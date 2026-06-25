// ─── Voraly Sync Engine · Logger interne ──────────────────────────────────────
// Logs explicites MAIS sans données sensibles : ni token, ni earnings bruts.
// Tout passe par ici pour garantir le masquage.

const PREFIX = '[Voraly]'

/** Masque un token : ne révèle que les 4 premiers caractères. */
export function maskToken(token) {
  if (!token || typeof token !== 'string') return '<none>'
  return token.slice(0, 4) + '…(' + token.length + ')'
}

/** Indique seulement la PRÉSENCE de métriques, jamais les valeurs. */
export function describeMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return '<none>'
  return Object.keys(metrics).join(',') || '<empty>'
}

export const log = (...args) => console.log(PREFIX, ...args)
export const warn = (...args) => console.warn(PREFIX, ...args)
export const error = (...args) => console.error(PREFIX, ...args)
