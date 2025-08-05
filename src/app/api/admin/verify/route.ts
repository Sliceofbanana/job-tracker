import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Server-side admin verification (secure - not exposed to client)
// Try both environment variable formats for compatibility
const getAdminEmails = (): string[] => {
  const serverEmails = process.env.ADMIN_EMAILS;
  const clientEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  
  // Prefer server-side env var, fall back to client-side
  const emailsString = serverEmails || clientEmails;
  
  if (!emailsString) {
    console.warn('No admin emails configured in environment variables (ADMIN_EMAILS or NEXT_PUBLIC_ADMIN_EMAILS)');
    return [];
  }
  
  const emails = emailsString.toLowerCase().split(',').map(email => email.trim()).filter(Boolean);
  console.log('Admin emails loaded:', emails.length, 'emails configured');
  return emails;
};

const ADMIN_EMAILS = getAdminEmails();

// Rate limiting for admin verification requests
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               request.headers.get('x-forwarded-for') ||
               'unknown';

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' }, 
        { status: 429 }
      );
    }

    const { email, action } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Invalid email provided' }, 
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);

    // Enhanced logging for debugging admin access issues
    if (action === 'verify') {
      console.log('=== Admin Verification Debug ===');
      console.log('Email being checked:', normalizedEmail);
      console.log('Available admin emails:', ADMIN_EMAILS);
      console.log('Is admin?', isAdmin);
      console.log('Client IP:', ip);
      console.log('Environment check - ADMIN_EMAILS exists:', !!process.env.ADMIN_EMAILS);
      console.log('Environment check - NEXT_PUBLIC_ADMIN_EMAILS exists:', !!process.env.NEXT_PUBLIC_ADMIN_EMAILS);
      console.log('==============================');
    }

    // Return minimal information
    return NextResponse.json({ 
      isAdmin,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
