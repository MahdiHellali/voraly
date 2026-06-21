import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

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

// NOTE i18n & cache (décision cycle 1) :
// L'i18n en mode cookie/Accept-Language rend la landing dynamique (le layout
// racine lit cookie+headers pour la langue). Un cache partagé court a été
// envisagé mais ÉCARTÉ : pour une même URL la langue varie selon le cookie
// VORALY_LOCALE / Accept-Language, et Next.js gère lui-même l'en-tête `Vary`
// (rsc, router-state...) en écrasant tout `Vary: Cookie, Accept-Language` qu'on
// poserait — un cache partagé servirait donc la mauvaise langue. Caddy ne cache
// pas par défaut, donc le SSR dynamique est sans risque de corruption à ce stade.
// La vraie solution (rendu statique regagné + hreflang + cache sûr par langue)
// = migration vers le routing `/[locale]/`, planifiée au sprint SEO (cf. DECISIONS).
const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
