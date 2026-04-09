# Rebirth Content Studio

Plateforme de contenu LinkedIn + newsletter **IA Friday** pour la democratisation de l'IA aupres des PME.

## Stack

- **Framework:** Next.js 15+ (App Router) + TypeScript
- **Database:** Supabase (PostgreSQL)
- **UI:** TailwindCSS + shadcn/ui
- **IA:** Anthropic Claude via Vercel AI SDK
- **LinkedIn:** LinkedIn API v2 (OAuth 2.0)
- **Newsletter:** Resend + React Email
- **Notifications:** Telegram Bot API
- **MCP:** Model Context Protocol server (SSE transport)
- **Deploiement:** Vercel

## Fonctionnalites

- Creation et edition de posts LinkedIn assistes par IA
- Systeme de veille automatise (histoires d'entrepreneurs + actu IA)
- Generateur de scripts video face camera
- Newsletter hebdomadaire "IA Friday" (vendredi soir)
- Calendrier editorial
- Analytics LinkedIn
- Serveur MCP pour integration agent IA externe

## Commandes

```bash
npm run dev            # Dev server
npm run build          # Build production
npm run lint           # ESLint
npm run test           # Tests
```

## Documentation

- [Strategie complete](./docs/linkedin-content-strategy.md)
