import React, { useState } from "react";
import Navbar from "./Navbar";
import ProfileForm from "./ProfileForm";
import FindTeammates from "./FindTeammates";
import Home from "./Home";
import Footer from "./Footer";
import Chat from "./Chat";
import HelpCenter from "./HelpCenter";
import { motion, AnimatePresence } from "motion/react";

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string | null>(null);

  const startChat = (roomId: string, name: string) => {
    setActiveRoomId(roomId);
    setRecipientName(name);
    setActiveTab("chat");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Home setActiveTab={setActiveTab} />;
      case "profile":
        return <ProfileForm />;
      case "find-teammates":
        return <FindTeammates suggestedOnly={false} onMessage={startChat} />;
      case "chat":
        return <Chat initialRoomId={activeRoomId || undefined} initialRecipientName={recipientName || undefined} />;
      case "help":
        return <HelpCenter />;
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer setActiveTab={setActiveTab} />
    </div>
  );
};

export default Dashboard;
