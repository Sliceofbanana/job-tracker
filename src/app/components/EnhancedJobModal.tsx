"use client";

import { useState, useEffect } from 'react';
import { JobEntry } from '../types';
import CurrencySettings, { useCurrencySettings } from './CurrencySettings';

interface EnhancedJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Partial<JobEntry>) => void;
  editingJob?: JobEntry | null;
  className?: string;
}

export default function EnhancedJobModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingJob,
  className = "" 
}: EnhancedJobModalProps) {
  const { country, updateCountry } = useCurrencySettings();
  const [formData, setFormData] = useState<Partial<JobEntry>>({
    company: '',
    role: '',
    link: '',
    notes: '',
    status: 'Applied',
    salary: '',
    interviewDate: '',
    companyResearch: '',
    applicationTemplate: '',
    tags: [],
    priority: 'medium',
    location: '',
    isRemote: false,
    isFavorite: false,
    followUpDate: '',
    applicationDate: '',
    responseDate: '',
    companySize: '',
    industry: '',
    jobType: 'full-time'
  });

  const [currentTag, setCurrentTag] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  useEffect(() => {
    if (editingJob) {
      setFormData({
        ...editingJob,
        tags: editingJob.tags || []
      });
      setShowAdvancedFields(true);
    } else {
      setFormData({
        company: '',
        role: '',
        link: '',
        notes: '',
        status: 'Applied',
        salary: '',
        interviewDate: '',
        companyResearch: '',
        applicationTemplate: '',
        tags: [],
        priority: 'medium',
        location: '',
        isRemote: false,
        isFavorite: false,
        followUpDate: '',
        applicationDate: new Date().toISOString().split('T')[0],
        responseDate: '',
        companySize: '',
        industry: '',
        jobType: 'full-time'
      });
      setShowAdvancedFields(false);
    }
  }, [editingJob, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (field: keyof JobEntry, value: string | boolean | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags?.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden ${className}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">
            {editingJob ? 'Edit Job Application' : 'Add New Job Application'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company || ''}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Role/Position *
                </label>
                <input
                  type="text"
                  required
                  value={formData.role || ''}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="Enter job role"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Job Posting Link
                </label>
                <input
                  type="url"
                  value={formData.link || ''}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  placeholder="https://..."
                />
              </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status || 'Applied'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="Applied" className="bg-gray-800">Applied</option>
                    <option value="Interviewing" className="bg-gray-800">Interviewing</option>
                    <option value="Accepted" className="bg-gray-800">Accepted</option>
                    <option value="Rejected" className="bg-gray-800">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Currency Settings */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Currency Settings
                </label>
                <CurrencySettings 
                  currentCountry={country}
                  onCountryChange={updateCountry}
                  className=""
                />
                <p className="text-xs text-white/60 mt-2">
                  💡 This setting affects how salaries are displayed throughout the app
                </p>
              </div>            {/* Priority and Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority || 'medium'}
                  onChange={(e) => handleInputChange('priority', e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="low" className="bg-gray-800">🟢 Low</option>
                  <option value="medium" className="bg-gray-800">🟡 Medium</option>
                  <option value="high" className="bg-gray-800">🔴 High</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRemote || false}
                    onChange={(e) => handleInputChange('isRemote', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-white/80">🏠 Remote</span>
                </label>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFavorite || false}
                    onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-white/80">⭐ Favorite</span>
                </label>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                  className="w-full px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium text-sm transition-all duration-200"
                >
                  {showAdvancedFields ? '🔼 Less' : '🔽 More'}
                </button>
              </div>
            </div>

            {/* Advanced Fields */}
            {showAdvancedFields && (
              <div className="space-y-6 p-4 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
                
                {/* Location and Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="City, State/Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Job Type
                    </label>
                    <select
                      value={formData.jobType || 'full-time'}
                      onChange={(e) => handleInputChange('jobType', e.target.value as JobEntry['jobType'])}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <option value="full-time" className="bg-gray-800">Full-time</option>
                      <option value="part-time" className="bg-gray-800">Part-time</option>
                      <option value="contract" className="bg-gray-800">Contract</option>
                      <option value="internship" className="bg-gray-800">Internship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Salary/Compensation
                    </label>
                    <input
                      type="text"
                      value={formData.salary || ''}
                      onChange={(e) => handleInputChange('salary', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="e.g., $80,000 - $100,000"
                    />
                  </div>
                </div>

                {/* Company Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={formData.industry || ''}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Company Size
                    </label>
                    <select
                      value={formData.companySize || ''}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <option value="" className="bg-gray-800">Select size</option>
                      <option value="startup" className="bg-gray-800">Startup (1-50)</option>
                      <option value="small" className="bg-gray-800">Small (51-200)</option>
                      <option value="medium" className="bg-gray-800">Medium (201-1000)</option>
                      <option value="large" className="bg-gray-800">Large (1000+)</option>
                    </select>
                  </div>
                </div>

                {/* Important Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Application Date
                    </label>
                    <input
                      type="date"
                      value={formData.applicationDate || ''}
                      onChange={(e) => handleInputChange('applicationDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Interview Date
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.interviewDate || ''}
                      onChange={(e) => handleInputChange('interviewDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={formData.followUpDate || ''}
                      onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      placeholder="Add a tag (e.g., javascript, frontend, startup)"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center gap-2"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-400 transition-colors duration-200"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                rows={4}
                placeholder="Add any notes about this application..."
              />
            </div>

            {/* Company Research */}
            {showAdvancedFields && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Company Research & Prep Notes
                </label>
                <textarea
                  value={formData.companyResearch || ''}
                  onChange={(e) => handleInputChange('companyResearch', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                  rows={4}
                  placeholder="Company culture, recent news, interview prep notes..."
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg bg-gray-600/20 text-gray-300 hover:bg-gray-600/30 font-bold transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {editingJob ? 'Update Application' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
