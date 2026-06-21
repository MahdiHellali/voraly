import { getRequestConfig } from 'next-intl/server'
import { getUserLocale } from './locale'

/**
 * Configuration de requête next-intl (mode sans routing par URL).
 * La langue vient du cookie/Accept-Language via getUserLocale ; les messages
 * sont chargés depuis messages/<locale>.json.
 */
export default getRequestConfig(async () => {
  const locale = await getUserLocale()

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
