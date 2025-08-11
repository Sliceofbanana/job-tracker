import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3001',
    '127.0.0.1:3001', 
    '192.168.56.1',
  ],
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...(process.env.NODE_ENV === 'development' ? [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods', 
              value: 'GET, POST, PUT, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization',
            },
          ] : []),
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://ssl.gstatic.com https://content.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://www.gstatic.com https://ssl.gstatic.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com wss://*.firebaseapp.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com https://apis.google.com https://content.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://www.gstatic.com https://ssl.gstatic.com",
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://content.googleapis.com https://apis.google.com https://*.gstatic.com https://ssl.gstatic.com https://accounts.youtube.com https://*.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://accounts.google.com",
              "frame-ancestors 'none'"
            ].join('; ')
          },
        ],
      },
    ];
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
