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
}

export default function Home() {
  const { user, login, logout } = useAuth();

  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [form, setForm] = useState({ company: "", role: "", link: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState(0);

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
      } catch {
        setError("Failed to fetch jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

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

  // Return login prompt after hooks
  if (!user) {
    return <Login onLogin={login} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      notes: form.notes.trim()
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
      setForm({ company: "", role: "", link: "", notes: "" });
    } catch {
      setError("Failed to save job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (job: JobEntry) => {
    setForm({ company: job.company, role: job.role, link: job.link, notes: job.notes });
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
        {error && <div className="mb-4 text-center text-red-400 font-semibold animate-pulse">{error}</div>}
        {loading && <div className="mb-4 text-center text-cyan-400 font-semibold animate-pulse">Loading...</div>}

        {/* Form Section */}
        <form className="grid md:grid-cols-4 gap-4 items-start mb-10 w-full" onSubmit={e => { e.preventDefault(); handleAddJob(); }}>
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Company" required />
          <input name="role" placeholder="Job Title" value={form.role} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Job Title" required />
          <input name="link" placeholder="Job Link (optional)" value={form.link} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Job Link" />
          <button type="submit" disabled={loading} className={`w-full px-5 py-3 rounded-lg bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 backdrop-blur-md border border-white/30 text-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition cursor-pointer ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={editId ? "Save Changes" : "Add Job"}>
            {editId ? "💾 Save Changes" : "➕ Add Job"}
          </button>
          <div className="col-span-4">
            <textarea name="notes" placeholder="Notes (e.g., interview tips, HR contact)" value={form.notes} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400" aria-label="Notes" />
          </div>
        </form>

        {/* Job Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
          {statuses.map(status => {
            const filteredJobs = jobs.filter(job => job.status === status);
            return (
              <div key={status} className={`p-4 rounded-xl border border-base-200 shadow-sm w-full flex flex-col bg-white/10 transition-all duration-200 ${draggedJobId ? 'ring-2 ring-cyan-400' : ''}`}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, status)}
                aria-label={status + ' jobs'}>
                <h2 className="text-xl font-bold text-white mb-4 border-b pb-2 border-white/30">{status}</h2>
                <div className="flex flex-col gap-3">
                  {filteredJobs.map(job => (
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
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 break-words">{job.company}</div>
                      {job.link && (
                        <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-words" aria-label="View job link">View Job</a>
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