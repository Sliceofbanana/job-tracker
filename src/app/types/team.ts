export type TeamRole = 'super-admin' | 'admin';

export interface TeamMember {
  id: string;
  email: string;
  displayName?: string;
  role: TeamRole;
  isActive: boolean;
  addedBy: string; // Email of the admin who added them
  addedAt: Date;
  lastLogin?: Date;
  permissions: string[];
  department?: string;
  notes?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  isAccepted: boolean;
  token: string;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<TeamRole, string[]> = {
  'super-admin': [
    'read:all',
    'write:all',
    'delete:all',
    'manage:users',
    'manage:admins',
    'manage:team',
    'export:data',
    'view:analytics',
    'system:settings',
    'invite:users',
    'promote:users'
  ],
  'admin': [
    'read:jobs',
    'write:jobs',
    'delete:jobs',
    'read:feedback',
    'write:feedback',
    'delete:feedback',
    'export:data',
    'view:analytics'
  ]
};

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  'admin': 1,
  'super-admin': 2
};

export const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  'super-admin': 'Full access to all features including user management and system settings',
  'admin': 'Manage jobs and feedback, view analytics (cannot manage team members)'
};
