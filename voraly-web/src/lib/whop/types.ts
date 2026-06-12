// ─── Voraly · Whop checkout · shared API contract ────────────────────────────
// Client-safe types (no server imports) shared by /api/checkout and the
// pricing page UI.

/** Success payload returned by POST /api/checkout. */
export interface CheckoutSessionResponse {
  /** Whop checkout configuration id ("ch_…") — passed to WhopCheckoutEmbed. */
  sessionId: string
  /** Whop plan id ("plan_…") — required by WhopCheckoutEmbed. */
  planId: string
}

/** Structured error codes returned by POST /api/checkout. */
export type CheckoutErrorCode =
  | 'unauthorized'
  | 'already_premium'
  | 'not_configured'
  | 'whop_error'

export interface CheckoutErrorResponse {
  error: CheckoutErrorCode
}

/** Metadata key attached to every Voraly checkout configuration. */
export const VORALY_USER_ID_METADATA_KEY = 'voralyUserId'
