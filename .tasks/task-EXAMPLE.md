# Task-EXAMPLE: Template de tâche

## Objectif
Décrire en 1-2 phrases ce que cette tâche doit accomplir.

## Spec technique
- **Stack** : Next.js 16 + Supabase + n8n
- **Composant** : `src/app/...`
- **Fichiers modifiés** :
  - `src/components/...` — raison de la modif
  - `src/lib/...` — raison de la modif
- **Nouveaux fichiers** :
  - `src/app/...` — description

## Design (DA liquid-glass)
- bg-zinc-950, verre bg-white/5 + backdrop-blur-xl + border-white/10
- Accents : violet #8b5cf6 / indigo #6366f1 / néon-pink #FF66CC
- rounded-3xl, transitions douces
- Icônes lucide-react

## Règles
- `user_id` depuis la session Supabase (jamais du body client)
- Aucun secret côté client
- TypeScript strict, single quotes, 2 espaces
- RLS owner-only respectée
- Toute donnée sensible : serveur-only

## Tests de vérification
- `npx tsc --noEmit` → VERT
- `npx eslint .` → VERT
- Tester manuellement en local sur `localhost:3000`
- Vérifier responsive mobile/tablette/desktop

## Notes spéciales
- Attention à [point sensible spécifique]
- Pense à [règle métier spécifique]