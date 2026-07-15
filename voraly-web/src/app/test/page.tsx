"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import {
  LayoutDashboard,
  Sparkles,
  Plug,
  CalendarClock,
  BookOpen,
  Mail,
  ChevronRight,
  Check,
  ArrowRight,
} from "lucide-react"

// ── Animation variants ────────────────────────────────────────────────────────

const blurReveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const fadeIn = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

// ── Section wrapper with parallax glow ────────────────────────────────────────

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const glowY = useTransform(scrollYProgress, [0, 1], [60, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  return (
    <section ref={ref} id={id} className={`relative overflow-hidden ${className}`}>
      {/* Parallax glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
          y: glowY,
          opacity,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(70px)",
          y: useTransform(scrollYProgress, [0, 1], [-30, 40]),
          opacity,
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-32">
        {children}
      </div>
    </section>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div ref={ref} className="mb-14 flex flex-col items-center gap-4 text-center">
      <motion.p
        variants={blurReveal}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        custom={0}
        className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={blurReveal}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        custom={1}
        className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={blurReveal}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={2}
          className="max-w-xl text-base text-zinc-400"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

// ── Feature Card ──────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
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
      className="group glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15]"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-bold">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </motion.div>
  )
}

// ── Blog Card ─────────────────────────────────────────────────────────────────

function BlogCard({
  title,
  excerpt,
  date,
  tag,
  delay,
}: {
  title: string
  excerpt: string
  date: string
  tag: string
  delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.article
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={delay}
      className="glass rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15] cursor-pointer group"
    >
      <span className="inline-block rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400 mb-4">
        {tag}
      </span>
      <h3 className="mb-2 text-lg font-bold group-hover:text-violet-300 transition-colors">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-zinc-400 mb-4">{excerpt}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-600">{date}</span>
        <span className="text-violet-400 text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Read more <ArrowRight size={14} />
        </span>
      </div>
    </motion.article>
  )
}

// ── Waitlist Form ─────────────────────────────────────────────────────────────

function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || loading) return
    setLoading(true)
    // Simulate API call — replace with real endpoint later
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20">
          <Check size={28} className="text-violet-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">You&apos;re on the list!</h3>
        <p className="text-zinc-400 text-sm">
          We&apos;ll let you know as soon as Voraly launches. Early access members get priority onboarding.
        </p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-1 flex gap-0 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="flex-1 bg-transparent px-5 py-4 text-sm text-white placeholder:text-zinc-500 outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="m-1 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-5 py-3 text-sm font-semibold text-white transition-colors flex items-center gap-2"
      >
        {loading ? "Joining..." : "Join"}
        {!loading && <ArrowRight size={16} />}
      </button>
    </form>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────

export default function TestPage() {
  return (
    <div className="bg-zinc-950 text-white min-h-dvh">
      {/* Scroll container */}
      <main className="h-dvh overflow-y-auto" id="main-content">
        {/* ── NAV ────────────────────────────────────────────────────────── */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06] backdrop-blur-xl">
          <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
            <span className="text-lg font-extrabold tracking-tight">
              <span className="gradient-text">Voraly</span>
            </span>
            <a
              href="#waitlist"
              className="rounded-full bg-violet-600 hover:bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Join Waitlist
            </a>
          </div>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center pt-20">
          {/* Background gradient */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 50% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10 flex max-w-4xl flex-col items-center gap-6 sm:gap-8">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: "blur(10px)", scale: 0.95 }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-block rounded-full border border-violet-500/30 bg-violet-500/8 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 backdrop-blur-sm">
                🚀 Now in Private Beta
              </span>
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-balance text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]"
            >
              Your freelance business,{" "}
              <br className="hidden sm:block" />
              <span className="gradient-text">finally under control.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={2}
              className="max-w-xl text-base sm:text-lg leading-relaxed text-zinc-400"
            >
              Centralize Upwork, Fiverr, Malt & LinkedIn on a single dashboard. Let AI
              build your growth roadmap. Never miss a deadline again.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-col sm:flex-row items-center gap-4 mt-2"
            >
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 px-8 py-4 text-base font-bold text-white transition-all hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]"
              >
                Get Early Access
                <ArrowRight size={18} />
              </a>
              <a
                href="#demo"
                className="glass inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                See how it works
              </a>
            </motion.div>

            {/* Micro-copy */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={4}
              className="text-xs text-zinc-600"
            >
              No credit card · Free during beta · Set up in 2 minutes
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="hidden md:block mt-8"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-6 w-px bg-gradient-to-b from-transparent to-zinc-600 mx-auto"
              />
              <p className="text-[10px] text-zinc-700 mt-2">Scroll to explore</p>
            </motion.div>
          </div>
        </section>

        {/* ── PROBLEM / SOLUTION ──────────────────────────────────────────── */}
        <Section>
          <div className="grid gap-8 md:grid-cols-2">
            <ProblemCard />
            <SolutionCard />
          </div>
        </Section>

        {/* ── FEATURES ────────────────────────────────────────────────────── */}
        <Section id="demo">
          <SectionHeader
            eyebrow="What you get"
            title="Everything you need to run your freelance business"
            subtitle="Stop juggling between tabs. Voraly brings your entire freelance workflow into one place."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<LayoutDashboard size={20} />}
              title="Unified Dashboard"
              description="See revenue, active projects, and deadlines from Upwork, Fiverr, Malt, and LinkedIn — all on one screen."
              delay={0}
            />
            <FeatureCard
              icon={<Sparkles size={20} />}
              title="AI Growth Roadmap"
              description="Voraly analyzes your profile and builds a personalized roadmap to optimize your rates and land better clients."
              delay={0.5}
            />
            <FeatureCard
              icon={<Plug size={20} />}
              title="Platform Sync"
              description="Connect your accounts in 2 minutes. Real-time sync keeps everything up to date — no manual entry."
              delay={1}
            />
            <FeatureCard
              icon={<CalendarClock size={20} />}
              title="Deadline Tracking"
              description="Never miss a deadline. Sync with Google Calendar and Notion. Get smart reminders before it's too late."
              delay={1.5}
            />
            <FeatureCard
              icon={<BookOpen size={20} />}
              title="Offer Optimization"
              description="AI-powered suggestions to improve your proposals. Stand out from the crowd and win more projects."
              delay={2}
            />
            <FeatureCard
              icon={<Mail size={20} />}
              title="Client CRM"
              description="Keep track of every client, message, and contract in one place. Build lasting relationships."
              delay={2.5}
            />
          </div>
        </Section>

        {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
        <Section>
          <SectionHeader
            eyebrow="How it works"
            title="From scattered to structured in 3 steps"
          />
          <HowItWorks />
        </Section>

        {/* ── METRICS ─────────────────────────────────────────────────────── */}
        <Section>
          <SectionHeader
            eyebrow="By the numbers"
            title="Freelancers who organize their workflow earn more"
          />
          <MetricsGrid />
        </Section>

        {/* ── BLOG ─────────────────────────────────────────────────────────── */}
        <Section>
          <SectionHeader
            eyebrow="Learn & Grow"
            title="Resources to scale your freelance business"
            subtitle="Practical guides, no fluff. Written for freelancers who want results."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            <BlogCard
              tag="Beginner"
              title="5 Things That Make You Scale as a Beginner Freelancer"
              excerpt="Most freelancers stay stuck because they focus on the wrong things. Here's what actually moves the needle in your first 6 months."
              date="Jul 2026"
              delay={0}
            />
            <BlogCard
              tag="Strategy"
              title="How to Price Your Services (Without Scaring Clients Away)"
              excerpt="Pricing is the #1 anxiety for new freelancers. Learn the framework that top earners use to set rates confidently."
              date="Jul 2026"
              delay={0.5}
            />
            <BlogCard
              tag="Growth"
              title="The Platform Playbook: Upwork vs Fiverr vs Malt"
              excerpt="Not all platforms are created equal. Which one pays the most? Where should you invest your time first?"
              date="Jun 2026"
              delay={1}
            />
          </div>

          {/* eBook Promo */}
          <motion.div
            variants={blurReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            custom={0}
            className="glass-hero relative overflow-hidden rounded-3xl p-10 md:p-14 text-center"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.12) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-5">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                Free eBook
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">
                The Freelancer&apos;s Guide to{" "}
                <span className="gradient-text">Scaling Beyond $5K/month</span>
              </h3>
              <p className="max-w-lg text-sm leading-relaxed text-zinc-400">
                A practical 40-page guide covering positioning, pricing, platform strategy,
                and automation. No theory — just what worked for freelancers who&apos;ve done it.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 hover:bg-violet-500 px-7 py-3.5 text-sm font-semibold text-white transition-all"
              >
                Get it free — Join the waitlist
                <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </Section>

        {/* ── WAITLIST CTA ────────────────────────────────────────────────── */}
        <Section id="waitlist">
          <div className="glass-hero relative overflow-hidden rounded-3xl p-10 md:p-16 text-center max-w-2xl mx-auto">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(255,102,204,0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                Be the first to know when{" "}
                <span className="gradient-text">Voraly launches.</span>
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-zinc-400">
                Early access members get priority onboarding, a free month of Pro, and
                direct input on the roadmap.
              </p>
              <WaitlistForm />
              <p className="text-xs text-zinc-600">
                🔒 We respect your inbox. No spam, ever.
              </p>
            </div>
          </div>
        </Section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06] py-12 px-6">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
            <span className="text-sm font-bold">
              <span className="gradient-text">Voraly</span>
            </span>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-zinc-300 transition-colors">
                Contact
              </a>
            </div>
            <p className="text-xs text-zinc-600">
              © 2026 Voraly. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProblemCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const items = [
    "Revenue scattered across 4+ platforms",
    "Deadlines tracked from memory",
    "Messages lost in different inboxes",
    "Hours wasted on admin every week",
  ]

  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={0}
      className="glass rounded-3xl p-8 flex flex-col gap-5"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          The Problem
        </p>
        <h3 className="text-2xl font-extrabold">Your business is scattered across ten tabs.</h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        Revenue spread over four platforms, messages everywhere, deadlines you track from
        memory. You spend more time managing than invoicing.
      </p>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function SolutionCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const items = [
    "All revenue on one dashboard",
    "Deadlines synced automatically",
    "Messages unified in one inbox",
    "AI handles the busywork",
  ]

  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={1}
      className="glass-hero rounded-3xl p-8 flex flex-col gap-5"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
          The Solution
        </p>
        <h3 className="text-2xl font-extrabold">
          Voraly brings everything onto a single dashboard.
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        Connect your accounts once. Voraly aggregates your revenue, projects, and
        deadlines in real time — and the AI tells you what to do next.
      </p>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const steps = [
    {
      num: "01",
      title: "Connect your platforms",
      desc: "Link your Upwork, Fiverr, Malt, and LinkedIn accounts. It takes less than 2 minutes and we never store your passwords.",
    },
    {
      num: "02",
      title: "Let AI analyze your profile",
      desc: "Voraly scans your history, rates, and reviews to build a personalized roadmap that maximizes your earning potential.",
    },
    {
      num: "03",
      title: "Grow on autopilot",
      desc: "Follow your roadmap, track deadlines effortlessly, and let Voraly handle the busywork while you focus on delivering great work.",
    },
  ]

  return (
    <div ref={ref} className="grid gap-5 sm:grid-cols-3">
      {steps.map((step, i) => (
        <motion.div
          key={step.num}
          variants={blurReveal}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={i * 0.5}
          className="glass rounded-2xl p-7 flex flex-col gap-4"
        >
          <span className="gradient-text text-3xl font-extrabold">{step.num}</span>
          <h3 className="text-base font-bold">{step.title}</h3>
          <p className="text-sm leading-relaxed text-zinc-400">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

function MetricsGrid() {
  const metrics = [
    { value: "47%", label: "Revenue increase after organizing workflow" },
    { value: "12h", label: "Average time saved per week on admin" },
    { value: "3.2×", label: "More proposals sent with AI optimization" },
    { value: "0", label: "Missed deadlines with automated tracking" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <AnimatedMetric key={m.label} value={m.value} label={m.label} delay={i * 0.5} />
      ))}
    </div>
  )
}

function AnimatedMetric({
  value,
  label,
  delay,
}: {
  value: string
  label: string
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
      className="glass flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
    >
      <span className="gradient-text text-4xl font-extrabold">{value}</span>
      <span className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{label}</span>
    </motion.div>
  )
}
