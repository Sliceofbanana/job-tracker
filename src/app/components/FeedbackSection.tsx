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
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      
      // Auto-close modal after successful submission
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitMessage('Sorry, there was an error submitting your feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitMessage('');
    setFeedbackForm({ type: 'bug', title: '', description: '', email: '' });
  };

  return (
    <div className={`${className}`}>
      {/* Feedback Button */}
      <div className="flex justify-start">
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-orange-400/50 flex items-center gap-2"
        >
          <span className="text-lg">🐛</span>
          <span className="hidden sm:inline">Report Bug / Suggest Feature</span>
          <span className="sm:hidden">Feedback</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4">
          {/* Background overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          
          {/* Modal content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-orange-800/90 to-yellow-800/90 backdrop-blur-md border border-orange-400/30 rounded-xl shadow-2xl z-10">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-600/20 to-yellow-600/20 backdrop-blur-md border-b border-orange-400/30 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🐛</span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-orange-300">Report Bugs & Suggest Features</h3>
                    <p className="text-xs sm:text-sm text-white/70">Help us improve this job tracker</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6">
                <p className="text-white/80 mb-4 text-sm sm:text-base">
                  Found a bug? Have an idea for improvement? We&apos;d love to hear from you! Your feedback helps make this tracker better for everyone.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="p-3 sm:p-4 rounded-lg bg-red-500/20 border border-red-400/30">
                    <div className="text-red-400 text-lg sm:text-xl mb-2">🐛</div>
                    <h4 className="font-bold text-red-300 text-sm sm:text-base">Bug Reports</h4>
                    <p className="text-xs sm:text-sm text-white/70">Something not working as expected?</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-lg bg-blue-500/20 border border-blue-400/30">
                    <div className="text-blue-400 text-lg sm:text-xl mb-2">💡</div>
                    <h4 className="font-bold text-blue-300 text-sm sm:text-base">Feature Requests</h4>
                    <p className="text-xs sm:text-sm text-white/70">Have an idea to make this better?</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-lg bg-green-500/20 border border-green-400/30">
                    <div className="text-green-400 text-lg sm:text-xl mb-2">⚡</div>
                    <h4 className="font-bold text-green-300 text-sm sm:text-base">Improvements</h4>
                    <p className="text-xs sm:text-sm text-white/70">Suggestions for existing features?</p>
                  </div>
                </div>
              </div>

              {submitMessage && (
                <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg text-sm sm:text-base ${
                  submitMessage.includes('Thank you') 
                    ? 'bg-green-500/20 border border-green-400/30 text-green-300' 
                    : 'bg-red-500/20 border border-red-400/30 text-red-300'
                }`}>
                  {submitMessage}
                </div>
              )}

              <form onSubmit={handleFeedbackSubmit} className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white/80 mb-2">
                      Type of Feedback
                    </label>
                    <select
                      name="type"
                      value={feedbackForm.type}
                      onChange={handleFeedbackChange}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm sm:text-base"
                      required
                    >
                      <option value="bug" className="bg-gray-800">🐛 Bug Report</option>
                      <option value="feature" className="bg-gray-800">💡 Feature Request</option>
                      <option value="improvement" className="bg-gray-800">⚡ Improvement Suggestion</option>
                      <option value="other" className="bg-gray-800">💬 Other Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-white/80 mb-2">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={feedbackForm.email}
                      onChange={handleFeedbackChange}
                      placeholder="your.email@example.com"
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white/80 mb-2">
                    Title/Summary
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={feedbackForm.title}
                    onChange={handleFeedbackChange}
                    placeholder="Brief description of the issue or suggestion"
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-white/80 mb-2">
                    Detailed Description
                  </label>
                  <textarea
                    name="description"
                    value={feedbackForm.description}
                    onChange={handleFeedbackChange}
                    placeholder="Please provide as much detail as possible. For bugs, include steps to reproduce. For features, explain the use case and expected behavior."
                    rows={4}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none text-sm sm:text-base"
                    required
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-lg bg-gray-600/50 hover:bg-gray-600/70 text-white transition-colors text-sm sm:text-base order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base order-1 sm:order-2 ${
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
          </div>
        </div>
      )}
    </div>
  );
}
