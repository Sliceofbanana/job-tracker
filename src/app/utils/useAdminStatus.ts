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

        // First try sync check (cache)
        const syncResult = isAdminSync(user);
        
        if (syncResult) {
          setIsAdminUser(true);
          setIsLoading(false);
          return;
        }

        // If sync fails, try async check
        const asyncResult = await isAdmin(user);
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
