// Configuration i18n partagée (client + serveur).
// Aucune dépendance serveur ici pour rester importable côté client.

export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'

// Nom du cookie portant la langue choisie. Lu/écrit côté serveur uniquement.
export const LOCALE_COOKIE = 'VORALY_LOCALE'

// Libellés affichés dans le sélecteur.
export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value)
}
