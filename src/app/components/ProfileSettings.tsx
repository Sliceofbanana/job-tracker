"use client";

import { useState } from 'react';
import { useAuth } from '../authprovider';
import { db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import AnalyticsDashboard from './AnalyticsDashboard';
import FeedbackSection from './FeedbackSection';
import CurrencySettings, { useCurrencySettings } from './CurrencySettings';
import { JobEntry } from '../types';
import { calculateStats } from '../utils';

interface ProfileSettingsProps {
  className?: string;
  onClose?: () => void;
  jobs?: JobEntry[];
}

export default function ProfileSettings({ className = "", onClose, jobs = [] }: ProfileSettingsProps) {
  const { user } = useAuth();
  const { country, updateCountry } = useCurrencySettings();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [dataStats, setDataStats] = useState<{
    jobApplications: number;
    feedback: number;
  } | null>(null);

  // Calculate stats for analytics
  const stats = calculateStats(jobs);

  // Fetch user data statistics
  const fetchDataStats = async () => {
    if (!user) return;

    try {
      // Count job applications
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('uid', '==', user.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);

      // Count feedback submissions (if any are tied to user)
      const feedbackQuery = query(
        collection(db, 'feedback'),
        where('email', '==', user.email || '')
      );
      const feedbackSnapshot = await getDocs(feedbackQuery);

      setDataStats({
        jobApplications: jobsSnapshot.size,
        feedback: feedbackSnapshot.size
      });
    } catch (error) {
      console.error('Error fetching data stats:', error);
      setDataStats({
        jobApplications: 0,
        feedback: 0
      });
    }
  };

  // Start delete process
  const handleDeleteProfile = async () => {
    setShowDeleteConfirm(true);
    await fetchDataStats();
  };

  // Confirm and execute account deletion
  const executeAccountDeletion = async () => {
    if (!user || deleteConfirmText !== 'DELETE MY ACCOUNT') return;

    setIsDeleting(true);

    try {
      // Step 1: Delete all user's job applications
      const jobsQuery = query(
        collection(db, 'jobs'),
        where('uid', '==', user.uid)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      
      const deletePromises = jobsSnapshot.docs.map(jobDoc => 
        deleteDoc(doc(db, 'jobs', jobDoc.id))
      );
      await Promise.all(deletePromises);

      // Step 2: Delete feedback submissions associated with user email (optional)
      if (user.email) {
        const feedbackQuery = query(
          collection(db, 'feedback'),
          where('email', '==', user.email)
        );
        const feedbackSnapshot = await getDocs(feedbackQuery);
        
        const feedbackDeletePromises = feedbackSnapshot.docs.map(feedbackDoc => 
          deleteDoc(doc(db, 'feedback', feedbackDoc.id))
        );
        await Promise.all(feedbackDeletePromises);
      }

      // Step 3: Delete the user account from Firebase Auth
      await deleteUser(user);

      // User will be automatically logged out due to account deletion
      // No need to call logout() as the user no longer exists
      
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className={`${className}`}>
      {!showDeleteConfirm ? (
        // Profile Overview
        <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/20">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 sm:gap-3">
              👤 Profile & Analytics
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg sm:text-xl transition-colors"
              >
                ×
              </button>
            )}
          </div>

          {/* User Info - Simplified */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-white/10">
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-lg sm:text-2xl font-bold text-white">
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white truncate">{user.displayName || 'User'}</h3>
                <p className="text-sm sm:text-base text-white/70 truncate">{user.email}</p>
                <p className="text-xs sm:text-sm text-white/60">Joined: {new Date(user.metadata.creationTime || '').toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          <div className="mb-4 sm:mb-6">
            <AnalyticsDashboard stats={stats} className="" />
          </div>

          {/* Feedback Section */}
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 rounded-xl bg-gradient-to-br from-blue-800/30 to-purple-800/30 backdrop-blur-md border border-blue-400/30">
            <div className="mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-blue-300 mb-2 text-left">
                💬 Help Us Improve
              </h3>
              <p className="text-sm text-white/70">
                Found a bug or have a feature idea? Your feedback helps us make the job tracker better for everyone.
              </p>
            </div>
            <FeedbackSection />
          </div>

          {/* Profile Actions */}
          <div className="space-y-4">
            {/* Danger Zone */}
            <div className="p-3 sm:p-4 rounded-lg bg-red-500/20 border border-red-400/30">
              <h4 className="font-semibold text-red-300 mb-2 text-sm sm:text-base">⚠️ Danger Zone</h4>
              <p className="text-white/80 text-xs sm:text-sm mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteProfile}
                className="px-3 sm:px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-medium text-sm sm:text-base"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Delete Confirmation Process
        <div className="p-4 sm:p-6 rounded-xl bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-md border border-red-400/30">
          <div className="text-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">⚠️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-red-300 mb-2">Delete Account Confirmation</h2>
            <p className="text-sm sm:text-base text-white/80">This action is permanent and cannot be undone!</p>
          </div>

          {/* Data Overview */}
          {dataStats && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-red-500/20 border border-red-400/30">
              <h3 className="font-semibold text-red-300 mb-3 text-sm sm:text-base">Data to be deleted:</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-white/80">
                <li className="flex justify-between">
                  <span>📋 Job Applications:</span>
                  <span className="font-medium">{dataStats.jobApplications}</span>
                </li>
                <li className="flex justify-between">
                  <span>💬 Feedback Submissions:</span>
                  <span className="font-medium">{dataStats.feedback}</span>
                </li>
                <li className="flex justify-between">
                  <span>👤 User Account:</span>
                  <span className="font-medium">1</span>
                </li>
              </ul>
            </div>
          )}

          {/* Confirmation Steps */}
          <div className="space-y-4">
            <div className="p-3 sm:p-4 rounded-lg bg-yellow-500/20 border border-yellow-400/30">
              <h4 className="font-semibold text-yellow-300 mb-2 text-sm sm:text-base">Before you proceed:</h4>
              <ul className="text-white/80 text-xs sm:text-sm space-y-1">
                <li>• All your job applications will be permanently deleted</li>
                <li>• Your feedback submissions will be removed</li>
                <li>• Your Google account won&apos;t be affected (only removed from this app)</li>
                <li>• You can create a new account anytime, but data won&apos;t be restored</li>
              </ul>
            </div>

            <div className="p-3 sm:p-4 rounded-lg bg-red-500/30">
              <label className="block text-xs sm:text-sm font-medium text-red-300 mb-2">
                Type &quot;DELETE MY ACCOUNT&quot; to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type: DELETE MY ACCOUNT"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 backdrop-blur-md border border-red-400/50 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors text-sm sm:text-base order-2 sm:order-1"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={executeAccountDeletion}
                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || isDeleting}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition-all duration-200 text-sm sm:text-base order-1 sm:order-2 ${
                  deleteConfirmText === 'DELETE MY ACCOUNT' && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
