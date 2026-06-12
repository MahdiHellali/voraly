import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PricingExperience from '@/components/pricing/PricingExperience'

export const metadata: Metadata = {
  title: 'Voraly Pro — Tarifs',
  description:
    'Passez à Voraly Pro : roadmaps IA illimitées, optimisation avancée et support prioritaire. Paiement sécurisé, sans quitter l’application.',
}

export default async function PricingPage() {
  // L'état d'authentification et le statut premium sont résolus côté serveur
  // pour que la page s'affiche directement dans le bon état, sans flash.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // La colonne is_premium peut ne pas exister tant que la migration n'a pas
  // tourné : toute erreur de lecture est ignorée et traitée comme « non
  // premium ». Seul un drapeau explicitement vrai active l'état membre Pro.
  let isPremium = false
  if (user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle()
    if (!error) isPremium = Boolean(profile?.is_premium)
  }

  return <PricingExperience isAuthenticated={!!user} isPremium={isPremium} />
}
