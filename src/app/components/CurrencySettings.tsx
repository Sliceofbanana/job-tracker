"use client";

import { useState, useEffect } from 'react';
import { countries, getUserCountry, type CountryOption } from '../utils/currency';

interface CurrencySettingsProps {
  currentCountry: string;
  onCountryChange: (countryCode: string) => void;
  className?: string;
}

export default function CurrencySettings({ currentCountry, onCountryChange, className = "" }: CurrencySettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCountry = countries.find(c => c.code === currentCountry) || countries[0];

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: CountryOption) => {
    onCountryChange(country.code);
    setIsOpen(false);
    setSearchTerm('');
    
    // Optional: You can add a success message here if needed
    // alert(`Currency updated to ${country.currency} (${country.name})`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as Element).closest('.currency-dropdown')) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className={`relative currency-dropdown ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 min-w-[200px]"
        aria-label="Select currency and country"
      >
        <span className="text-lg">{selectedCountry.flag}</span>
        <div className="flex flex-col items-start flex-1">
          <span className="text-sm font-medium">{selectedCountry.name}</span>
          <span className="text-xs text-white/70">{selectedCountry.symbol} {selectedCountry.currency}</span>
        </div>
        <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search countries or currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No countries found matching &ldquo;{searchTerm}&rdquo;
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                    country.code === currentCountry ? 'bg-blue-100 border-r-4 border-blue-500' : ''
                  }`}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{country.name}</div>
                    <div className="text-sm text-gray-600">
                      {country.symbol} {country.currency}
                    </div>
                  </div>
                  {country.code === currentCountry && (
                    <span className="text-blue-500 text-sm">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
          
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              💡 Your salary displays will update automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Settings storage hook
export const useCurrencySettings = () => {
  const [country, setCountry] = useState<string>('US');

  useEffect(() => {
    // Load saved country from localStorage or detect user's country
    const savedCountry = localStorage.getItem('jobTracker_userCountry');
    if (savedCountry) {
      setCountry(savedCountry);
    } else {
      const detectedCountry = getUserCountry();
      setCountry(detectedCountry);
      localStorage.setItem('jobTracker_userCountry', detectedCountry);
    }
  }, []);

  const updateCountry = (newCountry: string) => {
    setCountry(newCountry);
    localStorage.setItem('jobTracker_userCountry', newCountry);
  };

  return {
    country,
    updateCountry,
  };
};
