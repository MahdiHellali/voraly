import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',   value: 'on' },
  { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',   value: 'nosniff' },
  { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    // 'unsafe-inline' for styles/scripts is required by Tailwind and Next.js internals.
    // Tighten this to nonce-based CSP once the app is stable.
    // Whop embedded checkout loads its iframe from whop.com / *.whop.com
    // (sandbox.whop.com in test mode). Those origins are allowed on frame-src
    // (the iframe), script-src (the embed loader), and connect-src (its calls).
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://whop.com https://*.whop.com",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://whop.com https://*.whop.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "frame-src https://whop.com https://*.whop.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
