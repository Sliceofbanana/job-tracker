import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Rate limiting for team management requests
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 20;

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

    const { action } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' }, 
        { status: 400 }
      );
    }

    // Log team management actions for security monitoring
    console.log(`Team management action: ${action} - IP: ${ip}`);

    // Since we're using client-side Firebase operations, 
    // this endpoint mainly serves as a logging and rate limiting layer
    // The actual team management is handled by the TeamManager class

    switch (action) {
      case 'add_member':
      case 'update_member':
      case 'remove_member':
      case 'get_members':
        // Log the action and return success
        console.log(`Team action ${action} requested by IP: ${ip}`);
        return NextResponse.json({ 
          success: true,
          message: `${action} request logged`,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' }, 
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Team management API error:', error);
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
