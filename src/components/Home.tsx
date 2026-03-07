import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { 
  User, 
  Search, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Star,
  Sparkles
} from "lucide-react";

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { token, userId } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    const fields = [
      'full_name', 'college', 'contact_email', 'skills', 'interests', 
      'experience_level', 'preferred_role', 'past_project_name'
    ];
    const completed = fields.filter(f => !!profile[f]).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completion = calculateProfileCompletion();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Hacker'}! 👋
            </h1>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Your next winning hackathon team is just a search away. Our AI is ready to find your perfect matches.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab("find-teammates")}
                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center space-x-2 shadow-lg"
              >
                <Search size={20} />
                <span>Find Teammates</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className="bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-400 transition-all border border-indigo-400/30 flex items-center space-x-2"
              >
                <User size={20} />
                <span>Update Profile</span>
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 mb-10 mr-10 opacity-10">
          <Sparkles size={200} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Progress */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Completion Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Profile Strength</h3>
              <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                completion === 100 ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {completion}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-6">
              <motion.div 
                className="bg-indigo-600 h-2.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completion}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              ></motion.div>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              {completion < 100 
                ? "Complete your profile to get more accurate AI teammate recommendations."
                : "Your profile is looking great! You're ready for the best matches."}
            </p>
            {completion < 100 && (
              <button 
                onClick={() => setActiveTab("profile")}
                className="w-full py-3 text-indigo-600 font-bold text-sm border-2 border-indigo-50 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Finish Setup</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: About CodeMate */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <Zap size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">About CodeMate</h2>
            </div>
            
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                <span className="font-bold text-indigo-600">CodeMate</span> is an AI-powered platform designed to solve the biggest challenge in hackathons: <span className="italic">finding the right teammates.</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Semantic Matching</span>
                  </h4>
                  <p className="text-sm">Our AI analyzes your skills, interests, and past projects to find people who truly complement your expertise.</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Real-time Activity</span>
                  </h4>
                  <p className="text-sm">Connect with hackers who are currently active and looking for teams, reducing ghosting and delays.</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Skill Gap Analysis</span>
                  </h4>
                  <p className="text-sm">Identify exactly what your team is missing and find the perfect specialist to fill that role.</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                    <CheckCircle2 size={18} className="text-green-500" />
                    <span>Experience Balanced</span>
                  </h4>
                  <p className="text-sm">Whether you're a beginner or a pro, we help you find a team that matches your pace and goals.</p>
                </div>
              </div>

              <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mt-8">
                <h4 className="font-bold text-indigo-900 mb-2">Ready to start?</h4>
                <p className="text-sm text-indigo-700 mb-4">
                  Head over to the "Find Teammates" tab to start searching for your next dream team using our advanced filters and AI recommendations.
                </p>
                <button 
                  onClick={() => setActiveTab("find-teammates")}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors inline-flex items-center space-x-2"
                >
                  <span>Go to Search</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Why CodeMate Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <Star size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Build Better Projects</h3>
              <p className="text-sm text-gray-500">Diverse teams win more often. We help you find the right mix of designers, developers, and thinkers.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-gray-500">Our matching algorithm goes beyond keywords, understanding the context of your experience.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
