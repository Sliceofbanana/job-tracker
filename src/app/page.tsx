"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "./authprovider";
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

  // Show sign-in screen if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <button onClick={login} className="px-4 py-2 bg-blue-600 rounded-lg">
          Sign in with Google
        </button>
      </div>
    );
  }

  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [form, setForm] = useState({ company: "", role: "", link: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const jobSnapshot = await getDocs(collection(db, "jobs"));
      const jobsData = jobSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((job: any) => job.uid === user.uid) as JobEntry[];
      setJobs(jobsData);
    };
    fetchJobs();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddJob = async () => {
    if (!form.company || !form.role) return;

    if (editId) {
      const jobRef = doc(db, "jobs", editId);
      await updateDoc(jobRef, { ...form });
      setJobs(jobs.map(job => job.id === editId ? { ...job, ...form } : job));
      setEditId(null);
    } else {
      const newJobData = {
        ...form,
        status: "Applied",
        uid: user.uid,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "jobs"), newJobData);
      const newJob: JobEntry = { id: docRef.id, ...newJobData };
      setJobs([newJob, ...jobs]);
    }

    setForm({ company: "", role: "", link: "", notes: "" });
  };

  const handleEdit = (job: JobEntry) => {
    setForm({ company: job.company, role: job.role, link: job.link, notes: job.notes });
    setEditId(job.id);
    setOpenMenuId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "jobs", id));
    setJobs(jobs.filter(job => job.id !== id));
    setOpenMenuId(null);
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("jobId", id);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    const id = e.dataTransfer.getData("jobId");
    const jobRef = doc(db, "jobs", id);
    await updateDoc(jobRef, { status: newStatus });
    const updated = jobs.map(job => job.id === id ? { ...job, status: newStatus } : job);
    setJobs(updated);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-black bg-opacity-90 p-6">
      <button onClick={logout} className="absolute top-4 right-4 text-white bg-red-500 px-3 py-1 rounded z-50">
        Logout
      </button>
      <div className="relative w-full max-w-7xl p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/20 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset]">


        {/* Neon corners */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-400/30 rounded-full blur-[80px] border-t-2 border-r-2 border-cyan-300/40 pointer-events-none" style={{ transform: 'translate(50%, -50%)' }} />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-fuchsia-500/30 rounded-full blur-[80px] border-b-2 border-l-2 border-fuchsia-400/40 pointer-events-none" style={{ transform: 'translate(-50%, 50%)' }} />

        <h1 className="text-4xl font-extrabold mb-8 text-center text-primary">🎯 Job Application Tracker</h1>

        {/* Form Section */}
        <div className="grid md:grid-cols-4 gap-4 items-start mb-10 w-full">
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white" />
          <input name="role" placeholder="Job Title" value={form.role} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white" />
          <input name="link" placeholder="Job Link (optional)" value={form.link} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white" />
          <button onClick={handleAddJob} className="w-full px-5 py-3 rounded-lg bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 backdrop-blur-md border border-white/30 text-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(0,255,255,0.5)] transition cursor-pointer">
            {editId ? "💾 Save Changes" : "➕ Add Job"}
          </button>
          <div className="col-span-4">
            <textarea name="notes" placeholder="Notes (e.g., interview tips, HR contact)" value={form.notes} onChange={handleChange} className="w-full px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white" />
          </div>
        </div>

        {/* Job Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
          {statuses.map(status => {
            const filteredJobs = jobs.filter(job => job.status === status);

            return (
              <div key={status} className="p-4 rounded-xl border border-base-200 shadow-sm w-full flex flex-col bg-white/10" onDragOver={onDragOver} onDrop={(e) => onDrop(e, status)}>
                <h2 className="text-xl font-bold text-primary mb-4 border-b pb-2 border-base-300">{status}</h2>

                <div className="flex flex-col gap-3">
                  {filteredJobs.map(job => (
                    <div
                      key={job.id}
                      className={`relative border border-base-300 rounded-lg p-4 space-y-2 hover:shadow-md transition w-full bg-base-200/80 ${job.status === 'Rejected' ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, job.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`text-lg break-words font-bold ${job.status === 'Offer' ? 'text-green-400' : job.status === 'Rejected' ? 'text-red-500' : 'text-base-content'}`}>
                          {job.role}
                        </div>

                        {/* 3-dot dropdown */}
                        <div className="relative" ref={menuRef}>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                            className="text-xl text-base-content/60 hover:text-base-content cursor-pointer"
                          >
                            ⋮
                          </button>

                          {openMenuId === job.id && (
                            <div className="absolute top-6 right-0 flex flex-col p-2 gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-md shadow-md z-10 min-w-[120px]">
                              <button onClick={() => handleEdit(job)} className="px-3 py-1 text-sm text-white text-left hover:bg-white/10 rounded cursor-pointer">✏️ Edit</button>
                              <button onClick={() => handleDelete(job.id)} className="px-3 py-1 text-sm text-red-400 text-left hover:bg-red-400/10 rounded cursor-pointer">🗑️ Delete</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-base-content/70 break-words">{job.company}</div>
                      {job.link && (
                        <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline break-words">View Job</a>
                      )}
                      {job.notes && (
                        <div className="text-xs text-base-content/60 italic break-words">{job.notes}</div>
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