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
