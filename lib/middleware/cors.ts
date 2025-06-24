import { NextRequest, NextResponse } from 'next/server';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://devmind-staging.vercel.app',
  'https://devmind.vercel.app'
];

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  const response = NextResponse.next();
  
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }
  
  return response;
}