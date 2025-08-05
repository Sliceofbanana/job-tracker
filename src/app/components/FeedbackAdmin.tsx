"use client";

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useAuth } from '../authprovider';
import { isAdmin } from '../utils/adminAuth';
import { db } from '../firebase';

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
}

export default function FeedbackAdmin() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Only fetch data if user is admin
    if (!isAdmin(user)) {
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
  }, [user]);

  // Check admin access after hooks
  if (!isAdmin(user)) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
        <p className="text-white/60">You need admin privileges to view this page.</p>
      </div>
    );
  }

  const updateFeedbackStatus = async (feedbackId: string, newStatus: Feedback['status']) => {
    try {
      await updateDoc(doc(db, 'feedback', feedbackId), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating feedback status:', error);
    }
  };

  const filteredFeedback = filter === 'all' 
    ? feedback 
    : feedback.filter(item => item.status === filter);

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
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-white/60">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Feedback & Bug Reports</h1>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all" className="bg-gray-800">All ({feedback.length})</option>
            <option value="new" className="bg-gray-800">New ({feedback.filter(f => f.status === 'new').length})</option>
            <option value="in-progress" className="bg-gray-800">In Progress ({feedback.filter(f => f.status === 'in-progress').length})</option>
            <option value="resolved" className="bg-gray-800">Resolved ({feedback.filter(f => f.status === 'resolved').length})</option>
            <option value="closed" className="bg-gray-800">Closed ({feedback.filter(f => f.status === 'closed').length})</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredFeedback.length === 0 ? (
          <div className="text-center p-8 text-white/60">
            {filter === 'all' ? 'No feedback received yet.' : `No ${filter} feedback.`}
          </div>
        ) : (
          filteredFeedback.map((item) => (
            <div key={item.id} className="p-6 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-md border border-white/20">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <span>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
                      {item.email && (
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
              
              {(item.userAgent || item.url) && (
                <div className="text-xs text-white/40 border-t border-white/10 pt-3">
                  {item.url && <div>URL: {item.url}</div>}
                  {item.userAgent && <div>User Agent: {item.userAgent}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
