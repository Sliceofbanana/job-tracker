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
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-400/30">
          <div className="text-red-300 text-sm font-medium">🔒 Account Temporarily Locked</div>
          <div className="text-red-200 text-xs mt-1">
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
          className={`w-full px-4 py-3 pr-12 rounded-lg bg-white/10 backdrop-blur-md border transition-all duration-200 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 ${
            validation.errors.length > 0 && value
              ? 'border-red-400/50 focus:ring-red-400'
              : validation.isValid && value
              ? 'border-green-400/50 focus:ring-green-400'
              : 'border-white/20 focus:ring-blue-400'
          }`}
        />
        
        {/* Show/Hide Password Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled || !attemptLimit.allowed}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>

      {/* Password Strength Meter */}
      {showStrengthMeter && value && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">Password Strength</span>
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
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-600/30">
          <div className="text-sm font-medium text-white mb-2">Password Requirements:</div>
          <div className="space-y-1 text-xs">
            <div className={`flex items-center space-x-2 ${value.length >= 8 ? 'text-green-400' : 'text-white/60'}`}>
              <span>{value.length >= 8 ? '✅' : '⭕'}</span>
              <span>At least 8 characters long</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[A-Z]/.test(value) ? 'text-green-400' : 'text-white/60'}`}>
              <span>{/[A-Z]/.test(value) ? '✅' : '⭕'}</span>
              <span>One uppercase letter</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[a-z]/.test(value) ? 'text-green-400' : 'text-white/60'}`}>
              <span>{/[a-z]/.test(value) ? '✅' : '⭕'}</span>
              <span>One lowercase letter</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[0-9]/.test(value) ? 'text-green-400' : 'text-white/60'}`}>
              <span>{/[0-9]/.test(value) ? '✅' : '⭕'}</span>
              <span>One number</span>
            </div>
            <div className={`flex items-center space-x-2 ${/[^a-zA-Z0-9]/.test(value) ? 'text-green-400' : 'text-white/60'}`}>
              <span>{/[^a-zA-Z0-9]/.test(value) ? '✅' : '⭕'}</span>
              <span>One special character (!@#$%^&*)</span>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && value && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-400/30">
          <div className="text-red-300 text-sm font-medium mb-1">Please fix these issues:</div>
          <ul className="text-red-200 text-xs space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-red-400 mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validation.warnings.length > 0 && value && validation.errors.length === 0 && (
        <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-400/30">
          <div className="text-yellow-300 text-sm font-medium mb-1">Suggestions:</div>
          <ul className="text-yellow-200 text-xs space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-yellow-400 mt-0.5">💡</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rate Limit Info */}
      {attemptLimit.allowed && attemptLimit.remaining < 5 && (
        <div className="text-xs text-orange-300">
          ⚠️ {attemptLimit.remaining} attempts remaining before temporary lockout
        </div>
      )}
    </div>
  );
}
