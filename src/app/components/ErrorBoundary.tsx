"use client";

import React from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReporting: boolean;
  reportSent: boolean;
  userDescription: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reportSent: false,
      userDescription: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console for development
    console.error('Error caught by boundary:', error, errorInfo);
  }

  sendErrorReport = async (includeUserFeedback: boolean = false) => {
    this.setState({ isReporting: true });

    try {
      const errorReport = {
        type: 'automatic_error_report',
        category: 'Bug Report',
        message: `Automatic Error Report: ${this.state.error?.message || 'Unknown error'}`,
        description: this.state.userDescription || 'Automatically generated error report from Error Boundary',
        errorDetails: {
          errorMessage: this.state.error?.message,
          errorStack: this.state.error?.stack,
          componentStack: this.state.errorInfo?.componentStack,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userDescription: this.state.userDescription || 'No additional description provided',
          viewport: `${window.innerWidth}x${window.innerHeight}`
        },
        email: 'system@automatic-error-report.com',
        createdAt: Timestamp.now(),
        isAutomatic: true,
        userConsented: includeUserFeedback,
        severity: 'high'
      };

      await addDoc(collection(db, 'feedback'), errorReport);
      
      this.setState({ reportSent: true });
      console.log('Error report sent successfully');
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    } finally {
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#333333' }}>
          <div className="max-w-lg w-full p-6 rounded-xl bg-gradient-to-br from-red-800/50 to-red-900/50 backdrop-blur-md border border-red-400/30">
            {!this.state.reportSent ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">😅</div>
                  <h2 className="text-2xl font-bold text-red-300 mb-2">Oops! Something went wrong</h2>
                  <p className="text-white/80 text-sm">
                    Don&apos;t worry - we can fix this! An unexpected error occurred while you were using the app.
                  </p>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-400/30">
                  <h3 className="font-semibold text-red-300 mb-2 text-sm">What happened?</h3>
                  <p className="text-white/70 text-xs leading-relaxed">
                    A technical error prevented the page from loading properly. This could be due to a 
                    temporary issue, browser compatibility, or a bug in our code.
                  </p>
                  <div className="mt-3 p-2 rounded bg-red-600/30 text-red-200 text-xs font-mono">
                    Error: {this.state.error?.message || 'Unknown error'}
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-blue-500/20 border border-blue-400/30">
                  <h3 className="font-semibold text-blue-300 mb-3 text-sm">Help us fix this!</h3>
                  <p className="text-white/70 text-xs mb-3">
                    We can automatically send error details to our developers to help fix this issue. 
                    No personal data will be included.
                  </p>
                  
                  <textarea
                    value={this.state.userDescription}
                    onChange={(e) => this.setState({ userDescription: e.target.value })}
                    placeholder="Optional: Describe what you were doing when this error occurred..."
                    className="w-full p-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm resize-none mb-3"
                    rows={3}
                  />
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => this.sendErrorReport(true)}
                      disabled={this.state.isReporting}
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {this.state.isReporting ? '📤 Sending Report...' : '📤 Send Error Report'}
                    </button>
                    
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors text-sm"
                    >
                      🔄 Reload Page
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="text-white/60 text-xs hover:text-white/80 underline"
                  >
                    🏠 Go to Home Page
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-300 mb-2">Report Sent!</h2>
                <p className="text-white/80 text-sm mb-6">
                  Thank you! We&apos;ve received the error report and will work on fixing this issue.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-sm font-medium"
                  >
                    🔄 Reload Page
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white transition-colors text-sm"
                  >
                    🏠 Go to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
