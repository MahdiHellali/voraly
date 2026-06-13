// ─── Voraly · Integrations · Config déclarative ──────────────────────────────
// Analogue à @/lib/oauth/providers.ts — liste les intégrations non-plateforme
// (agenda, notes…) et leur statut actuel.
//
// STATUTS :
//   'soon'      → UI inerte (badge "Bientôt"), aucun lien
//   'connect'   → CTA actif vers la route OAuth de connexion
//   'connected' → Intégration active (lu depuis integration_connections)
//
// TODO : quand les flux OAuth seront construits, brancher ici :
//   1. Créer /app/dashboard/integrations/[provider]/connect/route.ts
//      → redirige vers l'URL d'autorisation OAuth du provider
//   2. Créer /app/dashboard/integrations/[provider]/callback/route.ts
//      → échange le code, stocke access_token dans integration_connections
//   3. Passer le statut de 'soon' → 'connect' ci-dessous
// ─────────────────────────────────────────────────────────────────────────────

export type IntegrationStatus = 'soon' | 'connect' | 'connected'

export interface IntegrationProvider {
  /** Identifiant stable, correspond à la colonne `provider` de la table. */
  id: 'google_calendar' | 'notion'
  /** Label affiché dans l'UI. */
  label: string
  /** Statut actuel (hardcodé ici ; le dashboard lit `integration_connections` pour 'connected'). */
  status: IntegrationStatus
  /** Description courte affichée dans l'UI. */
  description: string
  /** Couleur d'accent pour l'icône. */
  iconColor: string
  /**
   * Route de connexion OAuth — null tant que la route n'est pas implémentée.
   * Remplir quand connectRoute = route OAuth réelle.
   */
  connectRoute: string | null
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  {
    id: 'google_calendar',
    label: 'Google Calendar',
    // TODO: passer à 'connect' quand /app/dashboard/integrations/google-calendar/connect/route.ts existe
    status: 'soon',
    description: 'Synchronisez vos deadlines et livraisons client depuis Google Calendar.',
    iconColor: 'text-indigo-300',
    // TODO: brancher la route OAuth réelle
    connectRoute: null,
  },
  {
    id: 'notion',
    label: 'Notion',
    // TODO: passer à 'connect' quand /app/dashboard/integrations/notion/connect/route.ts existe
    status: 'soon',
    description: 'Importez vos projets et livrables depuis Notion.',
    iconColor: 'text-zinc-300',
    // TODO: brancher la route OAuth réelle
    connectRoute: null,
  },
]

/**
 * Renvoie la config d'un provider par son id.
 * Utiliser côté serveur uniquement.
 */
export function getIntegrationProvider(
  id: IntegrationProvider['id'],
): IntegrationProvider | undefined {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id)
}
