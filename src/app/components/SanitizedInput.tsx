"use client";

import React, { useState } from 'react';
import { useSanitizedInput } from '../utils/usePasswordHooks';
import { isValidEmail, isValidUrl, isValidPhoneNumber } from '../utils/inputSanitization';

interface SanitizedInputProps {
  value: string;
  onChange: (sanitizedValue: string) => void;
  type?: 'text' | 'email' | 'url' | 'html' | 'job-title' | 'company' | 'feedback' | 'phone';
  inputType?: 'text' | 'email' | 'url' | 'tel' | 'textarea';
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showCharCount?: boolean;
  validate?: boolean;
  rows?: number; // for textarea
}

export default function SanitizedInput({
  value,
  onChange,
  type = 'text',
  inputType = 'text',
  placeholder,
  maxLength,
  className = "",
  disabled = false,
  required = false,
  showCharCount = false,
  validate = false,
  rows = 4
}: SanitizedInputProps) {
  const [focused, setFocused] = useState(false);
  const { value: inputValue, sanitizedValue, setValue, isDirty } = useSanitizedInput(value, type);

  React.useEffect(() => {
    onChange(sanitizedValue);
  }, [sanitizedValue, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    setValue(newValue);
  };

  const getValidationStatus = () => {
    if (!validate || !inputValue.trim()) return null;
    
    switch (type) {
      case 'email':
        return isValidEmail(sanitizedValue) ? 'valid' : 'invalid';
      case 'url':
        return isValidUrl(sanitizedValue) ? 'valid' : 'invalid';
      case 'phone':
        return isValidPhoneNumber(sanitizedValue) ? 'valid' : 'invalid';
      default:
        return sanitizedValue.length > 0 ? 'valid' : 'invalid';
    }
  };

  const validationStatus = getValidationStatus();

  const getInputClassName = () => {
    let baseClassName = "w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-md border transition-all duration-200 text-white placeholder:text-white/50 focus:outline-none focus:ring-2";
    
    if (validationStatus === 'invalid' && inputValue.trim()) {
      baseClassName += " border-red-400/50 focus:ring-red-400";
    } else if (validationStatus === 'valid') {
      baseClassName += " border-green-400/50 focus:ring-green-400";
    } else {
      baseClassName += " border-white/20 focus:ring-blue-400";
    }
    
    return `${baseClassName} ${className}`;
  };

  const getValidationMessage = () => {
    if (!validate || !inputValue.trim() || validationStatus === 'valid') return null;
    
    switch (type) {
      case 'email':
        return 'Please enter a valid email address';
      case 'url':
        return 'Please enter a valid URL (http:// or https://)';
      case 'phone':
        return 'Please enter a valid phone number';
      default:
        return 'Please enter valid input';
    }
  };

  const InputComponent = inputType === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      <div className="relative">
        <InputComponent
          {...(inputType !== 'textarea' ? { type: inputType } : { rows })}
          value={inputValue}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={getInputClassName()}
          maxLength={maxLength}
        />
        
        {/* Validation Icon */}
        {validate && inputValue.trim() && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {validationStatus === 'valid' ? (
              <span className="text-green-400">✅</span>
            ) : (
              <span className="text-red-400">❌</span>
            )}
          </div>
        )}
      </div>

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="flex justify-between items-center text-xs">
          <span className={`${inputValue.length > maxLength * 0.9 ? 'text-yellow-400' : 'text-white/60'}`}>
            {inputValue.length} / {maxLength} characters
          </span>
          {inputValue.length > maxLength * 0.9 && (
            <span className="text-yellow-400">⚠️ Approaching limit</span>
          )}
        </div>
      )}

      {/* Sanitization Warning */}
      {isDirty && (
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
          <div className="text-blue-300 text-xs flex items-center space-x-2">
            <span>🛡️</span>
            <span>Input has been automatically sanitized for security</span>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {getValidationMessage() && (
        <div className="p-2 rounded-lg bg-red-500/20 border border-red-400/30">
          <div className="text-red-300 text-xs flex items-center space-x-2">
            <span>❌</span>
            <span>{getValidationMessage()}</span>
          </div>
        </div>
      )}

      {/* Type-specific Hints */}
      {focused && !inputValue && (
        <div className="text-xs text-white/60">
          {type === 'email' && '💡 Example: user@example.com'}
          {type === 'url' && '💡 Example: https://example.com'}
          {type === 'phone' && '💡 Example: +1 (555) 123-4567'}
          {type === 'job-title' && '💡 Example: Senior Software Engineer'}
          {type === 'company' && '💡 Example: Tech Company Inc.'}
          {type === 'feedback' && '💡 Please provide detailed feedback to help us improve'}
        </div>
      )}
    </div>
  );
}
