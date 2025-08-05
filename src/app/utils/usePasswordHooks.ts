/**
 * React Hooks for Password Validation and Input Sanitization
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  validatePassword, 
  PasswordValidationResult, 
  DEFAULT_PASSWORD_POLICY,
  checkPasswordAttemptLimit,
  recordPasswordAttempt,
  getPasswordStrengthColor
} from './passwordPolicy';
import { sanitizeInput } from './inputSanitization';

// Hook for password validation with real-time feedback
export const usePasswordValidation = (
  password: string, 
  personalInfo?: { email?: string; name?: string }
) => {
  const [validation, setValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    warnings: [],
    strength: 'very-weak',
    score: 0
  });

  useEffect(() => {
    if (password) {
      const result = validatePassword(password, DEFAULT_PASSWORD_POLICY, personalInfo);
      setValidation(result);
    } else {
      setValidation({
        isValid: false,
        errors: [],
        warnings: [],
        strength: 'very-weak',
        score: 0
      });
    }
  }, [password, personalInfo]);

  const strengthColor = useMemo(() => getPasswordStrengthColor(validation.strength), [validation.strength]);

  return {
    ...validation,
    strengthColor,
    strengthText: validation.strength.replace('-', ' ').toUpperCase()
  };
};

// Hook for input sanitization
export const useSanitizedInput = (
  initialValue: string = '',
  type: 'text' | 'email' | 'url' | 'html' | 'job-title' | 'company' | 'feedback' | 'phone' = 'text'
) => {
  const [rawValue, setRawValue] = useState(initialValue);
  const [sanitizedValue, setSanitizedValue] = useState(initialValue);

  const updateValue = (newValue: string) => {
    setRawValue(newValue);
    const sanitized = sanitizeInput(newValue, type);
    setSanitizedValue(sanitized);
  };

  useEffect(() => {
    const sanitized = sanitizeInput(rawValue, type);
    setSanitizedValue(sanitized);
  }, [rawValue, type]);

  return {
    value: rawValue,
    sanitizedValue,
    setValue: updateValue,
    isDirty: rawValue !== sanitizedValue
  };
};

// Hook for rate limiting password attempts
export const usePasswordAttemptLimit = (identifier: string) => {
  const [attemptInfo, setAttemptInfo] = useState(() => 
    checkPasswordAttemptLimit(identifier)
  );

  const recordAttempt = (successful: boolean) => {
    recordPasswordAttempt(identifier, successful);
    setAttemptInfo(checkPasswordAttemptLimit(identifier));
  };

  const refreshAttemptInfo = () => {
    setAttemptInfo(checkPasswordAttemptLimit(identifier));
  };

  useEffect(() => {
    // Refresh attempt info periodically if locked out
    if (!attemptInfo.allowed && attemptInfo.lockoutEnds) {
      const timeout = setTimeout(() => {
        refreshAttemptInfo();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [attemptInfo, refreshAttemptInfo]);

  return {
    ...attemptInfo,
    recordAttempt,
    refreshAttemptInfo
  };
};
