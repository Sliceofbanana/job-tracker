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
import { JobEntry } from './types';
import { filterJobs } from './utils';
import AdvancedFilters, { FilterState } from './components/AdvancedFilters';
import BulkActions from './components/BulkActions';
import CalendarView from './components/CalendarView';
import NotificationsPanel from './components/NotificationsPanel';
import EnhancedJobModal from './components/EnhancedJobModal';
import AboutPage from './components/AboutPage';
import FeedbackAdmin from './components/FeedbackAdmin';
import ProfileSettings from './components/ProfileSettings';
import NotificationBubbles, { useNotifications } from './components/NotificationBubbles';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';
import { useCurrencySettings } from './components/CurrencySettings';
import { useAdminStatus } from './utils/useAdminStatus';
import { formatSalary } from './utils/currency';
import { getGoogleCalendar, syncJobToCalendar, removeJobFromCalendar } from './utils/googleCalendar';

const statuses = ["Applied", "Interviewing", "Accepted", "Rejected"];

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
  },
  "internship": {
    name: "Internship",
    tips: "Focus on: Learning enthusiasm, relevant coursework, projects, willingness to contribute, and growth mindset.",
    keySkills: ["Academic Projects", "Relevant Coursework", "Communication", "Teamwork", "Eagerness to Learn"],
    coverLetterHint: "Emphasize your passion for learning, relevant academic work, and how this internship aligns with your career goals."
  }
};

export default function Home() {
  const { user, login, logout } = useAuth();
  const { notifications, dismissNotification, showSuccess, showError, showWarning, showInfo } = useNotifications();
  const { country } = useCurrencySettings();
  const { isAdmin: isUserAdmin, isLoading: adminLoading } = useAdminStatus(user);

  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [showCongratulationModal, setShowCongratulationModal] = useState(false);
  const [congratulationMessage, setCongratulationMessage] = useState("");

  // New enhanced features state
  const [currentView, setCurrentView] = useState<'kanban' | 'calendar' | 'notifications' | 'about' | 'admin' | 'profile'>('kanban');
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
        
        // Update local state
        const updatedJob = { ...editingJob, ...jobData } as JobEntry;
        setJobs((prev) => prev.map(job => job.id === editingJob.id ? updatedJob : job));
        
        // Sync with Google Calendar if connected
        const calendar = getGoogleCalendar();
        if (calendar.isUserSignedIn()) {
          try {
            const calendarEvents = await syncJobToCalendar(updatedJob);
            if (Object.keys(calendarEvents).length > 0) {
              // Update the job with calendar event IDs
              await updateDoc(jobRef, { googleCalendarEvents: calendarEvents });
              showInfo('Job updated and synced with Google Calendar! 📅');
            }
          } catch (calendarError) {
            console.error('Calendar sync error:', calendarError);
            showWarning('Job updated but calendar sync failed. Check your Google Calendar connection.');
          }
        }
        
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
        const newJob = { id: docRef.id, ...newJobData } as JobEntry;
        
        // Sync with Google Calendar if connected
        const calendar = getGoogleCalendar();
        if (calendar.isUserSignedIn()) {
          try {
            const calendarEvents = await syncJobToCalendar(newJob);
            if (Object.keys(calendarEvents).length > 0) {
              // Update the job with calendar event IDs
              await updateDoc(docRef, { googleCalendarEvents: calendarEvents });
              newJob.googleCalendarEvents = calendarEvents;
              showSuccess(`Successfully added application for ${jobData.company} and synced with Google Calendar! 🎉📅`);
            } else {
              showSuccess(`Successfully added application for ${jobData.company}! 🎉`);
            }
          } catch (calendarError) {
            console.error('Calendar sync error:', calendarError);
            showSuccess(`Successfully added application for ${jobData.company}! 🎉`);
            showWarning('Calendar sync failed. Check your Google Calendar connection.');
          }
        } else {
          showSuccess(`Successfully added application for ${jobData.company}! 🎉`);
        }
        
        setJobs((prev) => [newJob, ...prev]);
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
      // Remove from Google Calendar if connected and has events
      if (jobToDelete?.googleCalendarEvents) {
        const calendar = getGoogleCalendar();
        if (calendar.isUserSignedIn()) {
          try {
            const eventIds = Object.values(jobToDelete.googleCalendarEvents).filter(Boolean) as string[];
            await removeJobFromCalendar(eventIds);
            showInfo('Job removed from Google Calendar as well');
          } catch (calendarError) {
            console.error('Calendar deletion error:', calendarError);
            showWarning('Job deleted but calendar events may still exist');
          }
        }
      }
      
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
      
      // Show congratulations message if moved to Accepted status
      if (newStatus === "Accepted" && oldStatus !== "Accepted") {
        const randomQuote = congratulationQuotes[Math.floor(Math.random() * congratulationQuotes.length)];
        setCongratulationMessage(randomQuote);
        setShowCongratulationModal(true);
        showSuccess(`🎉 Congratulations! You accepted an offer from ${job.company}!`, 8000);
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

  return (
    <ErrorBoundary>
      <GlobalErrorHandler />
      <div className="min-h-screen p-2 sm:p-4 lg:p-6" style={{ backgroundColor: '#333333' }}>
        <Analytics />
      
        {/* Notification Bubbles */}
        <NotificationBubbles 
          notifications={notifications}
          onDismiss={dismissNotification}
        />
        
        {/* Logout Button - Fixed positioning */}
        <button 
          onClick={logout} 
          className="fixed top-2 right-2 z-50 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm shadow-lg transition-all duration-200 border border-red-400/50"
          aria-label="Logout"
        >
          🚪 <span className="hidden sm:inline">Logout</span>
        </button>

        <div className="flex flex-col lg:flex-row items-start justify-center gap-4 max-w-7xl mx-auto">
          {/* Desktop Sidebar */}
          <div className="hidden lg:flex flex-col gap-3 pt-8 sticky top-4">
            {[
              { key: 'kanban', label: '📋 Kanban', icon: '📋' },
              { key: 'calendar', label: '📅 Calendar', icon: '📅' },
              { key: 'notifications', label: '🔔 Notifications', icon: '🔔' },
              { key: 'profile', label: '👤 Profile', icon: '👤' },
              { key: 'about', label: '📖 About', icon: '📖' },
              ...(isUserAdmin ? [{ key: 'admin', label: '⚙️ Admin', icon: '⚙️' }] : [])
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setCurrentView(view.key as any)}
                className={`px-4 py-3 font-bold text-sm transition-all duration-300 min-w-[140px] text-left border rounded-l-2xl border-r-0 ${
                  currentView === view.key
                    ? 'bg-purple-600 text-white transform scale-105 border-white/20 backdrop-blur-md shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 border-white/10'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden w-full mb-4 overflow-x-auto">
            <div className="flex gap-2 px-2 pb-2 min-w-max">
              {[
                { key: 'kanban', label: '📋 Kanban', short: '📋' },
                { key: 'calendar', label: '📅 Calendar', short: '📅' },
                { key: 'notifications', label: '🔔 Notifications', short: '🔔' },
                { key: 'profile', label: '👤 Profile', short: '👤' },
                { key: 'about', label: '📖 About', short: '📖' },
                ...(isUserAdmin ? [{ key: 'admin', label: '⚙️ Admin', short: '⚙️' }] : [])
              ].map(view => (
                <button
                  key={view.key}
                  onClick={() => setCurrentView(view.key as any)}
                  className={`px-3 py-2 rounded-lg font-bold text-sm transition-all duration-200 whitespace-nowrap ${
                    currentView === view.key
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <span className="sm:hidden">{view.short}</span>
                  <span className="hidden sm:inline">{view.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full max-w-6xl bg-gradient-to-br from-purple-600/80 to-blue-700/80 rounded-xl backdrop-blur-md border border-white/20 p-4 lg:p-8 relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/30 rounded-full blur-[60px] pointer-events-none" style={{ transform: 'translate(50%, -50%)' }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-500/30 rounded-full blur-[60px] pointer-events-none" style={{ transform: 'translate(-50%, 50%)' }} />

            <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-white mb-4 lg:mb-8 text-center">
              🎯 Job Application Tracker
            </h1>

            {/* Error and Loading States */}
            {error && !loading && (
              <div className="mb-4 text-center text-red-400 font-semibold animate-pulse text-sm">
                {error}
              </div>
            )}
            {loading && (
              <div className="mb-4 text-center text-cyan-400 font-semibold animate-pulse text-sm">
                Loading...
              </div>
            )}
            
            {/* Welcome Message */}
            {!loading && !error && jobs.length === 0 && (
              <div className="mb-6 p-4 lg:p-6 rounded-xl bg-gradient-to-br from-green-800/50 to-emerald-800/50 backdrop-blur-md border border-green-400/30 text-center">
                <div className="text-4xl lg:text-6xl mb-3">🎯</div>
                <h3 className="text-lg lg:text-2xl font-bold text-green-300 mb-3">Welcome to your Job Tracker!</h3>
                <p className="text-sm lg:text-base text-white/80 mb-4 leading-relaxed">
                  Ready to take control of your job search? Start by adding your first application below. 
                  Track applications, manage interviews, and celebrate your offers! 🚀
                </p>
                <div className="text-xs lg:text-sm text-green-200 italic">
                  💡 Tip: Use the drag-and-drop feature to move jobs between status columns as you progress!
                </div>
              </div>
            )}

            {/* View Content */}
            {currentView === 'calendar' && (
              <CalendarView 
                jobs={jobs}
                onDateClick={(date) => console.log('Date clicked:', date)}
                className="mb-6"
              />
            )}
            
            {currentView === 'notifications' && (
              <NotificationsPanel jobs={jobs} className="mb-6" />
            )}

            {currentView === 'about' && (
              <AboutPage className="mb-6" />
            )}

            {currentView === 'admin' && (
              adminLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-white/60">Verifying admin access...</p>
                </div>
              ) : isUserAdmin ? (
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
                jobs={jobs}
              />
            )}

            {/* Kanban View */}
            {currentView === 'kanban' && (
              <>
                {/* Filters */}
                <AdvancedFilters 
                  jobs={jobs}
                  onFiltersChange={setFilters}
                  className="mb-6"
                />

                {/* Add Button */}
                <div className="mb-6 flex justify-center">
                  <button
                    onClick={() => openEnhancedModal()}
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-green-400/50"
                  >
                    <span className="lg:hidden">➕ Add Job</span>
                    <span className="hidden lg:inline">➕ Add New Application</span>
                  </button>
                </div>

                {/* Job Columns - Mobile First Approach */}
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
                  {statuses.map(status => {
                    const statusJobs = filteredJobs.filter(job => job.status === status);
                    return (
                      <div 
                        key={status} 
                        className={`p-3 lg:p-4 rounded-xl border border-white/20 bg-white/10 transition-all duration-200 ${
                          draggedJobId ? 'ring-2 ring-cyan-400' : ''
                        }`}
                        onDragOver={onDragOver}
                        onDrop={(e) => onDrop(e, status)}
                      >
                        <h2 className="text-lg lg:text-xl font-bold text-white mb-4 border-b pb-2 border-white/30">
                          {status} ({statusJobs.length})
                        </h2>
                        
                        <div className="space-y-3">
                          {statusJobs.map(job => (
                            <div
                              key={job.id}
                              className={`relative border border-gray-300 rounded-lg p-3 bg-white cursor-move transition-all duration-200 ${
                                job.status === 'Rejected' ? 'opacity-50' : ''
                              } ${
                                draggedJobId === job.id ? 'ring-2 ring-fuchsia-400 opacity-75' : ''
                              } ${
                                selectedJobs.includes(job.id) ? 'ring-2 ring-cyan-400' : ''
                              }`}
                              draggable={true}
                              onDragStart={(e) => onDragStart(e, job.id)}
                              onDragEnd={() => setDraggedJobId(null)}
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

                              {/* Job Content */}
                              <div className="ml-6">
                                {/* Header with Role and Menu */}
                                <div className="flex justify-between items-start mb-2">
                                  <div className={`font-bold text-sm lg:text-base break-words pr-2 ${
                                    job.status === 'Accepted' ? 'text-green-600' : 
                                    job.status === 'Rejected' ? 'text-red-600' : 'text-gray-800'
                                  }`}>
                                    {job.role}
                                  </div>
                                  
                                  {/* Menu Button */}
                                  <div className="relative flex-shrink-0">
                                    <button
                                      onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                                      className="text-lg text-gray-600 hover:text-gray-800 p-1"
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
                                          className="px-3 py-1 text-sm text-gray-700 text-left hover:bg-gray-100 rounded"
                                        >
                                          ✏️ Edit
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(job.id);
                                          }} 
                                          className="px-3 py-1 text-sm text-red-600 text-left hover:bg-red-50 rounded"
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
                                            className="px-3 py-1 text-sm text-blue-600 text-left hover:bg-blue-50 rounded"
                                          >
                                            📅 Interview
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Company and Status Indicators */}
                                <div className="text-sm text-gray-600 mb-2 flex items-center gap-2 flex-wrap">
                                  <span className="flex-1 min-w-0 truncate">{job.company}</span>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    {job.isFavorite && <span className="text-yellow-500">⭐</span>}
                                    {job.priority && (
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        job.priority === 'high' ? 'bg-red-100 text-red-600' :
                                        job.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-green-100 text-green-600'
                                      }`}>
                                        {job.priority === 'high' ? '🔴' : job.priority === 'medium' ? '🟡' : '🟢'}
                                        <span className="hidden sm:inline ml-1">{job.priority}</span>
                                      </span>
                                    )}
                                    {job.isRemote && (
                                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        🏠 <span className="hidden sm:inline">Remote</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Tags */}
                                {job.tags && job.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {job.tags.slice(0, 3).map((tag, index) => (
                                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        #{tag}
                                      </span>
                                    ))}
                                    {job.tags.length > 3 && (
                                      <span className="text-xs text-gray-500">+{job.tags.length - 3}</span>
                                    )}
                                  </div>
                                )}

                                {/* Additional Info */}
                                <div className="space-y-1 text-xs">
                                  {job.salary && (
                                    <div className="text-green-600 font-semibold">{formatSalary(job.salary, country)}</div>
                                  )}
                                  {job.location && (
                                    <div className="text-blue-600 truncate">📍 {job.location}</div>
                                  )}
                                  {job.jobType && (
                                    <div className="text-purple-600">💼 {job.jobType}</div>
                                  )}
                                  {job.interviewDate && (
                                    <div className="text-blue-600">📅 {new Date(job.interviewDate).toLocaleDateString()}</div>
                                  )}
                                  {job.link && (
                                    <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
                                      View Job
                                    </a>
                                  )}
                                  {job.notes && (
                                    <div className="text-gray-500 italic line-clamp-2">{job.notes}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk Actions */}
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

        {/* Congratulations Modal - Improved Mobile */}
        {showCongratulationModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div 
              className="absolute inset-0 bg-black bg-opacity-60"
              onClick={() => setShowCongratulationModal(false)}
            />
            
            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 text-white border-4 border-green-300 shadow-2xl max-w-sm w-full rounded-2xl p-6 z-10">
              <button 
                className="absolute right-2 top-2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-lg flex items-center justify-center transition-all duration-200"
                onClick={() => setShowCongratulationModal(false)}
              >
                ✕
              </button>
              <div className="text-center py-4">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="font-bold text-xl mb-4">Congratulations!</h3>
                <p className="text-base leading-relaxed px-4 mb-6">
                  {congratulationMessage.replace(/^🎉|🌟|🚀|💪|🎊|✨|🏆|🎯|🌈|💎|🔥|⭐\s*/, '')}
                </p>
                <button 
                  className="bg-white text-green-600 hover:bg-green-50 font-bold px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                  onClick={() => setShowCongratulationModal(false)}
                >
                  Thank you! 🙏
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}