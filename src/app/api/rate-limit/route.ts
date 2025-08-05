import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Server-side rate limiting storage
const rateLimitStore = new Map<string, {
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}>();

// Rate limiting configuration
const RATE_LIMITS = {
  // General API requests
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    blockDurationMs: 5 * 60 * 1000 // 5 minutes
  },
  // Feedback submission
  feedback: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 10,
    blockDurationMs: 10 * 60 * 1000 // 10 minutes
  },
  // Admin operations
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    blockDurationMs: 15 * 60 * 1000 // 15 minutes
  },
  // Authentication attempts
  auth: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  }
};

type RateLimitType = keyof typeof RATE_LIMITS;

function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  // Include user agent for additional fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const fingerprint = `${ip}:${userAgent.slice(0, 50)}`;
  
  return fingerprint;
}

function checkRateLimit(identifier: string, limitType: RateLimitType): {
  allowed: boolean;
  resetTime?: number;
  remaining?: number;
  total?: number;
} {
  const config = RATE_LIMITS[limitType];
  const now = Date.now();
  
  let record = rateLimitStore.get(identifier);
  
  if (!record) {
    record = {
      requests: [],
      blocked: false
    };
    rateLimitStore.set(identifier, record);
  }
  
  // Check if still blocked
  if (record.blocked && record.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      resetTime: record.blockedUntil
    };
  }
  
  // Reset block status if time has passed
  if (record.blocked && record.blockedUntil && now >= record.blockedUntil) {
    record.blocked = false;
    record.blockedUntil = undefined;
    record.requests = [];
  }
  
  // Clean old requests outside the window
  const windowStart = now - config.windowMs;
  record.requests = record.requests.filter(time => time > windowStart);
  
  // Check if limit exceeded
  if (record.requests.length >= config.maxRequests) {
    record.blocked = true;
    record.blockedUntil = now + config.blockDurationMs;
    
    return {
      allowed: false,
      resetTime: record.blockedUntil
    };
  }
  
  // Add current request
  record.requests.push(now);
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.requests.length,
    total: config.maxRequests,
    resetTime: windowStart + config.windowMs
  };
}

export async function POST(request: NextRequest) {
  try {
    const identifier = getClientIdentifier(request);
    
    const { action, limitType = 'general' } = await request.json();
    
    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    // Validate limit type
    if (!RATE_LIMITS[limitType as RateLimitType]) {
      return NextResponse.json(
        { error: 'Invalid limit type' },
        { status: 400 }
      );
    }
    
    const result = checkRateLimit(`${identifier}:${action}`, limitType as RateLimitType);
    
    if (!result.allowed) {
      const resetTimeISO = result.resetTime ? new Date(result.resetTime).toISOString() : null;
      
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetTime: resetTimeISO,
          message: 'Too many requests. Please try again later.'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': result.resetTime ? Math.ceil((result.resetTime - Date.now()) / 1000).toString() : '300'
          }
        }
      );
    }
    
    // Return success with rate limit info
    return NextResponse.json({
      allowed: true,
      remaining: result.remaining,
      total: result.total,
      resetTime: result.resetTime ? new Date(result.resetTime).toISOString() : null
    });
    
  } catch (error) {
    console.error('Rate limiting error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Cleanup function to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  for (const [key, record] of rateLimitStore.entries()) {
    // Clean very old blocked records
    if (record.blocked && record.blockedUntil && now - record.blockedUntil > oneHour) {
      rateLimitStore.delete(key);
    }
    // Clean records with no recent requests
    else if (record.requests.length === 0 || Math.max(...record.requests) < now - oneHour) {
      rateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000); // Cleanup every 15 minutes

// Block other HTTP methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
