'use client'

/**
 * Page Contact — formulaire simple.
 * Backend email non implémenté : le submit déclenche une Server Action
 * no-op qui renvoie un message de confirmation.
 * Pour une vraie implémentation, brancher Resend / nodemailer dans la
 * Server Action `sendContactMessage` (src/app/actions/).
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import PublicNav from '@/components/landing/PublicNav'
import PublicFooter from '@/components/landing/PublicFooter'

// ── Server Action no-op (simulée côté client pour l'instant) ────────────────
// TODO: remplacer par une vraie Server Action qui envoie un email via Resend.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function simulateSend(_formData: { name: string; email: string; message: string }) {
  // Simule un délai réseau
  await new Promise((r) => setTimeout(r, 1200))
  return { ok: true }
}

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('sending')
    try {
      const result = await simulateSend({ name, email, message })
      setStatus(result.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const inputClass =
    'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-600 backdrop-blur-sm transition-colors focus:border-violet-500/40 focus:bg-white/[0.06] focus:outline-none'

  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
          Contact
        </p>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Parlons de{' '}
          <span className="gradient-text">votre activité.</span>
        </h1>
        <p className="text-base text-zinc-400">
          Une question, une suggestion, un bug ? L&apos;équipe Voraly vous répond sous 24 h.
        </p>
      </section>

      {/* Formulaire */}
      <section className="mx-auto max-w-xl px-6 pb-28">
        <div className="glass rounded-3xl p-8">
          <AnimatePresence mode="wait">
            {status === 'sent' ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8 text-center"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10"
                  style={{ boxShadow: '0 0 30px rgba(139,92,246,0.2)' }}
                >
                  <span className="gradient-text text-2xl font-bold">✦</span>
                </div>
                <h2 className="text-xl font-bold text-white">Message envoyé !</h2>
                <p className="text-sm text-zinc-400">
                  Merci {name}. On vous répond sous 24 h.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatus('idle')
                    setName('')
                    setEmail('')
                    setMessage('')
                  }}
                  className="mt-2 text-sm text-violet-400 underline underline-offset-2 hover:text-violet-300"
                >
                  Envoyer un autre message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
                noValidate
              >
                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-name" className="text-xs font-semibold text-zinc-400">
                    Nom
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-email" className="text-xs font-semibold text-zinc-400">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-message" className="text-xs font-semibold text-zinc-400">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="Décrivez votre question ou demande..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className={inputClass}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {status === 'error' && (
                  <p className="text-xs font-medium text-red-400">
                    Une erreur s&apos;est produite. Réessayez ou écrivez-nous directement à{' '}
                    <a href="mailto:hello@voraly.net" className="underline">
                      hello@voraly.net
                    </a>
                    .
                  </p>
                )}

                <LiquidButton
                  type="submit"
                  size="xl"
                  disabled={status === 'sending'}
                  className="w-full rounded-full text-base font-bold text-white disabled:opacity-50"
                >
                  {status === 'sending' ? 'Envoi en cours…' : 'Envoyer'}
                </LiquidButton>

                <p className="text-center text-xs text-zinc-600">
                  Vous pouvez aussi nous écrire directement à{' '}
                  <a
                    href="mailto:hello@voraly.net"
                    className="text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
                  >
                    hello@voraly.net
                  </a>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
