// File: app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const statuses = ["Applied", "Interviewing", "Offer", "Rejected"];

interface JobEntry {
  id: string;
  company: string;
  role: string;
  link: string;
  notes: string;
  status: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobEntry[]>([]);
  const [form, setForm] = useState({ company: "", role: "", link: "", notes: "" });
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("jobs");
    if (stored) setJobs(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("jobs", JSON.stringify(jobs));
  }, [jobs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddJob = () => {
    if (!form.company || !form.role) return;

    if (editId) {
      setJobs(jobs.map(job => job.id === editId ? { ...job, ...form } : job));
      setEditId(null);
    } else {
      const newJob: JobEntry = { id: uuidv4(), ...form, status: "Applied" };
      setJobs([newJob, ...jobs]);
    }

    setForm({ company: "", role: "", link: "", notes: "" });
  };

  const handleEdit = (job: JobEntry) => {
    setForm({ company: job.company, role: job.role, link: job.link, notes: job.notes });
    setEditId(job.id);
  };

  const handleDelete = (id: string) => {
    setJobs(jobs.filter(job => job.id !== id));
  };

  const changeStatus = (id: string, newStatus: string) => {
    const updated = jobs.map(job => job.id === id ? { ...job, status: newStatus } : job);
    setJobs(updated);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-90 p-6 overflow-auto">
      <div className="relative w-full max-w-7xl p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.1),_0_0_50px_0_rgba(0,255,255,0.2)_inset,_0_0_50px_0_rgba(255,0,255,0.2)_inset]">

        {/* Neon glow corners */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/30 rounded-full blur-3xl" style={{ transform: 'translate(50%, -50%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/30 rounded-full blur-3xl" style={{ transform: 'translate(-50%, 50%)' }} />

        <h1 className="text-4xl font-extrabold mb-8 text-center text-primary">🎯 Job Application Tracker</h1>

        {/* Form Section */}
        <div className="grid md:grid-cols-4 gap-4 items-start mb-10">
          <input name="company" placeholder="Company" value={form.company} onChange={handleChange} className="input input-bordered w-full" />
          <input name="role" placeholder="Job Title" value={form.role} onChange={handleChange} className="input input-bordered w-full" />
          <input name="link" placeholder="Job Link (optional)" value={form.link} onChange={handleChange} className="input input-bordered w-full" />
          <button onClick={handleAddJob} className="btn w-full text-white font-semibold text-lg bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-500 border-none shadow-md hover:brightness-110 transition">
            {editId ? "💾 Save Changes" : "➕ Add Job"}
          </button>
          <div className="col-span-4">
            <textarea name="notes" placeholder="Notes (e.g., interview tips, HR contact)" value={form.notes} onChange={handleChange} className="textarea textarea-bordered w-full" />
          </div>
        </div>

        {/* Job Status Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statuses.map(status => (
            <div key={status} className="bg-white/10 p-4 rounded-xl border border-base-200 shadow-sm">
              <h2 className="text-xl font-bold text-primary mb-4 border-b pb-2 border-base-300">{status}</h2>
              <div className="space-y-3">
                {jobs.filter(job => job.status === status).map(job => (
                  <div key={job.id} className="bg-base-200/80 border border-base-300 rounded-lg p-4 space-y-2 hover:shadow-md transition">
                    <div className="font-bold text-lg text-base-content">{job.role}</div>
                    <div className="text-sm text-base-content/70">{job.company}</div>
                    {job.link && (<a href={job.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">View Job</a>)}
                    {job.notes && (<div className="text-xs text-base-content/60 italic">{job.notes}</div>)}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {statuses.map(s => s !== status && (
                        <button key={s} onClick={() => changeStatus(job.id, s)} className="btn btn-xs btn-outline">Move to {s}</button>
                      ))}
                      <button onClick={() => handleEdit(job)} className="btn btn-xs btn-warning">✏️ Edit</button>
                      <button onClick={() => handleDelete(job.id)} className="btn btn-xs btn-error text-white">🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}