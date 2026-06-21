'use client'

import { useState, useTransition, useActionState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  User as UserIcon,
  Bell,
  Shield,
  CreditCard,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  ChevronDown,
  Crown,
  QrCode,
  Languages
} from 'lucide-react'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  updateProfileAction,
  updateNotificationPreferencesAction,
  updatePasswordAction,
  disconnectOtherSessionsAction,
  deleteAccountAction
} from '@/app/dashboard/settings/actions'
import { broadcastNotificationFormAction } from '@/app/dashboard/settings/notifications-actions'

interface SettingsFormProps {
  user: SupabaseUser
  isPremium: boolean
  avatarUrl?: string | null
}

type SectionId = 'profile' | 'notifications' | 'security' | 'founder'

export default function SettingsForm({ user, isPremium, avatarUrl }: SettingsFormProps) {
  const t = useTranslations('dashboard.settings')
  const [activeSection, setActiveSection] = useState<SectionId | null>(null)
  const [isDisconnectPending, startDisconnectTransition] = useTransition()
  const [isDeletePending, startDeleteTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Profile Action State
  const [profileState, profileFormAction, isProfilePending] = useActionState(
    updateProfileAction,
    null
  )

  // Notifications Action State
  const [notifState, notifFormAction, isNotifPending] = useActionState(
    updateNotificationPreferencesAction,
    null
  )

  // Password Action State
  const [pwdState, pwdFormAction, isPwdPending] = useActionState(
    updatePasswordAction,
    null
  )

  // Founder Broadcast Action State
  const [founderState, founderFormAction, isFounderPending] = useActionState(
    broadcastNotificationFormAction,
    null
  )

  const [disconnectResult, setDisconnectResult] = useState<{ success?: string; error?: string } | null>(null)
  const [deleteResult, setDeleteResult] = useState<{ error?: string } | null>(null)

  // 2FA state
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaSetup, setMfaSetup] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null)
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null)
  const [mfaSecret, setMfaSecret] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null)
  const [mfaLoading, setMfaLoading] = useState(false)

  // Avatar upload state
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(avatarUrl ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  // Current user info
  const fullName = user.user_metadata?.full_name?.trim() || user.email?.split('@')[0] || 'Utilisateur'
  const email = user.email ?? ''
  const isFounder = ['contact@voraly.net', 'hellali.amine@gmail.com'].includes(email)
  const notifPrefs = user.user_metadata?.notification_preferences ?? {
    email_deadlines: true,
    email_offers: true,
    email_sync: true,
  }

  const supabase = createClient()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setAvatarError(data.message ?? 'Erreur lors de l\'upload.')
      } else {
        setLocalAvatarUrl(data.url)
      }
    } catch {
      setAvatarError('Impossible d\'uploader la photo.')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Check 2FA (MFA) status on mount
  useEffect(() => {
    async function checkMfa() {
      try {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (!error && data) {
          const verified = data.totp?.some(f => f.status === 'verified')
          setMfaEnabled(Boolean(verified))
        }
      } catch (err) {
        console.error('Error listing MFA factors:', err)
      }
    }
    checkMfa()
  }, [supabase])

  const toggleSection = (id: SectionId) => {
    setActiveSection(prev => (prev === id ? null : id))
  }

  const handleDisconnectOthers = () => {
    setDisconnectResult(null)
    startDisconnectTransition(async () => {
      const result = await disconnectOtherSessionsAction()
      setDisconnectResult(result)
    })
  }

  const handleDeleteAccount = () => {
    setDeleteResult(null)
    startDeleteTransition(async () => {
      const result = await deleteAccountAction()
      if (result?.error) {
        setDeleteResult({ error: result.error })
      }
    })
  }

  // MFA Setup Handlers
  const handleStartMfaSetup = async () => {
    setMfaError(null)
    setMfaSuccess(null)
    setMfaLoading(true)
    try {
      // Clean up any existing unverified factors before starting a new enrollment
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
      if (!listError && factors) {
        const allFactors = [
          ...(factors.totp || []),
          ...(factors.all || [])
        ]
        const uniqueFactors = Array.from(new Map(allFactors.map(f => [f.id, f])).values())
        const unverified = uniqueFactors.filter(f => f.status === 'unverified')
        for (const f of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Voraly',
        friendlyName: email
      })
      if (error) {
        setMfaError(error.message)
      } else if (data) {
        setMfaFactorId(data.id)
        if (data.totp) {
          setMfaQrCode(data.totp.qr_code)
          setMfaSecret(data.totp.secret)
          setMfaSetup(true)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue."
      setMfaError(msg)
    } finally {
      setMfaLoading(false)
    }
  }

  const handleCancelMfaSetup = async () => {
    setMfaSetup(false)
    if (mfaFactorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId: mfaFactorId })
      } catch (err) {
        console.error('Error unenrolling on cancel:', err)
      }
      setMfaFactorId(null)
      setMfaQrCode(null)
      setMfaSecret(null)
    }
  }

  const handleVerifyMfa = async () => {
    if (!mfaFactorId || !mfaCode) return
    setMfaError(null)
    setMfaSuccess(null)
    setMfaLoading(true)
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId
      })
      if (challengeError) {
        setMfaError(challengeError.message)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: mfaCode
      })

      if (verifyError) {
        setMfaError(verifyError.message)
      } else {
        setMfaSuccess('Double authentification (2FA) configurée et activée avec succès !')
        setMfaEnabled(true)
        setMfaSetup(false)
        setMfaCode('')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue."
      setMfaError(msg)
    } finally {
      setMfaLoading(false)
    }
  }

  const handleDisableMfa = async () => {
    setMfaError(null)
    setMfaSuccess(null)
    setMfaLoading(true)
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
      if (listError) {
        setMfaError(listError.message)
        return
      }

      const activeFactor = factors?.totp?.find(f => f.status === 'verified')
      if (!activeFactor) {
        setMfaEnabled(false)
        return
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: activeFactor.id
      })

      if (unenrollError) {
        setMfaError(unenrollError.message)
      } else {
        setMfaSuccess('Double authentification (2FA) désactivée avec succès.')
        setMfaEnabled(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue."
      setMfaError(msg)
    } finally {
      setMfaLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section PROFIL ── */}
      <div className="glass rounded-3xl overflow-hidden border border-white/[0.06] transition-all duration-300">
        <button
          onClick={() => toggleSection('profile')}
          className="w-full p-5 flex items-center justify-between text-left group hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <UserIcon size={16} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-200">Profil</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Informations personnelles et email</div>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform duration-300 ${
              activeSection === 'profile' ? 'rotate-180 text-zinc-300' : 'group-hover:text-zinc-400'
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === 'profile' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-t border-white/[0.06] p-6 bg-white/[0.01]">
                <form action={profileFormAction} className="flex flex-col gap-4 max-w-md">
                  {/* Avatar upload */}
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-violet-500/40 transition-colors" style={{ boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
                        {localAvatarUrl ? (
                          <img src={localAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl font-black text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {fullName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {avatarUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                            <Loader2 size={20} className="animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 border border-zinc-900 flex items-center justify-center">
                        <UserIcon size={12} className="text-white" />
                      </div>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={avatarUploading}
                    />
                    <p className="text-[10px] text-zinc-500">Cliquez pour {localAvatarUrl ? 'changer' : 'ajouter'} votre photo · Max 2 Mo</p>
                    {avatarError && (
                      <p className="text-[11px] text-rose-400 text-center">{avatarError}</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullName" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Nom complet
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      defaultValue={fullName}
                      required
                      className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25 transition-all duration-200"
                    />
                  </div>

                  {/* Email (Readonly) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                      Adresse email (non modifiable)
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-xl px-4 py-3 text-sm text-zinc-500 bg-white/[0.01] border border-white/[0.03] cursor-not-allowed"
                    />
                  </div>

                  {profileState?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 text-xs text-rose-400">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{profileState.error}</span>
                    </div>
                  )}

                  {profileState?.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400">
                      <Check size={14} className="shrink-0" />
                      <span>{profileState.success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProfilePending}
                    className="self-start inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-xs font-semibold text-white hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(139,92,246,0.25)] disabled:opacity-50"
                  >
                    {isProfilePending ? <Loader2 size={13} className="animate-spin" /> : null}
                    Enregistrer les modifications
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section NOTIFICATIONS ── */}
      <div className="glass rounded-3xl overflow-hidden border border-white/[0.06] transition-all duration-300">
        <button
          onClick={() => toggleSection('notifications')}
          className="w-full p-5 flex items-center justify-between text-left group hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Bell size={16} className="text-violet-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-200">Notifications</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Alertes de synchronisation et de deadlines</div>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform duration-300 ${
              activeSection === 'notifications' ? 'rotate-180 text-zinc-300' : 'group-hover:text-zinc-400'
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === 'notifications' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-t border-white/[0.06] p-6 bg-white/[0.01]">
                <form action={notifFormAction} className="flex flex-col gap-5 max-w-md">
                  {/* Preferences Checkboxes */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      Préférences email
                    </label>

                    {/* Checkbox 1 */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="emailDeadlines"
                        value="true"
                        defaultChecked={notifPrefs.email_deadlines}
                        className="mt-1 h-4 w-4 rounded border-white/[0.1] bg-white/[0.05] text-violet-500 focus:ring-violet-500/50"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          Alertes de Deadlines
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Recevez un rappel par email à l&apos;approche de vos livraisons clients.
                        </div>
                      </div>
                    </label>

                    {/* Checkbox 2 */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="emailOffers"
                        value="true"
                        defaultChecked={notifPrefs.email_offers}
                        className="mt-1 h-4 w-4 rounded border-white/[0.1] bg-white/[0.05] text-violet-500 focus:ring-violet-500/50"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          Opportunités d&apos;Offres
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Soyez averti lorsque l&apos;IA trouve de nouveaux axes d&apos;optimisation de revenus.
                        </div>
                      </div>
                    </label>

                    {/* Checkbox 3 */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="emailSync"
                        value="true"
                        defaultChecked={notifPrefs.email_sync}
                        className="mt-1 h-4 w-4 rounded border-white/[0.1] bg-white/[0.05] text-violet-500 focus:ring-violet-500/50"
                      />
                      <div>
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          Rapports de Synchronisation
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Bilan hebdomadaire des synchronisations de vos plateformes.
                        </div>
                      </div>
                    </label>
                  </div>

                  {notifState?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 text-xs text-rose-400">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{notifState.error}</span>
                    </div>
                  )}

                  {notifState?.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400">
                      <Check size={14} className="shrink-0" />
                      <span>{notifState.success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isNotifPending}
                    className="self-start inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-xs font-semibold text-white hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(139,92,246,0.25)] disabled:opacity-50"
                  >
                    {isNotifPending ? <Loader2 size={13} className="animate-spin" /> : null}
                    Enregistrer les préférences
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section SECURITE ── */}
      <div className="glass rounded-3xl overflow-hidden border border-white/[0.06] transition-all duration-300">
        <button
          onClick={() => toggleSection('security')}
          className="w-full p-5 flex items-center justify-between text-left group hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-200">Sécurité</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">Mot de passe, 2FA et sessions actives</div>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-zinc-500 transition-transform duration-300 ${
              activeSection === 'security' ? 'rotate-180 text-zinc-300' : 'group-hover:text-zinc-400'
            }`}
          />
        </button>

        <AnimatePresence initial={false}>
          {activeSection === 'security' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="border-t border-white/[0.06] p-6 bg-white/[0.01] flex flex-col gap-6">
                
                {/* 1. Changer le mot de passe */}
                <form action={pwdFormAction} className="flex flex-col gap-4 max-w-md">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">
                    Changer le mot de passe
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Nouveau mot de passe
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Min. 6 caractères"
                      className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25 transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="confirmPassword" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="Re-saisir le mot de passe"
                      className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25 transition-all duration-200"
                    />
                  </div>

                  {pwdState?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 text-xs text-rose-400">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{pwdState.error}</span>
                    </div>
                  )}

                  {pwdState?.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400">
                      <Check size={14} className="shrink-0" />
                      <span>{pwdState.success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPwdPending}
                    className="self-start inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-xs font-semibold text-white hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(139,92,246,0.25)] disabled:opacity-50"
                  >
                    {isPwdPending ? <Loader2 size={13} className="animate-spin" /> : null}
                    Mettre à jour le mot de passe
                  </button>
                </form>

                <hr className="border-white/[0.06]" />

                {/* 2. Double Authentification (2FA) */}
                <div className="max-w-md flex flex-col gap-4">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">
                      Double Authentification (2FA)
                    </div>
                    <p className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">
                      Sécurisez votre compte en exigeant un code de sécurité à chaque connexion.
                    </p>
                  </div>

                  {mfaError && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 text-xs text-rose-400">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{mfaError}</span>
                    </div>
                  )}

                  {mfaSuccess && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400">
                      <Check size={14} className="shrink-0" />
                      <span>{mfaSuccess}</span>
                    </div>
                  )}

                  {mfaEnabled ? (
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400 w-fit">
                        <Check size={14} />
                        <span>2FA active avec succès (TOTP)</span>
                      </div>
                      <button
                        onClick={handleDisableMfa}
                        disabled={mfaLoading}
                        className="self-start inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] px-6 py-2.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        {mfaLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                        Désactiver la double authentification
                      </button>
                    </div>
                  ) : !mfaSetup ? (
                    <button
                      onClick={handleStartMfaSetup}
                      disabled={mfaLoading}
                      className="self-start inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      {mfaLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                      Configurer la double authentification (2FA)
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                        <QrCode size={16} className="text-indigo-400" />
                        Scannez ce QR Code
                      </div>
                      
                      {mfaQrCode && (
                        <div className="w-48 h-48 bg-white p-3 rounded-2xl flex items-center justify-center mx-auto">
                          <img
                            src={mfaQrCode}
                            alt="QR Code 2FA"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {mfaSecret && (
                        <div className="text-center">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Clé secrète (saisie manuelle)</p>
                          <code className="text-xs text-indigo-300 font-mono select-all mt-1 block tracking-widest">{mfaSecret}</code>
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 mt-2">
                        <label htmlFor="totpCode" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                          Code de validation à 6 chiffres
                        </label>
                        <input
                          id="totpCode"
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[0.3em] font-mono rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25 transition-all duration-200"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleVerifyMfa}
                          disabled={mfaLoading || mfaCode.length !== 6}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2 text-xs font-semibold text-white hover:from-indigo-400 hover:to-violet-400 transition-all duration-200 cursor-pointer disabled:opacity-50"
                        >
                          {mfaLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                          Vérifier et activer
                        </button>
                        <button
                          onClick={handleCancelMfaSetup}
                          className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all duration-200 cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-white/[0.06]" />

                {/* 3. Disconnect other sessions */}
                <div className="max-w-md flex flex-col gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.12em]">
                      Sessions Actives
                    </div>
                    <p className="text-[11.5px] text-zinc-500 mt-1 leading-relaxed">
                      Si vous suspectez un accès non autorisé, déconnectez tous les autres appareils.
                    </p>
                  </div>

                  {disconnectResult?.error && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 text-xs text-rose-400">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{disconnectResult.error}</span>
                    </div>
                  )}

                  {disconnectResult?.success && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400">
                      <Check size={14} className="shrink-0" />
                      <span>{disconnectResult.success}</span>
                    </div>
                  )}

                  <button
                    onClick={handleDisconnectOthers}
                    disabled={isDisconnectPending}
                    className="self-start inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {isDisconnectPending ? <Loader2 size={13} className="animate-spin" /> : null}
                    Déconnecter toutes les autres sessions
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section CONSOLE FONDATEUR (Founder Only) ── */}
      {isFounder && (
        <div className="glass rounded-3xl overflow-hidden border border-amber-500/15 transition-all duration-300">
          <button
            onClick={() => toggleSection('founder')}
            className="w-full p-5 flex items-center justify-between text-left group hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                <Crown size={16} className="text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-200">Console Fondateur</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Diffuser une notification globale à tous les freelances</div>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-zinc-500 transition-transform duration-300 ${
                activeSection === 'founder' ? 'rotate-180 text-zinc-300' : 'group-hover:text-zinc-400'
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {activeSection === 'founder' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="border-t border-white/[0.06] p-6 bg-white/[0.01]">
                  <form action={founderFormAction} className="flex flex-col gap-4 max-w-md">
                    {/* Title */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="broadcastTitle" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Titre de la notification
                      </label>
                      <input
                        id="broadcastTitle"
                        name="broadcastTitle"
                        type="text"
                        required
                        placeholder="Ex: Nouvelle mise à jour du tableau de bord !"
                        className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25 transition-all duration-200"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="broadcastContent" className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Message
                      </label>
                      <textarea
                        id="broadcastContent"
                        name="broadcastContent"
                        required
                        rows={3}
                        placeholder="Ex: Nous venons de déployer la double authentification..."
                        className="w-full rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 bg-white/[0.04] border border-white/[0.08] focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/25 transition-all duration-200"
                      />
                    </div>

                    {founderState?.error && (
                      <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 px-4 py-2.5 text-xs text-rose-400">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{founderState.error}</span>
                      </div>
                    )}

                    {founderState?.success && (
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-2.5 text-xs text-emerald-400">
                        <Check size={14} className="shrink-0" />
                        <span>{founderState.success}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isFounderPending}
                      className="self-start inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-xs font-semibold text-white hover:from-amber-400 hover:to-orange-400 transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(245,158,11,0.25)] disabled:opacity-50"
                    >
                      {isFounderPending ? <Loader2 size={13} className="animate-spin" /> : null}
                      Diffuser la notification
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Section LANGUE ── */}
      <div className="glass rounded-3xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <Languages size={16} className="text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">{t('language.title')}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{t('language.subtitle')}</div>
          </div>
        </div>
        <div className="w-44 flex-shrink-0">
          <LanguageSwitcher variant="inline" />
        </div>
      </div>

      {/* ── Section ABONNEMENT (Lien direct vers tarifs) ── */}
      <Link
        href="/pricing"
        className="glass rounded-3xl p-5 flex items-center justify-between text-left group hover:border-white/20 transition-all duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
            <CreditCard size={16} className="text-pink-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-200">Abonnement</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {isPremium ? 'Plan Pro · Actif à vie' : 'Plan Gratuit · Gérer l\'abonnement'}
            </div>
          </div>
        </div>
        <ChevronRight size={15} className="text-zinc-600 flex-shrink-0 group-hover:text-zinc-400 transition-colors" />
      </Link>

      {/* ── Zone Sensible ── */}
      <div className="glass rounded-3xl p-6 border border-rose-500/15 mt-4 transition-all duration-300">
        <div className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.12em] mb-2">Zone sensible</div>
        <p className="text-[11.5px] text-zinc-500 leading-relaxed mb-4">
          La suppression de compte est irréversible. Toutes vos plateformes connectées, métriques de revenus et roadmaps générées par l&apos;IA seront définitivement détruites.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-[12px] font-semibold text-rose-400 hover:text-rose-350 transition-colors"
          >
            Supprimer mon compte définitivement
          </button>
        ) : (
          <div className="flex flex-col gap-3 max-w-md p-4 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20">
            <div className="text-xs font-semibold text-rose-400 flex items-center gap-2">
              <AlertTriangle size={14} /> Confirmer la suppression ?
            </div>
            
            {deleteResult?.error && (
              <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                {deleteResult.error}
              </div>
            )}

            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeletePending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {isDeletePending ? <Loader2 size={12} className="animate-spin" /> : null}
                Oui, supprimer mon compte
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-all duration-200 cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
