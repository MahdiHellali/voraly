// ─── Voraly · OAuth 2.0 provider registry ────────────────────────────────────
// Single source of truth shared by the connect + callback Route Handlers.
// Acts as an ALLOWLIST: any provider not listed here is rejected (defence in
// depth against open-redirect / SSRF via the [provider] dynamic segment).
//
// Secrets are never hard-coded — only the *names* of the env vars are stored.
// Set e.g. UPWORK_CLIENT_ID / UPWORK_CLIENT_SECRET in .env.local (server-only).

export type ProviderId = 'upwork' | 'linkedin' | 'fiverr' | 'malt'

export interface ProviderConfig {
  id: ProviderId
  label: string
  /** Provider's OAuth 2.0 authorization endpoint. */
  authorizeUrl: string
  /** Provider's OAuth 2.0 token endpoint (code → tokens exchange). */
  tokenUrl: string
  /** Space-delimited scopes requested. */
  scopes: string
  /** Name of the env var holding the client id. */
  clientIdEnv: string
  /** Name of the env var holding the client secret. */
  clientSecretEnv: string
  /** Extra static params some providers require on the authorize URL. */
  extraAuthParams?: Record<string, string>
}

export const OAUTH_PROVIDERS: Record<ProviderId, ProviderConfig> = {
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: 'openid profile email',
    clientIdEnv: 'LINKEDIN_CLIENT_ID',
    clientSecretEnv: 'LINKEDIN_CLIENT_SECRET',
  },
  upwork: {
    id: 'upwork',
    label: 'Upwork',
    authorizeUrl: 'https://www.upwork.com/ab/account-security/oauth2/authorize',
    tokenUrl: 'https://www.upwork.com/api/v3/oauth2/token',
    scopes: '',
    clientIdEnv: 'UPWORK_CLIENT_ID',
    clientSecretEnv: 'UPWORK_CLIENT_SECRET',
  },
  // Fiverr & Malt have no public OAuth product yet — listed so the UI can show
  // them, but `connect` will return ?error=config until real endpoints + creds
  // are provided. Update authorizeUrl/tokenUrl/scopes when available.
  fiverr: {
    id: 'fiverr',
    label: 'Fiverr',
    authorizeUrl: '',
    tokenUrl: '',
    scopes: '',
    clientIdEnv: 'FIVERR_CLIENT_ID',
    clientSecretEnv: 'FIVERR_CLIENT_SECRET',
  },
  malt: {
    id: 'malt',
    label: 'Malt',
    authorizeUrl: '',
    tokenUrl: '',
    scopes: '',
    clientIdEnv: 'MALT_CLIENT_ID',
    clientSecretEnv: 'MALT_CLIENT_SECRET',
  },
}

/** Returns the provider config only if `id` is in the allowlist, else null. */
export function getProvider(id: string): ProviderConfig | null {
  return (OAUTH_PROVIDERS as Record<string, ProviderConfig>)[id] ?? null
}

/** Reads the client credentials for a provider from the environment. */
export function getProviderCredentials(provider: ProviderConfig): {
  clientId?: string
  clientSecret?: string
} {
  return {
    clientId: process.env[provider.clientIdEnv],
    clientSecret: process.env[provider.clientSecretEnv],
  }
}

/** Returns true only if the provider is fully configured (endpoints + creds). */
export function isProviderConfigured(provider: ProviderConfig): boolean {
  const { clientId, clientSecret } = getProviderCredentials(provider)
  return Boolean(provider.authorizeUrl && provider.tokenUrl && clientId && clientSecret)
}

/**
 * Builds the OAuth redirect_uri. MUST be identical in connect + callback and
 * MUST match the value registered in the provider portal exactly.
 *
 * Result === `${NEXT_PUBLIC_SITE_URL}/api/platforms/${provider}/callback`
 * with no trailing slash. If NEXT_PUBLIC_SITE_URL is missing or malformed,
 * falls back strictly to 'http://localhost:3000'.
 */
export function buildRedirectUri(providerId: ProviderId): string {
  const FALLBACK = 'http://localhost:3000'
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  let base = FALLBACK
  if (raw) {
    try {
      // new URL(...).origin normalizes scheme://host:port and strips any
      // accidental trailing slash or path. Throws on malformed input.
      base = new URL(raw).origin
    } catch {
      base = FALLBACK
    }
  }

  return `${base}/api/platforms/${providerId}/callback`
}

/** Cookie name holding the per-flow CSRF state token. */
export const OAUTH_STATE_COOKIE = 'voraly_oauth_state'
