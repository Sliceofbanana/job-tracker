/**
 * Input Sanitization Utilities
 * Provides XSS protection and data validation for user inputs
 */

// Basic HTML entity encoding to prevent XSS
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };
  
  return input.replace(/[&<>"'`=\/]/g, (s) => entityMap[s]);
};

// Sanitize text input by removing potentially dangerous characters
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  
  // Remove null bytes, control characters, and normalize whitespace
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Sanitize email input
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, ''); // Keep only valid email characters
};

// Sanitize URL input
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return '';
    }
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

// Validate and sanitize job title
export const sanitizeJobTitle = (title: string): string => {
  if (!title) return '';
  
  return sanitizeText(title)
    .replace(/[<>{}[\]\\]/g, '') // Remove additional unsafe characters
    .substring(0, 100); // Limit length
};

// Validate and sanitize company name
export const sanitizeCompanyName = (company: string): string => {
  if (!company) return '';
  
  return sanitizeText(company)
    .replace(/[<>{}[\]\\]/g, '')
    .substring(0, 100);
};

// Sanitize feedback/description text
export const sanitizeFeedback = (feedback: string): string => {
  if (!feedback) return '';
  
  return sanitizeHtml(feedback)
    .substring(0, 5000); // Limit length for feedback
};

// Validate numeric input
export const sanitizeNumber = (input: string | number): number | null => {
  if (typeof input === 'number') {
    return isFinite(input) ? input : null;
  }
  
  const num = parseFloat(String(input).replace(/[^\d.-]/g, ''));
  return isFinite(num) ? num : null;
};

// Sanitize phone number
export const sanitizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  return phone
    .replace(/[^\d+()-.\s]/g, '') // Keep only valid phone characters
    .trim()
    .substring(0, 20);
};

// General input sanitizer that applies appropriate sanitization based on type
export const sanitizeInput = (input: string, type: 'text' | 'email' | 'url' | 'html' | 'job-title' | 'company' | 'feedback' | 'phone' = 'text'): string => {
  switch (type) {
    case 'email':
      return sanitizeEmail(input);
    case 'url':
      return sanitizeUrl(input);
    case 'html':
      return sanitizeHtml(input);
    case 'job-title':
      return sanitizeJobTitle(input);
    case 'company':
      return sanitizeCompanyName(input);
    case 'feedback':
      return sanitizeFeedback(input);
    case 'phone':
      return sanitizePhoneNumber(input);
    case 'text':
    default:
      return sanitizeText(input);
  }
};

// Validate file upload names
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe characters with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
};

// Input validation helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d+()-.\s]{7,20}$/;
  return phoneRegex.test(phone);
};
