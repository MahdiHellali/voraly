"use client"

/**
 * LandingExperience — conteneur principal de la landing `/`
 * Scroll : h-dvh overflow-y-auto (body est overflow:hidden global)
 */

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { LayoutDashboard, Sparkles, Plug, CalendarClock, ChevronDown } from "lucide-react"
import { LiquidButton } from "@/components/ui/liquid-glass-button"
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid"
import HeroBackground from "./HeroBackground"
import PublicNav from "./PublicNav"
import PublicFooter from "./PublicFooter"

// ── Constantes de contenu ────────────────────────────────────────────────────

const BENTO_ITEMS: BentoItem[] = [
  {
    title: "Tableau de bord temps réel",
    description:
      "Revenus, missions en cours et performance consolidés en direct, toutes plateformes confondues.",
    icon: <LayoutDashboard size={18} className="text-violet-400" />,
    status: "Live",
    tags: ["temps-réel"],
    colSpan: 2,
    hasPersistentHover: false,
  },
  {
    title: "Roadmap IA stratégique",
    description:
      "Une feuille de route personnalisée, générée par l'IA, pour augmenter vos revenus mois après mois.",
    icon: <Sparkles size={18} className="text-pink-400" />,
    status: "IA",
    tags: ["IA"],
    colSpan: 2,
  },
  {
    title: "Multi-plateformes",
    description:
      "Upwork, Fiverr, Malt, LinkedIn : connectez tout, pilotez depuis un seul écran.",
    icon: <Plug size={18} className="text-indigo-400" />,
    tags: ["intégrations"],
    colSpan: 1,
  },
  {
    title: "Suivi des deadlines",
    description:
      "Synchronisé avec Google Calendar et Notion. Plus jamais d'échéance oubliée.",
    icon: <CalendarClock size={18} className="text-violet-400" />,
    tags: ["deadlines"],
    colSpan: 1,
  },
]

const FAQ_ITEMS = [
  {
    q: "Quelles plateformes sont compatibles ?",
    a: "Upwork, Fiverr, Malt et LinkedIn dès aujourd'hui, avec de nouvelles intégrations chaque mois. Vos deadlines se synchronisent avec Google Calendar et Notion.",
  },
  {
    q: "Mes données sont-elles en sécurité ?",
    a: "Vos connexions sont chiffrées et nous ne stockons jamais vos identifiants de plateforme. Vous gardez le contrôle total et pouvez déconnecter un compte à tout moment.",
  },
  {
    q: "Comment fonctionne la roadmap IA ?",
    a: "L'IA analyse vos revenus, vos missions et vos tarifs pour générer une feuille de route personnalisée, mise à jour au fil de votre activité.",
  },
  {
    q: "Voraly est-il vraiment gratuit ?",
    a: "Vous démarrez gratuitement, sans carte bancaire. L'offre Pro débloque la roadmap IA avancée et les intégrations illimitées.",
  },
  {
    q: "Combien de temps pour démarrer ?",
    a: "Environ deux minutes : créez votre compte, connectez vos plateformes, et votre tableau de bord se remplit automatiquement.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui. Aucun engagement — résiliez votre abonnement Pro en un clic depuis vos réglages.",
  },
]

const METRICS = [
  { value: "Tous vos revenus", label: "centralisés en un seul endroit" },
  { value: "4", label: "plateformes connectées" },
  { value: "Toutes plateformes", label: "un seul écran" },
  { value: "2 min", label: "pour démarrer" },
]

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
  return (
    <>
      {/* Fond 3D (fixed, -z-10) */}
      <HeroBackground />

      {/* Scroll container — cf. PricingExperience pattern */}
      <main className="h-dvh overflow-y-auto" id="main-content">
        {/* Nav */}
        <PublicNav />

        {/* ── HERO ───────────────────────────────────────────────────────── */}
        <section
          className="relative flex min-h-dvh flex-col items-center justify-center px-6 text-center"
          aria-labelledby="hero-title"
        >
          <div className="relative z-10 flex max-w-4xl flex-col items-center gap-8">
            {/* Eyebrow */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={0}
              className="rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-violet-300 backdrop-blur-sm"
            >
              ✦ La plateforme tout-en-un des freelances
            </motion.p>

            {/* H1 */}
            <motion.h1
              id="hero-title"
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-6xl"
            >
              Pilotez toute votre activité freelance depuis{" "}
              <span className="gradient-text">un seul endroit.</span>
            </motion.h1>

            {/* Sous-titre — mot-clé principal intégré naturellement */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={2}
              className="max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
            >
              Le tableau de bord freelance tout-en-un : Upwork, Fiverr, Malt et LinkedIn réunis,
              revenus optimisés par l&apos;IA, deadlines synchronisées. Reprenez le contrôle de
              votre carrière.
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
                  Commencer gratuitement
                </LiquidButton>
              </Link>
              <Link
                href="/pricing"
                className="glass inline-flex items-center rounded-full px-8 py-3 text-base font-semibold text-zinc-200 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Voir les tarifs
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
              Sans carte bancaire · Configuration en 2 minutes
            </motion.p>

            {/* Phrase GEO — extractible par les moteurs et les IA */}
            <motion.p
              variants={blurReveal}
              initial="hidden"
              animate="visible"
              custom={4.5}
              className="max-w-2xl text-xs leading-relaxed text-zinc-500"
            >
              Voraly est un tableau de bord freelance qui centralise Upwork, Fiverr, Malt et
              LinkedIn, génère une roadmap de croissance par IA et synchronise vos deadlines avec
              Google Calendar et Notion.
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
                Vos plateformes, enfin réunies
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {PLATFORM_LOGOS.map((name) => (
                  <span
                    key={name}
                    className="text-sm font-semibold text-zinc-600 opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 hover:text-zinc-300"
                  >
                    {name}
                  </span>
                ))}
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
            eyebrow="Fonctionnalités"
            title="Tout ce qu'il faut pour faire grandir"
            gradientWord="votre activité."
            subtitle="Quatre piliers, un seul abonnement."
          />
          <BentoGrid items={BENTO_ITEMS} />
        </section>

        {/* ── COMMENT CA MARCHE ──────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 py-28">
          <SectionHeader
            eyebrow="Comment ça marche"
            title="Centraliser vos plateformes freelance en 3 étapes."
          />
          <HowItWorksSteps />
        </section>

        {/* ── MÉTRIQUES ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-5xl px-6 py-28">
          <SectionHeader
            eyebrow="Pourquoi Voraly"
            title="Pourquoi les freelances choisissent Voraly."
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {METRICS.map((m, i) => (
              <AnimatedMetric key={m.value} value={m.value} label={m.label} delay={i * 0.5} />
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
                Propulsé par l&apos;IA
              </p>
              <h2 className="max-w-2xl text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Roadmap IA freelance :{" "}
                <span className="gradient-text">votre stratégie, générée pour vous.</span>
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-zinc-400">
                L&apos;IA de Voraly analyse vos missions, vos tarifs et vos plateformes, puis
                construit une roadmap concrète : quels services pousser, quels tarifs ajuster,
                quelles plateformes prioriser. Vos deadlines se synchronisent automatiquement avec
                votre calendrier.
              </p>
              <Link
                href="/fonctionnalites"
                className="glass inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-violet-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Découvrir la roadmap IA
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="relative mx-auto max-w-3xl px-6 py-28" id="faq">
          <SectionHeader eyebrow="FAQ" title="Questions fréquentes" />
          <div className="flex flex-col gap-3">
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} index={i} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Voir toutes les questions →
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
                Reprenez le contrôle de{" "}
                <span className="gradient-text">votre carrière.</span>
              </h2>
              <p className="max-w-lg text-base leading-relaxed text-zinc-400">
                Rejoignez les freelances qui pilotent leur activité avec Voraly. Gratuit, sans
                carte bancaire.
              </p>
              <Link href="/signup">
                <LiquidButton
                  size="xl"
                  className="rounded-full px-10 text-base font-bold text-white"
                >
                  Commencer gratuitement
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
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Le problème</p>
        <h3 className="text-2xl font-extrabold text-white">
          Votre activité est éclatée sur dix onglets.
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        Des revenus dispersés sur quatre plateformes, des messages partout, des deadlines que vous
        suivez de tête. Vous passez plus de temps à gérer qu&apos;à facturer.
      </p>
      <div className="flex flex-col gap-2">
        {["Revenus invisibles", "Deadlines oubliées", "Messages dispersés", "Temps gaspillé"].map(
          (t) => (
            <div key={t} className="flex items-center gap-3 text-sm text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-700 shrink-0" />
              {t}
            </div>
          )
        )}
      </div>
    </motion.div>
  )
}

function SolutionCard() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
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
          La solution
        </p>
        <h3 className="text-2xl font-extrabold text-white">
          Voraly réunit tout sur un seul tableau de bord.
        </h3>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">
        Connectez vos comptes une fois. Voraly agrège vos revenus, vos missions et vos échéances
        en temps réel — et l&apos;IA vous dit quoi faire ensuite.
      </p>
      <div className="flex flex-col gap-2">
        {[
          "Revenus centralisés",
          "Deadlines synchronisées",
          "Roadmap IA personnalisée",
          "Tout en 2 minutes",
        ].map((t) => (
          <div key={t} className="flex items-center gap-3 text-sm text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
            {t}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

const STEPS = [
  {
    num: "01",
    title: "Connectez vos plateformes",
    desc: "Reliez Upwork, Fiverr, Malt et LinkedIn en quelques clics, en toute sécurité.",
  },
  {
    num: "02",
    title: "Laissez l'IA analyser",
    desc: "Voraly croise vos données et génère votre roadmap de croissance.",
  },
  {
    num: "03",
    title: "Pilotez et encaissez",
    desc: "Suivez vos métriques, respectez vos deadlines, concentrez-vous sur l'essentiel.",
  },
]

function HowItWorksSteps() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div ref={ref} className="grid gap-6 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.num}
          variants={blurReveal}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={i}
          className="glass rounded-2xl p-7 flex flex-col gap-4"
        >
          <span className="gradient-text text-3xl font-extrabold">{step.num}</span>
          <h3 className="text-base font-bold text-white">{step.title}</h3>
          <p className="text-sm leading-relaxed text-zinc-400">{step.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}

const TRUST_BADGES = [
  "OAuth 2.0",
  "Données chiffrées en transit",
  "Conforme RGPD",
  "Hébergement UE",
]

function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {TRUST_BADGES.map((badge) => (
        <span
          key={badge}
          className="glass inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-zinc-400"
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

function ValueCallout() {
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
        Conçu pour les freelances qui veulent reprendre le contrôle de leur activité — sans jongler
        entre dix onglets.
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
