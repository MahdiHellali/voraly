"use client"

import { useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { LayoutDashboard, Sparkles, Plug, ArrowRight, Check } from "lucide-react"

// ── Animation ─────────────────────────────────────────────────────────────────

const blurReveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

// ── Waitlist form (inline, minimal) ───────────────────────────────────────────

function WaitlistInline() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 glass rounded-full px-6 py-4"
      >
        <Check size={18} className="text-violet-400 shrink-0" />
        <span className="text-sm text-zinc-300">You&apos;re on the list. We&apos;ll be in touch.</span>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass flex rounded-full p-1 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 bg-transparent px-5 py-3 text-sm text-white placeholder:text-zinc-500 outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-6 py-3 text-sm font-semibold text-white transition-colors"
      >
        {loading ? "..." : "Join"}
      </button>
    </form>
  )
}

// ── Feature card (compact) ────────────────────────────────────────────────────

function Feature({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={delay}
      className="glass rounded-2xl p-6"
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}

// ── Step ──────────────────────────────────────────────────────────────────────

function Step({
  num,
  title,
  desc,
  delay,
}: {
  num: string
  title: string
  desc: string
  delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={delay}
      className="flex gap-4"
    >
      <span className="gradient-text text-2xl font-extrabold shrink-0 w-8">{num}</span>
      <div>
        <h3 className="text-base font-semibold mb-1">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function TestPage() {
  return (
    <>
      <main className="h-dvh overflow-y-auto" id="main-content">
        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06] backdrop-blur-xl">
          <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-4">
            <span className="text-lg font-extrabold tracking-tight gradient-text">
              Voraly
            </span>
            <a
              href="#join"
              className="rounded-full bg-violet-600 hover:bg-violet-500 px-5 py-2 text-sm font-semibold text-white transition-colors"
            >
              Join Waitlist
            </a>
          </div>
        </nav>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center pt-16">
          <div className="flex max-w-3xl flex-col items-center gap-5 sm:gap-7">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/8 px-4 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-violet-300">
                Private Beta
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={0}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-[-0.03em] leading-[1.08]"
            >
              Your freelance business,{" "}
              <span className="gradient-text">finally under control.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={1}
              className="max-w-lg text-base sm:text-lg text-zinc-400 leading-relaxed"
            >
              Centralize your platforms, let AI build your growth roadmap, and never miss a deadline.
            </motion.p>

            {/* Waitlist */}
            <motion.div
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={2}
              className="w-full flex justify-center"
            >
              <WaitlistInline />
            </motion.div>

            {/* Microcopy */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={3}
              className="text-xs text-zinc-600"
            >
              Free during beta · No credit card · 2-minute setup
            </motion.p>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-4xl px-6 py-24 md:py-36" id="features">
          <div className="grid gap-4 sm:grid-cols-3">
            <Feature
              icon={<LayoutDashboard size={18} />}
              title="Unified Dashboard"
              desc="All your platforms on one screen — revenue, projects, and messages in real time."
              delay={0}
            />
            <Feature
              icon={<Sparkles size={18} />}
              title="AI Roadmap"
              desc="Personalized growth plan based on your profile, rates, and market data."
              delay={0.3}
            />
            <Feature
              icon={<Plug size={18} />}
              title="Full Sync"
              desc="Connect Upwork, Fiverr, Malt, and LinkedIn in 2 minutes. No manual entry."
              delay={0.6}
            />
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-2xl px-6 py-24 md:py-36">
          <motion.p
            variants={blurReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            custom={0}
            className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400 mb-10 text-center"
          >
            How it works
          </motion.p>
          <div className="flex flex-col gap-8">
            <Step
              num="01"
              title="Connect your platforms"
              desc="Link Upwork, Fiverr, Malt, and LinkedIn. Takes less than 2 minutes — we never see your passwords."
              delay={0.2}
            />
            <Step
              num="02"
              title="AI builds your roadmap"
              desc="Voraly analyzes your history and market to create a personalized growth strategy."
              delay={0.5}
            />
            <Step
              num="03"
              title="Grow on autopilot"
              desc="Follow your plan, track deadlines, and let Voraly handle the rest."
              delay={0.8}
            />
          </div>
        </section>

        {/* ── RESOURCES ─────────────────────────────────────────────────── */}
        <section className="mx-auto max-w-2xl px-6 py-24 md:py-36 text-center">
          <motion.div
            variants={blurReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="glass-hero rounded-3xl p-10 md:p-14 relative overflow-hidden"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.1) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                Free eBook
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em]">
                The Guide to{" "}
                <span className="gradient-text">Scaling Beyond $5K/month</span>
              </h2>
              <p className="max-w-md text-sm text-zinc-400 leading-relaxed">
                Positioning, pricing, platform strategy. Everything we wish we knew when we started.
              </p>
              <a
                href="#join"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all mt-2"
              >
                Get it free <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.05] py-8 px-6">
          <div className="mx-auto max-w-4xl flex items-center justify-between">
            <span className="text-sm font-bold gradient-text">Voraly</span>
            <span className="text-xs text-zinc-600">© 2026</span>
          </div>
        </footer>
      </main>
    </>
  )
}
