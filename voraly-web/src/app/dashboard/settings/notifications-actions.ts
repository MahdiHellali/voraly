'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface NotificationItem {
  id: string
  title: string
  content: string
  created_at: string
  is_global: boolean
  read: boolean
}

/**
 * Fetches notifications for the authenticated user.
 * Tries the database table first, falls back to auth user_metadata if the tables don't exist.
 */
export async function fetchNotificationsAction(): Promise<{ error?: string; notifications: NotificationItem[] }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.', notifications: [] }
    }

    // 1. Try querying the database notifications table
    const { data: dbNotifs, error: dbError } = await supabase
      .from('notifications')
      .select('id, title, content, is_global, read, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!dbError && dbNotifs) {
      // Fetch user's global notification reads to determine read status of global notifications
      const { data: reads } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id)

      const readIds = new Set(reads?.map(r => r.notification_id) || [])

      const normalizedNotifs: NotificationItem[] = dbNotifs.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        created_at: n.created_at,
        is_global: n.is_global,
        read: n.is_global ? readIds.has(n.id) : n.read
      }))

      return { notifications: normalizedNotifs }
    }

    // 2. Fall back to user_metadata if table doesn't exist
    if (dbError && dbError.message.includes('does not exist')) {
      const metadataNotifs = user.user_metadata?.notifications || []
      return { notifications: metadataNotifs }
    }

    return { error: dbError?.message || 'Une erreur est survenue.', notifications: [] }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg, notifications: [] }
  }
}

/**
 * Broadcasts a global notification to all users.
 * Tries the database table first, falls back to updating user_metadata of all users if the tables don't exist.
 */
export async function broadcastNotificationAction(
  title: string,
  content: string
): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.' }
    }

    // Founder check
    const founderEmails = ['contact@voraly.net', 'hellali.amine@gmail.com']
    if (!founderEmails.includes(user.email || '')) {
      return { error: 'Seul le fondateur de Voraly est autorisé à diffuser des messages.' }
    }

    const admin = createAdminClient()

    // 1. Try to insert into public.notifications table via admin client (bypassing RLS)
    const { error: dbError } = await admin
      .from('notifications')
      .insert({
        title,
        content,
        is_global: true
      })

    if (!dbError) {
      revalidatePath('/dashboard')
      return { success: 'Notification globale diffusée via la base de données.' }
    }

    // 2. Fallback: update user_metadata for all users if table doesn't exist
    if (dbError && dbError.message.includes('does not exist')) {
      const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
      if (listError) {
        return { error: `Erreur de liste d'utilisateurs : ${listError.message}` }
      }

      // Generate random string ID
      const notifId = crypto.randomUUID()
      const newNotif: NotificationItem = {
        id: notifId,
        title,
        content,
        is_global: true,
        read: false,
        created_at: new Date().toISOString()
      }

      for (const u of users) {
        const currentNotifs = u.user_metadata?.notifications || []
        const updatedNotifs = [newNotif, ...currentNotifs].slice(0, 20) // Keep latest 20
        await admin.auth.admin.updateUserById(u.id, {
          user_metadata: {
            ...u.user_metadata,
            notifications: updatedNotifs
          }
        })
      }

      revalidatePath('/dashboard')
      return { success: 'Notification globale diffusée aux métadonnées de tous les utilisateurs.' }
    }

    return { error: dbError.message }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

/**
 * Marks all notifications as read for the user.
 */
export async function markAllNotificationsReadAction(): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.' }
    }

    // 1. Try DB first
    // For personal notifications, set read = true
    const { error: dbError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)

    // For global notifications, get all global notification IDs and insert into notification_reads
    const { data: globalNotifs } = await supabase
      .from('notifications')
      .select('id')
      .eq('is_global', true)

    if (globalNotifs && globalNotifs.length > 0) {
      const readsToInsert = globalNotifs.map(gn => ({
        user_id: user.id,
        notification_id: gn.id
      }))
      await supabase.from('notification_reads').upsert(readsToInsert)
    }

    if (!dbError) {
      revalidatePath('/dashboard')
      return { success: 'Notifications marquées comme lues.' }
    }

    // 2. Fallback to metadata
    if (dbError && dbError.message.includes('does not exist')) {
      const currentNotifs = user.user_metadata?.notifications || []
      const updatedNotifs = currentNotifs.map((n: NotificationItem) => ({ ...n, read: true }))
      const { error: authError } = await supabase.auth.updateUser({
        data: { notifications: updatedNotifs }
      })
      if (authError) {
        return { error: authError.message }
      }

      revalidatePath('/dashboard')
      return { success: 'Notifications marquées comme lues.' }
    }

    return { error: dbError.message }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

/**
 * Deletes a specific notification.
 */
export async function deleteNotificationAction(id: string): Promise<{ error?: string; success?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Non authentifié.' }
    }

    // 1. Try DB first
    const { error: dbError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (!dbError) {
      revalidatePath('/dashboard')
      return { success: 'Notification supprimée.' }
    }

    // 2. Fallback to metadata
    if (dbError && dbError.message.includes('does not exist')) {
      const currentNotifs = user.user_metadata?.notifications || []
      const updatedNotifs = currentNotifs.filter((n: NotificationItem) => n.id !== id)
      const { error: authError } = await supabase.auth.updateUser({
        data: { notifications: updatedNotifs }
      })
      if (authError) {
        return { error: authError.message }
      }

      revalidatePath('/dashboard')
      return { success: 'Notification supprimée.' }
    }

    return { error: dbError.message }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}

/**
 * Server Action for founder notification form submission.
 */
export async function broadcastNotificationFormAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error?: string; success?: string } | null> {
  try {
    const title = formData.get('broadcastTitle')?.toString()
    const content = formData.get('broadcastContent')?.toString()
    if (!title || !content) {
      return { error: 'Le titre et le message sont obligatoires.' }
    }
    return await broadcastNotificationAction(title, content)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Une erreur inconnue est survenue.'
    return { error: msg }
  }
}
