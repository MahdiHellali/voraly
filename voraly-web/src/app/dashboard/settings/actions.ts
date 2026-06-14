'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfileAction(prevState: unknown, formData: FormData) {
  try {
    const fullName = formData.get('fullName')?.toString().trim()
    if (!fullName) {
      return { error: 'Le nom complet ne peut pas être vide.' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.' }
    }

    // Update Auth User metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: fullName }
    })
    if (authError) {
      return { error: `Erreur Auth : ${authError.message}` }
    }

    // Update Profiles Table row
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)
    if (profileError) {
      return { error: `Erreur Profil : ${profileError.message}` }
    }

    revalidatePath('/dashboard/settings')
    return { success: 'Profil mis à jour avec succès.' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

export async function updateNotificationPreferencesAction(prevState: unknown, formData: FormData) {
  try {
    const emailDeadlines = formData.get('emailDeadlines') === 'true'
    const emailOffers = formData.get('emailOffers') === 'true'
    const emailSync = formData.get('emailSync') === 'true'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.' }
    }

    const prefs = {
      email_deadlines: emailDeadlines,
      email_offers: emailOffers,
      email_sync: emailSync,
    }

    // Save in Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { notification_preferences: prefs }
    })
    if (authError) {
      return { error: authError.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: 'Préférences de notifications enregistrées.' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

export async function updatePasswordAction(prevState: unknown, formData: FormData) {
  try {
    const password = formData.get('password')?.toString()
    const confirmPassword = formData.get('confirmPassword')?.toString()

    if (!password || !confirmPassword) {
      return { error: 'Tous les champs sont requis.' }
    }
    if (password !== confirmPassword) {
      return { error: 'Les mots de passe ne correspondent pas.' }
    }
    if (password.length < 6) {
      return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return { error: error.message }
    }

    return { success: 'Mot de passe mis à jour avec succès.' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

export async function disconnectOtherSessionsAction() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) {
      return { error: error.message }
    }
    return { success: 'Toutes les autres sessions ont été déconnectées.' }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

export async function deleteAccountAction() {
  let shouldRedirect = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.' }
    }

    // Sign out first
    await supabase.auth.signOut()

    // Delete user from auth via Admin client
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      return { error: `Erreur de suppression : ${error.message}` }
    }

    shouldRedirect = true
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }

  if (shouldRedirect) {
    redirect('/')
  }
}
