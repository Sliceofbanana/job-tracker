import { User } from 'firebase/auth';

// Get admin emails from environment variables (more secure)
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (!adminEmails) {
    console.warn('No admin emails configured in environment variables');
    return [];
  }
  return adminEmails.toLowerCase().split(',').map(email => email.trim());
};

export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) {
    return false;
  }
  
  const adminEmails = getAdminEmails();
  return adminEmails.includes(user.email.toLowerCase());
};

export const requireAdmin = (user: User | null): boolean => {
  if (!isAdmin(user)) {
    throw new Error('Admin access required');
  }
  return true;
};
