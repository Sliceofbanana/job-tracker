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

interface JobEntry {
  id: string;
  uid: string;
  company: string;
  role: string;
  link: string;
  notes: string;
  status: string;
  salary?: string;
  interviewDate?: string;
  companyResearch?: string;
  applicationTemplate?: string;
  createdAt?: Timestamp;
}

export default function Home() {
  const { user, login, logout } = useAuth();

  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [form, setForm] = useState({ company: "", role: "", link: "", notes: "", salary: "", interviewDate: "", companyResearch: "", applicationTemplate: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);
  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [showCongratulationModal, setShowCongratulationModal] = useState(false);
  const [congratulationMessage, setCongratulationMessage] = useState("");

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
        const q = query(
          collection(db, "jobs"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const jobsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as JobEntry[];
        setJobs(jobsData);
      } catch (err) {
        console.error("Error fetching jobs:", err);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddJob = async () => {
    if (isRateLimited()) return;

    // Input validation and sanitization
    const sanitizedForm = {
      company: form.company.trim(),
      role: form.role.trim(),
      link: form.link.trim(),
      notes: form.notes.trim(),
      salary: form.salary.trim(),
      interviewDate: form.interviewDate.trim(),
      companyResearch: form.companyResearch.trim(),
      applicationTemplate: form.applicationTemplate.trim()
    };

    if (!sanitizedForm.company || !sanitizedForm.role) {
      setError("Company and Role are required.");
      return;
    }

    // Validate URL if provided
    if (sanitizedForm.link && !isValidUrl(sanitizedForm.link)) {
      setError("Please provide a valid URL for the job link.");
      return;
    }

    // Length validation
    if (sanitizedForm.company.length > 100 || sanitizedForm.role.length > 100) {
      setError("Company and Role must be less than 100 characters.");
      return;
    }

    if (sanitizedForm.notes.length > 1000) {
      setError("Notes must be less than 1000 characters.");
      return;
    }

    if (sanitizedForm.companyResearch.length > 1000) {
      setError("Company research must be less than 1000 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editId) {
        const jobRef = doc(db, "jobs", editId);
        await updateDoc(jobRef, { ...sanitizedForm });
        setJobs((prev) => prev.map(job => job.id === editId ? { ...job, ...sanitizedForm } : job));
        setEditId(null);
      } else {
        const newJobData = {
          ...sanitizedForm,
          status: "Applied",
          uid: user.uid,
          createdAt: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, "jobs"), newJobData);
        setJobs((prev) => [{ id: docRef.id, ...newJobData }, ...prev]);
      }
      setForm({ company: "", role: "", link: "", notes: "", salary: "", interviewDate: "", companyResearch: "", applicationTemplate: "" });
    } catch {
      setError("Failed to save job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: JobEntry) => {
    setForm({ 
      company: job.company, 
      role: job.role, 
      link: job.link, 
      notes: job.notes,
      salary: job.salary || "",
      interviewDate: job.interviewDate || "",
      companyResearch: job.companyResearch || "",
      applicationTemplate: job.applicationTemplate || ""
    });
    setEditId(job.id);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    if (isRateLimited()) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "jobs", id));
      setJobs((prev) => prev.filter(job => job.id !== id));
      setOpenMenuId(null);
    } catch {
      setError("Failed to delete job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("jobId", id);
    setDraggedJobId(id);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    const id = e.dataTransfer.getData("jobId");
    const job = jobs.find(j => j.id === id);
    const oldStatus = job?.status;
    
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
      }
    } catch {
      setError("Failed to update job status. Please try again.");
    } finally {
      setLoading(false);
      setDraggedJobId(null);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Filter and search functionality
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === "" || 
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || job.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Statistics calculation
  const stats = {
    total: jobs.length,
    applied: jobs.filter(job => job.status === "Applied").length,
    interviewing: jobs.filter(job => job.status === "Interviewing").length,
    offers: jobs.filter(job => job.status === "Offer").length,
    rejected: jobs.filter(job => job.status === "Rejected").length,
    avgSalary: jobs.filter(job => job.salary && !isNaN(Number(job.salary)))
      .reduce((sum, job) => sum + Number(job.salary), 0) / 
      Math.max(jobs.filter(job => job.salary && !isNaN(Number(job.salary))).length, 1)
  };

  return (
    <div className="min-h-screen overflow-x-hidden flex items-center justify-center p-2 sm:p-4 lg:p-6" style={{ backgroundColor: '#333333' }}>
      <Analytics />
      <button onClick={logout} className="absolute top-2 right-2 sm:top-4 sm:right-4 px-3 py-2 sm:px-6 sm:py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-red-400/50 z-50" aria-label="Logout">
        <span className="hidden sm:inline">🚪 Logout</span>
        <span className="sm:hidden">🚪</span>
      </button>
      <div className="relative w-full max-w-7xl p-4 sm:p-6 lg:p-8 rounded-2xl backdrop-blur-md bg-gradient-to-br from-purple-600 to-blue-700 border border-white/20 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset]">
        {/* Neon corners */}
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-36 sm:h-36 bg-cyan-400/30 rounded-full blur-[60px] sm:blur-[80px] border-t-2 border-r-2 border-cyan-300/40 pointer-events-none" style={{ transform: 'translate(50%, -50%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-36 sm:h-36 bg-fuchsia-500/30 rounded-full blur-[60px] sm:blur-[80px] border-b-2 border-l-2 border-fuchsia-400/40 pointer-events-none" style={{ transform: 'translate(-50%, 50%)' }} />

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-4 sm:mb-6 lg:mb-8 text-center px-2">🎯 Job Application Tracker</h1>

        {/* Error and Loading Feedback */}
        {error && !loading && <div className="mb-4 text-center text-red-400 font-semibold animate-pulse">{error}</div>}
        {loading && <div className="mb-4 text-center text-cyan-400 font-semibold animate-pulse">Loading...</div>}

        {/* Advanced Search and Filter */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search jobs by company, role, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
            >
              <option value="all" className="bg-gray-800">All Status</option>
              <option value="Applied" className="bg-gray-800">Applied</option>
              <option value="Interviewing" className="bg-gray-800">Interviewing</option>
              <option value="Offer" className="bg-gray-800">Offer</option>
              <option value="Rejected" className="bg-gray-800">Rejected</option>
            </select>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-purple-400/50 text-sm sm:text-base"
            >
              📊 Stats
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {showStats && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md border border-white/20">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-300 mb-3 sm:mb-4">� Application Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-300">{stats.total}</div>
                <div className="text-xs sm:text-sm text-gray-300">Total</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-300">{stats.applied}</div>
                <div className="text-xs sm:text-sm text-gray-300">Applied</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-300">{stats.interviewing}</div>
                <div className="text-xs sm:text-sm text-gray-300">Interviewing</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-300">{stats.offers}</div>
                <div className="text-xs sm:text-sm text-gray-300">Offers</div>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10 col-span-2 sm:col-span-1">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-300">{stats.rejected}</div>
                <div className="text-xs sm:text-sm text-gray-300">Rejected</div>
              </div>
            </div>
            {stats.avgSalary > 0 && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-800/50 to-emerald-800/50">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-300">${stats.avgSalary.toLocaleString()}</div>
                  <div className="text-xs sm:text-sm text-gray-300">Average Expected Salary</div>
                </div>
              </div>
            )}
          </div>
        )}        {/* Form Section */}
        <div className="mb-6 sm:mb-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-white">Add New Application</h2>
            <button
              onClick={() => setShowAdvancedForm(!showAdvancedForm)}
              className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-blue-400/50 text-sm sm:text-base"
            >
              {showAdvancedForm ? "🔽" : "🔼"} Advanced
            </button>
          </div>
          
          <form className="space-y-3 sm:space-y-4" onSubmit={e => { e.preventDefault(); handleAddJob(); }}>
            {/* Main form row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-center">
              <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base" aria-label="Company" required />
              <input name="role" placeholder="Job Title" value={form.role} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base" aria-label="Job Title" required />
              <input name="link" placeholder="Job Link (optional)" value={form.link} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base sm:col-span-2 lg:col-span-1" aria-label="Job Link" />
            </div>
            
            {/* Advanced form fields */}
            {showAdvancedForm && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
                <input name="salary" placeholder="💰 Expected Salary" value={form.salary} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base" aria-label="Salary" />
                <input name="interviewDate" type="datetime-local" placeholder="📅 Interview Date" value={form.interviewDate} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base" aria-label="Interview Date" />
                <textarea name="companyResearch" placeholder="🏢 Company Research Notes" value={form.companyResearch} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none text-sm sm:text-base" rows={1} aria-label="Company Research" />
                <select name="applicationTemplate" value={form.applicationTemplate} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base" aria-label="Application Template">
                  <option value="" className="bg-gray-800">📝 Select Template</option>
                  <option value="software-engineer" className="bg-gray-800">Software Engineer</option>
                  <option value="product-manager" className="bg-gray-800">Product Manager</option>
                  <option value="data-scientist" className="bg-gray-800">Data Scientist</option>
                  <option value="designer" className="bg-gray-800">Designer</option>
                  <option value="marketing" className="bg-gray-800">Marketing</option>
                  <option value="sales" className="bg-gray-800">Sales</option>
                  <option value="custom" className="bg-gray-800">Custom</option>
                </select>
              </div>
            )}
            
            {/* Notes field - full width */}
            <div className="w-full">
              <textarea name="notes" placeholder="Notes (e.g., interview tips, HR contact)" value={form.notes} onChange={handleChange} className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none text-sm sm:text-base" rows={2} aria-label="Notes" />
            </div>

            {/* Submit Button - responsive alignment */}
            <div className="flex justify-center sm:justify-end">
              <button type="submit" disabled={loading} className={`w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-green-400/50 ${loading ? 'opacity-50 cursor-not-allowed transform-none' : 'cursor-pointer'}`}
                aria-label={editId ? "Save Changes" : "Add Job"}>
                {editId ? "💾 Save Changes" : "➕ Add Job"}
              </button>
            </div>
          </form>
        </div>

        {/* Separator Line */}
        <div className="mb-6 sm:mb-8 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

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
                      className={`relative border border-gray-300 rounded-lg p-3 sm:p-4 space-y-2 hover:shadow-md transition w-full bg-white ${job.status === 'Rejected' ? 'opacity-50' : ''} ${draggedJobId === job.id ? 'ring-2 ring-fuchsia-400' : ''}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, job.id)}
                      onDragEnd={() => setDraggedJobId(null)}
                      aria-grabbed={draggedJobId === job.id}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`text-base sm:text-lg break-words font-bold ${job.status === 'Offer' ? 'text-green-600' : job.status === 'Rejected' ? 'text-red-600' : 'text-gray-800'}`}>{job.role}</div>
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
                                  handleEdit(job);
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
                      <div className="text-xs sm:text-sm text-gray-600 break-words">{job.company}</div>
                      {job.salary && (
                        <div className="text-xs sm:text-sm text-green-600 font-semibold">💰 ${Number(job.salary).toLocaleString()}</div>
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
      </div>

      {/* Congratulations Modal */}
      {showCongratulationModal && (
        <div className="modal modal-open">
          <div className="modal-box relative bg-gradient-to-br from-green-400 to-emerald-500 text-white border-4 border-green-300 shadow-2xl max-w-xs sm:max-w-md mx-4">
            <button 
              className="btn btn-sm btn-circle absolute right-2 top-2 bg-white/20 hover:bg-white/30 border-none text-white"
              onClick={() => setShowCongratulationModal(false)}
            >
              ✕
            </button>
            <div className="text-center py-6 sm:py-8">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
              <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4">Congratulations!</h3>
              <p className="text-base sm:text-lg leading-relaxed px-2 sm:px-4">
                {congratulationMessage.replace(/^🎉|🌟|🚀|💪|🎊|✨|🏆|🎯|🌈|💎|🔥|⭐\s*/, '')}
              </p>
              <div className="modal-action justify-center mt-6 sm:mt-8">
                <button 
                  className="btn bg-white text-green-600 hover:bg-green-50 border-none font-bold px-6 sm:px-8 text-sm sm:text-base"
                  onClick={() => setShowCongratulationModal(false)}
                >
                  Thank you! 🙏
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => setShowCongratulationModal(false)}></div>
        </div>
      )}
    </div>
  );
}