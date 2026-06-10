# Voraly

AI-powered freelance optimization SaaS. Monorepo.

## Structure

| Path            | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| `voraly-web/`   | Next.js 16 (App Router) + React 19 + Tailwind v4 app. Main product surface.  |
| `supabase/`     | Database migrations, Edge Functions (Deno), and local `config.toml`.        |
| `extension/`    | Chrome MV3 extension (legacy/companion surface).                            |
| `n8n-workflows/`| Exported n8n automation workflows (e.g. AI Roadmap Generator).              |

## Stack

- **Frontend:** Next.js 16.2.7, React 19, Tailwind CSS v4, Shadcn (Liquid Glass dark theme)
- **Backend:** Supabase (Auth, Postgres + RLS, Edge Functions)
- **AI:** Google Gemini
- **Automation:** n8n (local instance)

## Getting started

```bash
cd voraly-web
npm install
cp .env.example .env.local   # then fill in Supabase + OAuth credentials
npm run dev
```

> **Secrets** live only in `voraly-web/.env.local` (gitignored). Never commit real
> keys. Supabase migrations under `supabase/migrations/` are applied manually in
> the Supabase SQL editor.
