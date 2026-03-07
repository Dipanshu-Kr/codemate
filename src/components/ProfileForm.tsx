import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { Save, User, School, Code, Heart, Briefcase, Star } from "lucide-react";

const ProfileForm: React.FC = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    college: "",
    contact_email: "",
    skills: "",
    interests: "",
    experience_level: "Beginner",
    preferred_role: "Frontend",
    past_hackathon: "",
    past_project_name: "",
    past_project_desc: "",
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data) {
          setProfile({
            full_name: data.full_name || "",
            college: data.college || "",
            contact_email: data.contact_email || "",
            skills: data.skills || "",
            interests: data.interests || "",
            experience_level: data.experience_level || "Beginner",
            preferred_role: data.preferred_role || "Frontend",
            past_hackathon: data.past_hackathon || "",
            past_project_name: data.past_project_name || "",
            past_project_desc: data.past_project_desc || "",
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Failed to update profile");
    }
  };

  if (loading) return <div className="text-center py-10">Loading profile...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8"
    >
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <User size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
          message.includes("success") ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <User size={16} /> <span>Full Name</span>
            </label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <School size={16} /> <span>College / University</span>
            </label>
            <input
              type="text"
              value={profile.college}
              onChange={(e) => setProfile({ ...profile, college: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Stanford University"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <User size={16} /> <span>Contact Email (for teammates)</span>
            </label>
            <input
              type="email"
              value={profile.contact_email}
              onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="contact@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <Code size={16} /> <span>Skills (comma separated)</span>
          </label>
          <input
            type="text"
            value={profile.skills}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="React, Node.js, Python, AI"
          />
          <p className="mt-1 text-xs text-gray-400">Example: Java, React, Python, AI, ML, Node.js</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
            <Heart size={16} /> <span>Interests (comma separated)</span>
          </label>
          <input
            type="text"
            value={profile.interests}
            onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Web Dev, Machine Learning, Blockchain"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Star size={16} /> <span>Experience Level</span>
            </label>
            <select
              value={profile.experience_level}
              onChange={(e) => setProfile({ ...profile, experience_level: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
              <Briefcase size={16} /> <span>Preferred Role</span>
            </label>
            <select
              value={profile.preferred_role}
              onChange={(e) => setProfile({ ...profile, preferred_role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>Frontend</option>
              <option>Backend</option>
              <option>AI Engineer</option>
              <option>Designer</option>
              <option>Fullstack</option>
            </select>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Briefcase size={18} className="text-indigo-500" />
            <span>Past Hackathon Experience</span>
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Star size={16} /> <span>Last Hackathon Name</span>
              </label>
              <input
                type="text"
                value={profile.past_hackathon}
                onChange={(e) => setProfile({ ...profile, past_hackathon: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. ETHGlobal, HackMIT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Star size={16} /> <span>Project Name</span>
              </label>
              <input
                type="text"
                value={profile.past_project_name}
                onChange={(e) => setProfile({ ...profile, past_project_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. AI Teammate Finder"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                <Code size={16} /> <span>Project Description</span>
              </label>
              <textarea
                value={profile.past_project_desc}
                onChange={(e) => setProfile({ ...profile, past_project_desc: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                placeholder="Briefly describe what you built, the tech stack, and your role."
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Save size={18} />
          <span>Save Profile</span>
        </button>
      </form>
    </motion.div>
  );
};

export default ProfileForm;
