# HANDOFF — Session Voraly

> Document de transfert vers une future session. Dernière mise à jour : 2026-06-22.

## État global

Deux chantiers majeurs livrés cette session, un en attente de vérification finale.

### 1. i18n FR/EN — LIVRÉ (3 cycles, déployé prod)
Site entièrement bilingue FR/EN via **next-intl 4.13** en mode cookie (pas de préfixe URL).
- Détection auto de la langue du nouvel utilisateur (Accept-Language).
- Sélecteur de langue en landing (déconnecté) **et** dashboard (Paramètres).
- Provider `NextIntlClientProvider` au root layout.
- Catalogues : `voraly-web/messages/fr.json` (~44KB) et `en.json` (~39KB), **511 clés chacun, parité parfaite**.
- Infra : `voraly-web/src/i18n/{config,locale,actions,request}.ts`
  - `LOCALES = ['fr','en']`, cookie `VORALY_LOCALE`
  - `getUserLocale` (détection Accept-Language), `setUserLocale` (server action, whitelist validée)
- `next.config.ts` : `createNextIntlPlugin('./src/i18n/request.ts')`. **Headers de cache retirés** (Next écrase `Vary` → unsafe). Migration `/[locale]/` documentée en commentaire si besoin futur.
- Décision : split des namespaces différé jusqu'à 80KB (voir DECISIONS.md).

### 2. Mini-agenda du jour — DÉPLOYÉ, vérification Chrome EN ATTENTE
Dans le dashboard, carte `⚡ Urgent & Deadlines` remplacée par un mini-agenda du jour en DA liquid-glass.
- Affiche les **heures restantes de la journée en cours** sous forme de grille horaire.
- Événements tirés de **Google Calendar** + **Notion** (intégrations connectées).
- Chaque event porte un badge source (CalendarDays/indigo = Google, FileText/zinc = Notion).
- Fichiers :
  - `voraly-web/src/lib/integrations/agenda.ts` — fetcher server-only. Lit `integration_connections` via RLS (jamais service_role), refresh token Google persisté, `AbortSignal.timeout(5s)` sur chaque fetch externe, échec par provider isolé → `[]`.
  - `voraly-web/src/lib/dashboard/types.ts` — interface `AgendaEvent` + champ `agenda` dans `DashboardData`.
  - `voraly-web/src/lib/dashboard/data.ts` — step 6 : `getTodayAgenda(...).catch(() => [])`.
  - `voraly-web/src/components/dashboard/DeadlineCard.tsx` — rendu grille + badges + empty state (boutons connecteurs).
  - `voraly-web/src/components/dashboard/DashboardContent.tsx` — passe `agenda={data.agenda}`.
  - `voraly-web/src/app/dashboard/page.tsx` — `agenda: []` dans le fallback.

#### Correctif fuseau horaire (dernier commit : `0c01107`)
Bug : le VPS est en **UTC**, l'utilisateur en **GMT+1 (Tunisie)**. Près de minuit, le serveur calculait « aujourd'hui » en UTC et ratait des events locaux.
- **Solution** : le serveur récupère une **fenêtre large ±36h** ; le filtrage « aujourd'hui » se fait **côté client** (`DeadlineCard`) dans le fuseau du navigateur (`new Date().toDateString()` / `todayStr`).
- Les deux agents ont validé : **scalability SCALABLE**, **security GO**.
- Branche : `feat/matomo-stats-deploy`. Poussé + déployé VPS.

## ⚠️ TÂCHE EN ATTENTE (à reprendre en priorité)
**Vérifier dans le Chrome de l'utilisateur** que les events Google Calendar s'affichent maintenant dans le mini-agenda.
- Google Chrome déjà connecté : deviceId `894f33c1-a7f0-4b44-bf2f-528480830b9c` (« Browser 1 »), tabId `387010140`, était sur `https://voraly.net/dashboard`.
- Le calendrier Google de l'utilisateur (vérifié par screenshot) contient le 22 juin 2026 (GMT+1) :
  - « test 2 » : 11:30 – 15:00
  - « Test 3 » : 18:00 – 20:00
  - Notion : 0 événement.
- **Action** : naviguer vers `https://voraly.net/dashboard` (tabId 387010140), attendre le rendu, inspecter le DOM via `javascript_tool` (chercher « test 2 » / « Test 3 » et les badges « Calendar » dans `document.body.innerText`), prendre un screenshot. Confirmer à l'utilisateur que c'est live et fonctionnel.
- Contrainte utilisateur : « Ne t'arrête que lorsque la feature est implémentée et live (déployée). »

## Déploiement VPS (procédure)
```
ssh -i ~/.ssh/voraly_vps ubuntu@152.228.128.234
cd ~/voraly/deploy && git pull && docker compose --env-file .env.production up -d --build
```
- Image : `node:22-alpine` (npm 10.9.8).
- **Auto-deploy** : dès les 2 GO (scalabilité + sécurité), déployer directement sans demander confirmation (cf. `feedback-auto-deploy.md`).

## Pièges connus (résolus, à ne pas reproduire)
- **`npm ci` EUSAGE / binaires musl manquants** : le `package-lock.json` doit être généré avec **npm 10** (`npx -y npm@10.9.8 install`), pas npm 11. Pour les binaires Linux natifs (`@parcel/watcher-linux-x64-musl`, `@swc/core-linux-x64-musl`), régénérer le lockfile **dans un conteneur node:22-alpine** puis scp en retour. `optionalDependencies` ajouté dans `package.json`. Voir `learnings-npm-lock-npm10-vs-npm11.md`.
- **Permissions git sur VPS** : objets `.git` root-owned → `sudo chown -R ubuntu:ubuntu ~/voraly/.git`.
- **Async server component dans client component** : `PublicFooter` est `'use client'` → utiliser `useTranslations`, pas `getTranslations`.

## Règles non-négociables (rappel CLAUDE.md)
- JAMAIS de push prod sans GO **scalabilité ET sécurité**.
- TOUJOURS local d'abord → typecheck + lint verts → push GitHub (backup) → déploiement VPS.
- Secrets (service_role, tokens) **serveur uniquement**, jamais côté client. `.env*` gitignorés.
- `user_id` dérivé de la **session**, jamais du body.
- DA liquid-glass obligatoire (zinc-950, `bg-white/5` + `backdrop-blur-xl` + `border-white/10`, accents violet/indigo).
- **Pas de tiret cadratin** dans le contenu rédigé.
- Autonomie totale : exécuter le cycle complet sans intervention manuelle.

## Chantiers abandonnés (ne pas reprendre)
- **Formulaire API Upwork** : l'utilisateur a tout fait lui-même. « ne t'y attarde plus. »
