"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface AboutPageProps {
  className?: string;
}

export default function AboutPage({ className = "" }: AboutPageProps) {
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'bug',
    title: '',
    description: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Add feedback to Firestore
      await addDoc(collection(db, 'feedback'), {
        type: feedbackForm.type,
        title: feedbackForm.title,
        description: feedbackForm.description,
        email: feedbackForm.email || null,
        timestamp: serverTimestamp(),
        status: 'new', // For tracking feedback status
        userAgent: navigator.userAgent, // Helpful for bug reports
        url: window.location.href
      });
      
      setSubmitMessage('Thank you for your feedback! We appreciate your input and will review it soon.');
      setFeedbackForm({ type: 'bug', title: '', description: '', email: '' });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitMessage('Sorry, there was an error submitting your feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Section */}
      <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-800/50 to-blue-800/50 backdrop-blur-md border border-white/20">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-3xl font-bold text-white mb-4">Why We Created This Job Tracker</h1>
        <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
          Born from the frustration of disorganized job searches and missed opportunities, 
          this tracker was designed to solve real problems faced by job seekers everywhere.
        </p>
      </div>

      {/* Problem Statement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-gradient-to-br from-red-800/30 to-red-900/30 backdrop-blur-md border border-red-400/30">
          <h2 className="text-2xl font-bold text-red-300 mb-4 flex items-center gap-3">
            😤 The Problems We Faced
          </h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📝</span>
              <span><strong>Lost Track of Applications:</strong> Applied to dozens of companies but couldn&apos;t remember which ones or when.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📅</span>
              <span><strong>Missed Interview Dates:</strong> Forgot about scheduled interviews or arrived unprepared.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📊</span>
              <span><strong>No Progress Tracking:</strong> Couldn&apos;t see patterns in rejections or measure application success rates.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">🔄</span>
              <span><strong>Improvised Follow-ups:</strong> Never knew when to follow up or what to say.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 text-xl">📋</span>
              <span><strong>Scattered Information:</strong> Job details spread across emails, notes, and browser bookmarks.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-br from-green-800/30 to-green-900/30 backdrop-blur-md border border-green-400/30">
          <h2 className="text-2xl font-bold text-green-300 mb-4 flex items-center gap-3">
            ✨ Our Solution
          </h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">🎯</span>
              <span><strong>Centralized Tracking:</strong> All your applications in one place with detailed progress tracking.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">🔔</span>
              <span><strong>Smart Notifications:</strong> Never miss an interview or follow-up deadline again.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">📈</span>
              <span><strong>Analytics Dashboard:</strong> Visualize your job search progress and identify improvement areas.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">📅</span>
              <span><strong>Calendar Integration:</strong> See all your interviews and deadlines in an organized calendar view.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400 text-xl">🏷️</span>
              <span><strong>Smart Organization:</strong> Tag, filter, and categorize applications for easy management.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Story Section */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-blue-800/30 to-purple-800/30 backdrop-blur-md border border-blue-400/30">
        <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-3">
          📖 The Story Behind This Tracker
        </h2>
        <div className="text-white/80 space-y-4 leading-relaxed">
          <p>
            Like many job seekers, we started our job search with good intentions. We would apply to companies, 
            save job postings in bookmarks, and jot down notes in random places. But as the applications 
            piled up, chaos ensued.
          </p>
          <p>
            We once showed up to an interview a day late because we confused the dates. Another time, 
            we applied to the same company twice because we lost track of our applications. The final 
            straw was when a recruiter asked about our application timeline, and we had no idea what 
            we had submitted or when.
          </p>
          <p>
            That&apos;s when we realized: <strong className="text-blue-300">job searching isn&apos;t just about finding jobs—it&apos;s about managing a complex process</strong>. 
            This tracker was born from that realization, designed to turn the chaotic job search into 
            an organized, trackable, and ultimately successful journey.
          </p>
          <p className="text-cyan-300 font-semibold">
            💡 Every feature in this tracker solves a real problem we faced during our job search. 
            From drag-and-drop status updates to automated follow-up reminders, it&apos;s built by job seekers, for job seekers.
          </p>
        </div>
      </div>

      {/* Features Highlight */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-md border border-purple-400/30">
        <h2 className="text-2xl font-bold text-purple-300 mb-4 flex items-center gap-3">
          🚀 Key Features That Make a Difference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="font-bold text-white mb-2">Kanban Board</h3>
            <p className="text-sm text-white/70">Visual progress tracking with drag-and-drop functionality</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-bold text-white mb-2">Calendar View</h3>
            <p className="text-sm text-white/70">See all your interviews and deadlines at a glance</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-bold text-white mb-2">Analytics</h3>
            <p className="text-sm text-white/70">Track success rates and identify improvement areas</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="font-bold text-white mb-2">Smart Notifications</h3>
            <p className="text-sm text-white/70">Automated reminders for interviews and follow-ups</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">🏷️</div>
            <h3 className="font-bold text-white mb-2">Advanced Filtering</h3>
            <p className="text-sm text-white/70">Tag, search, and filter applications effortlessly</p>
          </div>
          <div className="p-4 rounded-lg bg-white/10">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-bold text-white mb-2">Goal Tracking</h3>
            <p className="text-sm text-white/70">Set and achieve your job search milestones</p>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-orange-800/30 to-yellow-800/30 backdrop-blur-md border border-orange-400/30">
        <h2 className="text-2xl font-bold text-orange-300 mb-4 flex items-center gap-3">
          🐛 Help Us Improve - Report Bugs & Suggest Features
        </h2>
        
        <div className="mb-6">
          <p className="text-white/80 mb-4">
            Found a bug? Have an idea for improvement? We&apos;d love to hear from you! Your feedback helps make this tracker better for everyone.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-400/30">
              <div className="text-red-400 text-xl mb-2">🐛</div>
              <h3 className="font-bold text-red-300">Bug Reports</h3>
              <p className="text-sm text-white/70">Something not working as expected?</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-400/30">
              <div className="text-blue-400 text-xl mb-2">💡</div>
              <h3 className="font-bold text-blue-300">Feature Requests</h3>
              <p className="text-sm text-white/70">Have an idea to make this better?</p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
              <div className="text-green-400 text-xl mb-2">⚡</div>
              <h3 className="font-bold text-green-300">Improvements</h3>
              <p className="text-sm text-white/70">Suggestions for existing features?</p>
            </div>
          </div>
        </div>

        {submitMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            submitMessage.includes('Thank you') 
              ? 'bg-green-500/20 border border-green-400/30 text-green-300' 
              : 'bg-red-500/20 border border-red-400/30 text-red-300'
          }`}>
            {submitMessage}
          </div>
        )}

        <form onSubmit={handleFeedbackSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Type of Feedback
              </label>
              <select
                name="type"
                value={feedbackForm.type}
                onChange={handleFeedbackChange}
                className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
                required
              >
                <option value="bug" className="bg-gray-800">🐛 Bug Report</option>
                <option value="feature" className="bg-gray-800">💡 Feature Request</option>
                <option value="improvement" className="bg-gray-800">⚡ Improvement Suggestion</option>
                <option value="other" className="bg-gray-800">💬 Other Feedback</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={feedbackForm.email}
                onChange={handleFeedbackChange}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Title/Summary
            </label>
            <input
              type="text"
              name="title"
              value={feedbackForm.title}
              onChange={handleFeedbackChange}
              placeholder="Brief description of the issue or suggestion"
              className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Detailed Description
            </label>
            <textarea
              name="description"
              value={feedbackForm.description}
              onChange={handleFeedbackChange}
              placeholder="Please provide as much detail as possible. For bugs, include steps to reproduce. For features, explain the use case and expected behavior."
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-bold transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>

      {/* Contact & Social */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/20 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Stay Connected</h2>
        <p className="text-white/60 mb-4">
          Follow our journey and get updates on new features and improvements.
        </p>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 rounded-lg bg-white/10 text-white/70">
            💼 Built with ❤️ for job seekers
          </div>
          <div className="px-4 py-2 rounded-lg bg-white/10 text-white/70">
            🚀 Always improving
          </div>
        </div>
      </div>
    </div>
  );
}
