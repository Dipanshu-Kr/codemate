import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { User, School, Code, Briefcase, Star, Percent, Filter, X, Heart, Search, MessageSquare } from "lucide-react";

interface Teammate {
  user_id: number;
  full_name: string;
  college: string;
  contact_email?: string;
  skills: string;
  interests: string;
  experience_level: string;
  preferred_role: string;
  past_hackathon?: string;
  past_project_name?: string;
  past_project_desc?: string;
  matchPercentage?: number;
  last_active?: string;
}

const TeammateCard: React.FC<{ teammate: Teammate; currentUserId: number | null; onMessage?: (roomId: string, name: string) => void }> = ({ teammate, currentUserId, onMessage }) => {
  const skills = teammate.skills ? teammate.skills.split(",").map(s => s.trim()) : [];

  const handleMessage = () => {
    if (!currentUserId || !onMessage) return;
    const roomId = [currentUserId, teammate.user_id].sort((a, b) => a - b).join("_");
    onMessage(roomId, teammate.full_name);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <User size={24} />
        </div>
        {teammate.matchPercentage !== undefined && (
          <div className="flex items-center space-x-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-sm font-bold border border-green-100">
            <Percent size={14} />
            <span>{teammate.matchPercentage} Match</span>
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-1">{teammate.full_name || "Anonymous User"}</h3>
      <div className="flex items-center text-gray-500 text-sm mb-1">
        <School size={14} className="mr-1" />
        <span className="truncate">{teammate.college || "No college specified"}</span>
      </div>
      {teammate.contact_email && (
        <div className="flex items-center text-indigo-500 text-xs mb-2">
          <User size={12} className="mr-1" />
          <span className="truncate font-medium">{teammate.contact_email}</span>
        </div>
      )}
      
      {teammate.last_active && (
        <div className="text-[10px] text-gray-400 mb-4 flex items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse"></div>
          Active {new Date(teammate.last_active).toLocaleDateString()}
        </div>
      )}

      <div className="space-y-3 mb-6 flex-grow">
        <div className="flex items-center text-sm">
          <Briefcase size={14} className="mr-2 text-gray-400" />
          <span className="font-medium text-gray-700">{teammate.preferred_role}</span>
        </div>
        <div className="flex items-center text-sm">
          <Star size={14} className="mr-2 text-gray-400" />
          <span className="text-gray-600">{teammate.experience_level}</span>
        </div>
        
        {teammate.past_hackathon && (
          <div className="pt-3 mt-3 border-t border-gray-50">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Past Project</div>
            <div className="text-xs font-semibold text-indigo-600 mb-1">
              {teammate.past_hackathon} {teammate.past_project_name ? ` - ${teammate.past_project_name}` : ""}
            </div>
            <p className="text-xs text-gray-500 line-clamp-2 italic">
              "{teammate.past_project_desc}"
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
      
      <div className="mt-6 flex flex-col space-y-2">
        {teammate.contact_email ? (
          <a 
            href={`mailto:${teammate.contact_email}?subject=${encodeURIComponent("Team Collaboration Request")}&body=${encodeURIComponent("Hi,\nI found your profile on this platform and your skills look like a great match for my project. I would like to connect and discuss collaboration.")}`}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm text-center block"
          >
            Connect via Email
          </a>
        ) : (
          <button className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-100 transition-colors text-sm">
            Connect
          </button>
        )}
        
        <button 
          onClick={handleMessage}
          className="w-full py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-sm flex items-center justify-center space-x-2"
        >
          <MessageSquare size={16} />
          <span>Message</span>
        </button>
      </div>
    </motion.div>
  );
};

const FindTeammates: React.FC<{ suggestedOnly?: boolean; onMessage?: (roomId: string, name: string) => void }> = ({ suggestedOnly = false, onMessage }) => {
  const { token, userId } = useAuth();
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"match" | "experience" | "active">("match");
  
  // Search Form State
  const [searchSkills, setSearchSkills] = useState("");
  const [searchInterests, setSearchInterests] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Custom Weights
  const [weights, setWeights] = useState({
    skillWeight: 40,
    interestWeight: 30,
    experienceWeight: 20,
    availabilityWeight: 10
  });
  const [showPreferences, setShowPreferences] = useState(false);

  const fetchData = async () => {
    if (!suggestedOnly && !isSearching) return;
    
    setLoading(true);
    try {
      const endpoint = (suggestedOnly || isSearching) ? `/api/match/${userId}` : "/api/users";
      const method = (suggestedOnly || isSearching) ? "POST" : "GET";
      const body = (suggestedOnly || isSearching) ? JSON.stringify({
        ...weights,
        searchSkills: isSearching ? searchSkills : undefined,
        searchInterests: isSearching ? searchInterests : undefined
      }) : undefined;
      
      const res = await fetch(endpoint, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body
      });
      const data = await res.json();
      setTeammates(data);
      if (isSearching) setHasSearched(true);
    } catch (err) {
      console.error("Failed to fetch teammates", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (suggestedOnly) {
      fetchData();
    }
  }, [token, userId, suggestedOnly]);

  useEffect(() => {
    if (isSearching) {
      fetchData();
    }
  }, [isSearching, weights]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setShowPreferences(true); // Show customize section after search
  };

  const clearSearch = () => {
    setSearchSkills("");
    setSearchInterests("");
    setIsSearching(false);
    setHasSearched(false);
    setShowPreferences(false);
    setTeammates([]);
  };

  // Extract all unique skills from the fetched teammates
  const allSkills = useMemo(() => {
    const skillsSet = new Set<string>();
    teammates.forEach(t => {
      if (t.skills) {
        t.skills.split(",").forEach(s => {
          const trimmed = s.trim();
          if (trimmed) skillsSet.add(trimmed);
        });
      }
    });
    return Array.from(skillsSet).sort();
  }, [teammates]);

  // Filter and Sort teammates
  const filteredTeammates = useMemo(() => {
    let result = [...teammates];
    
    // Skill filtering
    if (selectedSkills.length > 0) {
      result = result.filter(t => {
        const tSkills = t.skills ? t.skills.split(",").map(s => s.trim().toLowerCase()) : [];
        return selectedSkills.every(skill => tSkills.includes(skill.toLowerCase()));
      });
    }

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "match") {
        return (b.matchPercentage || 0) - (a.matchPercentage || 0);
      } else if (sortBy === "experience") {
        const expMap: any = { "Advanced": 3, "Intermediate": 2, "Beginner": 1 };
        return (expMap[b.experience_level] || 0) - (expMap[a.experience_level] || 0);
      } else if (sortBy === "active") {
        const dateA = a.last_active ? new Date(a.last_active).getTime() : 0;
        const dateB = b.last_active ? new Date(b.last_active).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [teammates, selectedSkills, sortBy]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isSearching ? "Custom Search Results" : suggestedOnly ? "Top AI Matches for You" : "All Potential Teammates"}
          </h2>
          <p className="text-gray-500">
            {isSearching 
              ? "Based on your specific search requirements." 
              : suggestedOnly 
                ? "Based on your skills, interests, and experience level." 
                : "Browse all participants and find your perfect match."}
          </p>
        </div>
        
        {(suggestedOnly || isSearching) && (
          <button 
            onClick={() => setShowPreferences(!showPreferences)}
            className="flex items-center space-x-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            <Filter size={16} />
            <span>{showPreferences ? "Hide Preferences" : "Customize Matching"}</span>
          </button>
        )}

        {!suggestedOnly && !isSearching && allSkills.length > 0 && (
          <div className="flex items-center space-x-2 text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <Filter size={16} />
            <span>{filteredTeammates.length} results</span>
          </div>
        )}

        {(hasSearched || suggestedOnly) && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort By:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="match">Best Match</option>
              <option value="experience">Experience Level</option>
              <option value="active">Last Active</option>
            </select>
          </div>
        )}
      </div>

      {/* Custom Search Form */}
      {!suggestedOnly && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Code size={16} className="text-indigo-500" /> <span>Skills Needed</span>
                </label>
                <input
                  type="text"
                  value={searchSkills}
                  onChange={(e) => setSearchSkills(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. React, Python, ML"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Heart size={16} className="text-indigo-500" /> <span>Interests Needed</span>
                </label>
                <input
                  type="text"
                  value={searchInterests}
                  onChange={(e) => setSearchInterests(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. FinTech, Healthcare, Web3"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              {isSearching && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Clear Search
                </button>
              )}
              <button
                type="submit"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center space-x-2"
              >
                <Search size={18} />
                <span>Search Teammates</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Matching Preferences UI */}
      <AnimatePresence>
        {(suggestedOnly || isSearching) && showPreferences && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Matching Weights</h3>
                <span className="text-xs text-gray-400">Total must be 100% (Current: {Object.values(weights).reduce((a, b) => a + b, 0)}%)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { key: "skillWeight", label: "Skills Compatibility", icon: Code },
                  { key: "interestWeight", label: "Interest Similarity", icon: Heart },
                  { key: "experienceWeight", label: "Experience Level", icon: Star },
                  { key: "availabilityWeight", label: "Availability", icon: Briefcase }
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700 flex items-center">
                        <Icon size={16} className="mr-2 text-indigo-500" /> {label}
                      </label>
                      <span className="text-sm font-bold text-indigo-600">{(weights as any)[key]}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={(weights as any)[key]} 
                      onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={() => setWeights({ skillWeight: 40, interestWeight: 30, experienceWeight: 20, availabilityWeight: 10 })}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Reset to Default
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Filters */}
      {!suggestedOnly && allSkills.length > 0 && (
        <div className="mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
              <Code size={16} className="mr-2" /> Filter by Required Skills
            </h3>
            {selectedSkills.length > 0 && (
              <button 
                onClick={() => setSelectedSkills([])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                <X size={12} className="mr-1" /> Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allSkills.map(skill => {
              const isActive = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive 
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!suggestedOnly && !hasSearched && !loading && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-indigo-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Find Your Perfect Team</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Enter the skills and interests you're looking for above to see AI-powered teammate matches.
          </p>
        </div>
      )}

      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">AI is analyzing profiles and finding the best matches...</p>
        </div>
      )}

      {!loading && hasSearched && filteredTeammates.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">
            {selectedSkills.length > 0 
              ? "No teammates match all selected skills. Try removing some filters!" 
              : "No teammates found matching your search criteria. Try broadening your search!"}
          </p>
          {selectedSkills.length > 0 && (
            <button 
              onClick={() => setSelectedSkills([])}
              className="mt-4 text-indigo-600 font-semibold hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : !loading && (hasSearched || suggestedOnly) && filteredTeammates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTeammates.map((teammate) => (
              <TeammateCard 
                key={teammate.user_id} 
                teammate={teammate} 
                currentUserId={userId} 
                onMessage={onMessage} 
              />
            ))}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
};

export default FindTeammates;
