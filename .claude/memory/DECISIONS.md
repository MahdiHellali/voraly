# DECISIONS — Voraly

## 2026-06-21 — i18n FR/EN via next-intl (mode cookie, sans préfixe URL)

**Contexte.** Besoin de passer tout le site en anglais avec détection auto de la langue et sélecteur FR/EN (landing + dashboard), avec un effort minimal.

**Décision.** Adoption de `next-intl` en mode **sans routing par URL** : la langue est portée par un cookie `VORALY_LOCALE`, détectée au 1er passage via `Accept-Language`, par défaut `fr`. Aucune restructuration du dossier `app/`.

**Conséquence assumée.** Le layout racine lit cookie+headers → toutes les routes deviennent dynamiques (`ƒ`), la landing perd le rendu statique.

**Cache écarté volontairement.** Un `Cache-Control: s-maxage` partagé a été testé puis retiré : pour une même URL la langue varie selon cookie/Accept-Language, et Next.js gère lui-même l'en-tête `Vary` (il écrase tout `Vary: Cookie, Accept-Language` qu'on pose) → un cache partagé servirait la mauvaise langue. Caddy ne cachant pas par défaut, le SSR dynamique reste sans risque de corruption à ce stade.

**Dette / prochain pas (sprint SEO).** Migrer vers le routing `/[locale]/` (`/fr/…`, `/en/…`) pour : regagner le rendu statique, ajouter les `hreflang` et URLs canoniques par langue (SEO international), et permettre un cache partagé sûr par segment de langue.

**Périmètre cycle 1.** Infra i18n + landing (LandingExperience, PublicNav, PublicFooter) + topbar dashboard.

**Cycle 2 (2026-06-21, déployé sur voraly.net).** Tout le site public traduit FR/EN : faq, a-propos, contact, fonctionnalites, login, signup, cgu, confidentialite, mentions-legales, pricing (PricingExperience + ProCard). Chrome dashboard : FloatingNav, option langue dans les Réglages. Listes via `t.raw()`, liens inline via `t.rich()`. GO scalabilité + sécurité obtenus.

**Cycle 3 (2026-06-21, déployé sur voraly.net) — i18n COMPLÈTE.** Tout le dashboard interne traduit : composants (HeroBento, AiTaskCard, DeadlineCard, RevenueChart, KpiEmptyState, SubscriptionBadge), pages (dashboard, optimize, roadmap, integrations, platforms, settings, loading), arbre roadmap complet (EmptyState, CinematicLoader, RoadmapExperience, QuestionnaireFlow, RoadmapResult, MarketingChatbot), corps complet de SettingsForm, libellés serveur de lib/dashboard/data.ts. GO scalabilité + sécurité obtenus. **Le contenu généré par l'IA (roadmap, questions dynamiques, scripts marketing, chatbot) reste non traduit** = couche données produite par le modèle, hors périmètre i18n (standard). Les `QUESTIONS`/`QUESTION_LABELS` par défaut dans lib/roadmap/types.ts restent FR (fallback rarement utilisé, adjacents IA).

**Dette perf (différée, non bloquante).** `NextIntlClientProvider` est au layout racine → tout le catalogue (~44 Ko / 11 Ko gzip) part dans le HTML de chaque page, y compris la landing publique qui n'a pas besoin des namespaces dashboard/roadmap/platforms/settings. Scinder par groupe de routes (layout `/` public vs layout `/dashboard/*`) quand fr.json approchera **80 Ko brut** ou si le TTI Lighthouse de la landing devient prioritaire. Combiner avec la migration `/[locale]/` du sprint SEO.
