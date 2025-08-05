/**
 * Password Policy and Validation Utilities
 * Enforces strong password requirements and provides security checks
 */

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxRepeatingChars: number;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  score: number; // 0-100
}

// Default password policy
export const DEFAULT_PASSWORD_POLICY: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxRepeatingChars: 3,
  preventCommonPasswords: true,
  preventPersonalInfo: true
};

// Common weak passwords to prevent
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'admin123', 'root', 'user', 'guest', 'test', 'demo',
  '12345678', 'password321', 'abcdef123', 'welcome123', 'hello123'
];

// Calculate password entropy
const calculateEntropy = (password: string): number => {
  let charsetSize = 0;
  
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
  
  return password.length * Math.log2(charsetSize || 1);
};

// Check for repeating characters
const hasExcessiveRepeating = (password: string, maxRepeating: number): boolean => {
  for (let i = 0; i <= password.length - maxRepeating; i++) {
    const char = password[i];
    let count = 1;
    
    for (let j = i + 1; j < password.length && password[j] === char; j++) {
      count++;
    }
    
    if (count >= maxRepeating) {
      return true;
    }
  }
  return false;
};

// Check for common sequential patterns
const hasSequentialPattern = (password: string): boolean => {
  const sequences = [
    'abcdefghijklmnopqrstuvwxyz',
    'qwertyuiopasdfghjklzxcvbnm',
    '1234567890',
    '0987654321'
  ];
  
  const lowerPassword = password.toLowerCase();
  
  for (const sequence of sequences) {
    for (let i = 0; i <= sequence.length - 3; i++) {
      const subseq = sequence.substring(i, i + 3);
      if (lowerPassword.includes(subseq)) {
        return true;
      }
    }
  }
  return false;
};

// Check against personal information
const containsPersonalInfo = (password: string, personalInfo?: { email?: string; name?: string }): boolean => {
  if (!personalInfo) return false;
  
  const lowerPassword = password.toLowerCase();
  
  if (personalInfo.email) {
    const emailParts = personalInfo.email.toLowerCase().split('@');
    const username = emailParts[0];
    const domain = emailParts[1]?.split('.')[0];
    
    if (username && username.length > 2 && lowerPassword.includes(username)) {
      return true;
    }
    
    if (domain && domain.length > 2 && lowerPassword.includes(domain)) {
      return true;
    }
  }
  
  if (personalInfo.name) {
    const nameParts = personalInfo.name.toLowerCase().split(' ');
    for (const part of nameParts) {
      if (part.length > 2 && lowerPassword.includes(part)) {
        return true;
      }
    }
  }
  
  return false;
};

// Main password validation function
export const validatePassword = (
  password: string, 
  requirements: PasswordRequirements = DEFAULT_PASSWORD_POLICY,
  personalInfo?: { email?: string; name?: string }
): PasswordValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 0;
  
  // Length validation
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  } else {
    score += Math.min(25, (password.length / requirements.minLength) * 25);
  }
  
  if (password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }
  
  // Character type requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 15;
  }
  
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 15;
  }
  
  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (/[0-9]/.test(password)) {
    score += 15;
  }
  
  if (requirements.requireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  } else if (/[^a-zA-Z0-9]/.test(password)) {
    score += 20;
  }
  
  // Entropy and complexity checks
  const entropy = calculateEntropy(password);
  if (entropy < 40) {
    warnings.push('Password has low entropy - consider making it more complex');
  } else {
    score += Math.min(10, entropy / 6);
  }
  
  // Repeating characters
  if (requirements.maxRepeatingChars && hasExcessiveRepeating(password, requirements.maxRepeatingChars)) {
    errors.push(`Password cannot have ${requirements.maxRepeatingChars} or more repeating characters`);
  }
  
  // Sequential patterns
  if (hasSequentialPattern(password)) {
    warnings.push('Password contains sequential characters - consider mixing them up');
    score -= 10;
  }
  
  // Common passwords
  if (requirements.preventCommonPasswords && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
  }
  
  // Personal information
  if (requirements.preventPersonalInfo && containsPersonalInfo(password, personalInfo)) {
    errors.push('Password should not contain personal information like your name or email');
  }
  
  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));
  
  // Determine strength
  let strength: PasswordValidationResult['strength'];
  if (score < 20) strength = 'very-weak';
  else if (score < 40) strength = 'weak';
  else if (score < 60) strength = 'fair';
  else if (score < 80) strength = 'good';
  else if (score < 95) strength = 'strong';
  else strength = 'very-strong';
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength,
    score
  };
};

// Generate password suggestions
export const generatePasswordSuggestions = (): string[] => {
  const suggestions = [
    "Use a mix of uppercase and lowercase letters",
    "Include numbers and special characters (!@#$%^&*)",
    "Make it at least 12 characters long for better security",
    "Avoid common words and personal information",
    "Consider using a passphrase with multiple words",
    "Don't use the same password for multiple accounts",
    "Consider using a password manager",
  ];
  
  return suggestions;
};

// Password strength color for UI
export const getPasswordStrengthColor = (strength: PasswordValidationResult['strength']): string => {
  switch (strength) {
    case 'very-weak': return '#dc2626'; // red-600
    case 'weak': return '#ea580c'; // orange-600
    case 'fair': return '#d97706'; // amber-600
    case 'good': return '#65a30d'; // lime-600
    case 'strong': return '#16a34a'; // green-600
    case 'very-strong': return '#059669'; // emerald-600
    default: return '#6b7280'; // gray-500
  }
};

// Rate limiting for password attempts
const passwordAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_PASSWORD_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const checkPasswordAttemptLimit = (identifier: string): { allowed: boolean; remaining: number; lockoutEnds?: Date } => {
  const now = Date.now();
  const attempts = passwordAttempts.get(identifier);
  
  if (!attempts || now - attempts.lastAttempt > LOCKOUT_DURATION) {
    // Reset attempts if lockout period has passed
    passwordAttempts.set(identifier, { count: 0, lastAttempt: now });
    return { allowed: true, remaining: MAX_PASSWORD_ATTEMPTS };
  }
  
  if (attempts.count >= MAX_PASSWORD_ATTEMPTS) {
    const lockoutEnds = new Date(attempts.lastAttempt + LOCKOUT_DURATION);
    return { allowed: false, remaining: 0, lockoutEnds };
  }
  
  return { allowed: true, remaining: MAX_PASSWORD_ATTEMPTS - attempts.count };
};

export const recordPasswordAttempt = (identifier: string, successful: boolean): void => {
  const now = Date.now();
  const attempts = passwordAttempts.get(identifier) || { count: 0, lastAttempt: now };
  
  if (successful) {
    // Clear attempts on successful login
    passwordAttempts.delete(identifier);
  } else {
    // Increment failed attempts
    passwordAttempts.set(identifier, {
      count: attempts.count + 1,
      lastAttempt: now
    });
  }
};
