@AGENTS.md

## Serveur MCP — Rebirth Content Studio

Endpoint : `POST /api/mcp` (auth: `Bearer $MCP_AUTH_TOKEN`, protocole JSON-RPC 2.0)

### 20 MCP Tools disponibles

**Posts :** create_draft, list_posts, get_post, update_post, delete_post, generate_draft, improve_draft, publish_to_linkedin, attach_image_to_post
**Veille :** list_veille_items, add_veille_source, draft_from_veille
**Newsletter :** create_newsletter, regenerate_newsletter, send_newsletter
**Stats :** get_stats, check_linkedin_status
**Reminders :** create_reminder, list_reminders, cancel_reminder

### CRUD SQL direct (Supabase MCP, pas de tool dedie)

| Table | Colonnes cles | Enums |
|-------|--------------|-------|
| subscribers | id, email, first_name, interests[], source, status | status: active/unsubscribed/bounced, source: manual/website/linkedin/other |
| veille_items | id, title, summary, pme_angle, source_name, relevance_score, urgency, status | status: new/reviewed/used/dismissed, urgency: immediate/this_week/backlog |
| newsletters | id, subject, intro, content_html, status, sent_at, recipient_count | status: draft/ready/sending/sent |
| settings | key (PK), value (JSONB) | keys: linkedin, veille_sources |

### Couverture fonctionnelle : interface web vs agent

| Fonctionnalite | Web | MCP Tool | SQL |
|---|---|---|---|
| **POSTS** | | | |
| Lister les posts (+ filtre status) | /posts | list_posts | |
| Voir un post | /posts/[id] | get_post | |
| Creer un post | /posts/new | create_draft | |
| Modifier un post | /posts/[id] | update_post | |
| Supprimer un post | /posts/[id] | delete_post | |
| Generer brouillon IA | /posts/new | generate_draft | |
| Ameliorer un post IA | /posts/[id] | improve_draft | |
| Programmer un post | /posts/[id] | update_post (scheduled_at) | |
| Publier sur LinkedIn | /posts/[id] | publish_to_linkedin | |
| Attacher une image | /posts/[id] | attach_image_to_post | |
| **VEILLE** | | | |
| Lister les sujets | /veille | list_veille_items | |
| Ajouter un sujet | /veille | | INSERT veille_items |
| Modifier un sujet | /veille | | UPDATE veille_items |
| Ecarter/supprimer un sujet | /veille | | UPDATE veille_items SET status='dismissed' |
| Generer brouillon depuis veille | /veille | draft_from_veille | |
| Ajouter une source RSS | /settings | add_veille_source | |
| Lister les sources | /settings | | SELECT settings WHERE key='veille_sources' |
| Supprimer une source | /settings | | UPDATE settings (filtrer le JSON) |
| Lancer un scan | /veille | | curl GET /api/cron/veille |
| **NEWSLETTER** | | | |
| Lister les newsletters | /newsletter | | SELECT newsletters |
| Voir une newsletter | /newsletter/[id] | | SELECT newsletters WHERE id=... |
| Creer/generer newsletter IA | /newsletter | create_newsletter | |
| Modifier une newsletter | /newsletter/[id] | | UPDATE newsletters |
| Regenerer le contenu IA | /newsletter/[id] | regenerate_newsletter | |
| Envoyer une newsletter | /newsletter/[id] | send_newsletter | |
| **CONTACTS** | | | |
| Lister les contacts | /contacts | | SELECT subscribers |
| Ajouter un contact | /contacts | | INSERT subscribers |
| Modifier un contact | /contacts | | UPDATE subscribers |
| Supprimer un contact | /contacts | | DELETE subscribers |
| **DASHBOARD** | | | |
| Voir les stats | / | get_stats | |
| **SETTINGS** | | | |
| Verifier status LinkedIn | /settings | check_linkedin_status | |
| **REMINDERS** | | | |
| Creer un rappel | — | create_reminder | |
| Lister les rappels | — | list_reminders | |
| Annuler un rappel | — | cancel_reminder | |
