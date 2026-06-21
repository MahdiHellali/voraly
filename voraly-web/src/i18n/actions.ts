'use server'

import { cookies } from 'next/headers'
import { LOCALE_COOKIE, isLocale, type Locale } from './config'

/**
 * Server Action : enregistre la langue choisie dans un cookie.
 *
 * Sécurité : on valide strictement la valeur contre la liste des locales
 * supportées avant écriture — jamais de valeur brute issue du client dans
 * le cookie. Cookie non sensible (pas httpOnly nécessaire) mais en
 * SameSite=Lax + secure en prod.
 */
export async function setUserLocale(locale: Locale): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false }

  const cookieStore = await cookies()
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return { ok: true }
}
