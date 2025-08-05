/**
 * Enhanced XSS Protection and Session Security
 * Enterprise-grade security measures for preventing XSS and session hijacking
 */

// Enhanced XSS Protection with DOMPurify-like functionality
export class XSSProtection {
  private static readonly DANGEROUS_TAGS = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'link', 'style', 'meta', 'base', 'frame', 'frameset', 'applet'
  ];

  private static readonly DANGEROUS_ATTRIBUTES = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus',
    'onblur', 'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit', 'onchange',
    'javascript:', 'vbscript:', 'data:', 'about:', 'mocha:', 'livescript:'
  ];

  private static readonly SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

  // Deep sanitization for rich text content
  public static sanitizeHTML(html: string): string {
    if (!html) return '';

    let sanitized = html;

    // Remove dangerous tags
    this.DANGEROUS_TAGS.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Remove dangerous attributes and event handlers
    this.DANGEROUS_ATTRIBUTES.forEach(attr => {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Remove javascript: and other dangerous protocols
    sanitized = sanitized.replace(/href\s*=\s*["'](?:javascript|vbscript|data|about|mocha|livescript):[^"']*["']/gi, 'href="#"');
    sanitized = sanitized.replace(/src\s*=\s*["'](?:javascript|vbscript|data|about|mocha|livescript):[^"']*["']/gi, 'src=""');

    // Remove style attributes that could contain expressions
    sanitized = sanitized.replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '');

    // Encode remaining potential XSS vectors
    sanitized = this.encodeXSSVectors(sanitized);

    return sanitized;
  }

  // Aggressive encoding for user input
  public static sanitizeUserInput(input: string, allowHTML: boolean = false): string {
    if (!input) return '';

    if (allowHTML) {
      return this.sanitizeHTML(input);
    }

    // Complete HTML entity encoding for non-HTML input
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/`/g, '&#x60;')
      .replace(/=/g, '&#x3D;')
      .replace(/\(/g, '&#x28;')
      .replace(/\)/g, '&#x29;')
      .replace(/\[/g, '&#x5B;')
      .replace(/\]/g, '&#x5D;')
      .replace(/\{/g, '&#x7B;')
      .replace(/\}/g, '&#x7D;');
  }

  // URL validation and sanitization
  public static sanitizeURL(url: string): string {
    if (!url) return '';

    try {
      const parsedURL = new URL(url.trim());
      
      // Only allow safe protocols
      if (!this.SAFE_PROTOCOLS.includes(parsedURL.protocol)) {
        return '';
      }

      // Additional checks for suspicious patterns
      if (parsedURL.href.includes('javascript:') || 
          parsedURL.href.includes('data:') ||
          parsedURL.href.includes('<script')) {
        return '';
      }

      return parsedURL.href;
    } catch {
      return '';
    }
  }

  // Encode potential XSS vectors
  private static encodeXSSVectors(input: string): string {
    const xssPatterns = [
      // Script injection patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      // Event handler patterns
      /on\w+\s*=\s*["'][^"']*["']/gi,
      // Expression patterns
      /expression\s*\([^)]*\)/gi,
      // URL with javascript protocol
      /url\s*\(\s*["']?javascript:[^"')]*["']?\s*\)/gi
    ];

    let sanitized = input;
    xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    return sanitized;
  }

  // Generate Content Security Policy
  public static generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-insights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }
}

// Session Security Manager
export class SessionSecurity {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  private static sessionData = new Map<string, {
    lastActivity: number;
    fingerprint: string;
    createdAt: number;
    isValid: boolean;
  }>();

  // Generate browser fingerprint for session validation
  public static generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Security fingerprint', 2, 2);
    }

    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      localStorage: typeof Storage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined',
      webGL: this.getWebGLFingerprint()
    };

    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  }

  private static getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (!gl) return 'no-webgl';
      
      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      return `${vendor}-${renderer}`;
    } catch {
      return 'webgl-error';
    }
  }

  // Initialize session security
  public static initializeSession(userId: string): void {
    const fingerprint = this.generateFingerprint();
    const now = Date.now();

    this.sessionData.set(userId, {
      lastActivity: now,
      fingerprint,
      createdAt: now,
      isValid: true
    });

    // Set up activity tracking
    this.setupActivityTracking(userId);
    this.setupVisibilityTracking(userId);
  }

  // Validate session integrity
  public static validateSession(userId: string): boolean {
    const session = this.sessionData.get(userId);
    if (!session) return false;

    const now = Date.now();
    
    // Check session timeout
    if (now - session.lastActivity > this.SESSION_TIMEOUT) {
      this.invalidateSession(userId);
      return false;
    }

    // Verify browser fingerprint (detect session hijacking)
    const currentFingerprint = this.generateFingerprint();
    if (session.fingerprint !== currentFingerprint) {
      console.warn('Session fingerprint mismatch - possible session hijacking');
      this.invalidateSession(userId);
      return false;
    }

    // Update last activity
    session.lastActivity = now;
    return session.isValid;
  }

  // Invalidate session
  public static invalidateSession(userId: string): void {
    const session = this.sessionData.get(userId);
    if (session) {
      session.isValid = false;
    }
    this.sessionData.delete(userId);
  }

  // Setup activity tracking
  private static setupActivityTracking(userId: string): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      const session = this.sessionData.get(userId);
      if (session) {
        session.lastActivity = Date.now();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  // Setup page visibility tracking
  private static setupVisibilityTracking(userId: string): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - could indicate tab switching or minimizing
        const session = this.sessionData.get(userId);
        if (session) {
          session.lastActivity = Date.now() - (this.SESSION_TIMEOUT / 2); // Reduce session time when hidden
        }
      }
    });
  }

  // Check if session needs refresh
  public static needsRefresh(userId: string): boolean {
    const session = this.sessionData.get(userId);
    if (!session) return true;

    const timeSinceActivity = Date.now() - session.lastActivity;
    return timeSinceActivity > this.TOKEN_REFRESH_THRESHOLD;
  }

  // Security event logging
  public static logSecurityEvent(event: string, details: Record<string, unknown>): void {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details,
      fingerprint: this.generateFingerprint(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    console.warn('Security Event:', securityLog);
    
    // In production, send to security monitoring service
    // await fetch('/api/security-log', { method: 'POST', body: JSON.stringify(securityLog) });
  }
}

// Real-time security monitoring
export class SecurityMonitor {
  private static suspiciousActivity: Array<{
    type: string;
    timestamp: number;
    details: Record<string, unknown>;
  }> = [];

  // Monitor for suspicious patterns
  public static detectSuspiciousActivity(activity: {
    type: 'rapid_requests' | 'unusual_input' | 'session_anomaly' | 'xss_attempt';
    details: Record<string, unknown>;
  }): void {
    const now = Date.now();
    
    this.suspiciousActivity.push({
      type: activity.type,
      timestamp: now,
      details: activity.details
    });

    // Clean old entries (keep last hour)
    this.suspiciousActivity = this.suspiciousActivity.filter(
      item => now - item.timestamp < 60 * 60 * 1000
    );

    // Analyze patterns
    this.analyzeSecurityPatterns();
  }

  private static analyzeSecurityPatterns(): void {
    const recentActivity = this.suspiciousActivity.filter(
      item => Date.now() - item.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    // Detect rapid suspicious requests
    if (recentActivity.length > 10) {
      SessionSecurity.logSecurityEvent('HIGH_SUSPICIOUS_ACTIVITY', {
        activityCount: recentActivity.length,
        types: recentActivity.map(a => a.type)
      });
    }

    // Detect XSS attempts
    const xssAttempts = recentActivity.filter(a => a.type === 'xss_attempt');
    if (xssAttempts.length > 3) {
      SessionSecurity.logSecurityEvent('MULTIPLE_XSS_ATTEMPTS', {
        attempts: xssAttempts.length
      });
    }
  }
}

// Enhanced input validation with security monitoring
export const secureInputValidator = {
  validateAndSanitize: (input: string, type: 'text' | 'html' | 'url' = 'text'): string => {
    // Check for XSS patterns
    const xssPatterns = [
      /<script/i, /javascript:/i, /on\w+=/i, /expression\(/i,
      /%3Cscript/i, /&lt;script/i, /eval\(/i, /setTimeout\(/i
    ];

    const hasXSSPattern = xssPatterns.some(pattern => pattern.test(input));
    
    if (hasXSSPattern) {
      SecurityMonitor.detectSuspiciousActivity({
        type: 'xss_attempt',
        details: { input: input.substring(0, 100), type }
      });
    }

    // Sanitize based on type
    switch (type) {
      case 'html':
        return XSSProtection.sanitizeHTML(input);
      case 'url':
        return XSSProtection.sanitizeURL(input);
      default:
        return XSSProtection.sanitizeUserInput(input);
    }
  }
};
