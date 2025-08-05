"use client";

import { Stats } from '../types';

interface AnalyticsDashboardProps {
  stats: Stats;
  className?: string;
}

export default function AnalyticsDashboard({ stats, className = "" }: AnalyticsDashboardProps) {
  const getSuccessColor = (rate: number) => {
    if (rate >= 70) return "text-green-300";
    if (rate >= 40) return "text-yellow-300";
    return "text-red-300";
  };

  const getProgressColor = (progress: number, goal: number) => {
    const percentage = (progress / goal) * 100;
    if (percentage >= 100) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className={`p-3 sm:p-6 rounded-xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-md border border-white/20 ${className}`}>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-cyan-300 mb-3 sm:mb-4">📊 Analytics Dashboard</h3>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-300">{stats.total}</div>
          <div className="text-xs sm:text-sm text-gray-300">Total</div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-300">{stats.applied}</div>
          <div className="text-xs sm:text-sm text-gray-300">Applied</div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-300">{stats.interviewing}</div>
          <div className="text-xs sm:text-sm text-gray-300">Interviewing</div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-300">{stats.offers}</div>
          <div className="text-xs sm:text-sm text-gray-300">Offers</div>
        </div>
        <div className="text-center p-3 sm:p-4 rounded-lg bg-white/10 col-span-2 sm:col-span-1">
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-300">{stats.rejected}</div>
          <div className="text-xs sm:text-sm text-gray-300">Rejected</div>
        </div>
      </div>

      {/* Advanced Analytics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-purple-600/50 to-purple-700/50">
          <div className={`text-lg sm:text-xl font-bold ${getSuccessColor(stats.responseRate)}`}>
            {stats.responseRate.toFixed(1)}%
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Response Rate</div>
        </div>
        
        <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-indigo-600/50 to-indigo-700/50">
          <div className={`text-lg sm:text-xl font-bold ${getSuccessColor(stats.successRate)}`}>
            {stats.successRate.toFixed(1)}%
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Success Rate</div>
        </div>
        
        <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-teal-600/50 to-teal-700/50">
          <div className="text-lg sm:text-xl font-bold text-teal-300">
            {stats.avgDaysToResponse > 0 ? `${stats.avgDaysToResponse.toFixed(1)} days` : 'N/A'}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Avg Response Time</div>
        </div>
        
        <div className="text-center p-3 sm:p-4 rounded-lg bg-gradient-to-br from-emerald-600/50 to-emerald-700/50">
          <div className="text-lg sm:text-xl font-bold text-emerald-300">
            {stats.weeklyProgress}/{stats.weeklyGoal}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Weekly Progress</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(stats.weeklyProgress, stats.weeklyGoal)}`}
              style={{ width: `${Math.min((stats.weeklyProgress / stats.weeklyGoal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Salary Information */}
      {stats.avgSalary > 0 && (
        <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-green-800/50 to-emerald-800/50">
          <div className="text-center">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-300">
              ${stats.avgSalary.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-gray-300">Average Expected Salary</div>
          </div>
        </div>
      )}
    </div>
  );
}
