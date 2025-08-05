"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../authprovider';
import { 
  getAdminUser, 
  requireAdmin, 
  logAdminAction,
  checkRateLimit,
  type AdminRole
} from '../utils/adminAuth';
import { db } from '../firebase';
import AdminSecurityPanel from './AdminSecurityPanel';

interface ErrorDetails {
  errorMessage?: string;
  errorStack?: string;
  componentStack?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  userDescription?: string;
  viewport?: string;
}

interface Feedback {
  id: string;
  type: string;
  title: string;
  description: string;
  email?: string;
  timestamp: Timestamp | null;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  userAgent?: string;
  url?: string;
  isAutomatic?: boolean;
  errorDetails?: ErrorDetails;
  severity?: string;
  category?: string;
  assignedTo?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  tags?: string[];
  lastUpdated?: Timestamp;
  assignedBy?: string;
}

interface AdminUserData {
  email: string;
  role: AdminRole;
  isActive: boolean;
  permissions?: string[];
  lastLogin?: Date;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  assignedItems: number;
  isActive: boolean;
  permissions?: string[];
}

export default function FeedbackAdmin() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('urgency'); // New sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUserData | null>(null);
  const [securityAlert, setSecurityAlert] = useState<string>('');
  
  // Enhanced admin users with role-based permissions
  const [adminUsers] = useState<AdminUser[]>([
    {
      id: '1',
      email: 'admin1@yourdomain.com',
      name: 'Primary Admin',
      role: 'super-admin',
      assignedItems: feedback.filter(f => f.assignedTo === 'admin1@yourdomain.com').length,
      isActive: true,
      permissions: ['read:feedback', 'write:feedback', 'delete:feedback', 'manage:users', 'manage:admins']
    },
    {
      id: '2', 
      email: 'admin2@yourdomain.com',
      name: 'Secondary Admin',
      role: 'admin',
      assignedItems: feedback.filter(f => f.assignedTo === 'admin2@yourdomain.com').length,
      isActive: true,
      permissions: ['read:feedback', 'write:feedback', 'export:data']
    }
  ]);

  // Security check on component mount
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const adminData = await getAdminUser(user);
        if (!adminData) {
          setLoading(false);
          setSecurityAlert('Access denied: Admin privileges required');
          return;
        }

        setAdminUser(adminData);
        
        // Log admin access
        await logAdminAction(user, 'ACCESS_ADMIN_PANEL', {
          component: 'FeedbackAdmin',
          role: adminData.role
        });

      } catch (error) {
        console.error('Admin verification failed:', error);
        setSecurityAlert('Security verification failed');
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    // Only fetch data if user is verified admin
    if (!adminUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'feedback'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const feedbackData: Feedback[] = [];
      querySnapshot.forEach((doc) => {
        feedbackData.push({ id: doc.id, ...doc.data() } as Feedback);
      });
      setFeedback(feedbackData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [adminUser]);

  // Enhanced security check with detailed error messages
  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
        <p className="text-white/60">Please log in to access the admin panel.</p>
      </div>
    );
  }

  if (securityAlert) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🚨</div>
        <h2 className="text-2xl font-bold text-red-400 mb-4">Security Alert</h2>
        <p className="text-white/60 mb-4">{securityAlert}</p>
        <div className="text-sm text-white/40">
          Incident logged for security review
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-white/60">You need admin privileges to view this page.</p>
        <div className="mt-4 text-sm text-white/40">
          Contact your administrator if you believe this is an error
        </div>
      </div>
    );
  }

  const updateFeedbackStatus = async (feedbackId: string, newStatus: Feedback['status']) => {
    if (!user || !adminUser) return;

    // Check rate limiting
    if (!checkRateLimit(user.email!, 'update_status')) {
      setSecurityAlert('Rate limit exceeded. Please slow down.');
      return;
    }

    // Check permissions
    try {
      await requireAdmin(user, 'write:feedback');
    } catch (err) {
      console.error('Permission error:', err);
      setSecurityAlert('Insufficient permissions to update feedback status');
      return;
    }

    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        status: newStatus,
        lastUpdated: Timestamp.now(),
        lastUpdatedBy: user.email
      });

      // Log the action
      await logAdminAction(user, 'UPDATE_FEEDBACK_STATUS', {
        feedbackId,
        newStatus,
        previousStatus: feedback.find(f => f.id === feedbackId)?.status
      });

    } catch (error) {
      console.error('Error updating feedback status:', error);
      setSecurityAlert('Failed to update feedback status');
    }
  };

  const bulkAssignToAdmin = async (feedbackIds: string[], adminEmail: string) => {
    if (!user || !adminUser) return;

    // Enhanced rate limiting for bulk operations
    if (!checkRateLimit(user.email!, 'bulk_assign')) {
      setSecurityAlert('Rate limit exceeded for bulk operations');
      return;
    }

    // Check permissions for bulk operations
    try {
      await requireAdmin(user, 'write:feedback');
      
      // Additional check for large bulk operations
      if (feedbackIds.length > 50 && adminUser.role !== 'super-admin') {
        throw new Error('Large bulk operations require super-admin privileges');
      }
    } catch (error) {
      setSecurityAlert(error instanceof Error ? error.message : 'Insufficient permissions for bulk assignment');
      return;
    }

    try {
      const promises = feedbackIds.map(id => 
        updateDoc(doc(db, 'feedback', id), {
          assignedTo: adminEmail,
          assignedBy: user.email,
          lastUpdated: Timestamp.now()
        })
      );
      await Promise.all(promises);
      setSelectedItems([]);

      // Log the bulk action
      await logAdminAction(user, 'BULK_ASSIGN', {
        feedbackIds,
        assignedTo: adminEmail,
        count: feedbackIds.length
      });

    } catch (error) {
      console.error('Error bulk assigning feedback:', error);
      setSecurityAlert('Failed to complete bulk assignment');
    }
  };

  const bulkUpdateStatus = async (feedbackIds: string[], status: Feedback['status']) => {
    if (!user || !adminUser) return;

    // Enhanced rate limiting for bulk operations
    if (!checkRateLimit(user.email!, 'bulk_status_update')) {
      setSecurityAlert('Rate limit exceeded for bulk operations');
      return;
    }

    // Check permissions for bulk operations
    try {
      await requireAdmin(user, 'write:feedback');
      
      // Additional check for large bulk operations or sensitive status changes
      if ((feedbackIds.length > 50 || status === 'closed') && adminUser.role !== 'super-admin') {
        throw new Error('Large bulk operations or closing items require super-admin privileges');
      }
    } catch (error) {
      setSecurityAlert(error instanceof Error ? error.message : 'Insufficient permissions for bulk status update');
      return;
    }

    try {
      const promises = feedbackIds.map(id => 
        updateDoc(doc(db, 'feedback', id), {
          status: status,
          lastUpdated: Timestamp.now(),
          bulkUpdatedBy: user.email
        })
      );
      await Promise.all(promises);
      setSelectedItems([]);

      // Log the bulk action
      await logAdminAction(user, 'BULK_STATUS_UPDATE', {
        feedbackIds,
        newStatus: status,
        count: feedbackIds.length
      });

    } catch (error) {
      console.error('Error bulk updating status:', error);
      setSecurityAlert('Failed to complete bulk status update');
    }
  };

  const filteredFeedback = feedback.filter(item => {
    // Base filter by status/type
    let matchesFilter = true;
    if (filter === 'automatic') {
      matchesFilter = item.isAutomatic === true;
    } else if (filter !== 'all') {
      matchesFilter = item.status === filter;
    }

    // Search filter
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase());

    // Assignment filter
    const matchesAssignment = assignedTo === 'all' || 
      (assignedTo === 'unassigned' && !item.assignedTo) ||
      item.assignedTo === assignedTo;

    // Priority filter
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;

    return matchesFilter && matchesSearch && matchesAssignment && matchesPriority;
  });

  // Sorting function based on urgency and other criteria
  const getSortPriority = (item: Feedback) => {
    // Base priority scores (lower number = higher priority)
    const statusPriority: Record<string, number> = {
      'new': 1,           // Highest priority - needs immediate attention
      'in-progress': 2,   // Second priority - currently being worked on
      'resolved': 3,      // Lower priority - completed but might need verification
      'closed': 4         // Lowest priority - fully completed
    };

    const severityPriority: Record<string, number> = {
      'high': 0.1,        // Critical errors get top priority
      'medium': 0.2,      // Medium errors
      'low': 0.3          // Low priority errors
    };

    const typePriority: Record<string, number> = {
      'automatic_error_report': 0.1,  // Auto errors are urgent
      'bug': 0.2,                     // Manual bug reports
      'feature': 0.4,                 // Feature requests
      'improvement': 0.5,             // Improvements
      'other': 0.6                    // Other feedback
    };

    let priority = statusPriority[item.status] || 5;
    
    // Add severity bonus for automatic errors
    if (item.isAutomatic && item.severity) {
      priority += severityPriority[item.severity] || 0.3;
    }
    
    // Add type priority
    priority += typePriority[item.type] || 0.6;

    return priority;
  };

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    switch (sortBy) {
      case 'urgency':
        // Sort by calculated priority (lower = more urgent)
        const priorityDiff = getSortPriority(a) - getSortPriority(b);
        if (priorityDiff !== 0) return priorityDiff;
        // If same priority, sort by timestamp (newer first)
        return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
      
      case 'newest':
        return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
      
      case 'oldest':
        return (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0);
      
      case 'status':
        // Sort by status priority, then by timestamp
        const statusOrder = ['new', 'in-progress', 'resolved', 'closed'];
        const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        if (statusDiff !== 0) return statusDiff;
        return (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0);
      
      case 'type':
        // Sort by type, with automatic errors first
        if (a.isAutomatic && !b.isAutomatic) return -1;
        if (!a.isAutomatic && b.isAutomatic) return 1;
        return a.type.localeCompare(b.type);
      
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'resolved': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'closed': return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return '🐛';
      case 'feature': return '💡';
      case 'improvement': return '⚡';
      case 'automatic_error_report': return '🤖';
      default: return '💬';
    }
  };

  const isAutomaticError = (feedback: Feedback) => feedback.isAutomatic === true;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-white/60">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alert Banner */}
      {securityAlert && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="font-semibold text-red-300">Security Alert</h3>
              <p className="text-red-200 text-sm">{securityAlert}</p>
            </div>
            <button
              onClick={() => setSecurityAlert('')}
              className="ml-auto text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Admin Status Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Panel - Active Session</h2>
              <p className="text-sm text-white/70">
                Logged in as <strong>{adminUser.email}</strong> • Role: 
                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                  adminUser.role === 'super-admin' ? 'bg-purple-600/50 text-purple-200' :
                  adminUser.role === 'admin' ? 'bg-blue-600/50 text-blue-200' :
                  'bg-gray-600/50 text-gray-200'
                }`}>
                  {adminUser.role.replace('-', ' ').toUpperCase()}
                </span>
              </p>
            </div>
          </div>
          <div className="text-right text-sm text-white/60">
            <div>Session: {new Date().toLocaleTimeString()}</div>
            <div>Permissions: {adminUser.permissions?.length || 0} granted</div>
          </div>
        </div>
      </div>

      {/* Admin Security Panel */}
      <AdminSecurityPanel onSecurityAlert={setSecurityAlert} />

      {/* Enhanced Search and Filters */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white mb-3">🔍 Advanced Search & Filters</h2>
        
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search feedback content, emails, error messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50">
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Assignment Filter */}
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          >
            <option value="all" className="bg-gray-800">👥 All Assignments</option>
            <option value="unassigned" className="bg-gray-800">🆕 Unassigned ({feedback.filter(f => !f.assignedTo).length})</option>
            {adminUsers.map(admin => (
              <option key={admin.email} value={admin.email} className="bg-gray-800">
                👤 {admin.name} ({feedback.filter(f => f.assignedTo === admin.email).length})
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          >
            <option value="all" className="bg-gray-800">⚡ All Priorities</option>
            <option value="critical" className="bg-gray-800">🚨 Critical</option>
            <option value="high" className="bg-gray-800">🔥 High</option>
            <option value="medium" className="bg-gray-800">📊 Medium</option>
            <option value="low" className="bg-gray-800">📝 Low</option>
          </select>

          {/* Team Management Toggle */}
          <button
            onClick={() => setShowTeamManagement(!showTeamManagement)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showTeamManagement 
                ? 'bg-blue-600/80 border-blue-500 text-white' 
                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
            }`}
          >
            👥 Team Management
          </button>

          {/* Bulk Actions (shown when items are selected) */}
          {selectedItems.length > 0 && (
            <div className="relative">
              <select
                onChange={(e) => {
                  const action = e.target.value;
                  if (action.startsWith('assign-')) {
                    const adminEmail = action.replace('assign-', '');
                    bulkAssignToAdmin(selectedItems, adminEmail);
                  } else if (action.startsWith('status-')) {
                    const status = action.replace('status-', '') as Feedback['status'];
                    bulkUpdateStatus(selectedItems, status);
                  }
                  e.target.value = '';
                }}
                className="px-3 py-2 rounded-lg bg-green-600/80 border border-green-500 text-white focus:outline-none text-sm font-medium"
              >
                <option value="">📋 Bulk Actions ({selectedItems.length})</option>
                <optgroup label="Assign To">
                  {adminUsers.map(admin => (
                    <option key={`assign-${admin.email}`} value={`assign-${admin.email}`} className="bg-gray-800">
                      → {admin.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Update Status">
                  <option value="status-in-progress" className="bg-gray-800">→ In Progress</option>
                  <option value="status-resolved" className="bg-gray-800">→ Resolved</option>
                  <option value="status-closed" className="bg-gray-800">→ Closed</option>
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* Team Management Panel */}
        {showTeamManagement && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-md font-semibold text-white mb-3">👥 Team Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {adminUsers.map(admin => (
                <div key={admin.email} className="bg-white/10 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{admin.name}</div>
                      <div className="text-xs text-white/60">{admin.email}</div>
                      <div className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                        admin.role === 'super-admin' ? 'bg-purple-600/50 text-purple-200' :
                        admin.role === 'admin' ? 'bg-blue-600/50 text-blue-200' :
                        'bg-gray-600/50 text-gray-200'
                      }`}>
                        {admin.role.replace('-', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{admin.assignedItems}</div>
                      <div className="text-xs text-white/60">assigned</div>
                      <div className={`w-2 h-2 rounded-full mt-1 ${admin.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Feedback & Bug Reports</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Filter Dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          >
            <option value="all" className="bg-gray-800">All ({feedback.length})</option>
            <option value="new" className="bg-gray-800">New ({feedback.filter(f => f.status === 'new').length})</option>
            <option value="in-progress" className="bg-gray-800">In Progress ({feedback.filter(f => f.status === 'in-progress').length})</option>
            <option value="resolved" className="bg-gray-800">Resolved ({feedback.filter(f => f.status === 'resolved').length})</option>
            <option value="closed" className="bg-gray-800">Closed ({feedback.filter(f => f.status === 'closed').length})</option>
            <option value="automatic" className="bg-gray-800">Auto Errors ({feedback.filter(f => f.isAutomatic).length})</option>
          </select>
          
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          >
            <option value="urgency" className="bg-gray-800">🚨 Sort by Urgency</option>
            <option value="newest" className="bg-gray-800">🕐 Newest First</option>
            <option value="oldest" className="bg-gray-800">📅 Oldest First</option>
            <option value="status" className="bg-gray-800">📊 By Status</option>
            <option value="type" className="bg-gray-800">🏷️ By Type</option>
          </select>
          
          {/* Quick Action for Urgent Items */}
          {sortBy === 'urgency' && sortedFeedback.length > 0 && (
            <button
              onClick={() => {
                const urgentItems = sortedFeedback.slice(0, 5).filter(item => 
                  item.status === 'new' || item.status === 'in-progress'
                );
                const count = urgentItems.length;
                if (count > 0) {
                  alert(`⚠️ Found ${count} urgent item${count > 1 ? 's' : ''} needing immediate attention!\n\nTop urgent items:\n${urgentItems.slice(0, 3).map((item, i) => `${i + 1}. ${item.type === 'automatic_error_report' ? '🤖 Auto Error' : getTypeIcon(item.type)} ${item.type} - ${item.status}`).join('\n')}`);
                } else {
                  alert('✅ No urgent items requiring immediate action.');
                }
              }}
              className="px-3 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-700/80 transition-colors text-sm font-medium border border-red-500/50"
              title="Check for items that need immediate attention"
            >
              🚨 Quick Check
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sortedFeedback.length === 0 ? (
          <div className="text-center p-8 text-white/60">
            {filter === 'all' ? 'No feedback received yet.' : `No ${filter} feedback.`}
          </div>
        ) : (
          <>
            {/* Summary Bar */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs text-white/70">
                <span className="font-medium">Showing:</span> {sortedFeedback.length} items
              </div>
              <div className="text-xs text-white/70">•</div>
              <div className="text-xs text-white/70">
                <span className="font-medium">Urgent:</span> {sortedFeedback.filter(f => f.status === 'new' && (f.isAutomatic || f.type === 'bug')).length}
              </div>
              <div className="text-xs text-white/70">•</div>
              <div className="text-xs text-white/70">
                <span className="font-medium">Sort:</span> {
                  sortBy === 'urgency' ? '🚨 By Priority' :
                  sortBy === 'newest' ? '🕐 Newest First' :
                  sortBy === 'oldest' ? '📅 Oldest First' :
                  sortBy === 'status' ? '📊 By Status' :
                  '🏷️ By Type'
                }
              </div>
              {sortBy === 'urgency' && (
                <>
                  <div className="text-xs text-white/70">•</div>
                  <div className="text-xs text-white/50 italic" title="Urgency calculated by: Status priority + Error type weight + Auto-detection bonus">
                    💡 Sorted by status, type & severity
                  </div>
                </>
              )}
            </div>

            {sortedFeedback.map((item, index) => (
              <div key={item.id} className={`p-6 rounded-xl backdrop-blur-md border relative ${
                isAutomaticError(item) 
                  ? 'bg-gradient-to-br from-red-800/50 to-red-900/50 border-red-400/30' 
                  : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/20'
              }`}>
                {/* Priority Indicator */}
                {sortBy === 'urgency' && index < 5 && (
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-red-600/80 text-red-100' :
                    index === 1 ? 'bg-orange-600/80 text-orange-100' :
                    index === 2 ? 'bg-yellow-600/80 text-yellow-100' :
                    index === 3 ? 'bg-blue-600/80 text-blue-100' :
                    'bg-gray-600/80 text-gray-100'
                  }`}>
                    {index === 0 ? '🚨 CRITICAL' : 
                     index === 1 ? '⚡ URGENT' : 
                     index === 2 ? '🔥 HIGH' :
                     index === 3 ? '� MEDIUM' :
                     '📝 NORMAL'}
                  </div>
                )}
                
                {/* Add automatic error indicator */}
                {isAutomaticError(item) && (
                  <div className="mb-4 px-3 py-2 rounded-lg bg-red-600/50 text-red-200 text-sm font-medium inline-block">
                    🤖 Automatic Error Report
                    {item.severity && (
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        item.severity === 'high' ? 'bg-red-700/70 text-red-100' : 'bg-yellow-600/70 text-yellow-100'
                      }`}>
                        {item.severity.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(item.type)}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{item.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                        {item.email && item.email !== 'system@automatic-error-report.com' && (
                          <>
                            <span>•</span>
                            <span>{item.email}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{item.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status.replace('-', ' ').toUpperCase()}
                    </div>
                    <select
                      value={item.status}
                      onChange={(e) => updateFeedbackStatus(item.id, e.target.value as Feedback['status'])}
                      className="text-xs px-2 py-1 rounded bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none"
                    >
                      <option value="new" className="bg-gray-800">New</option>
                      <option value="in-progress" className="bg-gray-800">In Progress</option>
                      <option value="resolved" className="bg-gray-800">Resolved</option>
                      <option value="closed" className="bg-gray-800">Closed</option>
                    </select>
                  </div>
                </div>
                
                <p className="text-white/80 whitespace-pre-wrap mb-4">{item.description}</p>
                
                {/* Error Details for Automatic Reports */}
                {isAutomaticError(item) && item.errorDetails && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/20 border border-red-400/30">
                    <h4 className="font-semibold text-red-300 mb-3 text-sm">🔍 Technical Error Details</h4>
                    <div className="space-y-2 text-xs text-white/70">
                      {item.errorDetails.errorMessage && (
                        <div>
                          <span className="font-medium text-red-300">Error:</span> {item.errorDetails.errorMessage}
                        </div>
                      )}
                      {item.errorDetails.url && (
                        <div>
                          <span className="font-medium text-red-300">Page:</span> {item.errorDetails.url}
                        </div>
                      )}
                      {item.errorDetails.userDescription && item.errorDetails.userDescription !== 'No additional description provided' && (
                        <div>
                          <span className="font-medium text-red-300">User Description:</span> {item.errorDetails.userDescription}
                        </div>
                      )}
                      {item.errorDetails.viewport && (
                        <div>
                          <span className="font-medium text-red-300">Viewport:</span> {item.errorDetails.viewport}
                        </div>
                      )}
                      {item.errorDetails.timestamp && (
                        <div>
                          <span className="font-medium text-red-300">Time:</span> {new Date(item.errorDetails.timestamp).toLocaleString()}
                        </div>
                      )}
                      {item.errorDetails.errorStack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium text-red-300 hover:text-red-200">Stack Trace</summary>
                          <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-x-auto whitespace-pre-wrap text-gray-300">
                            {item.errorDetails.errorStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                )}
                
                {(item.userAgent || item.url) && (
                  <div className="text-xs text-white/40 border-t border-white/10 pt-3">
                    {item.url && <div>URL: {item.url}</div>}
                    {item.userAgent && <div>User Agent: {item.userAgent}</div>}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
