# Système de Task Bus Hermes ↔ Claude Code

## Principe
Hermes (VPS) écrit des specs de tâches → Claude Code (machine locale) les implémente → Hermes déploie.

## Structure `.tasks/`

```
.tasks/
├── README.md               # Ce fichier
├── task-NNN-description.md # Une tâche
└── DONE/                   # Archive des tâches terminées
    └── task-NNN-description.md
```

## Format d'une tâche

```markdown
# Task-001: Titre de la feature

## Objectif
Description claire de ce qu'il faut faire.

## Spec technique
- Stack : [Next.js/Supabase/n8n]
- Composant : [chemin fichier]
- Changements : ce qui doit être modifié

## Design
- DA liquid-glass (bg-zinc-950, verre bg-white/5 + backdrop-blur-xl, violet/indigo/néon-pink)
- Ou spec design complète

## Règles
- user_id depuis la session (jamais du body)
- Pas de secret côté client
- TypeScript strict, single quotes, 2 espaces

## Fichiers concernés
- `src/app/...`
- `src/components/...`

## Tests
- Vérifier que typecheck + lint passent
```

## Workflow

1. Hermes crée `task-NNN-description-PENDING.md`
2. Watchdog local détecte le fichier PENDING
3. Claude Code implémente la spec
4. Claude Code renomme en DONE + push
5. Hermes détecte le push → déploie
