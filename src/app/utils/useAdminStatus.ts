/**
 * React hook for async admin verification
 * Handles the transition from sync to async admin checking
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { isAdmin, isAdminSync } from './adminAuth';

export function useAdminStatus(user: User | null) {
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setIsAdminUser(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        console.log('🔍 Checking admin status for:', user.email);

        // First try sync check (cache)
        const syncResult = isAdminSync(user);
        console.log('📋 Sync result (cache):', syncResult);
        
        if (syncResult) {
          setIsAdminUser(true);
          setIsLoading(false);
          return;
        }

        // If sync fails, try async check
        console.log('🌐 Trying async admin verification...');
        const asyncResult = await isAdmin(user);
        console.log('✅ Async result:', asyncResult);
        setIsAdminUser(asyncResult);
      } catch (err) {
        console.error('Admin status check failed:', err);
        setError('Failed to verify admin status');
        setIsAdminUser(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user]);

  return { 
    isAdmin: isAdminUser, 
    isLoading, 
    error,
    // For backwards compatibility
    isAdminSync: () => isAdminUser 
  };
}
