"use client"

/**
 * LandingExperience — conteneur principal de la landing `/`
 * Scroll : h-dvh overflow-y-auto (body est overflow:hidden global)
 */

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { LayoutDashboard, Sparkles, Plug, CalendarClock, ChevronDown } from "lucide-react"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid"
import PublicNav from "./PublicNav"
import PublicFooter from "./PublicFooter"

// ── Structure de contenu (texte résolu via i18n à l'affichage) ────────────────

// Icônes des bento (le texte vient des messages, namespace landing.features.*)
const BENTO_ICONS = {
  dashboard: <LayoutDashboard size={18} className="text-violet-400" />,
  roadmap: <Sparkles size={18} className="text-pink-400" />,
  multi: <Plug size={18} className="text-indigo-400" />,
  deadlines: <CalendarClock size={18} className="text-violet-400" />,
} as const

const FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5", "q6"] as const
const METRIC_KEYS = ["m1", "m2", "m3", "m4"] as const
const TRUST_KEYS = ["oauth", "encrypted", "gdpr", "eu"] as const

const PLATFORM_LOGOS = ["Upwork", "Fiverr", "Malt", "LinkedIn", "Freelancer"]

// ── Variants d'animation ──────────────────────────────────────────────────────

const blurReveal = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

// ── Sous-composants de sections ───────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  gradientWord,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  gradientWord?: string
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
        className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
      >
        {title}
        {gradientWord && (
          <>
            {" "}
            <span className="gradient-text">{gradientWord}</span>
          </>
        )}
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
      className="glass flex flex-col items-center gap-2 rounded-2xl p-6 text-center"
    >
      <span className="gradient-text text-4xl font-extrabold">{value}</span>
      <span className="text-sm text-zinc-400">{label}</span>
    </motion.div>
  )
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })

  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={index * 0.5}
      className="glass rounded-2xl overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-white">{q}</span>
        <ChevronDown
          size={18}
          className={[
            "shrink-0 text-zinc-400 transition-transform duration-300",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {/* Réponse toujours dans le DOM — visibilité CSS uniquement (SEO + IA) */}
      <div
        aria-hidden={!open}
        className="overflow-hidden transition-all duration-350"
        style={{
          maxHeight: open ? "600px" : "0px",
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease, visibility 0.35s ease",
        }}
      >
        <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">{a}</p>
      </div>
    </motion.div>
  )
}

// ── LandingExperience ─────────────────────────────────────────────────────────

export default function LandingExperience() {
  const t = useTranslations("landing")
  const tc = useTranslations("common")

  const bentoItems: BentoItem[] = [
    {
      title: t("features.dashboard.title"),
      description: t("features.dashboard.description"),
      icon: BENTO_ICONS.dashboard,
      status: t("features.dashboard.status"),
      tags: [t("features.dashboard.tag")],
      colSpan: 2,
      hasPersistentHover: false,
    },
    {
      title: t("features.roadmap.title"),
      description: t("features.roadmap.description"),
      icon: BENTO_ICONS.roadmap,
      status: t("features.roadmap.status"),
      tags: [t("features.roadmap.tag")],
      colSpan: 2,
    },
    {
      title: t("features.multi.title"),
      description: t("features.multi.description"),
      icon: BENTO_ICONS.multi,
      tags: [t("features.multi.tag")],
      colSpan: 1,
    },
    {
      title: t("features.deadlines.title"),
      description: t("features.deadlines.description"),
      icon: BENTO_ICONS.deadlines,
      tags: [t("features.deadlines.tag")],
      colSpan: 1,
    },
  ]

  return (
    <>
      {/* Scroll container */}
      <main className="h-dvh overflow-y-auto" id="main-content">
        {/* Nav */}
        <PublicNav />

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section
          className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
          aria-labelledby="hero-title"
        >
          <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8">
            {/* Eyebrow — animation shimmer + flottement continu */}
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)', scale: 0.95 }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.p
                animate={{
                  y: [0, -6, 0, 4, 0],
                  rotate: [-0.3, 0.3, -0.2, 0.2, 0],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'loop',
                }}
                className="relative inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 backdrop-blur-sm"
                style={{
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  boxShadow: '0 0 20px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {/* Shimmer sweep */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  animate={{ backgroundPosition: ['200% center', '-200% center'] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                {t("hero.eyebrow")}
              </motion.p>
            </motion.div>

            {/* H1 — animation gradient shimmer en boucle infinie */}
            <motion.h1
              id="hero-title"
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-6xl"
            >
              {t("hero.titleLead")}{' '}
              <motion.span
                className="gradient-text inline-block"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  textShadow: [
                    '0 0 40px rgba(139,92,246,0)',
                    '0 0 40px rgba(139,92,246,0.45)',
                    '0 0 40px rgba(255,102,204,0.35)',
                    '0 0 40px rgba(99,102,241,0.4)',
                    '0 0 40px rgba(139,92,246,0)',
                  ],
                }}
                transition={{
                  backgroundPosition: { duration: 5, repeat: Infinity, ease: 'linear' },
                  textShadow: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                  background: 'linear-gradient(135deg, #a5b4fc 0%, #c084fc 35%, #FF66CC 65%, #a5b4fc 100%)',
                  backgroundSize: '300% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t("hero.titleAccent")}
              </motion.span>
            </motion.h1>

            {/* Sous-titre — mot-clé principal intégré naturellement */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={2}
              className="max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
            >
              {t("hero.subtitle")}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={3}
              className="flex flex-wrap items-center justify-center gap-4"
            >
              <Link href="/signup">
                <LiquidButton
                  size="xl"
                  className="rounded-full px-8 text-base font-bold text-white"
                >
                  {tc("getStartedFree")}
                </LiquidButton>
              </Link>
              <Link
                href="/pricing"
                className="glass inline-flex items-center rounded-full px-8 py-3 text-base font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {tc("viewPricing")}
              </Link>
            </motion.div>

            {/* Micro-copy */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={4}
              className="text-xs text-zinc-600"
            >
              {t("hero.microcopy")}
            </motion.p>

            {/* Phrase GEO — extractible par les moteurs et les IA */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={4.5}
              className="max-w-2xl text-xs leading-relaxed text-zinc-500"
            >
              {t("hero.geo")}
            </motion.p>

            {/* Logos plateformes */}
            <motion.div
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={5}
              className="mt-4 flex flex-col items-center gap-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                {t("hero.platformsLabel")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {PLATFORM_LOGOS.map((name) => {
                  const key = name.toLowerCase()
                  const iconPath = key === 'freelancer' ? '/globe.svg' : `/platforms/${key}.png`
                  return (
                    <span
                      key={name}
                      className="flex items-center gap-2 text-sm font-semibold text-zinc-400 opacity-70 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:text-zinc-200"
                    >
                      <Image
                        src={iconPath}
                        alt={name}
                        width={18}
                        height={18}
                        className="object-contain rounded-md"
                      />
                      {name}
                    </span>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="h-5 w-px bg-gradient-to-b from-transparent to-zinc-600"
            />
          </motion.div>
        </section>

        {/* ── PROBLÈME / SOLUTION ────────────────────────────────────────── */}
        <ParallaxSection>
          <div className="grid gap-12 md:grid-cols-2">
            <ProblemCard />
            <SolutionCard />
          </div>
        </ParallaxSection>

        {/* ── FONCTIONNALITÉS ────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-6xl px-6 py-28" id="fonctionnalites">
          <SectionHeader
            eyebrow={t("features.eyebrow")}
            title={t("features.title")}
            gradientWord={t("features.titleAccent")}
            subtitle={t("features.subtitle")}
          />
          <BentoGrid items={bentoItems} />
        </section>

        {/* ── COMMENT CA MARCHE ──────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 py-28">
          <SectionHeader
            eyebrow={t("howItWorks.eyebrow")}
            title={t("howItWorks.title")}
          />
          <HowItWorksSteps />
        </section>

        {/* ── MÉTRIQUES ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 py-28">
          <SectionHeader
            eyebrow={t("metrics.eyebrow")}
            title={t("metrics.title")}
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {METRIC_KEYS.map((k, i) => (
              <AnimatedMetric
                key={k}
                value={t(`metrics.${k}.value`)}
                label={t(`metrics.${k}.label`)}
                delay={i * 0.5}
              />
            ))}
          </div>
          <ValueCallout />
        </section>

        {/* ── SECTION IA ─────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 py-28">
          <div className="glass-hero relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-16">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% -20%, rgba(139,92,246,0.15) 0%, transparent 70%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
                {t("ai.eyebrow")}
              </p>
              <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t("ai.titleLead")}{" "}
                <span className="gradient-text">{t("ai.titleAccent")}</span>
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-zinc-400">
                {t("ai.body")}
              </p>
              <Link
                href="/fonctionnalites"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-violet-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                {t("ai.cta")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-3xl px-6 py-28" id="faq">
          <SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
          <div className="flex flex-col gap-3">
            {FAQ_KEYS.map((k, i) => (
              <FaqItem key={k} q={t(`faq.${k}.q`)} a={t(`faq.${k}.a`)} index={i} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              {t("faq.seeAll")}
            </Link>
          </div>
        </section>

        {/* ── BADGES CONFIANCE ───────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-3xl px-6 pb-16 flex justify-center">
          <TrustBadges />
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-4xl px-6 py-28 text-center">
          <div className="glass-hero relative overflow-hidden rounded-3xl px-8 py-16">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(255,102,204,0.1) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex flex-col items-center gap-8">
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {t("finalCta.titleLead")}{" "}
                <span className="gradient-text">{t("finalCta.titleAccent")}</span>
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-zinc-400">
                {t("finalCta.body")}
              </p>
              <Link href="/signup">
                <LiquidButton
                  size="xl"
                  className="rounded-full px-10 text-base font-bold text-white"
                >
                  {tc("getStartedFree")}
                </LiquidButton>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <PublicFooter />
      </main>
    </>
  )
}

// ── Sous-composants isolés ────────────────────────────────────────────────────

function ProblemCard() {
  const t = useTranslations("landing.problem")
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const items = ["revenue", "deadlines", "messages", "time"] as const
  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={0}
      className="glass rounded-3xl p-8 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{t("eyebrow")}</p>
        <h3 className="text-2xl font-extrabold text-white">
          {t("title")}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        {t("body")}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((key) => (
          <div key={key} className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 shrink-0" />
            {t(`items.${key}`)}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function SolutionCard() {
  const t = useTranslations("landing.solution")
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const items = ["revenue", "deadlines", "roadmap", "fast"] as const
  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={1}
      className="glass-hero rounded-3xl p-8 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">
          {t("eyebrow")}
        </p>
        <h3 className="text-2xl font-extrabold text-white">
          {t("title")}
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        {t("body")}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((key) => (
          <div key={key} className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
            {t(`items.${key}`)}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const STEP_KEYS = [
  { num: "01", key: "step1" },
  { num: "02", key: "step2" },
  { num: "03", key: "step3" },
] as const

function HowItWorksSteps() {
  const t = useTranslations("landing.howItWorks")
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div ref={ref} className="grid gap-6 md:grid-cols-3">
      {STEP_KEYS.map((step, i) => (
        <motion.div
          key={step.num}
          variants={blurReveal}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={i}
          className="glass rounded-2xl p-7 flex flex-col gap-4"
        >
          <span className="gradient-text text-3xl font-extrabold">{step.num}</span>
          <h3 className="text-base font-bold text-white">{t(`${step.key}.title`)}</h3>
          <p className="text-sm leading-relaxed text-zinc-400">{t(`${step.key}.desc`)}</p>
        </motion.div>
      ))}
    </div>
  )
}

function TrustBadges() {
  const t = useTranslations("landing.trust")
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {TRUST_KEYS.map((key) => (
        <span
          key={key}
          className="glass inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-zinc-400"
        >
          {t(key)}
        </span>
      ))}
    </div>
  )
}

function ValueCallout() {
  const t = useTranslations("landing.metrics")
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      variants={blurReveal}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      custom={0}
      className="glass rounded-3xl p-8 mt-12 flex flex-col items-center gap-4 text-center"
    >
      <p className="max-w-xl text-base font-semibold leading-relaxed text-zinc-200">
        {t("callout")}
      </p>
    </motion.div>
  )
}
// ── ParallaxSection ───────────────────────────────────────────────
// Enveloppe une section avec un glow décoratif en parallaxe au scroll

function ParallaxSection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  // Le glow dérive de +40px à -40px pendant que la section traverse le viewport
  const glowY = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section ref={ref} className="relative mx-auto max-w-5xl px-6 py-28">
      {/* Glow parallaxe indépendant du contenu */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          y: glowY,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 h-60 w-60 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,102,204,0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
          y: useTransform(scrollYProgress, [0, 1], [-20, 30]),
        }}
      />
      {children}
    </section>
  )
}
