"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./authprovider";
import Login from "./login";
import { Analytics } from "@vercel/analytics/next"
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

// Import new components
import { JobEntry } from './types';
import { calculateStats, filterJobs } from './utils';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AdvancedFilters, { FilterState } from './components/AdvancedFilters';
import BulkActions from './components/BulkActions';
import CalendarView from './components/CalendarView';
import NotificationsPanel from './components/NotificationsPanel';
import EnhancedJobModal from './components/EnhancedJobModal';
import AboutPage from './components/AboutPage';
import FeedbackAdmin from './components/FeedbackAdmin';
import FeedbackSection from './components/FeedbackSection';
import ProfileSettings from './components/ProfileSettings';
import NotificationBubbles, { useNotifications } from './components/NotificationBubbles';
import CurrencySettings, { useCurrencySettings } from './components/CurrencySettings';
import { isAdmin } from './utils/adminAuth';
import { formatSalary } from './utils/currency';

const statuses = ["Applied", "Interviewing", "Offer", "Rejected"];

// Congratulatory quotes for job offers
const congratulationQuotes = [
  "🎉 Congratulations! Your hard work has paid off! This offer is well-deserved!",
  "🌟 Amazing news! You've landed an offer! Time to celebrate your success!",
  "🚀 Fantastic! You've secured an offer! Your skills and dedication shine through!",
  "💪 Well done! This job offer proves your talent and perseverance!",
  "🎊 Incredible achievement! You've earned this offer through your excellence!",
  "✨ Outstanding! This offer is a testament to your capabilities and hard work!",
  "🏆 Bravo! You've successfully navigated the process and secured an offer!",
  "🎯 Bull's eye! Your preparation and skills have landed you this fantastic offer!",
  "🌈 What wonderful news! This offer opens up exciting new possibilities for you!",
  "💎 Excellent work! You've proven your worth and earned this amazing opportunity!",
  "🔥 You're on fire! This job offer shows how impressive you truly are!",
  "⭐ Superstar! Your talent has been recognized with this well-deserved offer!"
];

// Application templates with guidance
const applicationTemplates = {
  "software-engineer": {
    name: "Software Engineer",
    tips: "Focus on: Technical skills, coding projects, problem-solving abilities, and system design experience.",
    keySkills: ["Programming Languages", "Data Structures", "System Design", "Version Control", "Testing"],
    coverLetterHint: "Highlight your technical projects, coding experience, and ability to solve complex problems."
  },
  "product-manager": {
    name: "Product Manager",
    tips: "Focus on: Strategic thinking, user research, cross-functional collaboration, and data-driven decisions.",
    keySkills: ["Product Strategy", "User Research", "Data Analysis", "Cross-functional Leadership", "Roadmap Planning"],
    coverLetterHint: "Emphasize your ability to bridge technical and business teams, and your experience with product lifecycle."
  },
  "data-scientist": {
    name: "Data Scientist",
    tips: "Focus on: Statistical analysis, machine learning, data visualization, and business impact of insights.",
    keySkills: ["Machine Learning", "Statistical Analysis", "Python/R", "Data Visualization", "Business Intelligence"],
    coverLetterHint: "Showcase your analytical projects, ability to derive insights from data, and business impact."
  },
  "designer": {
    name: "Designer",
    tips: "Focus on: Portfolio quality, user experience principles, design thinking, and collaboration with developers.",
    keySkills: ["UI/UX Design", "Design Systems", "Prototyping", "User Research", "Visual Design"],
    coverLetterHint: "Let your portfolio speak first, then emphasize your design process and user-centered approach."
  },
  "marketing": {
    name: "Marketing",
    tips: "Focus on: Campaign results, audience targeting, brand development, and ROI metrics.",
    keySkills: ["Digital Marketing", "Content Strategy", "Analytics", "Brand Management", "Campaign Optimization"],
    coverLetterHint: "Quantify your marketing successes, show understanding of target audiences and growth metrics."
  },
  "sales": {
    name: "Sales",
    tips: "Focus on: Sales numbers, relationship building, closing techniques, and customer retention.",
    keySkills: ["Relationship Building", "Negotiation", "Pipeline Management", "Customer Retention", "Sales Strategy"],
    coverLetterHint: "Lead with your sales achievements, quota performance, and relationship-building abilities."
  },
  "custom": {
    name: "Custom",
    tips: "Tailor your approach: Research the specific role requirements and company culture thoroughly.",
    keySkills: ["Adaptability", "Research Skills", "Communication", "Problem Solving", "Industry Knowledge"],
    coverLetterHint: "Customize everything based on the job description and company values."
  }
};

// URL validation helper function
const isValidUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export default function Home() {
  const { user, login, logout } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError, showWarning, showInfo } = useNotifications();
  const { country, updateCountry } = useCurrencySettings();

  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [showCongratulationModal, setShowCongratulationModal] = useState(false);
  const [congratulationMessage, setCongratulationMessage] = useState("");

  // New enhanced features state
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'analytics' | 'notifications' | 'about' | 'admin' | 'profile'>('kanban');
  const [showEnhancedModal, setShowEnhancedModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobEntry | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    filterStatus: "all",
    selectedTags: [],
    salaryRange: [0, 300000],
    dateRange: 'all'
  });

  // Rate limiting helper
  const isRateLimited = (): boolean => {
    const now = Date.now();
    const timeDiff = now - lastActionTime;
    if (timeDiff < 1000) { // 1 second rate limit
      setError("Please wait before performing another action.");
      return true;
    }
    setLastActionTime(now);
    return false;
  };

  // Enhanced functionality handlers
  const handleJobSubmit = async (jobData: Partial<JobEntry>) => {
    if (isRateLimited() || !user) return;

    setLoading(true);
    setError(null);
    try {
      if (editingJob) {
        const jobRef = doc(db, "jobs", editingJob.id);
        await updateDoc(jobRef, jobData);
        setJobs((prev) => prev.map(job => job.id === editingJob.id ? { ...job, ...jobData } : job));
        setEditingJob(null);
        showSuccess(`Successfully updated ${jobData.company || 'job application'}!`);
      } else {
        const newJobData = {
          ...jobData,
          status: jobData.status || "Applied",
          uid: user.uid,
          createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, "jobs"), newJobData);
        setJobs((prev) => [{ id: docRef.id, ...newJobData } as JobEntry, ...prev]);
        showSuccess(`Successfully added application for ${jobData.company}! 🎉`);
      }
    } catch {
      setError("Failed to save job. Please try again.");
      showError("Failed to save job application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (jobIds: string[], updates: Partial<JobEntry>) => {
    if (isRateLimited()) return;

    setLoading(true);
    setError(null);
    try {
      const promises = jobIds.map(async (jobId) => {
        const jobRef = doc(db, "jobs", jobId);
        await updateDoc(jobRef, updates);
      });
      
      await Promise.all(promises);
      
      setJobs((prev) => prev.map(job => 
        jobIds.includes(job.id) ? { ...job, ...updates } : job
      ));
      
      setSelectedJobs([]);
      showSuccess(`Successfully updated ${jobIds.length} job${jobIds.length > 1 ? 's' : ''}!`);
    } catch {
      setError("Failed to update jobs. Please try again.");
      showError("Failed to update jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const filteredJobIds = filteredJobs.map(job => job.id);
    setSelectedJobs(filteredJobIds);
  };

  const handleClearSelection = () => {
    setSelectedJobs([]);
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  };

  const openEnhancedModal = (job?: JobEntry) => {
    setEditingJob(job || null);
    setShowEnhancedModal(true);
  };

  const closeEnhancedModal = () => {
    setShowEnhancedModal(false);
    setEditingJob(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on a menu or its contents
      if ((event.target as Element).closest('.menu-dropdown')) {
        return;
      }
      setOpenMenuId(null);
    };
    
    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  // Fetch jobs when user logs in
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      try {
        // Try multiple query strategies for maximum compatibility
        let querySnapshot;
        let jobsData: JobEntry[] = [];
        
        // Strategy 1: Try optimized query with orderBy (requires composite index)
        try {
          const optimizedQuery = query(
            collection(db, "jobs"),
            where("uid", "==", user.uid),
            orderBy("createdAt", "desc")
          );
          querySnapshot = await getDocs(optimizedQuery);
          jobsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as JobEntry[];
          console.log("✅ Loaded jobs with optimized query (composite index):", jobsData.length);
        } catch {
          console.log("⚠️ Composite index not available, trying fallback query...");
          
          // Strategy 2: Fallback to simple query without orderBy
          try {
            const simpleQuery = query(
              collection(db, "jobs"),
              where("uid", "==", user.uid)
            );
            querySnapshot = await getDocs(simpleQuery);
            jobsData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as JobEntry[];
            
            // Sort in memory since we can't use orderBy
            jobsData.sort((a, b) => {
              if (!a.createdAt || !b.createdAt) return 0;
              return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
            console.log("✅ Loaded jobs with fallback query + client sorting:", jobsData.length);
          } catch (fallbackError) {
            console.error("❌ Both queries failed:", fallbackError);
            // Only show error for new users if all queries fail
            if (user) {
              setError("Having trouble loading your jobs. Please refresh the page or check your connection.");
            }
            return;
          }
        }
        
        setJobs(jobsData);
      } catch (err) {
        console.error("❌ Unexpected error in fetchJobs:", err);
        setError("Failed to load your jobs. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user]);

  // Return login prompt after hooks
  if (!user) {
    return <Login onLogin={login} />;
  }

  const handleDelete = async (id: string) => {
    if (isRateLimited()) return;
    
    const jobToDelete = jobs.find(j => j.id === id);
    
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "jobs", id));
      setJobs((prev) => prev.filter(job => job.id !== id));
      setOpenMenuId(null);
      showInfo(`Deleted application for ${jobToDelete?.company || 'job'}`);
    } catch {
      setError("Failed to delete job. Please try again.");
      showError("Failed to delete job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedJobId(id);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    
    const oldStatus = job.status;
    if (oldStatus === newStatus) {
      setDraggedJobId(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const jobRef = doc(db, "jobs", id);
      await updateDoc(jobRef, { status: newStatus });
      setJobs((prev) => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
      
      // Show congratulations message if moved to Offer status
      if (newStatus === "Offer" && oldStatus !== "Offer") {
        const randomQuote = congratulationQuotes[Math.floor(Math.random() * congratulationQuotes.length)];
        setCongratulationMessage(randomQuote);
        setShowCongratulationModal(true);
        showSuccess(`🎉 Congratulations! You got an offer from ${job.company}!`, 8000);
      } else if (newStatus === "Interviewing" && oldStatus === "Applied") {
        showInfo(`📅 Great! You're now interviewing with ${job.company}!`);
      } else if (newStatus === "Rejected") {
        showWarning(`Keep going! Every rejection is one step closer to the right offer.`);
      }
    } catch (err) {
      console.error("Error updating job status:", err);
      setError("Failed to update job status. Please try again.");
    } finally {
      setLoading(false);
      setDraggedJobId(null);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Filter and search functionality - Enhanced
  const filteredJobs = filterJobs(
    jobs, 
    filters.searchQuery, 
    filters.filterStatus,
    filters.selectedTags,
    filters.priority,
    filters.isRemote,
    filters.isFavorite
  );

  // Statistics calculation - Enhanced
  const stats = calculateStats(jobs);

  return (
    <div className="min-h-screen overflow-x-hidden p-2 sm:p-4 lg:p-6" style={{ backgroundColor: '#333333' }}>
      <Analytics />
      
      {/* Notification Bubbles */}
      <NotificationBubbles 
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      
      <button onClick={logout} className="fixed top-2 right-2 sm:top-4 sm:right-4 px-3 py-2 sm:px-6 sm:py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-red-400/50 z-40" aria-label="Logout">
        <span className="hidden sm:inline">🚪 Logout</span>
        <span className="sm:hidden">🚪</span>
      </button>
      
      <div className="flex items-start justify-center gap-0">
        {/* Left Sidebar - View Switcher - Follows scroll without scrollbar */}
        <div className="hidden lg:flex flex-col gap-3 pt-8 sticky top-4 self-start">
          {[
            { key: 'kanban', label: '📋 Kanban', icon: '📋' },
            { key: 'calendar', label: '📅 Calendar', icon: '📅' },
            { key: 'analytics', label: '📊 Analytics', icon: '📊' },
            { key: 'notifications', label: '🔔 Notifications', icon: '🔔' },
            { key: 'profile', label: '👤 Profile', icon: '👤' },
            { key: 'about', label: '📖 About', icon: '📖' },
            ...(isAdmin(user) ? [{ key: 'admin', label: '⚙️ Admin', icon: '⚙️' }] : [])
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setCurrentView(view.key as 'kanban' | 'calendar' | 'analytics' | 'notifications' | 'about' | 'admin' | 'profile')}
              className={`relative px-4 py-3 font-bold text-sm transition-all duration-300 min-w-[140px] text-left border ${
                currentView === view.key
                  ? 'bg-purple-600 text-white transform scale-105 border-white/20 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset] rounded-l-2xl border-r-0'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:scale-102 border-white/10 border-r-0'
              }`}
            >
              <span className="relative z-10">{view.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile View Switcher */}
        <div className="lg:hidden w-full mb-6 flex flex-wrap gap-2 justify-center">
          {[
            { key: 'kanban', label: '📋 Kanban', icon: '📋' },
            { key: 'calendar', label: '📅 Calendar', icon: '📅' },
            { key: 'analytics', label: '📊 Analytics', icon: '📊' },
            { key: 'notifications', label: '🔔 Notifications', icon: '🔔' },
            { key: 'profile', label: '👤 Profile', icon: '👤' },
            { key: 'about', label: '📖 About', icon: '📖' },
            ...(isAdmin(user) ? [{ key: 'admin', label: '⚙️ Admin', icon: '⚙️' }] : [])
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setCurrentView(view.key as 'kanban' | 'calendar' | 'analytics' | 'notifications' | 'about' | 'admin' | 'profile')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 ${
                currentView === view.key
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-6xl p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-md bg-gradient-to-br from-purple-600 to-blue-700 border border-white/20 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset]">
          {/* Neon corners */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-36 sm:h-36 bg-cyan-400/30 rounded-full blur-[60px] sm:blur-[80px] border-t-2 border-r-2 border-cyan-300/40 pointer-events-none" style={{ transform: 'translate(50%, -50%)' }} />
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 bg-fuchsia-500/30 rounded-full blur-[60px] sm:blur-[80px] border-b-2 border-l-2 border-fuchsia-400/40 pointer-events-none" style={{ transform: 'translate(-50%, 50%)' }} />

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 sm:mb-6 lg:mb-8 text-center px-2">🎯 Job Application Tracker</h1>

          {/* Currency Settings */}
          <div className="mb-6 flex justify-center">
            <CurrencySettings 
              currentCountry={country}
              onCountryChange={(newCountry) => {
                updateCountry(newCountry);
                showInfo(`Currency updated! Salaries will now display in the local format.`);
              }}
            />
          </div>

          {/* Feedback Section - Prominent placement for better visibility */}
          <div className="mb-6 max-w-4xl mx-auto px-4">
            <FeedbackSection />
          </div>

          {/* Error and Loading Feedback */}
          {error && !loading && <div className="mb-4 text-center text-red-400 font-semibold animate-pulse">{error}</div>}
          {loading && <div className="mb-4 text-center text-cyan-400 font-semibold animate-pulse">Loading...</div>}
          
          {/* Welcome Message for New Users */}
          {!loading && !error && jobs.length === 0 && (
            <div className="mb-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-green-800/50 to-emerald-800/50 backdrop-blur-md border border-green-400/30 text-center">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎯</div>
              <h3 className="text-xl sm:text-2xl font-bold text-green-300 mb-2 sm:mb-3">Welcome to your Job Tracker!</h3>
              <p className="text-sm sm:text-base text-white/80 mb-3 sm:mb-4">
                Ready to take control of your job search? Start by adding your first application below. 
                Track applications, manage interviews, and celebrate your offers! 🚀
              </p>
              <div className="text-xs sm:text-sm text-green-200 italic">
                💡 Tip: Use the drag-and-drop feature to move jobs between status columns as you progress!
              </div>
            </div>
          )}

          {/* View-Specific Content */}
          {currentView === 'analytics' && (
            <AnalyticsDashboard stats={stats} className="mb-6" />
          )}
          
          {currentView === 'calendar' && (
            <CalendarView 
              jobs={jobs}
              onDateClick={(date) => console.log('Date clicked:', date)}
              className="mb-6"
            />
          )}
          
          {currentView === 'notifications' && (
            <NotificationsPanel 
              jobs={jobs}
              className="mb-6"
            />
          )}

          {currentView === 'about' && (
            <AboutPage className="mb-6" />
          )}

          {currentView === 'admin' && (
            isAdmin(user) ? (
              <FeedbackAdmin />
            ) : (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-bold text-white mb-4">Admin Access Required</h2>
                <p className="text-white/60">You don&apos;t have permission to access the admin panel.</p>
              </div>
            )
          )}

          {currentView === 'profile' && (
            <ProfileSettings 
              className="mb-6"
              onClose={() => setCurrentView('kanban')}
            />
          )}

          {/* Kanban View */}
          {currentView === 'kanban' && (
            <>
              {/* Enhanced Filters - Only in Kanban View */}
              <AdvancedFilters 
                jobs={jobs}
                onFiltersChange={setFilters}
                className="mb-6"
              />

              {/* Quick Add Button */}
              <div className="mb-6 flex justify-center">
                <button
                  onClick={() => openEnhancedModal()}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-green-400/50"
                >
                  ➕ Add New Application
                </button>
              </div>

              {/* Job Status Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                {statuses.map(status => {
                  const statusJobs = filteredJobs.filter(job => job.status === status);
                  return (
                    <div key={status} className={`p-3 sm:p-4 rounded-xl border border-base-200 shadow-sm w-full flex flex-col bg-white/10 transition-all duration-200 ${draggedJobId ? 'ring-2 ring-cyan-400' : ''}`}
                      onDragOver={onDragOver}
                      onDrop={(e) => onDrop(e, status)}
                      aria-label={status + ' jobs'}>
                      <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 border-b pb-2 border-white/30">
                        {status} ({statusJobs.length})
                      </h2>
                      <div className="flex flex-col gap-2 sm:gap-3">
                        {statusJobs.map(job => (
                          <div
                            key={job.id}
                            className={`relative border border-gray-300 rounded-lg p-3 sm:p-4 space-y-2 hover:shadow-md transition w-full bg-white cursor-move ${job.status === 'Rejected' ? 'opacity-50' : ''} ${draggedJobId === job.id ? 'ring-2 ring-fuchsia-400 opacity-75' : ''} ${selectedJobs.includes(job.id) ? 'ring-2 ring-cyan-400' : ''}`}
                            draggable={true}
                            onDragStart={(e) => onDragStart(e, job.id)}
                            onDragEnd={() => setDraggedJobId(null)}
                            aria-grabbed={draggedJobId === job.id}
                          >
                            {/* Selection Checkbox */}
                            <div className="absolute top-2 left-2">
                              <input
                                type="checkbox"
                                checked={selectedJobs.includes(job.id)}
                                onChange={() => toggleJobSelection(job.id)}
                                className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded focus:ring-cyan-500 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <div className="flex justify-between items-start">
                              <div className={`text-base sm:text-lg break-words font-bold ml-6 ${job.status === 'Offer' ? 'text-green-600' : job.status === 'Rejected' ? 'text-red-600' : 'text-gray-800'}`}>{job.role}</div>
                              {/* 3-dot dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                                  className="text-lg sm:text-xl text-gray-600 hover:text-gray-800 cursor-pointer p-1"
                                  aria-label="Open job menu"
                                  tabIndex={0}
                                >
                                  ⋮
                                </button>
                                {openMenuId === job.id && (
                                  <div className="menu-dropdown absolute top-6 right-0 flex flex-col p-2 gap-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEnhancedModal(job);
                                      }} 
                                      className="px-3 py-1 text-sm text-gray-700 text-left hover:bg-gray-100 rounded cursor-pointer" 
                                      aria-label="Edit job"
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(job.id);
                                      }} 
                                      className="px-3 py-1 text-sm text-red-600 text-left hover:bg-red-50 rounded cursor-pointer" 
                                      aria-label="Delete job"
                                    >
                                      🗑️ Delete
                                    </button>
                                    {job.interviewDate && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const date = new Date(job.interviewDate!);
                                          alert(`📅 Interview scheduled for ${date.toLocaleString()}`);
                                        }} 
                                        className="px-3 py-1 text-sm text-blue-600 text-left hover:bg-blue-50 rounded cursor-pointer" 
                                        aria-label="View Interview"
                                      >
                                        📅 Interview
                                      </button>
                                    )}
                                    {job.applicationTemplate && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const template = applicationTemplates[job.applicationTemplate as keyof typeof applicationTemplates];
                                          if (template) {
                                            alert(`📝 ${template.name} Template Tips:\n\n${template.tips}\n\nKey Skills: ${template.keySkills.join(', ')}\n\nCover Letter Hint: ${template.coverLetterHint}`);
                                          }
                                        }} 
                                        className="px-3 py-1 text-sm text-purple-600 text-left hover:bg-purple-50 rounded cursor-pointer" 
                                        aria-label="View Template Tips"
                                      >
                                        📝 Template Tips
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 break-words flex items-center gap-2">
                              {job.company}
                              {job.isFavorite && <span className="text-yellow-500">⭐</span>}
                              {job.priority && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  job.priority === 'high' ? 'bg-red-100 text-red-600' :
                                  job.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-green-100 text-green-600'
                                }`}>
                                  {job.priority === 'high' ? '🔴' : job.priority === 'medium' ? '🟡' : '🟢'} {job.priority}
                                </span>
                              )}
                              {job.isRemote && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">🏠 Remote</span>}
                            </div>
                            
                            {/* Tags */}
                            {job.tags && job.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {job.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                                {job.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{job.tags.length - 3} more</span>
                                )}
                              </div>
                            )}
                            {job.salary && (
                              <div className="text-xs sm:text-sm text-green-600 font-semibold">{formatSalary(job.salary, country)}</div>
                            )}
                            {job.location && (
                              <div className="text-xs sm:text-sm text-blue-600">📍 {job.location}</div>
                            )}
                            {job.jobType && (
                              <div className="text-xs sm:text-sm text-purple-600">💼 {job.jobType}</div>
                            )}
                            {job.interviewDate && (
                              <div className="text-xs sm:text-sm text-blue-600">📅 {new Date(job.interviewDate).toLocaleDateString()}</div>
                            )}
                            {job.link && (
                              <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm text-blue-600 hover:underline break-words" aria-label="View job link">View Job</a>
                            )}
                            {job.companyResearch && (
                              <div className="text-xs text-purple-600 italic break-words">🏢 {job.companyResearch}</div>
                            )}
                            {job.applicationTemplate && (
                              <div className="text-xs text-orange-600 cursor-pointer hover:underline" 
                                   onClick={() => {
                                     const template = applicationTemplates[job.applicationTemplate as keyof typeof applicationTemplates];
                                     if (template) {
                                       alert(`📝 ${template.name} Template Tips:\n\n${template.tips}\n\nKey Skills: ${template.keySkills.join(', ')}\n\nCover Letter Hint: ${template.coverLetterHint}`);
                                     }
                                   }}>
                                📝 Template: {job.applicationTemplate} (Click for tips)
                              </div>
                            )}
                            {job.notes && (
                              <div className="text-xs text-gray-500 italic break-words">{job.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Actions for Kanban View */}
              <BulkActions
                selectedJobs={selectedJobs}
                jobs={jobs}
                onBulkUpdate={handleBulkUpdate}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
              />
            </>
          )}
        </div>
      </div>

      {/* Enhanced Job Modal */}
      <EnhancedJobModal
        isOpen={showEnhancedModal}
        onClose={closeEnhancedModal}
        onSubmit={handleJobSubmit}
        editingJob={editingJob}
      />

      {/* Congratulations Modal */}
      {showCongratulationModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Background overlay with 60% opacity */}
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: 'rgba(51, 51, 51, 0.6)' }}
            onClick={() => setShowCongratulationModal(false)}
          ></div>
          
          {/* Modal content */}
          <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 text-white border-4 border-green-300 shadow-2xl max-w-xs sm:max-w-md mx-4 rounded-2xl p-6 sm:p-8 z-10">
            <button 
              className="absolute right-2 top-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-lg sm:text-xl flex items-center justify-center transition-all duration-200"
              onClick={() => setShowCongratulationModal(false)}
            >
              ✕
            </button>
            <div className="text-center py-2 sm:py-4">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
              <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">Congratulations!</h3>
              <p className="text-base sm:text-lg leading-relaxed px-2 sm:px-4">
                {congratulationMessage.replace(/^🎉|🌟|🚀|💪|🎊|✨|🏆|🎯|🌈|💎|🔥|⭐\s*/, '')}
              </p>
              <div className="flex justify-center mt-6 sm:mt-8">
                <button 
                  className="bg-white text-green-600 hover:bg-green-50 font-bold px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-sm sm:text-base transition-all duration-200 hover:shadow-lg"
                  onClick={() => setShowCongratulationModal(false)}
                >
                  Thank you! 🙏
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
