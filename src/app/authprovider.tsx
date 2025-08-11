"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? `User: ${user.email}` : "No user");
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const login = () => {
    // Force check the current auth state
    console.log("Login function called - checking current auth state");
    const currentUser = auth.currentUser;
    if (currentUser) {
      console.log("User is already authenticated:", currentUser.email);
      setUser(currentUser);
    } else {
      console.log("No current user found, waiting for auth state change");
    }
  };

  const logout = () => {
    signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};