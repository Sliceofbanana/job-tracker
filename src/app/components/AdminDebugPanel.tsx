/**
 * Admin Status Debug Component
 * Temporary component to help debug admin access issues
 */

"use client";

import React, { useState } from 'react';
import { useAuth } from '../authprovider';
import { verifyAdminStatus } from '../utils/secureAdmin';
import { isAdminSync, isAdmin } from '../utils/adminAuth';

export default function AdminDebugPanel() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const runAdminTest = async () => {
    if (!user || !user.email) {
      setDebugInfo({ error: 'No user logged in' });
      return;
    }

    setTesting(true);
    console.log('🧪 Starting admin debug test...');

    try {
      const results = {
        userEmail: user.email,
        timestamp: new Date().toISOString(),
        tests: {
          syncCheck: isAdminSync(user),
          asyncCheck: await isAdmin(user),
          serverVerification: await verifyAdminStatus(user.email),
        },
        environment: {
          hasPublicAdminEmails: !!process.env.NEXT_PUBLIC_ADMIN_EMAILS,
          publicAdminEmails: process.env.NEXT_PUBLIC_ADMIN_EMAILS, // Will show in browser
        }
      };

      console.log('🧪 Admin debug results:', results);
      setDebugInfo(results);
    } catch (error) {
      console.error('🚨 Admin test failed:', error);
      setDebugInfo({ 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg text-white">
        <h3 className="text-lg font-bold mb-2">🔍 Admin Debug Panel</h3>
        <p className="text-gray-400">Please log in to test admin access</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white space-y-4">
      <h3 className="text-lg font-bold">🔍 Admin Debug Panel</h3>
      
      <div className="space-y-2">
        <p><strong>User:</strong> {user.email}</p>
        <p><strong>UID:</strong> {user.uid}</p>
      </div>

      <button
        onClick={runAdminTest}
        disabled={testing}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
      >
        {testing ? '🔄 Testing...' : '🧪 Run Admin Test'}
      </button>

      {debugInfo && (
        <div className="mt-4 p-3 bg-gray-900 rounded-lg">
          <h4 className="font-bold mb-2">Test Results:</h4>
          <pre className="text-xs overflow-auto whitespace-pre-wrap">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-900/50 rounded-lg border border-yellow-600">
        <h4 className="font-bold text-yellow-400 mb-2">📋 Troubleshooting Steps:</h4>
        <ol className="text-sm space-y-1 text-yellow-200">
          <li>1. Check if your email is in the console logs</li>
          <li>2. Verify server-side verification is working</li>
          <li>3. Check browser console for detailed logs</li>
          <li>4. Ensure .env.local has ADMIN_EMAILS set</li>
        </ol>
      </div>
    </div>
  );
}
