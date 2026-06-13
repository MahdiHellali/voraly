'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProvider } from '@/lib/oauth/providers'
import { getIntegrationProvider } from '@/lib/integrations/providers'

// Server Action: disconnect a platform (delete the stored tokens).
// Security: authenticated session required; RLS + the explicit user_id filter
// ensure a user can only ever delete their own connection.
export async function disconnectPlatform(formData: FormData) {
  const providerId = String(formData.get('provider') ?? '')

  const provider = getProvider(providerId)
  if (!provider) {
    redirect('/dashboard/platforms?error=unknown_provider')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('platform_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('platform_name', provider.id)

  if (error) {
    console.error(`[oauth:${provider.id}] disconnect failed`, error)
    redirect('/dashboard/platforms?error=disconnect_failed')
  }

  revalidatePath('/dashboard/platforms')
  redirect(`/dashboard/platforms?success=disconnected&platform=${provider.id}`)
}

// Server Action: disconnect an integration (Google Calendar, Notion).
// Security: authenticated session required; RLS + explicit user_id ensure a user
// can only ever delete their own integration_connections row.
export async function disconnectIntegration(formData: FormData) {
  const providerId = String(formData.get('provider') ?? '')

  const provider = getIntegrationProvider(providerId)
  if (!provider) {
    redirect('/dashboard/platforms?error=unknown_provider')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('integration_connections')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider.id)

  if (error) {
    console.error(`[integration:${provider.id}] disconnect failed`, error)
    redirect('/dashboard/platforms?error=disconnect_failed')
  }

  revalidatePath('/dashboard/platforms')
  redirect(`/dashboard/platforms?success=disconnected&platform=${provider.id}`)
}
