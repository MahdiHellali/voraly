# Voraly — Constitution

## WHY
Voraly existe pour rendre aux freelances le contrôle de leur activité. Jongler entre plusieurs plateformes (Upwork, Malt, Fiverr…), piloter sa croissance et optimiser ses offres est aujourd'hui dispersé, manuel et chronophage. Voraly centralise, automatise et conseille pour que le freelance se concentre sur son métier.

## WHAT
SaaS pour freelances. Trois piliers :
- **Gestion multi-plateformes** : centralisation des connexions et données (revenus, missions) en un seul tableau de bord.
- **Roadmap IA** : génération d'une feuille de route de croissance personnalisée (analyse du profil, automations n8n + Gemini).
- **Optimisation d'offres** : recommandations IA pour affiner les offres et le positionnement.
Modèle Pro à vie via Whop (`is_premium`).

## CONTEXTE PROJET & STACK
Next.js 16 (App Router) + React 19 + Tailwind v4. Supabase cloud (Auth + Postgres + RLS). Whop (paiements, checkout embarqué). n8n (automations IA, Gemini). VPS OVH durci (Docker : Caddy + Next + n8n ; ufw 22/80/443, fail2ban, swap 4G). Assets UI via 21st.dev (Magic MCP).

## NORTH STAR & MÉTRIQUES
**North Star** : « features livrées en prod, sécurisées et sans régression ».
Métriques de suivi :
- Features livrées / semaine.
- 0 incident RLS / sécurité.
- 0 régression en prod.
- Build VPS < 90 s.

## HOW
Workflow standard : **design → code → scalabilité → sécurité → déploiement autonome**.
- Toujours **local d'abord** : implémenter, tester l'ergonomie réelle (bouton/affichage/route OK), puis pousser.
- **GitHub = backup** : `git push` avant tout déploiement VPS.
- Utiliser **graphify** pour situer une demande dans le code (`graphify query "…"` depuis `Saas/`) plutôt que de relire les fichiers.
- 1 idée = 1 cycle complet à la fois.
- **Autonomie totale d'exécution** : une fois que le chef scalabilité ET le chef sécurité ont donné leur GO, déployer directement sans attendre de confirmation utilisateur. Aucune action manuelle ne doit rester à la charge de l'utilisateur.

## RÈGLES NON-NÉGOCIABLES
1. **JAMAIS** pousser en prod sans le GO du **chef scalabilité** ET du **chef sécurité** — les deux sont requis.
2. **TOUJOURS** implémenter en **local d'abord**, puis `verify`/`run` (zéro bug d'ergonomie : bouton, affichage, route OK) avant de pousser.
3. **TOUJOURS** pousser sur **GitHub (backup)** avant tout déploiement VPS.
4. **TOUJOURS** respecter la **DA liquid-glass** — aucun composant hors charte.
5. **JAMAIS** exposer un **secret** (service_role, clés, tokens) côté client ni dans le repo ; les `.env*` restent gitignorés.
6. **TOUJOURS** dériver `user_id` de la **session**, jamais du body client ; `service_role` uniquement côté serveur.
7. **TOUJOURS** `typecheck + lint` verts avant tout push.
8. **MAXIMUM** 1 idée → 1 cycle complet (design → code → scalabilité → sécu → déploiement) à la fois ; capitaliser chaque décision (DECISIONS) et chaque bug/pattern (LEARNINGS).
9. **AUTONOMIE** : « 100% autonome » signifie exécuter l'intégralité du cycle sans intervention manuelle de l'utilisateur — pas sauter les validations des agents.

## VOCABULAIRE
| Terme | Définition |
| --- | --- |
| Liquid Glass | DA iOS : verre dépoli (`bg-white/5` + `backdrop-blur-xl` + `border-white/10`) sur `bg-zinc-950`. |
| DA | Direction artistique : zinc-950, liquid glass, accents violet/indigo (#8b5cf6/#6366f1) + néon-pink (#FF66CC), `rounded-3xl`, blur-reveal framer-motion. |
| RLS | Row Level Security Postgres : accès owner-only, chaque freelance ne voit que ses données. |
| service_role | Clé Supabase tout-pouvoir : serveur uniquement (webhook Whop), jamais côté client. |
| clé anon | Clé publique Supabase, soumise à la RLS ; ne doit lire aucune table sans session. |
| Prompt Injection | Attaque manipulant les inputs IA pour exfiltrer prompts système / code / données. |
| Rate-limit | Limitation de fréquence (Edge Functions/n8n) contre l'abus des quotas Gemini. |
| North Star | Métrique reine : features livrées en prod, sécurisées, sans régression. |
| Pro à vie / `is_premium` | Statut payant à vie (Whop), porté par la colonne `is_premium`. |
| bridge nip.io | Domaine temporaire `152.228.128.234.nip.io` en attendant voraly.me. |
| graphify | Graphe de connaissances du monorepo (`Saas/graphify-out/`), requêtable pour économiser des tokens. |

## COMMANDES PRINCIPALES
- Dev local : `npm run dev`.
- Build VPS : `docker compose --env-file .env.production up -d --build`.
- Contexte code : `graphify query "…"` (depuis `Saas/`).
- Agents : orchestrateur, designer, coder, scalability-chief, security-chief (`.claude/agents/`).

## POINTEURS
- @docs/REFERENCE.md — source de vérité (stack, sécurité, déploiement, env).
- @docs/OBJECTIVES.md — objectifs chiffrés M+6 / M+12.
- @docs/STRATEGY.md — vision, workflow agents, principes.
- `.claude/memory/*` — DECISIONS, LEARNINGS, BLOCKERS, JOURNAL, EVALS, EXPERIMENTS.
- `.claude/agents/*` — fiches des 4 agents.
- `.claude/rules/global.md` — règles transverses.
