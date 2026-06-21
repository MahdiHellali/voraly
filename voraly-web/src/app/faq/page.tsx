"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ChevronDown } from "lucide-react"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

// metadata injectée par src/app/faq/layout.tsx (page Client Component)

type FaqCategoryData = {
  slug: string
  title: string
  items: { q: string; a: string }[]
}

function FaqCategory({ category }: { category: FaqCategoryData }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
        {category.title}
      </h2>
      {category.items.map((item, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            aria-expanded={openIdx === i}
          >
            <span className="text-sm font-semibold text-white">{item.q}</span>
            <ChevronDown
              size={18}
              className={[
                "shrink-0 text-zinc-400 transition-transform duration-300",
                openIdx === i ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
          {/* Réponse toujours dans le DOM — pliage CSS uniquement (SEO + IA) */}
          <div
            aria-hidden={openIdx !== i}
            className="overflow-hidden"
            style={{
              maxHeight: openIdx === i ? "600px" : "0px",
              opacity: openIdx === i ? 1 : 0,
              visibility: openIdx === i ? "visible" : "hidden",
              transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease, visibility 0.35s ease",
            }}
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function FaqPage() {
  const t = useTranslations("faqPage")
  const categories = t.raw("categories") as FaqCategoryData[]

  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-violet-400">{t("eyebrow")}</p>
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-base text-zinc-400">
          {t("subtitle")}{" "}
          <Link
            href="/contact"
            className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
          >
            {t("contactCta")}
          </Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 pb-28 flex flex-col gap-12">
        {categories.map((cat) => (
          <FaqCategory key={cat.slug} category={cat} />
        ))}
      </section>

      <PublicFooter />
    </main>
  )
}
