/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const isDev = process.env.NODE_ENV !== 'production';

const BACKEND_HTTP_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_HTTP_URL || 'https://llm-radar-backend.onrender.com';
const BACKEND_WS_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  ? String(process.env.NEXT_PUBLIC_BACKEND_URL).replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  : (process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'wss://llm-radar-backend.onrender.com');

const csp = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src" + (isDev ? " 'self' http://localhost:8080 ws://localhost:8080 ws: wss:" : ` 'self' https://${new URL(BACKEND_HTTP_URL).host} wss://${new URL(BACKEND_HTTP_URL).host} ws: wss:`),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@llm-radar/types'],
  env: {
    NEXT_PUBLIC_BACKEND_URL: BACKEND_HTTP_URL,
    NEXT_PUBLIC_BACKEND_HTTP_URL: BACKEND_HTTP_URL,
    NEXT_PUBLIC_BACKEND_WS_URL: BACKEND_WS_URL,
  },
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          ...securityHeaders,
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;