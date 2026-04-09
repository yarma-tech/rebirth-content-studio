---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['docs/linkedin-content-strategy.md']
workflowType: 'prd'
projectName: 'Rebirth Content Studio'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: web_app
  domain: general (content creation / personal productivity)
  complexity: medium
  projectContext: greenfield
  keyInsight: >
    Double objectif — technique (publier du contenu, apprendre MCP) ET personnel
    (vaincre le blocage LinkedIn). UX doit rassurer et minimiser la friction.
    L'agent fait le gros du travail, l'utilisateur valide et ajuste.
    MCP sert aussi de terrain d'apprentissage pour futurs projets.
---

# Product Requirements Document - Rebirth Content Studio

**Author:** Yarma (Yannick Maillard)
**Date:** 2026-04-09

## Executive Summary

Rebirth Content Studio est une plateforme web personnelle conçue pour permettre à Yannick Maillard — vidéaste de 11 ans en reconversion vers l'IA, basé à Montréal — de déployer une stratégie de contenu LinkedIn axée sur la démocratisation de l'IA pour les PME. L'outil centralise le cycle complet : veille automatisée, génération de brouillons assistée par IA, validation humaine, publication LinkedIn, envoi de la newsletter hebdomadaire "IA Friday", et suivi analytique.

Le problème de fond n'est pas l'absence d'outil de publication — c'est un blocage professionnel. Après 4 ans à Montréal sans réseau dans le monde de l'IA, la stratégie outbound (aller vers les gens) ne fonctionne pas. Rebirth inverse l'approche : créer du contenu de valeur pour que les bonnes personnes — recruteurs, entrepreneurs, partenaires potentiels — viennent d'elles-mêmes. Chaque post publié est à la fois du contenu et un portfolio vivant, prouvant la capacité de Yannick à piloter des projets IA.

L'utilisateur cible du contenu est le dirigeant de PME (1-50 salariés) qui n'a jamais intégré l'IA dans ses processus. Le contenu s'articule autour de 3 piliers : build in public (40%), vulgarisation et actualité IA (35%), et retours terrain/cas concrets (25%), avec un focus particulier sur les histoires d'entrepreneurs québécois, français et antillais.

L'objectif à 6 mois : que des professionnels contactent Yannick spontanément suite à son contenu, ouvrant la voie à un poste de Product Manager / Product Owner IA.

### What Makes This Special

**L'outil est la preuve.** La plupart des créateurs de contenu IA utilisent Buffer ou Hootsuite. Yannick construit son propre outil de A à Z — c'est en soi une démonstration de compétence. Le projet sert de portfolio technique tout en produisant le contenu qui construit sa visibilité.

**Le pont vidéo × IA.** 11 ans de production vidéo + la capacité de construire des outils IA = un positionnement unique. Personne d'autre dans l'écosystème montréalais ne combine ces deux compétences. Le format vidéo face caméra (scripts générés par l'agent) exploite directement cette double expertise.

**MCP comme terrain d'apprentissage.** L'intégration d'un serveur MCP (Model Context Protocol) dans l'app sert un double objectif : améliorer le produit (agent IA conversationnel) et acquérir une compétence technique réutilisable sur d'autres projets (dashboard analytics en cours de construction).

**L'agent comme filet de sécurité émotionnel.** L'IA fait le gros du travail (veille, génération, suggestions). Yannick valide et ajuste. Ce ratio effort/résultat très favorable transforme une tâche anxiogène (poster sur LinkedIn) en une habitude simple (valider un brouillon). L'outil réduit la friction au minimum pour débloquer la régularité.

## Project Classification

- **Type de projet :** Application web (Next.js, App Router, SPA)
- **Domaine :** Content creation / Personal productivity
- **Complexité :** Medium — pas de compliance réglementaire lourde, mais intégrations multiples (LinkedIn OAuth, Resend, Telegram, RSS, MCP) et composante IA générative
- **Contexte :** Greenfield — nouveau projet from scratch
- **Utilisateur :** Mono-utilisateur (Yannick Maillard uniquement) + page publique d'inscription newsletter

## Success Criteria

### User Success (Yannick)

- **Régularité sans friction :** Publier 2 posts/semaine pendant 8 semaines consécutives sans interruption. L'acte de poster est devenu une habitude, pas une source de stress.
- **Engagement conversationnel :** Recevoir des réponses en commentaires ET en messages privés. Au moins 3 conversations MP significatives par mois avec des professionnels qui réagissent au contenu.
- **Sentiment de légitimité :** Se sentir à l'aise pour parler d'IA dans n'importe quel contexte professionnel. Indicateur proxy : être sollicité pour un avis, un échange, ou une collaboration liée à l'IA.
- **Utilité ressentie :** Retrouver le sentiment d'être consulté et reconnu pour son expertise — l'équivalent montréalais de ce qui existait en Guadeloupe dans la vidéo.

### Business Success (Carrière)

- **3 mois :** 5+ conversations LinkedIn avec des professionnels IA/tech à Montréal. Au moins 1 invitation à un événement, podcast ou collaboration.
- **6 mois :** 1+ opportunité concrète (entretien PM/PO IA, mission freelance, ou collaboration projet) directement attribuable au contenu LinkedIn.
- **12 mois (graal) :** Décrocher un poste Product Manager IA ou Product Owner IA, avec le contenu LinkedIn et le portfolio technique comme leviers principaux.
- **Newsletter IA Friday :** Canal de crédibilité pure (pas de monétisation). 200+ abonnés à 3 mois = signal que le contenu a de la valeur. Le processus de curation hebdomadaire renforce aussi l'expertise personnelle de Yannick sur le domaine.

### Technical Success

- **MCP production-ready :** Le serveur MCP est démontrable en entretien technique. Code propre, architecture claire, documentation. Pas un prototype — un vrai produit.
- **Portfolio technique complet :** Le code source de Rebirth Content Studio est montrable à un recruteur. Il démontre : architecture Next.js, intégration IA (Claude), MCP, APIs tierces (LinkedIn, Resend, Telegram), base de données Supabase.
- **Veille fonctionnelle :** Le système de veille détecte et filtre les sujets pertinents de manière autonome, avec un taux de pertinence > 70% (sur les items retenus après filtrage IA).

### Measurable Outcomes

| Métrique | MVP (M1) | Croissance (M3) | Vision (M6) |
|----------|----------|------------------|--------------|
| Posts publiés | 8/mois | 12/mois | 16/mois |
| Newsletters envoyées | 4/mois | 4/mois | 4/mois |
| Impressions/post | 200+ | 1000+ | 2000+ |
| Conversations MP/mois | 1+ | 3+ | 5+ |
| Abonnés newsletter | 20+ | 200+ | 500+ |
| Contacts pro IA/tech | 2+ | 10+ | 25+ |
| Opportunités concrètes | — | 1+ | 3+ |

## Technical Stack

- **Framework :** Next.js 15+ (App Router) + TypeScript
- **Database :** Supabase (PostgreSQL) — nouveau projet dédié
- **UI :** TailwindCSS + shadcn/ui + Lucide icons
- **IA :** Anthropic Claude via Vercel AI SDK
- **LinkedIn :** LinkedIn API v2 (OAuth 2.0)
- **Newsletter :** Resend + React Email — "IA Friday"
- **Notifications :** Telegram Bot API
- **MCP :** Model Context Protocol server (SSE transport)
- **Auth :** Supabase Auth mono-utilisateur (magic link ou mot de passe)
- **Validation :** Zod
- **Tests :** Vitest
- **Déploiement :** Vercel

## User Journeys

### Journey 1 — Le matin de Yannick (Dashboard web)

Yannick ouvre Rebirth Content Studio sur son laptop avec son café. Le dashboard affiche : 2 sujets de veille détectés cette nuit, 1 brouillon en attente de validation, et les stats du dernier post (320 impressions, 8 commentaires). Il clique sur le sujet de veille le plus pertinent — une PME française qui a automatisé sa comptabilité avec l'IA. Il clique "Générer un brouillon", choisit le pilier "retour terrain", et Claude produit un post en 10 secondes. Yannick relit, modifie l'accroche, et programme la publication pour jeudi 9h. Il vérifie son calendrier éditorial — la semaine est bouclée. Temps total : 12 minutes.

**Fonctionnalités révélées :** Dashboard avec indicateurs clés, veille avec scoring de pertinence, génération IA par pilier, éditeur de post, calendrier éditorial, publication programmée.

### Journey 2 — Yannick dans le métro (Telegram)

Il est 8h, Yannick est dans le métro à Montréal. Il ouvre Telegram et envoie : "qu'est-ce qu'on a aujourd'hui ?" L'agent répond avec un résumé : "Tu as un brouillon prêt sur le restaurateur de Sherbrooke. Ton post de mardi a 45 likes et 12 commentaires, dont 3 de profils tech intéressants. Et la veille a trouvé un article sur Mistral qui sort un modèle gratuit pour les PME." Yannick répond : "génère un post sur Mistral, angle PME, ton accessible." L'agent envoie le brouillon. Yannick lit, tape "change l'accroche, commence par une question." L'agent ajuste. "Parfait, programme pour vendredi 10h." C'est fait. 3 minutes dans le métro.

**Fonctionnalités révélées :** Bot Telegram connecté à l'agent, résumé quotidien à la demande, stats rapides, génération avec instructions en langage naturel, modification itérative du brouillon, programmation de publication conversationnelle. Architecture : Telegram webhook → Agent IA → MCP Tools → App Rebirth.

### Journey 3 — L'abonné qui devient un contact (Newsletter)

Marie-Claire dirige une PME de 15 personnes à Lyon. Elle voit un post de Yannick sur LinkedIn : "Un restaurateur de Sherbrooke économise 6h/semaine grâce à l'IA. Voici comment." Elle like et commente : "Intéressant ! C'est applicable à une agence d'événementiel ?" Elle clique sur le lien dans le profil de Yannick et arrive sur la page `/subscribe`. Elle entre son email. Vendredi soir, elle reçoit IA Friday — le récap de la semaine avec 4 actus IA vulgarisées et un tip pratique. Elle répond directement à l'email : "Votre newsletter est top. On pourrait échanger sur l'automatisation dans l'événementiel ?" Yannick voit cette réponse remonter dans son dashboard, dans le tableau de bord des contacts/leads. Marie-Claire est passée de "abonnée anonyme" à "lead qualifié". C'est exactement le type de contact qu'il cherchait.

**Fonctionnalités révélées :** Page subscribe publique, newsletter IA Friday via Resend, curation automatique du contenu de la semaine, tracking des réponses email, tableau de bord contacts/leads (mini-CRM), qualification des contacts (abonné → lead → conversation).

### Journey Requirements Summary

Les 3 journeys révèlent les grandes zones fonctionnelles suivantes :

| Zone | Journey 1 (Dashboard) | Journey 2 (Telegram) | Journey 3 (Newsletter) |
|------|----------------------|---------------------|----------------------|
| **Veille** | Consultation, scoring, filtrage | Résumé à la demande | Curation pour newsletter |
| **Création** | Éditeur web, génération IA | Génération conversationnelle | — |
| **Publication** | Programmation via UI | Programmation via commande | — |
| **Analytics** | Dashboard stats détaillé | Stats résumées rapides | Taux ouverture/clics |
| **Newsletter** | — | — | Envoi, tracking, réponses |
| **Contacts/Leads** | Vue tableau de bord leads | Alertes contacts qualifiés | Source d'acquisition |
| **Agent/MCP** | Génération via API interne | Interface principale (Telegram→MCP) | — |
| **Telegram** | — | Bot conversationnel | — |

**Insight architecture :** Telegram n'est pas un "plus" — c'est l'interface mobile principale de Yannick. L'agent doit être aussi complet via Telegram que via le dashboard. Le MCP est le pont entre les deux : même outils, deux interfaces.

## Innovation & Novel Patterns

### Detected Innovation Areas

1. **Architecture MCP comme interface multi-canal** — Utilisation du Model Context Protocol pour connecter un agent IA à une app web de content management. La plupart des outils de contenu (Buffer, Hootsuite, Taplio) sont des apps fermées. Le MCP permet à n'importe quel client (Telegram, Claude Desktop, agent custom) d'interagir avec les mêmes outils via un protocole standardisé.

2. **Telegram comme interface mobile principale via agent IA** — Pas un chatbot de FAQ. Un agent conversationnel complet qui pilote une app entière (création, publication, analytics) depuis une conversation Telegram. Pattern émergent encore rare en production.

3. **Veille IA ciblée sur des histoires humaines** — Les systèmes de veille IA standard cherchent des actus tech. Ici, le moteur de veille cherche des histoires d'entrepreneurs (succès et échecs) avec un ciblage géographique précis (Québec, France, Antilles). Angle de veille unique.

4. **L'outil comme portfolio vivant** — Le produit n'est pas séparé du portfolio. Le construire EST la démonstration de compétence. Pattern "build in public" appliqué à un outil de "build in public".

### Validation Approach

- **MCP :** Démontrable via Claude Desktop + Telegram simultanément sur les mêmes outils. Validation = même action exécutée depuis les deux interfaces produit le même résultat.
- **Veille histoires :** Mesurer le taux de pertinence des items détectés (cible > 70%). Validation = Yannick juge les items utiles pour créer du contenu.
- **Telegram agent :** Couverture fonctionnelle Telegram vs dashboard. Validation = toutes les actions courantes (créer, lister, publier, stats) faisables depuis Telegram.

### Risk Mitigation

- **MCP encore jeune :** Le protocole évolue rapidement. Mitigation : isoler la couche MCP dans un module dédié, facile à mettre à jour.
- **Telegram rate limits :** Mitigation : queue de messages, pas d'envoi en rafale.
- **Veille bruit vs signal :** Le filtrage IA peut remonter trop de faux positifs. Mitigation : scoring de pertinence + validation humaine obligatoire avant utilisation.

## Web App Specific Requirements

### Project-Type Overview

Application web hybride Next.js (App Router) avec deux zones distinctes : une zone publique (SEO, SSR) pour l'acquisition d'abonnés newsletter, et un dashboard privé (SPA-like) pour la gestion de contenu. Mono-utilisateur, Chrome principalement. Dashboard responsive (important pour le portfolio technique).

### Technical Architecture Considerations

**Rendering Strategy :**
- Pages publiques (`/subscribe`, `/subscribe/confirmation`) : Server-Side Rendering (SSR) pour SEO et performance au premier chargement
- Dashboard privé (`/dashboard/*`) : Client-side rendering avec React Server Components où pertinent
- API Routes : `/api/*` pour le backend (CRUD, MCP, webhooks Telegram, cron jobs)

**Browser Support :**
- Chrome (principal) — dernières 2 versions
- Pas de support legacy requis (IE11, vieux Safari)
- Responsive obligatoire sur toutes les pages (dashboard inclus) — le projet sert de portfolio technique, la qualité UI/responsive doit être démontrable

**SEO :**
- `/subscribe` : meta tags, Open Graph (preview quand partagé sur LinkedIn), title/description optimisés
- `/subscribe/confirmation` : page de remerciement, pas indexée (noindex)
- Dashboard : aucun SEO, pages protégées par auth

**Performance :**
- Dashboard : rafraîchissement des données 1x/jour suffit (pas de real-time, pas de WebSocket)
- Veille : cron job toutes les 6h, résultats disponibles au prochain chargement du dashboard
- Génération IA : streaming de la réponse Claude (pour voir le brouillon s'écrire en temps réel)

**Accessibilité :**
- Niveau basique : contrastes suffisants, navigation clavier fonctionnelle, labels sur les formulaires
- Pas de visée WCAG AA complète

### Implementation Considerations

- **Auth mono-utilisateur** : Pas de système de rôles. Un seul compte Supabase Auth avec magic link ou mot de passe.
- **Responsive design** : TailwindCSS breakpoints mobile-first. Le dashboard doit être utilisable sur mobile même si Telegram est l'interface mobile principale — c'est une question de qualité portfolio.
- **Streaming IA** : Utiliser le Vercel AI SDK pour streamer les réponses de Claude dans l'éditeur de post.
- **Cron** : Vercel Cron pour la veille (toutes les 6h) et la newsletter (vendredi soir).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche MVP :** Problem-solving MVP — résoudre le blocage de publication. Si Yannick peut créer un brouillon assisté par IA, le relire, et le marquer comme publié en moins de 10 minutes, le MVP est réussi.

**Ressources :** 1 personne (Yannick en vibe coding avec Claude). Estimation : 2 semaines pour le MVP fonctionnel.

### MVP Feature Set (Phase 1)

**Journey supporté :** Journey 1 (Dashboard matin) uniquement.

**Must-Have :**
- Setup projet Next.js + Supabase + TailwindCSS + shadcn/ui
- Auth mono-utilisateur (Supabase Auth, magic link)
- Dashboard : liste des posts, stats basiques, alertes veille
- CRUD posts : créer, éditer, lister, archiver
- Génération IA : sujet/idée → Claude génère un brouillon (streaming)
- Preview LinkedIn : rendu visuel du post tel qu'il apparaîtra
- Publication manuelle : copier-coller + marquage "publié" (pas d'API LinkedIn)
- Schema DB : posts, veille_items, settings
- MCP Server v1 : endpoint `/api/mcp` (SSE) avec `create_draft`, `list_posts`, `get_post`, `update_post`, `generate_draft`
- Responsive design (mobile-first, TailwindCSS)

**Explicitement hors MVP :**
- API LinkedIn (publication auto)
- Veille automatisée (on ajoute les sujets manuellement au début)
- Newsletter IA Friday
- Telegram bot
- Scripts vidéo
- Calendrier éditorial
- Analytics LinkedIn
- Contacts/leads

### Post-MVP Features

**Phase 2 — Veille & Contenu (Semaines 3-4) :**
- Veille automatisée : RSS + filtrage IA (cron 6h)
- Dashboard veille : sujets détectés, scoring, actions
- Générateur scripts vidéo (hook/contexte/impact/action/CTA)
- Calendrier éditorial (vue semaine)
- MCP Tools v2 : `get_veille_feed`, `veille_to_draft`, `create_video_script`
- MCP Resources : `strategy://content-strategy`, `strategy://post-templates`

**Phase 3 — LinkedIn API + Newsletter + Telegram (Semaines 5-6) :**
- API LinkedIn : OAuth 2.0, publication directe, programmation
- Newsletter IA Friday : page subscribe, éditeur, envoi Resend, stats
- Telegram bot : agent conversationnel connecté via MCP
- Analytics LinkedIn : impressions, engagement, tendances
- Notifications Telegram : sujets chauds
- MCP Tools v3 : `publish_post`, `schedule_post`, `get_analytics`, `generate_newsletter`, `send_newsletter`

**Phase 4 — Agent autonome + Leads (Semaines 7-8) :**
- Tableau de bord contacts/leads (mini-CRM)
- Agent autonome : suggestions proactives, workflow complet
- Analyse de sentiment sur commentaires
- Recommandations basées sur les données
- MCP Tools finaux : `search_posts`, `improve_draft`, `get_subscribers_stats`

### Risk Mitigation Strategy

**Risque technique principal :** MCP est encore un protocole jeune.
→ Mitigation : module MCP isolé, facile à mettre à jour. Commencer avec des tools simples (CRUD), complexifier progressivement.

**Risque marché :** Le contenu ne génère pas d'engagement.
→ Mitigation : commencer à poster DÈS le MVP (publication manuelle). Ne pas attendre que tout soit automatisé. Mesurer et ajuster les piliers/formats en fonction des réactions.

**Risque ressource :** Yannick est seul développeur.
→ Mitigation : MVP ultra lean (2 semaines). Si le MVP prend plus de 3 semaines, réduire le scope (enlever le MCP du MVP, l'ajouter en Phase 2).

**Risque personnel :** Le blocage LinkedIn persiste malgré l'outil.
→ Mitigation : l'agent génère le brouillon complet. Yannick n'a qu'à valider. Réduire la friction au strict minimum. Si le blocage persiste, commencer par poster 1x/semaine au lieu de 2.

## Functional Requirements

### Content Creation

- **FR1:** Yannick peut créer un nouveau post LinkedIn avec un titre interne, du contenu, un pilier, et des hashtags
- **FR2:** Yannick peut modifier un post existant (contenu, pilier, hashtags, statut)
- **FR3:** Yannick peut supprimer ou archiver un post
- **FR4:** Yannick peut lister ses posts filtrés par statut (brouillon, prêt, programmé, publié, archivé)
- **FR5:** Yannick peut demander à l'IA de générer un brouillon de post à partir d'un sujet/idée, avec un pilier et un ton spécifié
- **FR6:** Yannick peut voir le brouillon IA se générer en temps réel (streaming)
- **FR7:** Yannick peut demander à l'IA d'améliorer un brouillon existant (accroche, reformulation, CTA)
- **FR8:** Yannick peut prévisualiser un post tel qu'il apparaîtra sur LinkedIn
- **FR9:** Yannick peut marquer un post comme "publié" manuellement (copier-coller)
- **FR10:** Yannick peut programmer un post à une date et heure spécifiques

### Video Scripts

- **FR11:** Yannick peut créer un script vidéo structuré (hook, contexte, impact, action, CTA)
- **FR12:** Yannick peut demander à l'IA de générer un script à partir d'un sujet de veille
- **FR13:** Yannick peut afficher un script en mode lecture (référence pendant le tournage)
- **FR14:** Yannick peut lier un script vidéo à un post LinkedIn associé

### Veille & Intelligence

- **FR15:** Le système peut collecter automatiquement des sujets depuis des sources RSS et newsletters (cron 6h)
- **FR16:** Le système peut filtrer les sujets par pertinence via l'IA (scoring 0-1)
- **FR17:** Le système peut détecter des histoires d'entrepreneurs/PME ayant implémenté l'IA (succès et échecs)
- **FR18:** Le système peut prioriser les histoires québécoises, françaises et antillaises
- **FR19:** Yannick peut consulter les sujets de veille détectés avec leur score de pertinence
- **FR20:** Yannick peut transformer un sujet de veille en brouillon de post en un clic
- **FR21:** Yannick peut marquer un sujet de veille comme non pertinent (dismissed)

### Newsletter (IA Friday)

- **FR22:** Un visiteur peut s'inscrire à la newsletter via une page publique `/subscribe`
- **FR23:** Un abonné peut se désinscrire via un lien dans chaque email
- **FR24:** Le système peut générer un brouillon de newsletter à partir de la veille de la semaine et des posts publiés
- **FR25:** Yannick peut éditer et valider le contenu de la newsletter avant envoi
- **FR26:** Le système peut envoyer la newsletter aux abonnés via Resend
- **FR27:** Yannick peut consulter les stats de la newsletter (taux ouverture, clics, désabonnements)

### LinkedIn Publication & Analytics

- **FR28:** Yannick peut connecter son compte LinkedIn via OAuth 2.0
- **FR29:** Yannick peut publier un post directement sur LinkedIn depuis l'app
- **FR30:** Le système peut publier automatiquement un post programmé à l'heure prévue
- **FR31:** Le système peut récupérer les métriques LinkedIn d'un post (impressions, likes, commentaires, partages)
- **FR32:** Yannick peut consulter un dashboard analytics avec tendances et classement des posts

### Contacts & Leads

- **FR33:** Yannick peut voir la liste des abonnés newsletter avec leur source d'inscription
- **FR34:** Yannick peut voir les réponses aux newsletters remontées dans un tableau de bord
- **FR35:** Yannick peut qualifier un contact (abonné → lead → conversation active)

### Agent IA & MCP

- **FR36:** Un client MCP externe peut se connecter au serveur via SSE (`/api/mcp`)
- **FR37:** Un client MCP peut créer, lister, modifier et supprimer des posts via les MCP tools
- **FR38:** Un client MCP peut déclencher la génération d'un brouillon IA
- **FR39:** Un client MCP peut récupérer le feed de veille et les analytics
- **FR40:** Un client MCP peut publier et programmer des posts
- **FR41:** Un client MCP peut générer et envoyer une newsletter
- **FR42:** Le serveur MCP expose des ressources statiques (stratégie, templates, résumé analytics)

### Telegram Bot

- **FR43:** Yannick peut interagir avec l'agent IA via Telegram en langage naturel
- **FR44:** L'agent Telegram peut fournir un résumé quotidien (veille, brouillons en attente, stats)
- **FR45:** L'agent Telegram peut générer et modifier un brouillon de post conversationnellement
- **FR46:** L'agent Telegram peut programmer une publication via commande
- **FR47:** L'agent Telegram peut notifier Yannick d'un sujet de veille urgent

### Dashboard & Configuration

- **FR48:** Yannick peut se connecter à l'app via magic link ou mot de passe
- **FR49:** Yannick peut voir un dashboard avec : posts récents, stats clés, alertes veille, brouillons en attente
- **FR50:** Yannick peut consulter un calendrier éditorial (vue semaine/mois) avec code couleur par pilier
- **FR51:** Yannick peut configurer ses préférences (sources de veille, compte LinkedIn, bot Telegram, newsletter)

## Non-Functional Requirements

### Performance

- Les pages du dashboard chargent en moins de 2 secondes (first contentful paint)
- La page publique `/subscribe` charge en moins de 1 seconde (SSR, critique pour la conversion)
- Le streaming de génération IA commence dans les 3 secondes suivant la requête
- Les cron jobs (veille, newsletter) se terminent dans les 60 secondes max (limite Vercel Cron)

### Sécurité

- Les tokens OAuth LinkedIn et les clés API (Resend, Telegram, Claude) sont stockés en variables d'environnement, jamais en base de données
- Les emails des abonnés sont stockés dans Supabase avec RLS activé
- L'endpoint MCP est protégé par authentification (pas d'accès public)
- Le dashboard est protégé par Supabase Auth (session cookie)
- La page `/subscribe` inclut une protection anti-spam basique (honeypot ou rate limiting)
- Conformité LCAP (loi canadienne anti-pourriel) : opt-in explicite, lien de désabonnement dans chaque email

### Intégration

- **LinkedIn API v2** : OAuth 2.0, respect des quotas API (100 posts/jour max), gestion des tokens refresh
- **Resend** : Envoi transactionnel, tracking ouvertures/clics via webhooks, gestion bounces
- **Telegram Bot API** : Webhook pour réception des messages, envoi via API REST, retry en cas d'échec
- **Supabase** : Client via service role key côté API, RLS pour la sécurité des données
- **Anthropic Claude** : Vercel AI SDK pour le streaming, gestion des erreurs et fallback si rate limited
- **MCP** : Transport SSE, compatible avec Claude Desktop et clients MCP standards

### Qualité de code (Portfolio)

- Code TypeScript strict (pas de `any`)
- Architecture claire et documentée (README, CLAUDE.md)
- Tests unitaires sur les fonctions critiques (génération IA, MCP tools)
- Code source démontrable en entretien technique
