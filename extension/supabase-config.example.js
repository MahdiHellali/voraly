// ─── Voraly · Supabase Configuration (TEMPLATE) ──────────────────────────────
// Copy this file to `supabase-config.js` and fill in your project values.
// `supabase-config.js` is gitignored — it is NOT committed.
//
// Constantes exportées pour les appels fetch() natifs vers l'Edge Function.
// Pas de client Supabase JS — conforme à la CSP stricte de Manifest V3.
// La clé anon est publique par conception ; la sécurité repose sur les
// Row-Level Security policies et la validation côté Edge Function.

export const SUPABASE_URL      = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// URL de l'application web — utilisée pour récupérer le JWT utilisateur.
// En développement local, remplacer par 'http://localhost:3000'.
export const VORALY_APP_URL = 'https://voraly.me';
