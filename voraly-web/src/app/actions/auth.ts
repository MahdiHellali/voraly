'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type AuthState = { error?: string; message?: string; mfaRequired?: boolean; factorId?: string } | null

// Supabase returns English errors — map to French
const ERROR_MAP: Record<string, string> = {
  'Invalid login credentials':                          'Email ou mot de passe incorrect.',
  'Email not confirmed':                                'Confirmez votre adresse email avant de vous connecter.',
  'User already registered':                            'Un compte existe déjà avec cet email.',
  'Unable to validate email address: invalid format':   'Format d\'email invalide.',
  'Password should be at least 6 characters':           'Le mot de passe doit contenir au moins 12 caractères.',
  'signup is disabled':                                 'Les inscriptions sont temporairement désactivées.',
  'over_email_send_rate_limit':                         'Trop de tentatives. Veuillez patienter avant de réessayer.',
}

function toFrench(msg: string): string {
  return ERROR_MAP[msg] ?? msg
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email:    (formData.get('email')    as string).trim().toLowerCase(),
    password: (formData.get('password') as string),
  })
  if (error) return { error: toFrench(error.message) }

  // Check if MFA (TOTP) is enrolled and verified for this user
  const { data: mfaData } = await supabase.auth.mfa.listFactors()
  const verifiedFactors = mfaData?.totp?.filter((f: { id: string; status: string }) => f.status === 'verified') || []

  if (verifiedFactors.length > 0) {
    return {
      mfaRequired: true,
      factorId: verifiedFactors[0].id
    }
  }
  
  redirect('/dashboard')
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email    = (formData.get('email')     as string).trim().toLowerCase()
  const password = (formData.get('password')  as string)
  const fullName = (formData.get('full_name') as string).trim()

  if (password.length < 12) {
    return { error: 'Le mot de passe doit contenir au moins 12 caractères.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) return { error: toFrench(error.message) }

  return {
    message: '🎉 Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.',
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
