# Rebirth Content Studio

Plateforme personnelle de Yannick Maillard (Montreal, QC) pour deployer une strategie de contenu LinkedIn autour de la democratisation de l'IA pour les PME. Inclut un systeme de veille, un generateur de posts/scripts video, une newsletter hebdomadaire (IA Friday), et un serveur MCP pour integration agent IA.

## Stack

- **Framework:** Next.js 15+ (App Router) + TypeScript 5
- **Database:** Supabase (PostgreSQL) avec RLS
- **UI:** React 19, TailwindCSS 4, shadcn/ui, Lucide icons
- **IA:** Anthropic Claude via Vercel AI SDK + @anthropic-ai/sdk
- **LinkedIn:** LinkedIn API v2 (OAuth 2.0)
- **Newsletter:** Resend + React Email — "IA Friday" chaque vendredi soir
- **Notifications:** Telegram Bot API (sujets chauds)
- **MCP:** Model Context Protocol server (SSE transport)
- **Validation:** Zod
- **Tests:** Vitest
- **Deploiement:** Vercel

## Commandes

```bash
npm run dev            # Dev server sur port 3000
npm run build          # Build production
npm run lint           # ESLint
npm run test           # Tous les tests (vitest run)
```

## Architecture

```
src/
├── app/
│   ├── api/            # Routes API (REST, MCP, webhooks)
│   │   ├── mcp/        # Serveur MCP (SSE transport)
│   │   ├── posts/      # CRUD posts LinkedIn
│   │   ├── scripts/    # CRUD scripts video
│   │   ├── veille/     # Systeme de veille
│   │   ├── newsletter/ # Generation et envoi IA Friday
│   │   ├── analytics/  # Metriques LinkedIn
│   │   ├── subscribers/# Gestion abonnes newsletter
│   │   └── cron/       # Jobs planifies (veille, newsletter)
│   ├── (dashboard)/    # Pages dashboard protegees
│   └── subscribe/      # Page publique inscription newsletter
├── components/         # React components (ui/ = shadcn)
├── lib/                # Logique metier
│   ├── supabase.ts     # Client Supabase
│   ├── linkedin.ts     # Integration LinkedIn API
│   ├── resend.ts       # Envoi emails / newsletter
│   ├── telegram.ts     # Notifications Telegram
│   ├── veille.ts       # Moteur de veille (RSS, scraping)
│   └── ai.ts           # Generation de contenu via Claude
└── types/              # Types TypeScript
```

## Conventions de code

- **Variables/fonctions:** camelCase — **Composants React:** PascalCase
- **Colonnes DB / tables Supabase:** snake_case — **Constantes:** SCREAMING_SNAKE_CASE
- Path alias: `@/*` pointe vers `./src/*`
- API routes: un fichier `route.ts` par endpoint, handlers `GET`/`POST`/`PATCH`
- Validation Zod en haut de chaque route API
- CSS via classes Tailwind + utilitaire `cn()` (clsx + tailwind-merge)

## Base de donnees

Tables principales: `posts`, `video_scripts`, `veille_items`, `post_analytics`, `subscribers`, `newsletters`, `settings`.

## Auth

App mono-utilisateur (Yannick uniquement). Auth simple par mot de passe ou magic link Supabase.

## Regles IMPORTANTES

- IMPORTANT: Toujours valider les inputs utilisateur avec Zod avant traitement
- IMPORTANT: Le serveur MCP est le point d'entree pour l'agent IA externe — ne pas exposer la DB directement
- IMPORTANT: La newsletter IA Friday est envoyee chaque vendredi soir (heure Montreal, UTC-4/UTC-5)
- IMPORTANT: La veille priorise les histoires d'entrepreneurs (Quebec, France, Antilles) avant les actus tech generiques
- IMPORTANT: Les posts LinkedIn doivent etre valides par Yannick avant publication — jamais de publication automatique sans validation
