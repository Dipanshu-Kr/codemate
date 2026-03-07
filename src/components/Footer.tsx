import React from "react";
import { Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";

interface FooterProps {
  setActiveTab?: (tab: string) => void;
}

const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <span className="text-2xl font-bold text-indigo-600">CodeMate</span>
            <p className="mt-4 text-gray-500 text-sm leading-relaxed">
              Empowering hackers to find their perfect teammates using AI-driven semantic matching. Build faster, better, together.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveTab?.("find-teammates")} className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Find Teammates</button></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Upcoming Hackathons</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setActiveTab?.("help")} className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Help Center</button></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-500 hover:text-indigo-600 text-sm transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-600 transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-xs">
            © {new Date().getFullYear()} CodeMate. All rights reserved.
          </p>
          <p className="text-gray-400 text-xs flex items-center mt-4 md:mt-0">
            Made with <Heart size={12} className="mx-1 text-red-400 fill-current" /> for the hacker community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
