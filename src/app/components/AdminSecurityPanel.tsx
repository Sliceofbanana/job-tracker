"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../authprovider';
import { 
  getAdminUser, 
  logAdminAction,
  clearAdminCache
} from '../utils/adminAuth';
import TeamManagementPanel from './TeamManagementPanel';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  event: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

interface AdminUser {
  email: string;
  role: string;
  isActive: boolean;
  permissions?: string[];
  lastLogin?: Date;
}

interface AdminSecurityPanelProps {
  onSecurityAlert: (message: string) => void;
}

export default function AdminSecurityPanel({ onSecurityAlert }: AdminSecurityPanelProps) {
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [sessionInfo] = useState({
    loginTime: new Date(),
    actionsPerformed: 0,
    lastActivity: new Date()
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      try {
        const adminData = await getAdminUser(user);
        setAdminUser(adminData);
      } catch (error) {
        console.error('Failed to verify admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Mock security events - in production, these would come from audit logs
  useEffect(() => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        event: 'Admin Login',
        details: `${user?.email} logged into admin panel`,
        severity: 'info'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        event: 'Multiple Failed Access Attempts',
        details: 'IP: 192.168.1.100 attempted admin access 5 times',
        severity: 'warning'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 30 * 1000),
        event: 'Bulk Operation Performed',
        details: `${user?.email} updated 15 feedback items`,
        severity: 'info'
      }
    ];
    setSecurityEvents(mockEvents);
  }, [user]);

  const handleForceLogout = async () => {
    if (!user || !adminUser) return;

    try {
      await logAdminAction(user, 'FORCE_LOGOUT', {
        reason: 'Manual security logout',
        sessionDuration: Date.now() - sessionInfo.loginTime.getTime()
      });

      // Clear admin cache
      clearAdminCache(user.email!);
      
      // In a real app, you would sign out the user here
      onSecurityAlert('Security logout initiated');
      
    } catch (error) {
      console.error('Error during security logout:', error);
      onSecurityAlert('Failed to perform security logout');
    }
  };

  const refreshSecurityStatus = async () => {
    if (!user) return;

    try {
      // Clear cache to force fresh verification
      clearAdminCache(user.email!);
      
      const adminData = await getAdminUser(user);
      setAdminUser(adminData);
      
      await logAdminAction(user, 'SECURITY_REFRESH', {
        timestamp: new Date()
      });
      
      onSecurityAlert('Security status refreshed');
    } catch (error) {
      console.error('Error refreshing security status:', error);
      onSecurityAlert('Failed to refresh security status');
    }
  };

  const getEventIcon = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getEventColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-300 border-red-400/30 bg-red-500/20';
      case 'warning': return 'text-yellow-300 border-yellow-400/30 bg-yellow-500/20';
      case 'info': return 'text-blue-300 border-blue-400/30 bg-blue-500/20';
      default: return 'text-gray-300 border-gray-400/30 bg-gray-500/20';
    }
  };

  if (!adminUser) {
    return null;
  }

  return (
    <>
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          🛡️ Security Center
        </h3>
        <button
          onClick={() => setShowSecurityPanel(!showSecurityPanel)}
          className="px-3 py-1 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-sm"
        >
          {showSecurityPanel ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Quick Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-green-600/20 border border-green-400/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-green-400">🔐</span>
            <div>
              <div className="text-sm font-medium text-green-300">Session Secure</div>
              <div className="text-xs text-green-200/70">Active for {Math.floor((Date.now() - sessionInfo.loginTime.getTime()) / (1000 * 60))} min</div>
            </div>
          </div>
        </div>

        <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">👤</span>
            <div>
              <div className="text-sm font-medium text-blue-300">Admin Role</div>
              <div className="text-xs text-blue-200/70 capitalize">{adminUser.role.replace('-', ' ')}</div>
            </div>
          </div>
        </div>

        <div className="bg-purple-600/20 border border-purple-400/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <span className="text-purple-400">🔑</span>
            <div>
              <div className="text-sm font-medium text-purple-300">Permissions</div>
              <div className="text-xs text-purple-200/70">{adminUser.permissions?.length || 0} granted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={refreshSecurityStatus}
          className="px-3 py-1 rounded-lg bg-blue-600/80 text-white hover:bg-blue-700/80 transition-colors text-sm"
        >
          🔄 Refresh Status
        </button>
        
        {/* Team Management - Only for Super Admins */}
        {adminUser.role === 'super-admin' && (
          <button
            onClick={() => setShowTeamManagement(true)}
            className="px-3 py-1 rounded-lg bg-green-600/80 text-white hover:bg-green-700/80 transition-colors text-sm"
          >
            👥 Manage Team
          </button>
        )}
        
        <button
          onClick={handleForceLogout}
          className="px-3 py-1 rounded-lg bg-red-600/80 text-white hover:bg-red-700/80 transition-colors text-sm"
        >
          🚪 Security Logout
        </button>
      </div>

      {/* Detailed Security Panel */}
      {showSecurityPanel && (
        <div className="space-y-4">
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-md font-semibold text-white mb-3">Recent Security Events</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {securityEvents.map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${getEventColor(event.severity)}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getEventIcon(event.severity)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{event.event}</span>
                        <span className="text-xs opacity-70">
                          {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs opacity-80 mt-1">{event.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Information */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-md font-semibold text-white mb-3">Session Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-white/60">Login Time</div>
                <div className="text-white font-medium">{sessionInfo.loginTime.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-white/60">Last Activity</div>
                <div className="text-white font-medium">{sessionInfo.lastActivity.toLocaleTimeString()}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-white/60">Actions Performed</div>
                <div className="text-white font-medium">{sessionInfo.actionsPerformed}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-sm text-white/60">User Agent</div>
                <div className="text-white font-medium text-xs truncate" title={navigator.userAgent}>
                  {navigator.userAgent.split(' ')[0]}...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Team Management Modal */}
    {showTeamManagement && (
      <TeamManagementPanel onClose={() => setShowTeamManagement(false)} />
    )}
    </>
  );
}
