"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "./authprovider";
import Login from "./login";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const statuses = ["Applied", "Interviewing", "Offer", "Rejected"];

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
  createdAt?: any;
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

  // Fetch jobs from Firebase
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const jobSnapshot = await getDocs(collection(db, "jobs"));
        const jobsData: JobEntry[] = jobSnapshot.docs
          .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<JobEntry, "id">) }))
          .filter((job) => job.uid === user.uid);
        setJobs(jobsData);
        setError(null); // Clear any previous errors on successful fetch
      } catch (error) {
        console.error("Error fetching jobs:", error);
        // Only show error for actual failures, not empty results
        setError("Failed to fetch jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
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
    setLoading(true);
    setError(null);
    try {
      const jobRef = doc(db, "jobs", id);
      await updateDoc(jobRef, { status: newStatus });
      setJobs((prev) => prev.map(job => job.id === id ? { ...job, status: newStatus } : job));
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
    <div className="h-screen overflow-hidden flex items-center justify-center p-6" style={{ backgroundColor: '#333333' }}>
      <button onClick={logout} className="absolute top-4 right-4 px-4 py-2 rounded-lg bg-gradient-to-br from-red-500/30 to-red-600/30 backdrop-blur-md border border-white/30 text-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] transition cursor-pointer z-50" aria-label="Logout">
        🚪 Logout
      </button>
      <div className="relative w-full max-w-7xl p-8 rounded-2xl backdrop-blur-md bg-gradient-to-br from-purple-600 to-blue-700 border border-white/20 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset]">
        {/* Neon corners */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/30 rounded-full blur-[80px] border-t-2 border-r-2 border-cyan-300/40 pointer-events-none" style={{ transform: 'translate(50%, -50%)' }} />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-fuchsia-500/30 rounded-full blur-[80px] border-b-2 border-l-2 border-fuchsia-400/40 pointer-events-none" style={{ transform: 'translate(-50%, 50%)' }} />

        <h1 className="text-4xl font-extrabold text-white mb-8 text-center">🎯 Job Application Tracker</h1>

        {/* Error and Loading Feedback */}
        {error && !loading && <div className="mb-4 text-center text-red-400 font-semibold animate-pulse">{error}</div>}
        {loading && <div className="mb-4 text-center text-cyan-400 font-semibold animate-pulse">Loading...</div>}

        {/* Advanced Search and Filter */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="🔍 Search jobs by company, role, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all" className="bg-gray-800">All Status</option>
              <option value="Applied" className="bg-gray-800">Applied</option>
              <option value="Interviewing" className="bg-gray-800">Interviewing</option>
              <option value="Offer" className="bg-gray-800">Offer</option>
              <option value="Rejected" className="bg-gray-800">Rejected</option>
            </select>
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-4 py-2 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 backdrop-blur-md border border-white/30 text-white font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition cursor-pointer"
            >
              📊 Stats
            </button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        {showStats && (
          <div className="mb-6 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Application Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
                <div className="text-white/70 text-sm">Total</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.applied}</div>
                <div className="text-white/70 text-sm">Applied</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.interviewing}</div>
                <div className="text-white/70 text-sm">Interviewing</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.offers}</div>
                <div className="text-white/70 text-sm">Offers</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
                <div className="text-white/70 text-sm">Rejected</div>
              </div>
            </div>
            {stats.avgSalary > 0 && (
              <div className="mt-4 text-center">
                <div className="text-lg text-white">💰 Average Salary: <span className="font-bold text-green-400">${stats.avgSalary.toLocaleString()}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Form Section */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Add New Application</h2>
            <button
              onClick={() => setShowAdvancedForm(!showAdvancedForm)}
              className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition cursor-pointer"
            >
              {showAdvancedForm ? "🔽" : "🔼"} Advanced
            </button>
          </div>
          
          <form className="grid md:grid-cols-4 gap-4 items-start" onSubmit={e => { e.preventDefault(); handleAddJob(); }}>
            <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Company" required />
            <input name="role" placeholder="Job Title" value={form.role} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Job Title" required />
            <input name="link" placeholder="Job Link (optional)" value={form.link} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Job Link" />
            <button type="submit" disabled={loading} className={`w-full px-5 py-3 rounded-lg bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 backdrop-blur-md border border-white/30 text-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={editId ? "Save Changes" : "Add Job"}>
              {editId ? "💾 Save Changes" : "➕ Add Job"}
            </button>
            
            {showAdvancedForm && (
              <>
                <input name="salary" placeholder="💰 Expected Salary" value={form.salary} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Salary" />
                <input name="interviewDate" type="datetime-local" placeholder="📅 Interview Date" value={form.interviewDate} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Interview Date" />
                <textarea name="companyResearch" placeholder="🏢 Company Research Notes" value={form.companyResearch} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Company Research" />
                <select name="applicationTemplate" value={form.applicationTemplate} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Application Template">
                  <option value="" className="bg-gray-800">📝 Select Template</option>
                  <option value="software-engineer" className="bg-gray-800">Software Engineer</option>
                  <option value="product-manager" className="bg-gray-800">Product Manager</option>
                  <option value="data-scientist" className="bg-gray-800">Data Scientist</option>
                  <option value="designer" className="bg-gray-800">Designer</option>
                  <option value="marketing" className="bg-gray-800">Marketing</option>
                  <option value="sales" className="bg-gray-800">Sales</option>
                  <option value="custom" className="bg-gray-800">Custom</option>
                </select>
              </>
            )}
            
            <div className="col-span-6">
              <textarea name="notes" placeholder="Notes (e.g., interview tips, HR contact)" value={form.notes} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Notes" />
            </div>
          </form>
        </div>

        {/* Job Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
          {statuses.map(status => {
            const statusJobs = filteredJobs.filter(job => job.status === status);
            return (
              <div key={status} className={`p-4 rounded-xl border border-base-200 shadow-sm w-full flex flex-col bg-white/10 transition-all duration-200 ${draggedJobId ? 'ring-2 ring-cyan-400' : ''}`}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
                aria-label={status + ' jobs'}>
                <h2 className="text-xl font-bold text-white mb-4 border-b pb-2 border-white/30">
                  {status} ({statusJobs.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {statusJobs.map(job => (
                    <div
                      key={job.id}
                      className={`relative border border-gray-300 rounded-lg p-4 space-y-2 hover:shadow-md transition w-full bg-white ${job.status === 'Rejected' ? 'opacity-50' : ''} ${draggedJobId === job.id ? 'ring-2 ring-fuchsia-400' : ''}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, job.id)}
                      onDragEnd={() => setDraggedJobId(null)}
                      aria-grabbed={draggedJobId === job.id}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`text-lg break-words font-bold ${job.status === 'Offer' ? 'text-green-600' : job.status === 'Rejected' ? 'text-red-600' : 'text-gray-800'}`}>{job.role}</div>
                        {/* 3-dot dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                            className="text-xl text-gray-600 hover:text-gray-800 cursor-pointer"
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
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 break-words">{job.company}</div>
                      {job.salary && (
                        <div className="text-sm text-green-600 font-semibold">💰 ${Number(job.salary).toLocaleString()}</div>
                      )}
                      {job.interviewDate && (
                        <div className="text-sm text-blue-600">📅 {new Date(job.interviewDate).toLocaleDateString()}</div>
                      )}
                      {job.link && (
                        <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-words" aria-label="View job link">View Job</a>
                      )}
                      {job.companyResearch && (
                        <div className="text-xs text-purple-600 italic break-words">🏢 {job.companyResearch}</div>
                      )}
                      {job.applicationTemplate && (
                        <div className="text-xs text-orange-600">📝 Template: {job.applicationTemplate}</div>
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
    </div>
  );
}