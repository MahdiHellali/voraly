// ─── Voraly · Integrations · OAuth registry ───────────────────────────────────
// Single source of truth pour les intégrations agenda/outils (Google Calendar,
// Notion). Calqué sur @/lib/oauth/providers.ts — même structure, namespacing
// distinct (INTEGRATION_STATE_COOKIE, buildIntegrationRedirectUri, etc.).
//
// Secrets : jamais stockés ici — seuls les NOMS des env vars sont référencés.
// Lecture depuis process.env[clientIdEnv] côté serveur uniquement.
// ─────────────────────────────────────────────────────────────────────────────

import { getSiteOrigin } from '@/lib/oauth/providers'

export type IntegrationId = 'google_calendar' | 'notion'

export interface IntegrationProviderConfig {
  id: IntegrationId
  label: string
  /** Provider's OAuth 2.0 authorization endpoint. */
  authorizeUrl: string
  /** Provider's OAuth 2.0 token endpoint (code → tokens exchange). */
  tokenUrl: string
  /** Space-delimited scopes requested. Empty string = provider doesn't use scope param. */
  scopes: string
  /** Name of the env var holding the client id. */
  clientIdEnv: string
  /** Name of the env var holding the client secret. */
  clientSecretEnv: string
  /** Extra static params some providers require on the authorize URL. */
  extraAuthParams?: Record<string, string>
  /** Short description shown in the UI. */
  description: string
  /** Tailwind color class for icon accent. */
  iconColor: string
}

export const INTEGRATION_PROVIDERS: Record<IntegrationId, IntegrationProviderConfig> = {
  google_calendar: {
    id: 'google_calendar',
    label: 'Google Calendar',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: 'https://www.googleapis.com/auth/calendar.events.readonly',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
    clientSecretEnv: 'GOOGLE_CLIENT_SECRET',
    // access_type=offline + prompt=consent : indispensable pour obtenir un refresh_token
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    description: 'Synchronisez vos deadlines et livraisons client depuis Google Calendar.',
    iconColor: 'text-indigo-300',
  },
  notion: {
    id: 'notion',
    label: 'Notion',
    authorizeUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    // Notion n'utilise pas le paramètre scope
    scopes: '',
    clientIdEnv: 'NOTION_CLIENT_ID',
    clientSecretEnv: 'NOTION_CLIENT_SECRET',
    extraAuthParams: { owner: 'user' },
    description: 'Importez vos projets et livrables depuis Notion.',
    iconColor: 'text-zinc-300',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the provider config only if `id` is in the allowlist, else null. */
export function getIntegrationProvider(id: string): IntegrationProviderConfig | null {
  return (INTEGRATION_PROVIDERS as Record<string, IntegrationProviderConfig>)[id] ?? null
}

/** Reads the client credentials for an integration provider from the environment. */
export function getIntegrationCredentials(provider: IntegrationProviderConfig): {
  clientId?: string
  clientSecret?: string
} {
  return {
    clientId: process.env[provider.clientIdEnv],
    clientSecret: process.env[provider.clientSecretEnv],
  }
}

/** Returns true only if the provider is fully configured (endpoints + creds). */
export function isIntegrationConfigured(provider: IntegrationProviderConfig): boolean {
  const { clientId, clientSecret } = getIntegrationCredentials(provider)
  return Boolean(provider.authorizeUrl && provider.tokenUrl && clientId && clientSecret)
}

/**
 * Builds the OAuth redirect_uri for integrations.
 * Result === `${NEXT_PUBLIC_SITE_URL}/api/integrations/${id}/callback`
 * Utilise getSiteOrigin (jamais request.origin) — cf. LRN-005.
 */
export function buildIntegrationRedirectUri(id: IntegrationId): string {
  return `${getSiteOrigin()}/api/integrations/${id}/callback`
}

/**
 * Dérive le statut UI à partir de la configuration effective :
 * - 'connect'  → provider configuré (creds env présents)
 * - 'soon'     → creds manquants
 */
export function getIntegrationStatus(provider: IntegrationProviderConfig): 'connect' | 'soon' {
  return isIntegrationConfigured(provider) ? 'connect' : 'soon'
}

/** Cookie name holding the per-flow CSRF state token for integrations. */
export const INTEGRATION_STATE_COOKIE = 'voraly_integration_oauth_state'
