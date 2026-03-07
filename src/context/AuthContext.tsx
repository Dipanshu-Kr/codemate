import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  token: string | null;
  userId: number | null;
  login: (token: string, userId: number) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<number | null>(
    localStorage.getItem("userId") ? parseInt(localStorage.getItem("userId")!) : null
  );

  const login = (token: string, userId: number) => {
    setToken(token);
    setUserId(userId);
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId.toString());
  };

  const logout = () => {
    setToken(null);
    setUserId(null);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, userId, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
