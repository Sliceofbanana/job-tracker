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
    let baseClassName = "w-full px-4 py-3 rounded-lg bg-white border transition-all duration-200 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2";
    
    if (validationStatus === 'invalid' && inputValue.trim()) {
      baseClassName += " border-red-400 focus:ring-red-400";
    } else if (validationStatus === 'valid') {
      baseClassName += " border-green-400 focus:ring-green-400";
    } else {
      baseClassName += " border-gray-300 focus:ring-blue-400";
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
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Character Count */}
      {showCharCount && maxLength && (
        <div className="flex justify-between items-center text-xs">
          <span className={`${inputValue.length > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-600'}`}>
            {inputValue.length} / {maxLength} characters
          </span>
          {inputValue.length > maxLength * 0.9 && (
            <span className="text-orange-600">⚠️ Approaching limit</span>
          )}
        </div>
      )}

      {/* Sanitization Warning */}
      {isDirty && (
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
          <div className="text-blue-700 text-xs flex items-center space-x-2">
            <span>🛡️</span>
            <span>Input has been automatically sanitized for security</span>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {getValidationMessage() && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-200">
          <div className="text-red-700 text-xs flex items-center space-x-2">
            <span>❌</span>
            <span>{getValidationMessage()}</span>
          </div>
        </div>
      )}

      {/* Type-specific Hints */}
      {focused && !inputValue && (
        <div className="text-xs text-gray-600">
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
