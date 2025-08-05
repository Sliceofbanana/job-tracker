/**
 * Secure Admin Utilities - Server-side admin verification
 * Replaces client-side NEXT_PUBLIC_ADMIN_EMAILS with secure server-side verification
 */

interface AdminVerificationResponse {
  isAdmin: boolean;
  timestamp: string;
}

interface AdminAPIError {
  error: string;
}

/**
 * Securely verify if a user is an admin using server-side API
 * This replaces the insecure client-side admin email checking
 */
export async function verifyAdminStatus(email: string): Promise<boolean> {
  try {
    if (!email || typeof email !== 'string') {
      console.log('❌ Invalid email provided to verifyAdminStatus:', email);
      return false;
    }

    console.log('🔐 Sending admin verification request for:', email);

    const response = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.trim().toLowerCase(),
        action: 'verify'
      }),
    });

    console.log('📡 Admin verification response status:', response.status);

    if (!response.ok) {
      console.error(`❌ Admin verification failed: ${response.status} ${response.statusText}`);
      return false;
    }

    const data: AdminVerificationResponse | AdminAPIError = await response.json();
    console.log('📋 Admin verification response data:', data);
    
    if ('error' in data) {
      console.error('❌ Admin verification error:', data.error);
      return false;
    }

    console.log('✅ Admin verification result:', data.isAdmin);
    return data.isAdmin;
  } catch (error) {
    console.error('Admin verification request failed:', error);
    return false;
  }
}

/**
 * Check if current authenticated user is an admin
 * Uses secure server-side verification
 */
export async function isCurrentUserAdmin(userEmail?: string): Promise<boolean> {
  if (!userEmail) {
    return false;
  }
  
  return await verifyAdminStatus(userEmail);
}

/**
 * Rate-limited admin verification for component use
 * Includes client-side caching to reduce server requests
 */
class AdminVerificationCache {
  private cache = new Map<string, { isAdmin: boolean; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async verifyWithCache(email: string): Promise<boolean> {
    const cacheKey = email.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.isAdmin;
    }

    const isAdmin = await verifyAdminStatus(email);
    this.cache.set(cacheKey, { isAdmin, timestamp: Date.now() });
    
    return isAdmin;
  }

  clearCache(): void {
    this.cache.clear();
  }

  removeCacheEntry(email: string): void {
    this.cache.delete(email.toLowerCase().trim());
  }
}

// Singleton instance for caching
export const adminVerificationCache = new AdminVerificationCache();

/**
 * Hook-style admin verification for React components
 */
export function useAdminVerification() {
  return {
    verifyAdmin: (email: string) => adminVerificationCache.verifyWithCache(email),
    clearCache: () => adminVerificationCache.clearCache(),
    isAdmin: (email: string) => adminVerificationCache.verifyWithCache(email)
  };
}

/**
 * Secure admin guard for protecting admin-only functionality
 */
export async function requireAdminAccess(userEmail?: string): Promise<void> {
  if (!userEmail) {
    throw new Error('Authentication required');
  }

  const isAdmin = await verifyAdminStatus(userEmail);
  if (!isAdmin) {
    throw new Error('Admin access required');
  }
}
