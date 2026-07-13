---
paths:
  - "**/*"
---

# Règles globales Voraly — applicables partout

## Langue & Communication
- Langue de travail : français (PRD, messages, commentaires, documentation)
- Messages concis, pas de blabla
- Toujours citer les sources (fichier:ligne) quand on référence du code

## Conventions de code
- TypeScript strict, pas de `any`
- React Server Components par défaut (App Router)
- Client Components uniquement si interactivité nécessaire (useState, useEffect, onClick...)
- Pas de `useEffect` pour fetcher → utiliser Server Components + async
- Nommage : PascalCase pour composants, camelCase pour fonctions/variables, kebab-case pour fichiers
- Imports triés : React/Next → lib → components → styles

## Git
- Branche depuis `main` : `feat/[nom]`, `fix/[nom]`, `refactor/[nom]`
- Messages de commit : `feat(scope): message en français` (conventional commits)
- Push avant tout déploiement VPS
- Ne jamais push sur main directement sans PR

## Capitalisation
- Chaque décision structurante → `DECISIONS.md`
- Chaque pattern/bug → `LEARNINGS.md`
- Chaque fin de cycle → `JOURNAL.md`
- Bloqueurs connus → `BLOCKERS.md`

## Sécurité
- `user_id` TOUJOURS depuis la session serveur (auth.uid())
- Aucun secret en dur dans le code
- RLS obligatoire sur toutes les tables utilisateur
- `service_role` serveur uniquement
