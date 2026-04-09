# Testing Checklist — MVP Rebirth Content Studio

**Date:** 2026-04-09
**Testeur:** Yannick Maillard

## Dashboard (`/`)

- [x] La page charge sans erreur
- [x] Les 4 cartes de stats affichent des valeurs (meme 0)
- [x] La section "Posts recents" affiche le post test cree
- [x] La section "Veille recente" affiche "Aucun sujet" (ou des items si ajoutes)
- [x] Le lien "Nouveau post" redirige vers `/posts/new`
- [x] Les liens "Voir tout" redirigent vers `/posts` et `/veille`

## Liste des posts (`/posts`)

- [x] La page affiche le post test
- [x] Le filtre par statut fonctionne (Brouillon, Publie, etc.)
- [x] Cliquer sur un post redirige vers `/posts/[id]`

## Creation de post (`/posts/new`)

- [x] Selectionner un pilier + ecrire un sujet + cliquer "Generer" → le post apparait en streaming
- [x] Le post genere mentionne le contexte perso (Montreal, video, Rebirth, etc.)
- [x] Le compteur de caracteres est correct et affiche "optimal" entre 800-1300
- [x] La preview LinkedIn se met a jour en temps reel
- [x] Modifier le contenu manuellement fonctionne
- [x] "Ameliorer" avec une instruction (ex: "change l'accroche") regenere le post
- [x] Ajouter des hashtags separes par des virgules → les badges s'affichent
  - ~~BUG: hashtag en trop pour le premier badge~~ **FIXE**
- [x] Programmer une date/heure → le statut passe a "Programme"
- [x] Annuler la programmation → retour a "Brouillon"
- [x] "Creer" sauvegarde et redirige vers `/posts/[id]`
- [x] "Copier" met le post + hashtags dans le presse-papier

## Edition de post (`/posts/[id]`)

- [x] Le post existant se charge avec tous ses champs
- [x] Modifier le contenu + "Sauvegarder" fonctionne
- [x] "Marquer comme publie" change le statut
- [x] Revenir sur `/posts` montre le statut mis a jour

## Veille (`/veille`)

- [x] "Ajouter un sujet" ouvre le dialog
- [x] Remplir le formulaire + soumettre → le sujet apparait dans la liste
  - ~~BUG: la textarea resume s'etire indefiniment en cas de texte long~~ **FIXE** (max-height + scroll)
- [x] Le bouton crayon cree un brouillon de post a partir du sujet
  - ~~BUG: le bouton creait un post au lieu de rediriger vers l'editeur~~ **FIXE** (redirige vers `/posts/[id]`)
- [x] Le bouton X ecarte le sujet (disparait de la liste)
- [x] Le lien externe ouvre la source dans un nouvel onglet

## Settings (`/settings`)

- [x] La page affiche les integrations avec les bons statuts
- [x] Le serveur MCP est indique comme "Actif"

## MCP Server (`/api/mcp`)

- [x] `GET /api/mcp` retourne le health check avec les 5 tools
- [x] `POST /api/mcp` avec `tools/list` retourne la liste des outils
- [x] `POST /api/mcp` sans token → erreur 401
- [x] `POST /api/mcp` avec `tools/call` `list_posts` → retourne les posts

## Responsive

- [x] Le dashboard est lisible sur mobile (sidebar se collapse en menu hamburger)
- [x] L'editeur de post empile les panneaux sur mobile (editeur au-dessus, preview en-dessous)

## Cas limites

- [x] Generer sans pilier → message d'erreur
- [x] Sauvegarder un post vide → message d'erreur
- [x] Naviguer vers un post inexistant → message "Post introuvable"
