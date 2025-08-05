"use client";

import { useState, useEffect } from 'react';

export interface NotificationBubble {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationBubblesProps {
  notifications: NotificationBubble[];
  onDismiss: (id: string) => void;
}

export default function NotificationBubbles({ notifications, onDismiss }: NotificationBubblesProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<NotificationBubble[]>([]);

  useEffect(() => {
    setVisibleNotifications(notifications);

    // Auto-dismiss notifications after their duration
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          onDismiss(notification.id);
        }, notification.duration);
      }
    });
  }, [notifications, onDismiss]);

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-red-600 border-red-400 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400 text-white';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 border-blue-400 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-400 text-white';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {visibleNotifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            ${getNotificationStyles(notification.type)}
            rounded-lg border-2 shadow-lg backdrop-blur-md
            transform transition-all duration-300 ease-in-out
            hover:scale-105 hover:shadow-xl
            animate-slide-in-right
          `}
          style={{
            animationDelay: `${index * 100}ms`,
            animation: 'slideInRight 0.3s ease-out forwards'
          }}
        >
          <div className="p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </span>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium break-words">
                {notification.message}
              </p>
              
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action!.onClick();
                    onDismiss(notification.id);
                  }}
                  className="mt-2 text-xs underline hover:no-underline opacity-90 hover:opacity-100 transition-opacity"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={() => onDismiss(notification.id)}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm font-bold transition-colors ml-2"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
          
          {/* Progress bar for timed notifications */}
          {notification.duration && notification.duration > 0 && (
            <div className="h-1 bg-white/20 rounded-b-lg overflow-hidden">
              <div 
                className="h-full bg-white/40 animate-shrink-width"
                style={{
                  animation: `shrinkWidth ${notification.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        
        .animate-shrink-width {
          animation: shrinkWidth var(--duration) linear forwards;
        }
      `}</style>
    </div>
  );
}

// Utility hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationBubble[]>([]);

  const addNotification = (notification: Omit<NotificationBubble, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Predefined notification types for common actions
  const showSuccess = (message: string, duration?: number) => 
    addNotification({ message, type: 'success', duration });
  
  const showError = (message: string, duration?: number) => 
    addNotification({ message, type: 'error', duration });
  
  const showWarning = (message: string, duration?: number) => 
    addNotification({ message, type: 'warning', duration });
  
  const showInfo = (message: string, duration?: number) => 
    addNotification({ message, type: 'info', duration });

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
