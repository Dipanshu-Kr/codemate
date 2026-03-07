import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen font-sans">
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
