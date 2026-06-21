import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import PublicNav from "@/components/landing/PublicNav"
import PublicFooter from "@/components/landing/PublicFooter"

export const metadata: Metadata = {
  title: "Mentions légales — Voraly",
  description: "Mentions légales de Voraly, tableau de bord freelance.",
  alternates: {
    canonical: "/mentions-legales",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const mailLink = (chunks: React.ReactNode) => (
  <a
    href="mailto:contact@voraly.net"
    className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
  >
    {chunks}
  </a>
)

export default async function MentionsLegalesPage() {
  const t = await getTranslations("legalNoticePage")

  return (
    <main className="h-dvh overflow-y-auto">
      <PublicNav />

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white">
          {t("title")}
        </h1>
        <p className="mb-10 text-sm text-zinc-500">
          {t.rich("intro", { mail: mailLink })}
        </p>

        <div className="flex flex-col gap-10 text-sm leading-relaxed text-zinc-400">
          <section>
            <h2 className="mb-3 text-base font-bold text-white">{t("editor.title")}</h2>
            <p>
              {t.rich("editor.body", {
                strong: (chunks) => <strong className="text-zinc-200">{chunks}</strong>,
              })}
            </p>
            <p className="mt-2">{t.rich("editor.contact", { mail: mailLink })}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">{t("hosting.title")}</h2>
            <p>{t("hosting.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">{t("ip.title")}</h2>
            <p>{t("ip.body")}</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-bold text-white">{t("data.title")}</h2>
            <p>
              {t.rich("data.body", {
                privacy: (chunks) => (
                  <a
                    href="/confidentialite"
                    className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </section>

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
