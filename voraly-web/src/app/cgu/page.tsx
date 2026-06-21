import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Voraly",
  description:
    "Conditions générales d'utilisation de Voraly, tableau de bord freelance. Accès au service, abonnements, responsabilités.",
  alternates: {
    canonical: "/cgu",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const SECTION_KEYS = ["access", "plans", "responsibility", "availability", "modification"] as const

const richTags = {
  strong: (chunks: React.ReactNode) => <strong className="text-zinc-200">{chunks}</strong>,
}

export default async function CguPage() {
  const t = await getTranslations("termsPage")

  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="mb-10 text-sm text-zinc-500">
          {t.rich("intro", {
            mail: (chunks) => (
              <a
                href="mailto:contact@voraly.net"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                {chunks}
              </a>
            ),
          })}
        </p>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-zinc-400">
          {SECTION_KEYS.map((key) => (
            <section key={key}>
              <h2 className="mb-3 text-base font-bold text-white">{t(`sections.${key}.title`)}</h2>
              <p>{t.rich(`sections.${key}.body`, richTags)}</p>
            </section>
          ))}

          <p className="text-xs text-zinc-600">
            {t.rich("footerNote", {
              mail: (chunks) => (
                <a
                  href="mailto:contact@voraly.net"
                  className="text-zinc-500 underline underline-offset-2 hover:text-zinc-300"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </section>

      <PublicFooter />
    </main>
  )
}
