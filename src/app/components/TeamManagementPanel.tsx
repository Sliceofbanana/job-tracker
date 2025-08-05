"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../authprovider';
import { TeamManager } from '../utils/teamManager';
import { TeamMember, TeamRole, ROLE_DESCRIPTIONS } from '../types/team';

interface TeamManagementPanelProps {
  onClose?: () => void;
}

export default function TeamManagementPanel({ onClose }: TeamManagementPanelProps) {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    role: 'admin' as TeamRole,
    department: '',
    notes: ''
  });

  const checkSuperAdminPermission = useCallback(async () => {
    if (!user) return;
    const role = await TeamManager.getUserRole(user);
    if (role !== 'super-admin') {
      setError('Only super-admins can manage team members');
    }
  }, [user]);

  useEffect(() => {
    loadTeamMembers();
    checkSuperAdminPermission();
  }, [checkSuperAdminPermission]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const members = await TeamManager.getAllTeamMembers();
      setTeamMembers(members);
    } catch (err) {
      setError('Failed to load team members');
      console.error('Error loading team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);
      
      if (editingMember) {
        // Update existing member
        const result = await TeamManager.updateTeamMember(
          user,
          editingMember.email,
          {
            displayName: formData.displayName || undefined,
            role: formData.role,
            department: formData.department || undefined,
            notes: formData.notes || undefined
          }
        );
        
        if (result.success) {
          await loadTeamMembers();
          setEditingMember(null);
          resetForm();
        } else {
          setError(result.error || 'Failed to update team member');
        }
      } else {
        // Add new member
        const result = await TeamManager.addTeamMember(
          user,
          formData.email,
          formData.role,
          formData.displayName || undefined,
          formData.department || undefined,
          formData.notes || undefined
        );
        
        if (result.success) {
          await loadTeamMembers();
          setShowAddForm(false);
          resetForm();
        } else {
          setError(result.error || 'Failed to add team member');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error submitting form:', err);
    }
  };

  const handleRemoveMember = async (memberEmail: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const result = await TeamManager.removeTeamMember(user, memberEmail);
      if (result.success) {
        await loadTeamMembers();
      } else {
        setError(result.error || 'Failed to remove team member');
      }
    } catch (err) {
      setError('Failed to remove team member');
      console.error('Error removing team member:', err);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    // Security: Only allow editing admin members, not super-admins
    if (member.role === 'super-admin') {
      setError('Super-admin accounts cannot be edited for security reasons');
      return;
    }
    
    setEditingMember(member);
    setFormData({
      email: member.email,
      displayName: member.displayName || '',
      role: member.role,
      department: member.department || '',
      notes: member.notes || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      displayName: '',
      role: 'admin',
      department: '',
      notes: ''
    });
    setEditingMember(null);
  };

  const getRoleBadgeColor = (role: TeamRole) => {
    switch (role) {
      case 'super-admin':
        return 'bg-red-100 text-red-800 border border-red-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            🔐 <strong>Security Notice:</strong> Only super-admins can manage team members. New members are assigned admin role with limited permissions.
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-4">
                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={!!editingMember}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as TeamRole }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="admin">Admin</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {ROLE_DESCRIPTIONS[formData.role]}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      ℹ️ Only super-admins can manage team members. New members are assigned admin role.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingMember ? 'Update Member' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingMember(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Action Buttons */}
          {!showAddForm && (
            <div className="mb-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Team Member
              </button>
            </div>
          )}

          {/* Team Members List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member) => (
                  <tr key={member.email} className={!member.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.displayName || member.email}
                        </div>
                        {member.displayName && (
                          <div className="text-sm text-gray-500">{member.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.addedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {/* Only allow editing admin members, not super-admins */}
                        {member.role === 'admin' && (
                          <button
                            onClick={() => handleEditMember(member)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                        
                        {/* Cannot remove self or super-admins */}
                        {member.email !== user?.email && member.role !== 'super-admin' && (
                          <button
                            onClick={() => handleRemoveMember(member.email)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                        
                        {member.role === 'super-admin' && (
                          <span className="text-gray-400 text-sm">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {teamMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No team members found. Add your first team member to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
