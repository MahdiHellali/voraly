// ─── Voraly Sync Engine · Parsers JSON par plateforme ─────────────────────────
// Reçoit le JSON de l'API interne de la plateforme et renvoie les 4 KPIs.
//
// ⚠ STRUCTURES À CONFIRMER : les chemins ci-dessous (`data.xxx`) sont des
// EMPLACEMENTS supposés. À valider en inspectant la vraie réponse JSON
// (DevTools → Network → cliquez la requête earnings → onglet Response).
// Toute valeur introuvable → 0. Si AUCUNE clé attendue n'est présente, on
// considère la réponse non exploitable (probablement une page de login).

/** Coerce en nombre fini >= 0. */
function num(v) {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

const PARSERS = {
  // Exemple supposé : { earnings: { total, pending }, orders: { active }, rating }
  fiverr: (d) => ({
    totalEarnings: num(d?.earnings?.total ?? d?.total_earnings),
    pendingBalance: num(d?.earnings?.pending ?? d?.pending_clearance),
    activeOrders: num(d?.orders?.active ?? d?.active_orders),
    rating: num(d?.rating ?? d?.seller_rating),
  }),
  // Exemple supposé : { totalEarnings, inReview, activeContracts, jss }
  upwork: (d) => ({
    totalEarnings: num(d?.totalEarnings ?? d?.lifetimeBillings),
    pendingBalance: num(d?.inReview ?? d?.pending),
    activeOrders: num(d?.activeContracts ?? d?.activeContractsCount),
    rating: num(d?.jss ?? d?.jobSuccessScore),
  }),
  // Exemple supposé : { revenue: { total, pending }, missions: { active }, score }
  malt: (d) => ({
    totalEarnings: num(d?.revenue?.total ?? d?.totalRevenue),
    pendingBalance: num(d?.revenue?.pending ?? d?.pendingRevenue),
    activeOrders: num(d?.missions?.active ?? d?.activeMissions),
    rating: num(d?.score ?? d?.rating),
  }),
}

/**
 * @returns {object|null} les 4 KPIs, ou null si la réponse n'est pas exploitable
 *   (aucune des clés attendues présente → probablement non authentifié).
 */
export function parseMetrics(platform, data) {
  const parse = PARSERS[platform]
  if (!parse || !data || typeof data !== 'object') return null
  let m
  try {
    m = parse(data)
  } catch {
    return null
  }
  // Si tout est à 0, on ne peut pas distinguer « vraiment 0 » d'une réponse
  // vide/login. On exige qu'au moins une clé brute attendue ait existé.
  const looksAuthenticated = JSON.stringify(data).length > 2 // pas "{}"
  if (!looksAuthenticated) return null
  return m
}
