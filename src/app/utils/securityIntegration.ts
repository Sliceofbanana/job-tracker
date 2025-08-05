/**
 * Security Integration Utilities
 * Easy-to-use functions for implementing security across the application
 */

import { verifyAdminStatus } from './secureAdmin';

// Rate limiting client utility
export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  total?: number;
  resetTime?: string;
  message?: string;
}

export async function checkRateLimit(
  action: string, 
  limitType: 'general' | 'feedback' | 'admin' | 'auth' = 'general'
): Promise<RateLimitResult> {
  try {
    const response = await fetch('/api/rate-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, limitType }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        allowed: false,
        message: data.message || 'Rate limit exceeded'
      };
    }

    return {
      allowed: true,
      remaining: data.remaining,
      total: data.total,
      resetTime: data.resetTime
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      allowed: true, // Fail open for better UX
      message: 'Rate limit service unavailable'
    };
  }
}

// Secure form submission wrapper
export async function secureFormSubmit<T>(
  action: string,
  formData: T,
  options: {
    limitType?: 'general' | 'feedback' | 'admin' | 'auth';
    requireAdmin?: boolean;
    userEmail?: string;
    onRateLimit?: (result: RateLimitResult) => void;
    onAdminRequired?: () => void;
  } = {}
): Promise<{ success: boolean; error?: string; data?: T }> {
  
  const { 
    limitType = 'general', 
    requireAdmin = false, 
    userEmail,
    onRateLimit,
    onAdminRequired 
  } = options;

  // Check rate limit first
  const rateLimitResult = await checkRateLimit(action, limitType);
  if (!rateLimitResult.allowed) {
    onRateLimit?.(rateLimitResult);
    return {
      success: false,
      error: rateLimitResult.message || 'Rate limit exceeded'
    };
  }

  // Check admin status if required
  if (requireAdmin) {
    if (!userEmail) {
      onAdminRequired?.();
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const isAdmin = await verifyAdminStatus(userEmail);
    if (!isAdmin) {
      onAdminRequired?.();
      return {
        success: false,
        error: 'Admin access required'
      };
    }
  }

  return {
    success: true,
    data: formData
  };
}

// Security event logging
export interface SecurityEvent {
  type: 'xss_attempt' | 'session_anomaly' | 'rate_limit_exceeded' | 'admin_access' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, unknown>;
  userEmail?: string;
  timestamp: Date;
}

export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date()
  };

  // Log to console for development
  console.warn(`🚨 Security Event [${event.severity.toUpperCase()}]:`, fullEvent);

  // In production, send to security monitoring service
  // Example: Send to Firestore security_events collection
  // Example: Send to external security service (Datadog, Sentry, etc.)
}

// Component security wrapper for easy integration
export interface SecurityWrapperOptions {
  requireAdmin?: boolean;
  rateLimit?: {
    action: string;
    limitType?: 'general' | 'feedback' | 'admin' | 'auth';
  };
}

export interface SecurityWrapperResult {
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
}

export async function checkComponentSecurity(
  userEmail?: string,
  options: SecurityWrapperOptions = {}
): Promise<SecurityWrapperResult> {
  try {
    // Check rate limit if specified
    if (options.rateLimit) {
      const rateLimitResult = await checkRateLimit(
        options.rateLimit.action,
        options.rateLimit.limitType
      );
      
      if (!rateLimitResult.allowed) {
        return {
          isAuthorized: false,
          isLoading: false,
          error: 'Rate limit exceeded. Please try again later.'
        };
      }
    }

    // Check admin access if required
    if (options.requireAdmin) {
      if (!userEmail) {
        return {
          isAuthorized: false,
          isLoading: false,
          error: 'Authentication required'
        };
      }

      const isAdmin = await verifyAdminStatus(userEmail);
      if (!isAdmin) {
        return {
          isAuthorized: false,
          isLoading: false,
          error: 'Admin access required'
        };
      }
    }

    return {
      isAuthorized: true,
      isLoading: false,
      error: null
    };
  } catch (err) {
    console.error('Security check failed:', err);
    return {
      isAuthorized: false,
      isLoading: false,
      error: 'Security validation failed'
    };
  }
}
