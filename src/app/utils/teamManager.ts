import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { TeamMember, TeamInvite, TeamRole, ROLE_PERMISSIONS } from '../types/team';
import { v4 as uuidv4 } from 'uuid';

// Team member management utilities
export class TeamManager {
  
  // Add a new team member
  static async addTeamMember(
    adminUser: User,
    memberEmail: string,
    role: TeamRole,
    displayName?: string,
    department?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string; member?: TeamMember }> {
    try {
      // Validate admin permissions
      if (!await this.canManageTeam(adminUser)) {
        return { success: false, error: 'Insufficient permissions to manage team members' };
      }

      // Check if member already exists
      const existingMember = await this.getTeamMember(memberEmail);
      if (existingMember) {
        return { success: false, error: 'Team member already exists' };
      }

      // Validate role assignment permissions
      if (!await this.canAssignRole(adminUser, role)) {
        return { success: false, error: `Insufficient permissions to assign ${role} role` };
      }

      const newMember: TeamMember = {
        id: uuidv4(),
        email: memberEmail.toLowerCase().trim(),
        displayName,
        role,
        isActive: true,
        addedBy: adminUser.email!,
        addedAt: new Date(),
        permissions: ROLE_PERMISSIONS[role],
        department,
        notes
      };

      await setDoc(doc(db, 'team_members', newMember.email), newMember);

      return { success: true, member: newMember };
    } catch (error) {
      console.error('Error adding team member:', error);
      return { success: false, error: 'Failed to add team member' };
    }
  }

  // Update team member
  static async updateTeamMember(
    adminUser: User,
    memberEmail: string,
    updates: Partial<Pick<TeamMember, 'role' | 'displayName' | 'department' | 'notes' | 'isActive'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.canManageTeam(adminUser)) {
        return { success: false, error: 'Insufficient permissions to manage team members' };
      }

      const member = await this.getTeamMember(memberEmail);
      if (!member) {
        return { success: false, error: 'Team member not found' };
      }

      // If updating role, validate permissions
      if (updates.role && !await this.canAssignRole(adminUser, updates.role)) {
        return { success: false, error: `Insufficient permissions to assign ${updates.role} role` };
      }

      const updateData: Partial<TeamMember> = { ...updates };
      
      // Update permissions if role is being changed
      if (updates.role) {
        updateData.permissions = ROLE_PERMISSIONS[updates.role];
      }

      await updateDoc(doc(db, 'team_members', memberEmail), updateData);

      return { success: true };
    } catch (error) {
      console.error('Error updating team member:', error);
      return { success: false, error: 'Failed to update team member' };
    }
  }

  // Remove team member
  static async removeTeamMember(
    adminUser: User,
    memberEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.canManageTeam(adminUser)) {
        return { success: false, error: 'Insufficient permissions to manage team members' };
      }

      // Prevent removing oneself
      if (adminUser.email === memberEmail) {
        return { success: false, error: 'Cannot remove yourself from the team' };
      }

      const member = await this.getTeamMember(memberEmail);
      if (!member) {
        return { success: false, error: 'Team member not found' };
      }

      // Only super-admins can remove other super-admins
      const adminRole = await this.getUserRole(adminUser);
      if (member.role === 'super-admin' && adminRole !== 'super-admin') {
        return { success: false, error: 'Only super-admins can remove other super-admins' };
      }

      await deleteDoc(doc(db, 'team_members', memberEmail));

      return { success: true };
    } catch (error) {
      console.error('Error removing team member:', error);
      return { success: false, error: 'Failed to remove team member' };
    }
  }

  // Get all team members
  static async getAllTeamMembers(): Promise<TeamMember[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'team_members'));
      return querySnapshot.docs.map(doc => doc.data() as TeamMember);
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  // Get a specific team member
  static async getTeamMember(email: string): Promise<TeamMember | null> {
    try {
      const docRef = doc(db, 'team_members', email.toLowerCase().trim());
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as TeamMember : null;
    } catch (error) {
      console.error('Error fetching team member:', error);
      return null;
    }
  }

  // Get user's role
  static async getUserRole(user: User): Promise<TeamRole | null> {
    if (!user.email) return null;
    
    const member = await this.getTeamMember(user.email);
    return member?.role || null;
  }

  // Check if user can manage team
  static async canManageTeam(user: User): Promise<boolean> {
    const role = await this.getUserRole(user);
    // SECURITY: Only super-admins can manage team members
    return role === 'super-admin';
  }

  // Check if user can assign a specific role
  static async canAssignRole(user: User, targetRole: TeamRole): Promise<boolean> {
    const adminRole = await this.getUserRole(user);
    if (!adminRole) return false;

    // SECURITY: Only super-admins can assign roles, and they can only assign 'admin' role
    if (adminRole !== 'super-admin') return false;
    
    // Super-admins can only assign 'admin' role to maintain security hierarchy
    return targetRole === 'admin';
  }

  // Check if user has a specific permission
  static async hasPermission(user: User, permission: string): Promise<boolean> {
    const member = await this.getTeamMember(user.email!);
    return member?.permissions.includes(permission) || false;
  }

  // Send team invitation (placeholder for email integration)
  static async sendTeamInvitation(
    adminUser: User,
    email: string,
    role: TeamRole
  ): Promise<{ success: boolean; error?: string; invite?: TeamInvite }> {
    try {
      if (!await this.canManageTeam(adminUser)) {
        return { success: false, error: 'Only super-admins can send team invitations' };
      }

      if (!await this.canAssignRole(adminUser, role)) {
        return { success: false, error: 'Can only assign admin role to new team members' };
      }

      // Check if already a team member
      const existingMember = await this.getTeamMember(email);
      if (existingMember) {
        return { success: false, error: 'User is already a team member' };
      }

      const invite: TeamInvite = {
        id: uuidv4(),
        email: email.toLowerCase().trim(),
        role,
        invitedBy: adminUser.email!,
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isAccepted: false,
        token: uuidv4()
      };

      await setDoc(doc(db, 'team_invites', invite.id), invite);

      // TODO: Send actual email invitation
      console.log(`Team invitation sent to ${email} for ${role} role`);

      return { success: true, invite };
    } catch (error) {
      console.error('Error sending team invitation:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  }

  // Get pending invitations
  static async getPendingInvitations(): Promise<TeamInvite[]> {
    try {
      const q = query(
        collection(db, 'team_invites'),
        where('isAccepted', '==', false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as TeamInvite);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
  }

  // Cancel invitation
  static async cancelInvitation(
    adminUser: User,
    inviteId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.canManageTeam(adminUser)) {
        return { success: false, error: 'Insufficient permissions to cancel invitations' };
      }

      await deleteDoc(doc(db, 'team_invites', inviteId));
      return { success: true };
    } catch (error) {
      console.error('Error canceling invitation:', error);
      return { success: false, error: 'Failed to cancel invitation' };
    }
  }

  // Update last login
  static async updateLastLogin(email: string): Promise<void> {
    try {
      const member = await this.getTeamMember(email);
      if (member) {
        await updateDoc(doc(db, 'team_members', email), {
          lastLogin: new Date()
        });
      }
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }
}

// Utility functions for backward compatibility with existing admin system
export const isTeamMember = async (user: User | null): Promise<boolean> => {
  if (!user?.email) return false;
  const member = await TeamManager.getTeamMember(user.email);
  return member?.isActive || false;
};

export const getTeamMemberRole = async (user: User | null): Promise<TeamRole | null> => {
  if (!user?.email) return null;
  return await TeamManager.getUserRole(user);
};

export const canManageTeam = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  // SECURITY: Only super-admins can manage team
  return await TeamManager.canManageTeam(user);
};
