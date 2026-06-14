# STRATEGY — Voraly

## Vision produit
Devenir le poste de pilotage unique du freelance : une plateforme qui centralise les données multi-plateformes, génère une roadmap de croissance par IA et optimise les offres. La valeur perçue tient à trois choses : la **clarté** (un seul tableau de bord cohérent en DA liquid-glass), l'**intelligence** (recommandations IA actionnables) et la **confiance** (sécurité et confidentialité des revenus par défaut). On vise un produit fiable, beau et sûr plutôt qu'une accumulation de fonctionnalités.

## Workflow des agents
Chaque idée traverse un cycle gouverné : **design → code → sécurité**.
- **Orchestrateur (opus)** : reçoit l'idée en français, consulte CLAUDE.md + la mémoire (DECISIONS/BLOCKERS/LEARNINGS), découpe et **route** vers les bons agents. Il garantit qu'aucun cycle ne démarre sans objectif clair ni en contradiction avec la constitution.
- **Designer (opus)** : conçoit tout le frontend de la feature en DA liquid-glass (maquettes, composants, animations, tokens, assets 21st.dev). Ne code pas la logique métier.
- **Coder (sonnet)** : transforme l'idée en code, implémente **en local d'abord**, corrige les bugs d'ergonomie, fait passer typecheck/lint, puis pousse sur GitHub (backup).
- **Scalability-chief** : relecteur intermédiaire après le Coder, avant le Security-chief. Vérifie index BDD, légèreté des réponses API, gestion des ressources, tenue en charge. Rend un verdict **SCALABLE / RISQUE**.
- **Security-chief (opus)** : **dernier relecteur** avant tout déploiement prod. Vérifie chiffrement des tokens, prévention prompt injection, anti-abus quotas, audit RLS. Rend un verdict **GO / NO-GO**. Le déploiement est déclenché automatiquement dès ce GO obtenu — aucune action manuelle requise.

## Usage de graphify
Le monorepo est indexé dans `Saas/graphify-out/`. Les agents **requêtent** ce graphe (`graphify query "…"` depuis `Saas/`) pour situer une demande, comprendre les relations entre fichiers et localiser le code, **au lieu de relire** des fichiers entiers. Objectif : économie de tokens et contexte plus précis.

## Principes
- **Local-first** : rien ne part en prod sans avoir été vu fonctionner en local (ergonomie réelle testée).
- **GitHub = backup** : push systématique avant déploiement VPS.
- **Sécurité par défaut** : secrets serveur-only, `user_id` depuis la session, RLS owner-only, GO scalabilité + GO sécurité obligatoires avant tout déploiement.
- **Autonomie totale** : une fois les deux GOs obtenus, l'agent déploie directement sans intervention de l'utilisateur.
- **DA cohérente** : aucun écran ni composant hors charte liquid-glass.
- **Capitalisation** : chaque décision structurante → DECISIONS ; chaque pattern/bug → LEARNINGS ; chaque session → JOURNAL.
