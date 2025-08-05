"use client";

import { useEffect } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      await sendAutomaticErrorReport({
        type: 'unhandled_promise_rejection',
        error: event.reason?.toString() || 'Unknown promise rejection',
        stack: event.reason?.stack || 'No stack trace available'
      });
    };

    // Handle global JavaScript errors
    const handleGlobalError = async (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      await sendAutomaticErrorReport({
        type: 'global_javascript_error',
        error: event.message,
        stack: event.error?.stack || 'No stack trace available',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    // Cleanup function
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Helper function to send automatic error reports
async function sendAutomaticErrorReport(errorDetails: {
  type: string;
  error: string;
  stack: string;
  filename?: string;
  lineno?: number;
  colno?: number;
}) {
  try {
    const errorReport = {
      type: 'automatic_error_report',
      category: 'Bug Report',
      message: `Automatic Error Report: ${errorDetails.type}`,
      description: `Automatically captured error: ${errorDetails.error}`,
      errorDetails: {
        ...errorDetails,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userDescription: 'Automatically captured error - no user interaction'
      },
      email: 'system@automatic-error-report.com',
      createdAt: Timestamp.now(),
      isAutomatic: true,
      userConsented: false,
      severity: errorDetails.type === 'global_javascript_error' ? 'high' : 'medium'
    };

    await addDoc(collection(db, 'feedback'), errorReport);
    console.log('Automatic error report sent for:', errorDetails.type);
  } catch (reportError) {
    console.error('Failed to send automatic error report:', reportError);
  }
}
