// Rate-limiting et verrou anti-abus en mémoire (anti-abus quotas Gemini + slots
// 90 s). Même esprit que le quota free du chatbot : un seul conteneur web tourne,
// donc l'état module persiste entre requêtes et se réinitialise au redéploiement
// (acceptable). Pour du multi-instance, migrer vers un store partagé (Phase 3).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const inFlight = new Set<string>()

const PRUNE_INTERVAL_MS = 60_000
let lastPrune = 0

function prune(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
}

/**
 * Compteur à fenêtre fixe par clé. Renvoie allowed=false avec le délai d'attente
 * (en secondes) une fois la limite atteinte sur la fenêtre courante.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  prune(now)
  const bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  bucket.count += 1
  return { allowed: true, retryAfterSec: 0 }
}

/**
 * Verrou « une opération en vol par clé ». Renvoie false si une opération est
 * déjà en cours. Toujours libérer dans un `finally`. L'état étant en mémoire, un
 * crash du process libère le verrou (pas de verrou orphelin).
 */
export function acquireLock(key: string): boolean {
  if (inFlight.has(key)) return false
  inFlight.add(key)
  return true
}

export function releaseLock(key: string): void {
  inFlight.delete(key)
}
