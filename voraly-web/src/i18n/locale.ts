import 'server-only'

import { cookies, headers } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale, type Locale } from './config'

/**
 * Détermine la langue de l'utilisateur, côté serveur uniquement.
 *
 * Priorité :
 *   1. Cookie `VORALY_LOCALE` (choix explicite de l'utilisateur).
 *   2. En-tête `Accept-Language` du navigateur (détection au 1er passage).
 *   3. Langue par défaut (fr).
 *
 * Aucune écriture de cookie ici : la détection reste passive tant que
 * l'utilisateur n'a pas choisi (l'écriture se fait via setUserLocale).
 */
export async function getUserLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie

  return detectLocaleFromHeaders(await headers())
}

function detectLocaleFromHeaders(headerStore: Headers): Locale {
  const acceptLanguage = headerStore.get('accept-language')
  if (!acceptLanguage) return DEFAULT_LOCALE

  // Parse "en-US,en;q=0.9,fr;q=0.8" -> [['en-us', 1], ['en', 0.9], ['fr', 0.8]]
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, qPart] = part.trim().split(';q=')
      const quality = qPart ? Number.parseFloat(qPart) : 1
      return { tag: tag.toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality }
    })
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (isLocale(base) && LOCALES.includes(base)) return base
  }

  return DEFAULT_LOCALE
}
