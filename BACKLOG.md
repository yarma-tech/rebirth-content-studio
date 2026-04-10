# Backlog — Rebirth Content Studio

Features identifiees post-MVP. Non priorisees tant qu'elles ne sont pas marquees `Next`.

Voir aussi : [PRD complet](_bmad-output/prd.md), [Testing checklist MVP](docs/testing-checklist.md).

---

## Next

_(vide — a definir lors de la prochaine session de planification)_

---

## Phase 4 — Contacts & Leads

- [ ] **Reponses newsletter dans le dashboard**
  - **Pourquoi** : centraliser le suivi des conversations qui demarrent apres l'envoi d'IA Friday
  - **Effort** : M — necessite probablement un webhook Resend pour capturer les replies, ou une integration IMAP
  - **Reference** : FR34 du PRD

- [ ] **Qualification de contact** (abonne → lead → conversation active)
  - **Pourquoi** : transformer la liste d'abonnes en mini-CRM pour suivre les contacts qualifies
  - **Effort** : M — necessite ajouter une colonne `lead_status` (enum) a la table `subscribers` + UI de qualification + filtre
  - **Reference** : FR35 du PRD

- [ ] **Popup de confirmation pour la suppression de contact** (UX)
  - **Pourquoi** : actuellement la suppression utilise `window.confirm()` natif (peu lisible, pas dans le style du dashboard). Remplacer par un Dialog shadcn avec titre, description et bouton "Supprimer" en variant destructive.
  - **Effort** : S — un Dialog avec etat `deletingItem` dans `src/app/(dashboard)/contacts/page.tsx`. Pattern proche de l'edit dialog deja en place.
  - **Notes** : a generaliser eventuellement pour les autres suppressions (veille dismiss, posts archive, etc.) si on en fait un composant `ConfirmDialog` reutilisable.

---

## Phase 4 — Agent autonome & MCP

- [ ] **Suggestions proactives de l'agent autonome**
  - **Pourquoi** : passer d'un outil reactif a un agent qui propose des sujets/posts/actions
  - **Effort** : L — necessite definir les triggers, le scoring, l'interface de presentation des suggestions
  - **Reference** : Phase 4 du PRD

- [ ] **Analyse de sentiment sur commentaires LinkedIn**
  - **Pourquoi** : reperer les commentaires negatifs / opportunites de conversation
  - **Effort** : M — necessite l'API LinkedIn pour recuperer les commentaires + classification IA
  - **Reference** : Phase 4 du PRD

- [ ] **MCP Tools restants**
  - `search_posts` — recherche full-text dans les posts
  - `improve_draft` — ameliorer un brouillon existant via instructions
  - `get_subscribers_stats` — stats d'engagement de la newsletter
  - **Effort** : S chacun
  - **Reference** : Phase 4 du PRD (FR36-39)

---

## Dette technique

- [ ] **Pas de tests automatises** — uniquement le testing-checklist manuel (`docs/testing-checklist.md`). Mettre en place Vitest pour la logique metier (`lib/`) et Playwright pour les flux critiques (creation post, envoi newsletter, scan veille).
- [ ] **Compte git committer non configure globalement** — warning "Your name and email address were configured automatically" a chaque commit. Resoluble via `git config --global user.name/user.email`.

---

## Done (resume condense)

- ✅ MVP Phase 1 (dashboard, posts, generation IA, MCP server)
- ✅ Veille automatisee (RSS + scoring IA Claude)
- ✅ Calendrier editorial
- ✅ Newsletter IA Friday (Resend + template)
- ✅ Telegram bot (notifications + commandes)
- ✅ LinkedIn OAuth + publication directe
- ✅ Refonte page veille en tableau (1 ligne = 1 sujet, colonnes filtrees)
- ✅ Modal de preview au clic sur une ligne de veille (backdrop blur)
- ✅ Connexion Vercel ↔ GitHub (auto-deploy a chaque push sur `main`)
- ✅ Page `/contacts` (FR33) — mini-CRM des subscribers (table, filtres, CRUD)
