import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Send, User, MessageSquare, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Message {
  id?: number;
  room_id: string;
  sender_id: number;
  sender_name: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  room_id: string;
  other_user_name: string;
  other_user_id: number;
  last_message: string;
  last_timestamp: string;
}

interface ChatProps {
  initialRoomId?: string;
  initialRecipientName?: string;
}

const Chat: React.FC<ChatProps> = ({ initialRoomId, initialRecipientName }) => {
  const { token, userId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputText, setInputText] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(initialRoomId || null);
  const [recipientName, setRecipientName] = useState<string | null>(initialRecipientName || null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/conversations", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setConversations(data);
      } catch (err) {
        console.error("Failed to fetch conversations", err);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [token, activeRoom]);

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "auth", token }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat") {
        if (data.roomId === activeRoom) {
          setMessages((prev) => [...prev, {
            sender_id: data.senderId,
            sender_name: data.senderName,
            text: data.text,
            timestamp: data.timestamp,
            room_id: data.roomId
          }]);
        }
        
        // Update conversation list last message
        setConversations(prev => {
          const existing = prev.find(c => c.room_id === data.roomId);
          if (existing) {
            return prev.map(c => c.room_id === data.roomId ? {
              ...c,
              last_message: data.text,
              last_timestamp: data.timestamp
            } : c).sort((a, b) => new Date(b.last_timestamp).getTime() - new Date(a.last_timestamp).getTime());
          }
          return prev;
        });
      }
    };

    return () => {
      socket.close();
    };
  }, [token, activeRoom]);

  useEffect(() => {
    if (activeRoom && token) {
      fetch(`/api/messages/${activeRoom}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Failed to fetch messages", err));
    }
  }, [activeRoom, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom || !socketRef.current) return;

    socketRef.current.send(JSON.stringify({
      type: "chat",
      roomId: activeRoom,
      text: inputText
    }));

    setInputText("");
  };

  const renderConversationList = () => (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <MessageSquare size={24} className="text-indigo-600" />
          <span>Messages</span>
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        {loadingConversations ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 p-8 text-center">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm">No conversations yet. Find a teammate to start chatting!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((conv) => (
              <button
                key={conv.room_id}
                onClick={() => {
                  setActiveRoom(conv.room_id);
                  setRecipientName(conv.other_user_name);
                }}
                className={`w-full p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors text-left ${
                  activeRoom === conv.room_id ? "bg-indigo-50/50" : ""
                }`}
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex-shrink-0 flex items-center justify-center">
                  <User size={24} />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-gray-900 truncate">{conv.other_user_name}</h4>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                      {new Date(conv.last_timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (!activeRoom) {
    return renderConversationList();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[75vh]">
      {/* Sidebar for Desktop */}
      <div className="hidden lg:block lg:col-span-1 h-full">
        {renderConversationList()}
      </div>

      {/* Chat Window */}
      <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setActiveRoom(null)}
              className="lg:hidden p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{recipientName || "Chat Room"}</h3>
              <p className="text-[10px] text-green-500 font-bold flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                ONLINE
              </p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-grow p-4 overflow-y-auto space-y-4 bg-white"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === userId;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe 
                      ? "bg-indigo-600 text-white rounded-tr-none shadow-sm" 
                      : "bg-gray-100 text-gray-900 rounded-tl-none"
                  }`}>
                    {!isMe && (
                      <p className="text-[10px] font-bold opacity-70 mb-1">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center mt-1 opacity-50 text-[9px] ${isMe ? "justify-end" : "justify-start"}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <Check size={10} className="ml-1 text-white" />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
