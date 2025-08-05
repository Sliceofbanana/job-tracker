"use client";

import { useState } from 'react';
import { JobEntry } from '../types';

interface BulkActionsProps {
  selectedJobs: string[];
  jobs: JobEntry[];
  onBulkUpdate: (jobIds: string[], updates: Partial<JobEntry>) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  className?: string;
}

export default function BulkActions({ 
  selectedJobs, 
  jobs, 
  onBulkUpdate, 
  onSelectAll, 
  onClearSelection,
  className = "" 
}: BulkActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [newTag, setNewTag] = useState('');

  if (selectedJobs.length === 0) {
    return null;
  }

  const selectedJobCount = selectedJobs.length;
  const totalJobs = jobs.length;

  const handleBulkStatusUpdate = (status: string) => {
    onBulkUpdate(selectedJobs, { status });
    setShowActions(false);
  };

  const handleBulkPriorityUpdate = (priority: 'high' | 'medium' | 'low') => {
    onBulkUpdate(selectedJobs, { priority });
    setShowActions(false);
  };

  const handleBulkTagAdd = () => {
    if (!newTag.trim()) return;
    
    const updatedJobs = selectedJobs.map(jobId => {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return null;
      
      const existingTags = job.tags || [];
      if (!existingTags.includes(newTag.trim())) {
        return { tags: [...existingTags, newTag.trim()] };
      }
      return null;
    }).filter(Boolean);

    if (updatedJobs.length > 0) {
      selectedJobs.forEach((jobId, index) => {
        if (updatedJobs[index]) {
          onBulkUpdate([jobId], updatedJobs[index]!);
        }
      });
    }
    
    setNewTag('');
    setShowActions(false);
  };

  const handleBulkFavorite = (isFavorite: boolean) => {
    onBulkUpdate(selectedJobs, { isFavorite });
    setShowActions(false);
  };

  const handleBulkRemote = (isRemote: boolean) => {
    onBulkUpdate(selectedJobs, { isRemote });
    setShowActions(false);
  };

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 ${className}`}>
      <div className="bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selection Info */}
          <div className="text-white text-sm font-medium">
            {selectedJobCount} of {totalJobs} selected
          </div>

          {/* Selection Controls */}
          <div className="flex gap-2">
            <button
              onClick={onSelectAll}
              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-all duration-200"
            >
              Select All
            </button>
            <button
              onClick={onClearSelection}
              className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-sm hover:bg-gray-500/30 transition-all duration-200"
            >
              Clear
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkFavorite(true)}
              className="px-3 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-sm hover:bg-yellow-500/30 transition-all duration-200"
              title="Add to Favorites"
            >
              ⭐
            </button>
            <button
              onClick={() => handleBulkFavorite(false)}
              className="px-3 py-1 rounded-lg bg-gray-500/20 text-gray-400 text-sm hover:bg-gray-500/30 transition-all duration-200"
              title="Remove from Favorites"
            >
              ☆
            </button>
          </div>

          {/* More Actions Button */}
          <button
            onClick={() => setShowActions(!showActions)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {showActions ? "Close" : "More Actions"}
          </button>
        </div>

        {/* Extended Actions Panel */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Status Updates */}
              <div className="space-y-2">
                <h4 className="text-white/80 text-sm font-medium">Update Status:</h4>
                <div className="flex flex-wrap gap-1">
                  {['Applied', 'Interviewing', 'Offer', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusUpdate(status)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                        status === 'Applied' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                        status === 'Interviewing' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' :
                        status === 'Offer' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' :
                        'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Updates */}
              <div className="space-y-2">
                <h4 className="text-white/80 text-sm font-medium">Set Priority:</h4>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '🔴 High', value: 'high' as const },
                    { label: '🟡 Medium', value: 'medium' as const },
                    { label: '🟢 Low', value: 'low' as const }
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      onClick={() => handleBulkPriorityUpdate(priority.value)}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/70 hover:bg-white/20 transition-all duration-200"
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Tags */}
              <div className="space-y-2">
                <h4 className="text-white/80 text-sm font-medium">Add Tag:</h4>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Enter tag name"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBulkTagAdd()}
                    className="flex-1 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
                  />
                  <button
                    onClick={handleBulkTagAdd}
                    disabled={!newTag.trim()}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs hover:bg-cyan-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Location Type */}
              <div className="space-y-2">
                <h4 className="text-white/80 text-sm font-medium">Location Type:</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleBulkRemote(true)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all duration-200"
                  >
                    🏠 Remote
                  </button>
                  <button
                    onClick={() => handleBulkRemote(false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all duration-200"
                  >
                    🏢 On-site
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
