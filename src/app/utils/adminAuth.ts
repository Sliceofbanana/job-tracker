import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { verifyAdminStatus } from './secureAdmin';
import { TeamManager } from './teamManager';

// Admin role hierarchy (legacy, use TeamRole for new code)
export type AdminRole = 'super-admin' | 'admin' | 'moderator';

interface AdminUser {
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Date;
  permissions: string[];
}

// Role-based permissions
const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  'super-admin': [
    'read:feedback',
    'write:feedback', 
    'delete:feedback',
    'manage:users',
    'manage:admins',
    'export:data',
    'view:analytics',
    'system:settings'
  ],
  'admin': [
    'read:feedback',
    'write:feedback',
    'delete:feedback',
    'export:data',
    'view:analytics'
  ],
  'moderator': [
    'read:feedback',
    'write:feedback',
    'view:analytics'
  ]
};

// Cache for admin data to reduce Firestore calls
const adminCache = new Map<string, { user: AdminUser; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// SECURE: Server-side admin verification (replaces client-side NEXT_PUBLIC_ADMIN_EMAILS)
const getAdminStatusSecurely = async (email: string): Promise<boolean> => {
  try {
    return await verifyAdminStatus(email);
  } catch (error) {
    console.error('Secure admin verification failed:', error);
    return false;
  }
};

// Enhanced admin verification with Firestore lookup and secure server-side verification
export const getAdminUser = async (user: User | null): Promise<AdminUser | null> => {
  if (!user || !user.email) {
    return null;
  }

  const email = user.email.toLowerCase();
  
  // Check cache first
  const cached = adminCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user.isActive ? cached.user : null;
  }

  try {
    // ENHANCED: First check the new team management system
    const teamMember = await TeamManager.getTeamMember(email);
    if (teamMember && teamMember.isActive) {
      // Update last login
      await TeamManager.updateLastLogin(email);
      
      const adminUser: AdminUser = {
        email: teamMember.email,
        role: teamMember.role as AdminRole, // Map TeamRole to AdminRole
        isActive: teamMember.isActive,
        lastLogin: new Date(),
        permissions: teamMember.permissions
      };
      
      // Cache the result
      adminCache.set(email, {
        user: adminUser,
        timestamp: Date.now()
      });
      
      return adminUser;
    }

    // Try to get admin data from Firestore (legacy)
    const adminDoc = await getDoc(doc(db, 'admin_users', email));
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data() as AdminUser;
      
      // Cache the result
      adminCache.set(email, {
        user: adminData,
        timestamp: Date.now()
      });
      
      return adminData.isActive ? adminData : null;
    } else {
      // SECURE: Use server-side verification instead of exposed environment variables
      const isAdminUser = await getAdminStatusSecurely(email);
      if (isAdminUser) {
        const fallbackAdmin: AdminUser = {
          email,
          role: 'super-admin', // Default role for server-verified admins
          isActive: true,
          permissions: ROLE_PERMISSIONS['super-admin']
        };
        
        // Cache the fallback result
        adminCache.set(email, {
          user: fallbackAdmin,
          timestamp: Date.now()
        });
        
        return fallbackAdmin;
      }
    }
  } catch (error) {
    console.error('Error fetching admin user:', error);
    
    // SECURE: Fallback to server-side verification on error
    try {
      const isAdminUser = await getAdminStatusSecurely(email);
      if (isAdminUser) {
        const fallbackAdmin: AdminUser = {
          email,
          role: 'super-admin',
          isActive: true,
          permissions: ROLE_PERMISSIONS['super-admin']
        };
        return fallbackAdmin;
      }
    } catch (fallbackError) {
      console.error('Fallback admin verification also failed:', fallbackError);
    }
  }

  return null;
};

// Basic admin check (backwards compatible)
export const isAdmin = async (user: User | null): Promise<boolean> => {
  const adminUser = await getAdminUser(user);
  return adminUser !== null;
};

// Synchronous version for immediate checks (uses cache only for security)
export const isAdminSync = (user: User | null): boolean => {
  if (!user || !user.email) {
    return false;
  }
  
  const email = user.email.toLowerCase();
  
  // Only check cache for security - no fallback to exposed environment variables
  const cached = adminCache.get(email);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user.isActive;
  }
  
  // SECURE: Return false if not in cache - requires async verification via getAdminUser
  return false;
};

// Permission-based authorization
export const hasPermission = async (user: User | null, permission: string): Promise<boolean> => {
  const adminUser = await getAdminUser(user);
  if (!adminUser) return false;
  
  return adminUser.permissions.includes(permission);
};

// Role-based authorization
export const hasRole = async (user: User | null, requiredRole: AdminRole): Promise<boolean> => {
  const adminUser = await getAdminUser(user);
  if (!adminUser) return false;
  
  const roleHierarchy: Record<AdminRole, number> = {
    'moderator': 1,
    'admin': 2,
    'super-admin': 3
  };
  
  return roleHierarchy[adminUser.role] >= roleHierarchy[requiredRole];
};

// Enhanced require admin with specific permissions
export const requireAdmin = async (user: User | null, permission?: string): Promise<AdminUser> => {
  const adminUser = await getAdminUser(user);
  
  if (!adminUser) {
    throw new Error('Admin access required');
  }
  
  if (permission && !adminUser.permissions.includes(permission)) {
    throw new Error(`Permission required: ${permission}`);
  }
  
  return adminUser;
};

// Rate limiting for admin actions
const actionCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ACTIONS_PER_MINUTE = 100;

export const checkRateLimit = (userEmail: string, action: string): boolean => {
  const key = `${userEmail}:${action}`;
  const now = Date.now();
  const record = actionCounts.get(key);
  
  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    actionCounts.set(key, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= MAX_ACTIONS_PER_MINUTE) {
    return false;
  }
  
  record.count++;
  return true;
};

// Audit logging for admin actions
export const logAdminAction = async (
  user: User,
  action: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    const logEntry = {
      adminEmail: user.email,
      action,
      details: details || {},
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      ip: 'client-side' // In production, get this from server
    };
    
    console.log('Admin Action:', logEntry);
    
    // In production, send to Firestore audit collection
    // await addDoc(collection(db, 'admin_audit_log'), logEntry);
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// Clear cache (useful for testing or when admin status changes)
export const clearAdminCache = (email?: string): void => {
  if (email) {
    adminCache.delete(email.toLowerCase());
  } else {
    adminCache.clear();
  }
};
