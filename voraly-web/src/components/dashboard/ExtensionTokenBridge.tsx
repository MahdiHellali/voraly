'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Émet le JWT Supabase de la session courante vers l'extension Voraly (via le
 * content script voraly-bridge.js → service worker), afin que l'extension puisse
 * appeler le backend en `Authorization: Bearer <token>` (register connexion,
 * sync métriques). Sans ça, l'extension n'a aucun token → tous les appels
 * backend échouent en `no_token` et aucune ligne platform_connections n'est
 * créée (dashboard bloqué sur l'empty state / compteur 0/4).
 *
 * On NE transmet QUE l'access_token (court, faible surface). Le refresh_token
 * n'est jamais envoyé : au renouvellement, onAuthStateChange ré-émet le nouveau
 * token. Rien n'est rendu (composant invisible).
 */
export function ExtensionTokenBridge() {
  useEffect(() => {
    const supabase = createClient()
    const origin = window.location.origin

    function emit(accessToken?: string | null, expiresAt?: number | null) {
      if (!accessToken) return
      window.postMessage(
        {
          type: 'VORALY_AUTH_TOKEN',
          token: accessToken,
          // expiresAt (epoch s) → ISO ; le SW garde la date pour ignorer un token expiré.
          expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
        },
        origin,
      )
    }

    // Émission initiale de la session courante.
    supabase.auth.getSession().then(({ data: { session } }) => {
      emit(session?.access_token, session?.expires_at)
    })

    // Ré-émission au refresh / (re)connexion pour ne jamais laisser un token périmé.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      emit(session?.access_token, session?.expires_at)
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
