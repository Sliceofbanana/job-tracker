"use client";

import { useState } from 'react';
import { JobEntry } from '../types';

interface AdvancedFiltersProps {
  jobs: JobEntry[];
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  searchQuery: string;
  filterStatus: string;
  selectedTags: string[];
  priority?: string;
  isRemote?: boolean;
  isFavorite?: boolean;
  salaryRange: [number, number];
  dateRange: 'all' | 'week' | 'month' | 'quarter';
  jobType?: string;
  location?: string;
}

export default function AdvancedFilters({ jobs, onFiltersChange, className = "" }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    filterStatus: "all",
    selectedTags: [],
    salaryRange: [0, 300000],
    dateRange: 'all'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract unique values from jobs for filter options
  const allTags = Array.from(new Set(jobs.flatMap(job => job.tags || [])));
  
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearFilters = () => {
    const cleared: FilterState = {
      searchQuery: "",
      filterStatus: "all",
      selectedTags: [],
      salaryRange: [0, 300000],
      dateRange: 'all'
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    updateFilters({ selectedTags: newTags });
  };

  return (
    <div className={`p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 ${className}`}>
      {/* Basic Filters Row */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 Search jobs by company, role, location..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
          />
        </div>
        
        <select
          value={filters.filterStatus}
          onChange={(e) => updateFilters({ filterStatus: e.target.value })}
          className="px-3 sm:px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm sm:text-base"
        >
          <option value="all" className="bg-gray-800">All Status</option>
          <option value="Applied" className="bg-gray-800">Applied</option>
          <option value="Interviewing" className="bg-gray-800">Interviewing</option>
          <option value="Offer" className="bg-gray-800">Offer</option>
          <option value="Rejected" className="bg-gray-800">Rejected</option>
        </select>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-indigo-400/50 text-sm sm:text-base"
        >
          {showAdvanced ? "🔼" : "🔽"} Advanced
        </button>

        {(filters.selectedTags.length > 0 || filters.priority || filters.isRemote !== undefined || filters.isFavorite !== undefined) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-sm transition-all duration-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4">
          {/* Priority, Remote, Favorite Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={filters.priority || ""}
              onChange={(e) => updateFilters({ priority: e.target.value || undefined })}
              className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
            >
              <option value="" className="bg-gray-800">All Priorities</option>
              <option value="high" className="bg-gray-800">🔴 High Priority</option>
              <option value="medium" className="bg-gray-800">🟡 Medium Priority</option>
              <option value="low" className="bg-gray-800">🟢 Low Priority</option>
            </select>

            <select
              value={filters.isRemote === undefined ? "" : filters.isRemote.toString()}
              onChange={(e) => updateFilters({ isRemote: e.target.value === "" ? undefined : e.target.value === "true" })}
              className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
            >
              <option value="" className="bg-gray-800">All Locations</option>
              <option value="true" className="bg-gray-800">🏠 Remote</option>
              <option value="false" className="bg-gray-800">🏢 On-site</option>
            </select>

            <select
              value={filters.jobType || ""}
              onChange={(e) => updateFilters({ jobType: e.target.value || undefined })}
              className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
            >
              <option value="" className="bg-gray-800">All Job Types</option>
              <option value="full-time" className="bg-gray-800">Full-time</option>
              <option value="part-time" className="bg-gray-800">Part-time</option>
              <option value="contract" className="bg-gray-800">Contract</option>
              <option value="internship" className="bg-gray-800">Internship</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['all', 'week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => updateFilters({ dateRange: range })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filters.dateRange === range
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {range === 'all' ? 'All Time' : `This ${range.charAt(0).toUpperCase() + range.slice(1)}`}
              </button>
            ))}
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Tags:</label>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                      filters.selectedTags.includes(tag)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Salary Range */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Salary Range: ${filters.salaryRange[0].toLocaleString()} - ${filters.salaryRange[1].toLocaleString()}
            </label>
            <div className="flex gap-4">
              <input
                type="range"
                min="0"
                max="300000"
                step="5000"
                value={filters.salaryRange[0]}
                onChange={(e) => updateFilters({ 
                  salaryRange: [Number(e.target.value), filters.salaryRange[1]] 
                })}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="300000"
                step="5000"
                value={filters.salaryRange[1]}
                onChange={(e) => updateFilters({ 
                  salaryRange: [filters.salaryRange[0], Number(e.target.value)] 
                })}
                className="flex-1"
              />
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateFilters({ isFavorite: filters.isFavorite ? undefined : true })}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                filters.isFavorite
                  ? 'bg-yellow-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              ⭐ Favorites Only
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
