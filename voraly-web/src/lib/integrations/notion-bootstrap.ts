import 'server-only'

const NOTION_V = '2022-06-28'
// Titre de la page racine créée dans le workspace de l'utilisateur
const VORALY_PAGE_TITLE = 'Voraly'
// Titre de la base de données calendrier editorial (doit contenir "Voraly" pour le search)
const VORALY_DB_TITLE = 'Voraly Calendrier Editorial'

// Crée les en-têtes Notion avec le token fourni
function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_V,
  }
}

// Crée la page "Voraly" dans le workspace de l'utilisateur avec une base de données
// calendrier editorial embarquée. Idempotent : skip si la page existe déjà.
// Best-effort : les erreurs sont loggées mais ne bloquent pas la connexion OAuth.
export async function bootstrapNotionVoralyCalendar(accessToken: string): Promise<void> {
  const h = headers(accessToken)

  // 1. Vérifier si la page "Voraly" existe déjà
  const searchRes = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      query: VORALY_PAGE_TITLE,
      filter: { property: 'object', value: 'page' },
      page_size: 20,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })

  if (searchRes.ok) {
    const { results = [] } = (await searchRes.json()) as {
      results: Array<{
        properties?: Record<string, { type?: string; title?: Array<{ plain_text?: string }> }>
      }>
    }
    const alreadyExists = results.some((r) =>
      Object.values(r.properties ?? {}).some(
        (p) =>
          p.type === 'title' && p.title?.some((t) => t.plain_text === VORALY_PAGE_TITLE),
      ),
    )
    if (alreadyExists) return
  }

  // 2. Créer la page racine "Voraly"
  const pageRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      parent: { workspace: true },
      icon: { type: 'emoji', emoji: '📅' },
      properties: {
        title: [{ type: 'text', text: { content: VORALY_PAGE_TITLE } }],
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })

  if (!pageRes.ok) {
    const body = await pageRes.text()
    throw new Error(`Notion page creation failed ${pageRes.status}: ${body.slice(0, 300)}`)
  }

  const { id: pageId } = (await pageRes.json()) as { id: string }

  // 3. Créer la base de données calendrier editorial dans la page
  const dbRes = await fetch('https://api.notion.com/v1/databases', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: pageId },
      icon: { type: 'emoji', emoji: '📋' },
      is_inline: true,
      title: [{ type: 'text', text: { content: VORALY_DB_TITLE } }],
      properties: {
        // Propriété titre requise (premier champ = nom de la card)
        Nom: { title: {} },
        // Propriété date utilisée par le dashboard Voraly pour afficher l'événement
        'Date de publication': { date: {} },
        Statut: {
          select: {
            options: [
              { name: 'Idée', color: 'gray' },
              { name: 'En cours', color: 'yellow' },
              { name: 'Rédigé', color: 'blue' },
              { name: 'Publié', color: 'green' },
            ],
          },
        },
        Type: {
          select: {
            options: [
              { name: 'Blog', color: 'purple' },
              { name: 'Réseau social', color: 'pink' },
              { name: 'Newsletter', color: 'orange' },
              { name: 'Vidéo', color: 'red' },
            ],
          },
        },
        Notes: { rich_text: {} },
      },
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  })

  if (!dbRes.ok) {
    const body = await dbRes.text()
    throw new Error(`Notion database creation failed ${dbRes.status}: ${body.slice(0, 300)}`)
  }
}
