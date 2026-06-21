'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { LiquidButton } from '@/components/ui/liquid-glass-button'
import PublicNav from '@/components/landing/PublicNav'
import PublicFooter from '@/components/landing/PublicFooter'

export default function ContactPage() {
  const t = useTranslations('contactPage')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
      }
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
          {t('eyebrow')}
        </p>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {t('titleLead')}{' '}
          <span className="gradient-text">{t('titleAccent')}</span>
        </h1>
        <p className="text-base text-zinc-400">
          {t('subtitle')}
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
                <h2 className="text-xl font-bold text-white">{t('sentTitle')}</h2>
                <p className="text-sm text-zinc-400">
                  {t('sentBody', { name })}
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
                  {t('sendAnother')}
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
                    {t('nameLabel')}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    placeholder={t('namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-email" className="text-xs font-semibold text-zinc-400">
                    {t('emailLabel')}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="contact-message" className="text-xs font-semibold text-zinc-400">
                    {t('messageLabel')}
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder={t('messagePlaceholder')}
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
                    {t('errorPrefix')}{' '}
                    <a href="mailto:contact@voraly.net" className="underline">
                      contact@voraly.net
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
                  {status === 'sending' ? t('sending') : t('send')}
                </LiquidButton>

                <p className="text-center text-xs text-zinc-600">
                  {t('directPrefix')}{' '}
                  <a
                    href="mailto:contact@voraly.net"
                    className="text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
                  >
                    contact@voraly.net
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
