"use client";

import React, { useState } from 'react';
import { usePasswordValidation, usePasswordAttemptLimit } from '../utils/usePasswordHooks';

interface SecurePasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  personalInfo?: { email?: string; name?: string };
  showStrengthMeter?: boolean;
  showRequirements?: boolean;
  identifier?: string; // For rate limiting
  className?: string;
  disabled?: boolean;
}

export default function SecurePasswordInput({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter password",
  personalInfo,
  showStrengthMeter = true,
  showRequirements = true,
  identifier = 'default',
  className = "",
  disabled = false
}: SecurePasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);
  
  const validation = usePasswordValidation(value, personalInfo);
  const attemptLimit = usePasswordAttemptLimit(identifier);

  React.useEffect(() => {
    onValidationChange?.(validation.isValid);
  }, [validation.isValid, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!attemptLimit.allowed) return;
    onChange(e.target.value);
  };

  const getStrengthBarColor = (index: number) => {
    const strengthLevels = ['very-weak', 'weak', 'fair', 'good', 'strong', 'very-strong'];
    const currentLevelIndex = strengthLevels.indexOf(validation.strength);
    
    if (index <= currentLevelIndex) {
      return validation.strengthColor;
    }
    return '#e5e7eb'; // gray-200
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Rate Limit Warning */}
      {!attemptLimit.allowed && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm font-medium">🔒 Account Temporarily Locked</div>
          <div className="text-red-600 text-xs mt-1">
            Too many failed attempts. Try again after {attemptLimit.lockoutEnds?.toLocaleTimeString()}.
          </div>
        </div>
      )}

      {/* Password Input */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled || !attemptLimit.allowed}
          className={`w-full px-4 py-3 pr-12 rounded-lg bg-white border transition-all duration-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 ${
            validation.errors.length > 0 && value
              ? 'border-red-400 focus:ring-red-400'
              : validation.isValid && value
              ? 'border-green-400 focus:ring-green-400'
              : 'border-gray-300 focus:ring-blue-400'
          }`}
        />
        
        {/* Show/Hide Password Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled || !attemptLimit.allowed}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors p-1"
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-3.121a3 3 0 013 3m-6 0a3 3 0 01-3-3m6 0a3 3 0 013 3m-6 0a3 3 0 01-3-3m6-6l6 6" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Password Strength Meter */}
      {showStrengthMeter && value && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">Password Strength</span>
            <span 
              className="text-sm font-medium"
              style={{ color: validation.strengthColor }}
            >
              {validation.strengthText} ({validation.score}/100)
            </span>
          </div>
          
          {/* Strength Bar */}
          <div className="flex space-x-1">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-2 flex-1 rounded-full transition-colors duration-300"
                style={{ backgroundColor: getStrengthBarColor(index) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Password Requirements */}
      {showRequirements && (focused || validation.errors.length > 0) && (
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-2">Password Requirements:</div>
          <div className="space-y-1 text-xs">
            <div className={`flex items-center space-x-2 ${value.length >= 8 ? 'text-green-600' : 'text-gray-600'}`}>
              <span>{value.length >= 8 ? '✅' : '⭕'}</span>
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[A-Z]/.test(value) ? 'text-green-600' : 'text-gray-600'}`}>
              <span>{/[A-Z]/.test(value) ? '✅' : '⭕'}</span>
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[a-z]/.test(value) ? 'text-green-600' : 'text-gray-600'}`}>
              <span>{/[a-z]/.test(value) ? '✅' : '⭕'}</span>
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[0-9]/.test(value) ? 'text-green-600' : 'text-gray-600'}`}>
              <span>{/[0-9]/.test(value) ? '✅' : '⭕'}</span>
              <span>One number</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[^a-zA-Z0-9]/.test(value) ? 'text-green-600' : 'text-gray-600'}`}>
              <span>{/[^a-zA-Z0-9]/.test(value) ? '✅' : '⭕'}</span>
              <span>One special character (!@#$%^&*)</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && value && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <div className="text-red-700 text-sm font-medium mb-1">Please fix these issues:</div>
          <ul className="text-red-600 text-xs space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && value && validation.errors.length === 0 && (
        <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="text-yellow-700 text-sm font-medium mb-1">Suggestions:</div>
          <ul className="text-yellow-600 text-xs space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-yellow-500 mt-0.5">💡</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rate Limit Info */}
      {attemptLimit.allowed && attemptLimit.remaining < 5 && (
        <div className="text-xs text-orange-600">
          ⚠️ {attemptLimit.remaining} attempts remaining before temporary lockout
        </div>
      )}
    </div>
  );
}
