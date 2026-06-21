# DECISIONS — Voraly

## 2026-06-21 — i18n FR/EN via next-intl (mode cookie, sans préfixe URL)

**Contexte.** Besoin de passer tout le site en anglais avec détection auto de la langue et sélecteur FR/EN (landing + dashboard), avec un effort minimal.

**Décision.** Adoption de `next-intl` en mode **sans routing par URL** : la langue est portée par un cookie `VORALY_LOCALE`, détectée au 1er passage via `Accept-Language`, par défaut `fr`. Aucune restructuration du dossier `app/`.

**Conséquence assumée.** Le layout racine lit cookie+headers → toutes les routes deviennent dynamiques (`ƒ`), la landing perd le rendu statique.

**Cache écarté volontairement.** Un `Cache-Control: s-maxage` partagé a été testé puis retiré : pour une même URL la langue varie selon cookie/Accept-Language, et Next.js gère lui-même l'en-tête `Vary` (il écrase tout `Vary: Cookie, Accept-Language` qu'on pose) → un cache partagé servirait la mauvaise langue. Caddy ne cachant pas par défaut, le SSR dynamique reste sans risque de corruption à ce stade.

**Dette / prochain pas (sprint SEO).** Migrer vers le routing `/[locale]/` (`/fr/…`, `/en/…`) pour : regagner le rendu statique, ajouter les `hreflang` et URLs canoniques par langue (SEO international), et permettre un cache partagé sûr par segment de langue.

**Périmètre cycle 1.** Infra i18n + landing (LandingExperience, PublicNav, PublicFooter) + topbar dashboard. Reste à traduire au cycle 2 : pages landing secondaires (faq, fonctionnalites, a-propos, contact, légales) et l'intérieur du dashboard.
