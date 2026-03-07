import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = "hackathon-teammate-finder-secret";
const db = new Database("database.sqlite");

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    full_name TEXT,
    college TEXT,
    contact_email TEXT,
    skills TEXT,
    interests TEXT,
    experience_level TEXT,
    preferred_role TEXT,
    past_hackathon TEXT,
    past_project_name TEXT,
    past_project_desc TEXT,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT,
    sender_id INTEGER,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id)
  );
`);

// Migration: Ensure all columns exist in profiles table
const columns = [
  { name: "past_hackathon", type: "TEXT" },
  { name: "past_project_name", type: "TEXT" },
  { name: "past_project_desc", type: "TEXT" },
  { name: "last_active", type: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
  { name: "contact_email", type: "TEXT" }
];

const tableInfo: any[] = db.prepare("PRAGMA table_info(profiles)").all();
const existingColumns = tableInfo.map(col => col.name);

for (const col of columns) {
  if (!existingColumns.includes(col.name)) {
    try {
      db.exec(`ALTER TABLE profiles ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to profiles table`);
    } catch (err) {
      console.error(`Failed to add column ${col.name}:`, err);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/signup", (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hashedPassword);
      const userId = result.lastInsertRowid;
      
      // Create empty profile
      db.prepare("INSERT INTO profiles (user_id) VALUES (?)").run(userId);
      
      const token = jwt.sign({ userId }, JWT_SECRET);
      res.json({ token, userId });
    } catch (err) {
      res.status(400).json({ error: "User already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    // Update last active
    db.prepare("UPDATE profiles SET last_active = CURRENT_TIMESTAMP WHERE user_id = ?").run(user.id);
    res.json({ token, userId: user.id });
  });

  // Profile Routes
  app.get("/api/profile", authenticate, (req: any, res) => {
    const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.user.userId);
    res.json(profile);
  });

  app.post("/api/profile", authenticate, (req: any, res) => {
    const { full_name, college, contact_email, skills, interests, experience_level, preferred_role, past_hackathon, past_project_name, past_project_desc } = req.body;
    db.prepare(`
      UPDATE profiles SET 
        full_name = ?, 
        college = ?, 
        contact_email = ?,
        skills = ?, 
        interests = ?, 
        experience_level = ?, 
        preferred_role = ?,
        past_hackathon = ?,
        past_project_name = ?,
        past_project_desc = ?,
        last_active = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(full_name, college, contact_email, skills, interests, experience_level, preferred_role, past_hackathon, past_project_name, past_project_desc, req.user.userId);
    res.json({ success: true });
  });

  // User List (for finding teammates)
  app.get("/api/users", authenticate, (req: any, res) => {
    const users = db.prepare(`
      SELECT p.*, u.email 
      FROM profiles p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.user_id != ?
    `).all(req.user.userId);
    res.json(users);
  });

  // Get messages for a room
  app.get("/api/messages/:roomId", authenticate, (req: any, res) => {
    const messages = db.prepare(`
      SELECT m.*, p.full_name as sender_name
      FROM messages m
      JOIN profiles p ON m.sender_id = p.user_id
      WHERE m.room_id = ?
      ORDER BY m.timestamp ASC
    `).all(req.params.roomId);
    res.json(messages);
  });

  // Get all conversations for a user
  app.get("/api/conversations", authenticate, (req: any, res) => {
    const userId = req.user.userId;
    const conversations = db.prepare(`
      SELECT DISTINCT room_id, 
             (SELECT full_name FROM profiles WHERE user_id = 
               CASE 
                 WHEN sender_id = ? THEN (SELECT sender_id FROM messages m2 WHERE m2.room_id = m.room_id AND m2.sender_id != ?)
                 ELSE sender_id 
               END
             ) as other_user_name,
             (SELECT text FROM messages m3 WHERE m3.room_id = m.room_id ORDER BY m3.timestamp DESC LIMIT 1) as last_message,
             (SELECT timestamp FROM messages m4 WHERE m4.room_id = m.room_id ORDER BY m4.timestamp DESC LIMIT 1) as last_timestamp
      FROM messages m
      WHERE room_id LIKE ? OR room_id LIKE ?
      ORDER BY last_timestamp DESC
    `).all(userId, userId, `%_${userId}`, `${userId}_%`);
    
    // Refined query to get better other_user_name
    const refinedConversations = conversations.map(conv => {
      const ids = conv.room_id.split("_").map(Number);
      const otherId = ids.find(id => id !== userId);
      const otherProfile: any = db.prepare("SELECT full_name FROM profiles WHERE user_id = ?").get(otherId);
      return {
        ...conv,
        other_user_name: otherProfile?.full_name || "Unknown User",
        other_user_id: otherId
      };
    });

    res.json(refinedConversations);
  });

  // Matching Algorithm (Enhanced)
  app.post("/api/match/:userId", authenticate, async (req: any, res) => {
    const targetUserId = parseInt(req.params.userId);
    const { 
      skillWeight = 40, 
      interestWeight = 30, 
      experienceWeight = 20, 
      availabilityWeight = 10,
      searchSkills,
      searchInterests
    } = req.body;

    const myProfile: any = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(targetUserId);
    const otherProfiles: any[] = db.prepare("SELECT * FROM profiles WHERE user_id != ?").all(targetUserId);

    if (!myProfile) return res.status(404).json({ error: "Profile not found" });

    // Use search requirements if provided, otherwise fallback to user profile
    const targetSkills = searchSkills 
      ? searchSkills.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : (myProfile.skills || "").split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
    
    const targetInterests = searchInterests
      ? searchInterests.split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean)
      : (myProfile.interests || "").split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);

    // AI Semantic Interest Matching (Optional enhancement)
    // We'll use a simple keyword overlap for speed, but we can use Gemini to score the "vibe" of interests
    // For this task, we'll implement a "Deep Interest" check using Gemini for the top candidates later
    // or just use it to refine the interest score here.
    
    const matches = await Promise.all(otherProfiles.map(async other => {
      const otherSkills = (other.skills || "").split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      const otherInterests = (other.interests || "").split(",").map((s: string) => s.trim().toLowerCase()).filter(Boolean);

      // 1. Skill Compatibility
      const skillOverlap = otherSkills.filter((s: string) => targetSkills.includes(s)).length;
      const skillScore = targetSkills.length > 0 ? (skillOverlap / Math.max(targetSkills.length, otherSkills.length)) * skillWeight : 0;

      // 2. Deep Interest & Project Similarity (Enhanced with AI)
      let interestScore = 0;
      const interestOverlap = otherInterests.filter((i: string) => targetInterests.includes(i)).length;
      const basicInterestScore = targetInterests.length > 0 ? (interestOverlap / Math.max(targetInterests.length, otherInterests.length)) : 0;
      
      // Use Gemini to see if their interests or past projects are semantically related to the target requirements
      try {
        const prompt = `Compare these requirements for a hackathon teammate match against a candidate's profile.
        
        Target Requirements:
        Skills Needed: ${targetSkills.join(", ")}
        Interests/Goals: ${targetInterests.join(", ")}
        
        Candidate Profile:
        Skills: ${other.skills}
        Interests: ${other.interests}
        Past Hackathon: ${other.past_hackathon || "None"}
        Past Project Name: ${other.past_project_name || "None"}
        Past Project Description: ${other.past_project_desc || "None"}
        
        Provide a similarity score between 0 and 1 based on how well the candidate's background (especially their past projects and interests) matches the target requirements.
        Return ONLY the number.`;
        
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
        });
        const aiScore = parseFloat(response.text.trim()) || 0;
        interestScore = aiScore * interestWeight;
      } catch (e) {
        interestScore = basicInterestScore * interestWeight;
      }

      // 3. Experience Level
      const expMap: any = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
      const myExp = expMap[myProfile.experience_level] || 1;
      const otherExp = expMap[other.experience_level] || 1;
      const expScore = (1 - Math.abs(myExp - otherExp) / 2) * experienceWeight;

      // 4. Availability
      const availabilityScore = availabilityWeight;

      const totalScore = Math.round(skillScore + interestScore + expScore + availabilityScore);

      return {
        ...other,
        matchPercentage: Math.min(100, totalScore)
      };
    }));

    // Sort by score and take top 3
    const topMatches = matches.sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 3);
    res.json(topMatches);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, req) => {
    let currentUserId: number | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "auth") {
          const decoded: any = jwt.verify(message.token, JWT_SECRET);
          currentUserId = decoded.userId;
          if (currentUserId) {
            clients.set(currentUserId, ws);
          }
        }

        if (message.type === "chat" && currentUserId) {
          const { roomId, text } = message;
          
          // Save to DB
          db.prepare("INSERT INTO messages (room_id, sender_id, text) VALUES (?, ?, ?)").run(roomId, currentUserId, text);
          
          // Broadcast to all clients in the same room (simple broadcast for now)
          const profile: any = db.prepare("SELECT full_name FROM profiles WHERE user_id = ?").get(currentUserId);
          const broadcastMsg = JSON.stringify({
            type: "chat",
            roomId,
            senderId: currentUserId,
            senderName: profile?.full_name || "Unknown",
            text,
            timestamp: new Date().toISOString()
          });

          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMsg);
            }
          });
        }
      } catch (err) {
        console.error("WS error:", err);
      }
    });

    ws.on("close", () => {
      if (currentUserId) {
        clients.delete(currentUserId);
      }
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
