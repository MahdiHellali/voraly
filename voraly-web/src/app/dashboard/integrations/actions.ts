'use server'

import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = ['Idée', 'En cours', 'Rédigé', 'Publié'] as const
type NotionStatus = (typeof ALLOWED_STATUSES)[number]

// Met a jour la propriete Statut d'une entree dans le calendrier editorial Voraly.
// user_id derive de la session (jamais du body). Token Notion lu via RLS.
export async function updateNotionEventStatus(
  notionPageId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  // Valider le statut (whitelist) avant tout appel reseau
  if (!ALLOWED_STATUSES.includes(status as NotionStatus)) {
    return { ok: false, error: 'invalid_status' }
  }
  // Valider le format de l'ID Notion (UUID sans tirets ou avec)
  if (!/^[0-9a-f-]{32,36}$/i.test(notionPageId)) {
    return { ok: false, error: 'invalid_page_id' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthenticated' }

  const { data: conn } = await supabase
    .from('integration_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'notion')
    .single()

  if (!conn?.access_token) return { ok: false, error: 'no_notion_token' }

  const res = await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${conn.access_token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      properties: {
        Statut: { select: { name: status } },
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[notion:updateStatus] failed', res.status, body.slice(0, 200))
    return { ok: false, error: 'notion_api_error' }
  }

  return { ok: true }
}
