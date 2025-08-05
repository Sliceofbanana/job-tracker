"use client";

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface FeedbackSectionProps {
  className?: string;
}

export default function FeedbackSection({ className = "" }: FeedbackSectionProps) {
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'bug',
    title: '',
    description: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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
        status: 'new',
        userAgent: navigator.userAgent,
        url: window.location.href
      });
      
      setSubmitMessage('Thank you for your feedback! We appreciate your input and will review it soon.');
      setFeedbackForm({ type: 'bug', title: '', description: '', email: '' });
      
      // Auto-collapse after successful submission
      setTimeout(() => {
        setIsExpanded(false);
        setSubmitMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitMessage('Sorry, there was an error submitting your feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Compact Header - Always Visible */}
      <div 
        className="p-4 rounded-xl bg-gradient-to-r from-orange-600/20 to-yellow-600/20 backdrop-blur-md border border-orange-400/30 cursor-pointer hover:from-orange-600/30 hover:to-yellow-600/30 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐛</span>
            <div>
              <h3 className="text-lg font-bold text-orange-300">Report Bugs & Suggest Features</h3>
              <p className="text-sm text-white/70">Help us improve this job tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-2">
              <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-medium">🐛 Bugs</span>
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-medium">💡 Ideas</span>
              <span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs font-medium">⚡ Improvements</span>
            </div>
            <span className={`text-white transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Feedback Form */}
      {isExpanded && (
        <div className="mt-4 p-6 rounded-xl bg-gradient-to-br from-orange-800/30 to-yellow-800/30 backdrop-blur-md border border-orange-400/30 animate-slide-down">
          <div className="mb-6">
            <p className="text-white/80 mb-4">
              Found a bug? Have an idea for improvement? We&apos;d love to hear from you! Your feedback helps make this tracker better for everyone.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-400/30">
                <div className="text-red-400 text-xl mb-2">🐛</div>
                <h4 className="font-bold text-red-300">Bug Reports</h4>
                <p className="text-sm text-white/70">Something not working as expected?</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-500/20 border border-blue-400/30">
                <div className="text-blue-400 text-xl mb-2">💡</div>
                <h4 className="font-bold text-blue-300">Feature Requests</h4>
                <p className="text-sm text-white/70">Have an idea to make this better?</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/20 border border-green-400/30">
                <div className="text-green-400 text-xl mb-2">⚡</div>
                <h4 className="font-bold text-green-300">Improvements</h4>
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
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                required
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-600/70 text-white transition-colors"
              >
                Cancel
              </button>
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
      )}

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 1000px;
          }
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
