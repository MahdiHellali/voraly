const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const JSON_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'] as const
const STREAM_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'] as const
const RETRY_DELAYS = [500, 1500, 4000] // delays between attempts 1→2, 2→3
const JSON_TIMEOUT_MS = 90_000
const STREAM_TIMEOUT_MS = 30_000
const STREAM_ERROR_MSG =
  'Le service IA est temporairement indisponible. Veuillez réessayer dans quelques instants.'

function isRetryable(status: number, body: string): boolean {
  if (status === 429 || status === 503) return true
  return body.includes('UNAVAILABLE') || body.includes('RESOURCE_EXHAUSTED') || body.includes('high demand')
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function withJitter(ms: number): number {
  return ms * (1 + Math.random() * 0.3)
}

// Génère une réponse JSON depuis Gemini avec retry + fallback modèle.
// timeoutMs et primaryMaxAttempts permettent d'adapter le comportement selon le contexte
// (ex : questions avec fallback statique → timeout court, moins de tentatives).
export async function callGeminiJSON({
  system,
  userText,
  timeoutMs = JSON_TIMEOUT_MS,
  primaryMaxAttempts = 3,
}: {
  system: string
  userText: string
  timeoutMs?: number
  primaryMaxAttempts?: number
}): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
  })

  let lastError: unknown

  modelLoop: for (let mi = 0; mi < JSON_MODELS.length; mi++) {
    const model = JSON_MODELS[mi]
    const maxAttempts = mi === 0 ? primaryMaxAttempts : 1
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`

    for (let a = 0; a < maxAttempts; a++) {
      if (a > 0) await sleep(withJitter(RETRY_DELAYS[a - 1]))

      const abort = new AbortController()
      const timer = setTimeout(() => abort.abort(), timeoutMs)

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          cache: 'no-store',
          signal: abort.signal,
        })
        clearTimeout(timer)

        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[]
          }
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (!text) throw new Error(`Gemini ${model}: empty response`)
          return JSON.parse(text)
        }

        const detail = await res.text().catch(() => '')
        if (isRetryable(res.status, detail)) {
          lastError = new Error(`Gemini ${model} ${res.status}`)
          continue // retry same model (or fall through to next after maxAttempts)
        }
        // non-retryable: abandon entirely
        throw new Error(`Gemini ${model} ${res.status}: ${detail.slice(0, 200)}`)
      } catch (err) {
        clearTimeout(timer)
        const isAbort = err instanceof Error && err.name === 'AbortError'
        lastError = err
        if (!isAbort && a < maxAttempts - 1) continue
        // timeout or last attempt: break to next model
        continue modelLoop
      }
    }
    // exhausted attempts on this model
  }

  throw lastError ?? new Error('Gemini: all models exhausted')
}

// Stream token-par-token depuis Gemini (SSE) avec retry + fallback modèle.
// Le ReadableStream expose cancel() pour court-circuiter le retry si le client déconnecte
// avant l'ouverture du stream, évitant les fetch orphelins.
export function streamGemini({
  system,
  contents,
}: {
  system: string
  contents: { role: string; parts: { text: string }[] }[]
}): ReadableStream<Uint8Array> {
  const cancelCtrl = new AbortController()

  return new ReadableStream<Uint8Array>(
    {
      async start(controller) {
        const encoder = new TextEncoder()
        const decoder = new TextDecoder()
        const apiKey = process.env.GEMINI_API_KEY

        if (!apiKey) {
          controller.enqueue(encoder.encode(STREAM_ERROR_MSG))
          controller.close()
          return
        }

        const payload = JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { temperature: 0.8 },
        })

        let res: Response | null = null

        modelLoop: for (let mi = 0; mi < STREAM_MODELS.length; mi++) {
          const model = STREAM_MODELS[mi]
          const maxAttempts = mi === 0 ? 3 : 1
          const url = `${GEMINI_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`

          for (let a = 0; a < maxAttempts; a++) {
            if (cancelCtrl.signal.aborted) break modelLoop
            if (a > 0) {
              await sleep(withJitter(RETRY_DELAYS[a - 1]))
              if (cancelCtrl.signal.aborted) break modelLoop
            }

            const timeoutCtrl = new AbortController()
            const timer = setTimeout(() => timeoutCtrl.abort(), STREAM_TIMEOUT_MS)
            // Propager cancel → timeout pour que fetch reçoive un seul signal
            const onCancel = () => timeoutCtrl.abort()
            cancelCtrl.signal.addEventListener('abort', onCancel, { once: true })

            try {
              const r = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                cache: 'no-store',
                signal: timeoutCtrl.signal,
              })
              if (r.ok && r.body) {
                res = r
                break modelLoop
              }
              const detail = await r.text().catch(() => '')
              if (!isRetryable(r.status, detail)) break modelLoop
              // retryable: continue
            } catch {
              // network/timeout/cancel: retry or next model
            } finally {
              clearTimeout(timer)
              cancelCtrl.signal.removeEventListener('abort', onCancel)
            }
          }
          // exhausted this model
        }

        if (!res?.body || cancelCtrl.signal.aborted) {
          if (!cancelCtrl.signal.aborted) {
            controller.enqueue(encoder.encode(STREAM_ERROR_MSG))
          }
          controller.close()
          return
        }

        const reader = res.body.getReader()
        let buffer = ''
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data:')) continue
              const data = trimmed.slice(5).trim()
              if (!data || data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
                if (typeof text === 'string' && text) controller.enqueue(encoder.encode(text))
              } catch {
                // ligne SSE partielle/non-JSON : ignorée
              }
            }
          }
        } catch (error) {
          console.error('[gemini] stream read failed', error)
          if (!cancelCtrl.signal.aborted) {
            controller.enqueue(encoder.encode(STREAM_ERROR_MSG))
          }
        } finally {
          controller.close()
        }
      },

      cancel() {
        cancelCtrl.abort()
      },
    },
  )
}
