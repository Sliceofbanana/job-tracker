"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../authprovider';
import { SessionSecurity, SecurityMonitor, XSSProtection } from '../utils/enhancedSecurity';

interface SecurityContextType {
  isSessionValid: boolean;
  sessionFingerprint: string;
  lastActivity: Date | null;
  securityAlerts: SecurityAlert[];
  validateInput: (input: string, type?: 'text' | 'html' | 'url') => string;
  reportSecurityEvent: (event: string, details: Record<string, unknown>) => void;
  refreshSession: () => void;
  clearSecurityAlerts: () => void;
}

interface SecurityAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

interface SecurityProviderProps {
  children: React.ReactNode;
}

export default function SecurityProvider({ children }: SecurityProviderProps) {
  const { user } = useAuth();
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [sessionFingerprint, setSessionFingerprint] = useState('');
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);

  // Initialize session security when user logs in
  useEffect(() => {
    if (user) {
      SessionSecurity.initializeSession(user.uid);
      setSessionFingerprint(SessionSecurity.generateFingerprint());
      setLastActivity(new Date());
      setIsSessionValid(true);
    } else {
      setIsSessionValid(false);
      setSessionFingerprint('');
      setLastActivity(null);
    }
  }, [user]);

  // Session validation interval
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const isValid = SessionSecurity.validateSession(user.uid);
      setIsSessionValid(isValid);
      
      if (!isValid) {
        addSecurityAlert('danger', 'Session expired or security violation detected. Please log in again.');
      }
      
      setLastActivity(new Date());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Monitor for session hijacking attempts
  useEffect(() => {
    if (!user) return;

    const checkFingerprint = () => {
      const currentFingerprint = SessionSecurity.generateFingerprint();
      if (sessionFingerprint && currentFingerprint !== sessionFingerprint) {
        SessionSecurity.logSecurityEvent('FINGERPRINT_MISMATCH', {
          original: sessionFingerprint,
          current: currentFingerprint
        });
        addSecurityAlert('danger', 'Potential session hijacking detected!');
        setIsSessionValid(false);
      }
    };

    const interval = setInterval(checkFingerprint, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [sessionFingerprint, user]);

  // Setup CSP and security headers
  useEffect(() => {
    const csp = XSSProtection.generateCSP();
    const metaCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!metaCSP) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = csp;
      document.head.appendChild(meta);
    }

    // Add security headers via meta tags
    const securityHeaders = [
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' }
    ];

    securityHeaders.forEach(header => {
      const existing = document.querySelector(`meta[http-equiv="${header.name}"]`);
      if (!existing) {
        const meta = document.createElement('meta');
        meta.httpEquiv = header.name;
        meta.content = header.content;
        document.head.appendChild(meta);
      }
    });
  }, []);

  const addSecurityAlert = (type: SecurityAlert['type'], message: string, details?: Record<string, unknown>) => {
    const alert: SecurityAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(),
      details
    };

    setSecurityAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep max 5 alerts

    // Auto-remove info alerts after 10 seconds
    if (type === 'info') {
      setTimeout(() => {
        setSecurityAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 10000);
    }
  };

  const validateInput = (input: string, type: 'text' | 'html' | 'url' = 'text'): string => {
    try {
      let sanitized = '';
      
      switch (type) {
        case 'html':
          sanitized = XSSProtection.sanitizeHTML(input);
          break;
        case 'url':
          sanitized = XSSProtection.sanitizeURL(input);
          break;
        default:
          sanitized = XSSProtection.sanitizeUserInput(input);
      }

      // Check if input was modified (potential XSS attempt)
      if (sanitized !== input && input.length > 0) {
        SecurityMonitor.detectSuspiciousActivity({
          type: 'xss_attempt',
          details: { originalLength: input.length, sanitizedLength: sanitized.length, type }
        });
        
        addSecurityAlert('warning', 'Potentially dangerous content was removed from your input for security.');
      }

      return sanitized;
    } catch (error) {
      console.error('Input validation error:', error);
      return '';
    }
  };

  const reportSecurityEvent = (event: string, details: Record<string, unknown>) => {
    SessionSecurity.logSecurityEvent(event, details);
    
    if (event.includes('ATTACK') || event.includes('VIOLATION')) {
      addSecurityAlert('danger', `Security event detected: ${event}`);
    }
  };

  const refreshSession = () => {
    if (user) {
      SessionSecurity.initializeSession(user.uid);
      setSessionFingerprint(SessionSecurity.generateFingerprint());
      setLastActivity(new Date());
      setIsSessionValid(true);
      addSecurityAlert('info', 'Session refreshed successfully.');
    }
  };

  const clearSecurityAlerts = () => {
    setSecurityAlerts([]);
  };

  const contextValue: SecurityContextType = {
    isSessionValid,
    sessionFingerprint,
    lastActivity,
    securityAlerts,
    validateInput,
    reportSecurityEvent,
    refreshSession,
    clearSecurityAlerts
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
      
      {/* Security Alerts Overlay */}
      {securityAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
          {securityAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-300 ${
                alert.type === 'danger' 
                  ? 'bg-red-500/20 border-red-400/50 text-red-200'
                  : alert.type === 'warning'
                  ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200'
                  : 'bg-blue-500/20 border-blue-400/50 text-blue-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {alert.type === 'danger' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span className="font-medium text-sm">Security Alert</span>
                  </div>
                  <p className="text-xs mt-1 opacity-90">{alert.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => setSecurityAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="ml-2 text-white/60 hover:text-white/80 text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Status Indicator */}
      {user && (
        <div className="fixed bottom-4 left-4 z-[9998]">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg backdrop-blur-md text-xs ${
            isSessionValid 
              ? 'bg-green-500/20 border border-green-400/50 text-green-200'
              : 'bg-red-500/20 border border-red-400/50 text-red-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isSessionValid ? 'bg-green-400' : 'bg-red-400'}`} />
            <span>{isSessionValid ? 'Session Secure' : 'Session Invalid'}</span>
            {lastActivity && (
              <span className="opacity-70">
                • {lastActivity.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      )}
    </SecurityContext.Provider>
  );
}
