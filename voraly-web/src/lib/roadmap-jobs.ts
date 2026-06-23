// Suivi en mémoire de l'état des générations de roadmap (asynchrones via after()).
// Mono-conteneur web, même hypothèse que rate-limit.ts / freeQuota : l'état module
// est partagé entre requêtes et réinitialisé au redéploiement. Une génération en
// cours pendant un redéploiement perd son statut -> le front, qui poll, bascule en
// erreur après son timeout (cas rare, acceptable).

export type RoadmapJobStatus = 'pending' | 'done' | 'error'

type Job = { status: RoadmapJobStatus; error?: string; updatedAt: number }

const jobs = new Map<string, Job>()

const JOB_TTL_MS = 15 * 60_000
const PRUNE_INTERVAL_MS = 60_000
let lastPrune = 0

function prune(now: number): void {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return
  lastPrune = now
  for (const [key, job] of jobs) {
    if (now - job.updatedAt > JOB_TTL_MS) jobs.delete(key)
  }
}

export function setJobStatus(userId: string, status: RoadmapJobStatus, error?: string): void {
  const now = Date.now()
  prune(now)
  jobs.set(userId, { status, error, updatedAt: now })
}

/** Renvoie le job courant de l'utilisateur, ou null si aucun (ex. perdu au redéploiement). */
export function getJobStatus(userId: string): Job | null {
  prune(Date.now())
  return jobs.get(userId) ?? null
}
