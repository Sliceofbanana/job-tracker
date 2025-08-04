"use client";

import React, { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "./firebase";

interface LoginProps {
  onLogin: () => void;
}

const quotes = [
  "Your dream job doesn't just happen — you create it with persistence and preparation.",
  "A rejection is just redirection toward the role that's meant for you.",
  "The right opportunity will value you for what you bring, not just what you've done.",
  "Every interview is a rehearsal for the moment you say yes to the right offer.",
  "Your skills are your currency — invest in them wisely."
];

const tips = [
  {
    title: "Tailor Your Resume",
    desc: "Customize it for each application to highlight relevant experience."
  },
  {
    title: "Research the Company",
    desc: "Learn about their values, mission, and culture before applying or interviewing."
  },
  {
    title: "Network Intentionally",
    desc: "Connect with industry professionals on LinkedIn, attend events, and join groups."
  },
  {
    title: "Practice Interview Skills",
    desc: "Use mock interviews to refine your answers and boost confidence."
  },
  {
    title: "Highlight Soft Skills",
    desc: "Employers look for adaptability, communication, and problem-solving abilities."
  },
  {
    title: "Stay Organized",
    desc: "Track applications, follow-up dates, and interview schedules."
  },
  {
    title: "Keep Learning",
    desc: "Enroll in free or paid courses to stay competitive in your field."
  }
];

export default function Login({ onLogin }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    setCurrentQuoteIndex(Math.floor(Math.random() * quotes.length));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords don't match!");
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        console.log("User created:", userCredential.user);
        alert("Account created successfully!");
        onLogin();
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        console.log("User signed in:", userCredential.user);
        alert("Signed in successfully!");
        onLogin();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      console.error("Authentication error:", error);
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#333333] flex items-center justify-center p-2 sm:p-4 lg:p-8">
      <div className="relative w-full max-w-6xl p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-md bg-gradient-to-br from-purple-600 to-blue-700 border border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset]">
        {/* Background neon corners */}
        <div
          className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 bg-cyan-400/30 rounded-full blur-[60px] sm:blur-[70px] lg:blur-[80px] border-t-2 border-r-2 border-cyan-300/40 pointer-events-none"
          style={{ transform: "translate(50%, -50%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 bg-fuchsia-500/30 rounded-full blur-[60px] sm:blur-[70px] lg:blur-[80px] border-b-2 border-l-2 border-fuchsia-400/40 pointer-events-none"
          style={{ transform: "translate(-50%, 50%)" }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          {/* Login Form Container */}
          <div className="w-full lg:flex-1 flex items-center justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-md p-4 sm:p-6 lg:p-8 rounded-2xl bg-white border-2 border-gray-200 shadow-2xl">
              {/* Enhanced neon corners for more visibility */}
              <div
                className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-cyan-400/30 rounded-full blur-[40px] sm:blur-[45px] lg:blur-[50px] border-t-4 border-r-4 border-cyan-300/40 pointer-events-none"
                style={{ transform: "translate(50%, -50%)" }}
              />
              <div
                className="absolute bottom-0 left-0 w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-fuchsia-500/30 rounded-full blur-[40px] sm:blur-[45px] lg:blur-[50px] border-b-4 border-l-4 border-fuchsia-400/40 pointer-events-none"
                style={{ transform: "translate(-50%, 50%)" }}
              />

              <div className="relative z-10">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 drop-shadow-sm">
                    LOGIN
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">
                    {isSignUp
                      ? "Create your account to get started"
                      : "Welcome back! Please enter your details"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-sm sm:text-base"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-sm sm:text-base"
                      required
                    />
                  </div>

                  {isSignUp && (
                    <div>
                      <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all text-sm sm:text-base"
                        required
                      />
                    </div>
                  )}

                  {!isSignUp && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs sm:text-sm gap-2 sm:gap-0">
                      <label className="flex items-center text-gray-600">
                        <input
                          type="checkbox"
                          className="mr-2 rounded bg-gray-50 border-gray-300 cursor-pointer"
                        />
                        Remember me
                      </label>
                      <button
                        type="button"
                        className="text-cyan-500 hover:text-cyan-600 font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-br from-cyan-500 to-fuchsia-500 border-2 border-transparent text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer text-sm sm:text-base"
                  >
                    {isSignUp ? "Create Account" : "Sign In"}
                  </button>
                </form>

                <div className="mt-4 sm:mt-6">
                  <div className="divider text-gray-400 font-medium text-xs sm:text-sm">
                    or
                  </div>

                  <button
                    onClick={onLogin}
                    className="w-full px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gray-50 border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 transition flex items-center justify-center hover:scale-105 transform cursor-pointer text-sm sm:text-base"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="hidden sm:inline">
                      Continue with Google
                    </span>
                    <span className="sm:hidden">Google</span>
                  </button>
                </div>

                <div className="mt-4 sm:mt-6 text-center">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-cyan-500 hover:text-cyan-600 transition text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    {isSignUp
                      ? "Already have an account? Sign in"
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Background Content (quotes/tips) */}
          <div className="w-full lg:flex-1 text-center order-1 lg:order-2 mb-4 lg:mb-0">
            <div className="text-center mb-4 sm:mb-6 lg:mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4">
                Job Tracker
              </h1>
              <p className="text-white/90 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 lg:mb-6">
                Track your career journey with confidence
              </p>
            </div>

            <div className="mb-4 sm:mb-6 lg:mb-8">
              <blockquote className="text-white/95 text-base sm:text-lg lg:text-xl italic leading-relaxed px-2">
                &ldquo;{quotes[currentQuoteIndex]}&rdquo;
              </blockquote>
            </div>

            <div className="space-y-3 sm:space-y-4 hidden sm:block">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center">
                  <span className="mr-2">📌</span>
                  <span className="hidden sm:inline">
                    Practical Tips for Job Seekers
                  </span>
                  <span className="sm:hidden">Job Tips</span>
                </h2>
              </div>

              <div
                className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-56 lg:max-h-64 overflow-y-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(255, 255, 255, 0.7) transparent"
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.9);
                  }
                `}</style>
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20 text-left"
                  >
                    <h3 className="text-cyan-200 font-semibold text-xs sm:text-sm mb-1">
                      {tip.title}
                    </h3>
                    <p className="text-white/80 text-xs leading-relaxed">
                      {tip.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}