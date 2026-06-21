'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Send, Sparkles, User, AlertCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function MarketingChatbot({ isPremium }: { isPremium: boolean }) {
  const router = useRouter()
  const t = useTranslations('roadmap.chatbot')
  const starterPrompts = t.raw('starterPrompts') as string[]
  const proBenefits = t.raw('proBenefits') as string[]
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('welcome'),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userMessageCount, setUserMessageCount] = useState(0)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return

    setError(null)
    const userMessage: Message = { role: 'user', content: textToSend }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    let apiData: { error?: string; reply?: string } | null = null

    try {
      const history = messages.slice(1).map((msg) => ({
        role: msg.role,
        message: msg.content,
      }))

      const res = await fetch('/api/roadmap/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history }),
      })

      apiData = await res.json()

      if (!res.ok) {
        throw new Error(apiData?.error || t('errors.generic'))
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: apiData?.reply || '' },
      ])
      setUserMessageCount((prev) => prev + 1)
    } catch (err: unknown) {
      console.error('[chatbot] failed to get response', err)
      const errMsg = err instanceof Error ? err.message : null
      const errorCode = apiData?.error ?? errMsg
      // free_limit_reached → affiche directement le paywall sans message d'erreur
      if (errorCode === 'free_limit_reached') {
        setUserMessageCount((prev) => prev + 1)
        return
      }
      const friendlyMsg =
        errorCode === 'chatbot_unreachable' || errorCode === 'chatbot_failed'
          ? t('errors.unreachable')
          : errorCode === 'empty_response'
            ? t('errors.empty')
            : errMsg || t('errors.cantReach')
      setError(friendlyMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const showPaywall = !isPremium && userMessageCount >= 1

  return (
    <div className="relative flex flex-col rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-6 min-h-[500px] max-h-[600px]">
      {/* Paywall overlay */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-3xl bg-zinc-950/85 backdrop-blur-xl p-6 text-center"
          >
            {/* Halo décoratif */}
            <div aria-hidden className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
              <div
                className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/4 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,102,204,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }}
              />
            </div>
            <div className="relative z-10 flex flex-col items-center gap-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-pink-400">{t('paywallEyebrow')}</p>
              <h3 className="text-xl font-extrabold tracking-tight text-white">{t('paywallTitle')}</h3>
              <p className="max-w-xs text-sm text-zinc-400">
                {t('paywallBody')}
              </p>
              <ul className="flex flex-col gap-2 text-left">
                {proBenefits.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-zinc-200">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-400 text-[9px]">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <motion.button
                type="button"
                onClick={() => router.push('/pricing')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="mt-1 inline-flex items-center gap-2 rounded-full border border-pink-500/40 bg-pink-500/10 px-7 py-3.5 text-sm font-semibold text-pink-100 backdrop-blur-xl transition-colors hover:bg-pink-500/20"
                style={{ boxShadow: '0 0 28px rgba(255,102,204,0.25)' }}
              >
                {t('upgrade')}
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[380px] scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isAi = msg.role === 'assistant'
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'flex items-start gap-3 max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed',
                  isAi
                    ? 'mr-auto border border-white/5 bg-white/[0.03] text-zinc-100'
                    : 'ml-auto border border-pink-500/20 bg-pink-500/10 text-pink-50',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs border',
                    isAi
                      ? 'border-pink-500/40 bg-pink-500/10 text-pink-300'
                      : 'border-white/10 bg-white/10 text-white',
                  )}
                >
                  {isAi ? <Sparkles size={12} /> : <User size={12} />}
                </div>
                <div className="whitespace-pre-line">{msg.content}</div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-start gap-3 mr-auto border border-white/5 bg-white/[0.03] text-zinc-100 rounded-2xl p-4 text-sm max-w-[85%]">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs border border-pink-500/40 bg-pink-500/10 text-pink-300">
              <Sparkles size={12} />
            </div>
            <div className="flex items-center gap-1.5 py-1">
              <motion.div
                animate={{ scale: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                className="h-2 w-2 rounded-full bg-pink-400"
              />
              <motion.div
                animate={{ scale: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="h-2 w-2 rounded-full bg-pink-400"
              />
              <motion.div
                animate={{ scale: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                className="h-2 w-2 rounded-full bg-pink-400"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Starter Prompts */}
      {messages.length === 1 && !isLoading && (
        <div className="mt-4 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-300 backdrop-blur-xl transition-all hover:border-pink-500/30 hover:bg-pink-500/5 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
        className="mt-4 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder={t('placeholder')}
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none backdrop-blur-xl transition-colors placeholder:text-zinc-500 focus:border-pink-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-95',
            input.trim() && !isLoading
              ? 'border-pink-500/40 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25'
              : 'border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed',
          )}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
