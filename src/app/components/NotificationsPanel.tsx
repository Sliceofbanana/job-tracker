"use client";

import { useState, useEffect, useCallback } from 'react';
import { JobEntry, Notification } from '../types';

interface NotificationsPanelProps {
  jobs: JobEntry[];
  className?: string;
}

export default function NotificationsPanel({ jobs, className = "" }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  const generateNotifications = useCallback(() => {
    const newNotifications: Notification[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    jobs.forEach(job => {
      // Interview reminders
      if (job.interviewDate) {
        const interviewDate = new Date(job.interviewDate);
        const daysDiff = Math.ceil((interviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          newNotifications.push({
            id: `interview-today-${job.id}`,
            type: 'interview',
            title: 'Interview Today!',
            message: `You have an interview with ${job.company} today for the ${job.role} position.`,
            date: today,
            jobId: job.id,
            isRead: false
          });
        } else if (daysDiff === 1) {
          newNotifications.push({
            id: `interview-tomorrow-${job.id}`,
            type: 'interview',
            title: 'Interview Tomorrow',
            message: `Don't forget about your interview with ${job.company} tomorrow for the ${job.role} position.`,
            date: today,
            jobId: job.id,
            isRead: false
          });
        } else if (daysDiff > 0 && daysDiff <= 3) {
          newNotifications.push({
            id: `interview-upcoming-${job.id}`,
            type: 'interview',
            title: `Interview in ${daysDiff} days`,
            message: `Upcoming interview with ${job.company} for the ${job.role} position.`,
            date: today,
            jobId: job.id,
            isRead: false
          });
        }
      }

      // Follow-up reminders
      if (job.followUpDate) {
        const followUpDate = new Date(job.followUpDate);
        const daysDiff = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 0) {
          newNotifications.push({
            id: `followup-due-${job.id}`,
            type: 'followup',
            title: 'Follow-up Due',
            message: `Time to follow up with ${job.company} about your ${job.role} application.`,
            date: today,
            jobId: job.id,
            isRead: false
          });
        } else if (daysDiff === 1) {
          newNotifications.push({
            id: `followup-tomorrow-${job.id}`,
            type: 'followup',
            title: 'Follow-up Tomorrow',
            message: `Remember to follow up with ${job.company} tomorrow.`,
            date: today,
            jobId: job.id,
            isRead: false
          });
        }
      }

      // Stale applications (applied more than 2 weeks ago with no response)
      if (job.applicationDate && job.status === 'Applied') {
        const appDate = new Date(job.applicationDate);
        const daysSinceApp = Math.ceil((today.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceApp >= 14 && !job.followUpDate) {
          newNotifications.push({
            id: `stale-application-${job.id}`,
            type: 'followup',
            title: 'Application Follow-up Suggested',
            message: `It's been ${daysSinceApp} days since you applied to ${job.company}. Consider following up.`,
            date: today,
            jobId: job.id,
            isRead: false
          });
        }
      }
    });

    // Achievement notifications
    const totalApplications = jobs.length;
    const thisWeekApplications = jobs.filter(job => {
      if (!job.applicationDate) return false;
      const appDate = new Date(job.applicationDate);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return appDate >= weekAgo;
    }).length;

    if (totalApplications > 0 && totalApplications % 10 === 0) {
      newNotifications.push({
        id: `milestone-${totalApplications}`,
        type: 'achievement',
        title: '🎉 Milestone Reached!',
        message: `Congratulations! You've reached ${totalApplications} job applications.`,
        date: today,
        isRead: false
      });
    }

    if (thisWeekApplications >= 5) {
      newNotifications.push({
        id: `weekly-goal-${thisWeekApplications}`,
        type: 'achievement',
        title: '🚀 Weekly Goal Achieved!',
        message: `Great job! You've applied to ${thisWeekApplications} jobs this week.`,
        date: today,
        isRead: false
      });
    }

    setNotifications(newNotifications.sort((a, b) => b.date.getTime() - a.date.getTime()));
  }, [jobs]);

  useEffect(() => {
    generateNotifications();
  }, [jobs, generateNotifications]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'interview': return '📅';
      case 'followup': return '📞';
      case 'deadline': return '⏰';
      case 'achievement': return '🏆';
      default: return '📱';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'interview': return 'from-blue-500/20 to-blue-600/20 border-blue-400/30';
      case 'followup': return 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30';
      case 'deadline': return 'from-red-500/20 to-red-600/20 border-red-400/30';
      case 'achievement': return 'from-green-500/20 to-green-600/20 border-green-400/30';
      default: return 'from-gray-500/20 to-gray-600/20 border-gray-400/30';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className={`p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🔔</div>
          <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-white/60">No new notifications at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/20 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-all duration-200"
            >
              Mark All Read
            </button>
          )}
          
          {notifications.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-all duration-200"
            >
              {showAll ? 'Show Less' : `Show All (${notifications.length})`}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayedNotifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg bg-gradient-to-r ${getNotificationColor(notification.type)} border backdrop-blur-md ${
              notification.isRead ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className={`font-semibold ${notification.isRead ? 'text-white/70' : 'text-white'}`}>
                      {notification.title}
                    </h3>
                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-white/50' : 'text-white/80'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-white/40 mt-2">
                      {notification.date.toLocaleDateString()} • {notification.date.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400 transition-all duration-200"
                      title="Delete notification"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 p-3 rounded-lg bg-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-white/60">This Week</div>
            <div className="text-lg font-bold text-white">
              {jobs.filter(job => {
                if (!job.applicationDate) return false;
                const appDate = new Date(job.applicationDate);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return appDate >= weekAgo;
              }).length}
            </div>
            <div className="text-xs text-white/50">applications</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-white/60">Interviews</div>
            <div className="text-lg font-bold text-cyan-400">
              {jobs.filter(job => job.status === 'Interviewing').length}
            </div>
            <div className="text-xs text-white/50">scheduled</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-white/60">Follow-ups</div>
            <div className="text-lg font-bold text-yellow-400">
              {notifications.filter(n => n.type === 'followup' && !n.isRead).length}
            </div>
            <div className="text-xs text-white/50">pending</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-white/60">Response Rate</div>
            <div className="text-lg font-bold text-green-400">
              {jobs.length > 0 ? Math.round((jobs.filter(job => job.status !== 'Applied').length / jobs.length) * 100) : 0}%
            </div>
            <div className="text-xs text-white/50">overall</div>
          </div>
        </div>
      </div>
    </div>
  );
}
