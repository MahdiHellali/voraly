'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, User, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STARTER_PROMPTS = [
  "Donne-moi des idées de posts pour LinkedIn",
  "Comment améliorer mon script de Shorts ?",
  "Quelle stratégie payante pour trouver des clients ?",
  "Aide-moi à affiner mon positionnement",
]

export default function MarketingChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Bonjour ! Je suis votre conseiller marketing IA. Je suis ici pour répondre à vos questions concernant votre stratégie organique, payante, vos scripts de Shorts ou toute autre question liée à la croissance de votre activité freelance. Comment puis-je vous aider aujourd'hui ?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
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

    // apiData est mis à jour dès que la réponse API est parsée,
    // pour pouvoir l'utiliser dans le catch même en cas d'erreur HTTP.
    let apiData: { error?: string; reply?: string } | null = null

    try {
      // Map message history to n8n format
      // n8n chatbot node expects history as an array of messages
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
        throw new Error(apiData?.error || 'Une erreur est survenue.')
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: apiData?.reply || '' },
      ])
    } catch (err: unknown) {
      console.error('[chatbot] failed to get response', err)
      const errMsg = err instanceof Error ? err.message : null
      const errorCode = apiData?.error ?? errMsg
      const friendlyMsg =
        errorCode === 'chatbot_unreachable' || errorCode === 'chatbot_failed'
          ? 'Le conseiller IA est momentanément indisponible. Réessayez dans quelques instants.'
          : errorCode === 'empty_response'
            ? 'Le conseiller n\'a pas pu générer de réponse. Reformulez votre question.'
            : errMsg || 'Impossible de joindre le chatbot.'
      setError(friendlyMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl md:p-6 min-h-[500px] max-h-[600px]">
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
                  "flex items-start gap-3 max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed",
                  isAi
                    ? "mr-auto border border-white/5 bg-white/[0.03] text-zinc-100"
                    : "ml-auto border border-pink-500/20 bg-pink-500/10 text-pink-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs border",
                    isAi
                      ? "border-pink-500/40 bg-pink-500/10 text-pink-300"
                      : "border-white/10 bg-white/10 text-white"
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
          {STARTER_PROMPTS.map((prompt) => (
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
          placeholder="Posez votre question marketing..."
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none backdrop-blur-xl transition-colors placeholder:text-zinc-500 focus:border-pink-500/50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all active:scale-95",
            input.trim() && !isLoading
              ? "border-pink-500/40 bg-pink-500/15 text-pink-100 hover:bg-pink-500/25"
              : "border-white/10 bg-white/5 text-zinc-500 cursor-not-allowed"
          )}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
