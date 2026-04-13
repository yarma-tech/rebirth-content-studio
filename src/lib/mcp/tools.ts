import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"
import { generateDraft, improveDraft } from "@/lib/ai"

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  handler: (args: Record<string, unknown>) => Promise<unknown>
}

export const MCP_TOOLS: MCPTool[] = [
  {
    name: "create_draft",
    description: "Créer un brouillon de post LinkedIn avec titre, contenu, pilier et hashtags",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        pillar: { type: "string", enum: ["build_in_public", "vulgarisation", "retour_terrain"] },
        hashtags: { type: "array", items: { type: "string" } },
      },
      required: ["content"],
    },
    handler: async (args) => {
      const parsed = z.object({
        title: z.string().optional(),
        content: z.string(),
        pillar: z.enum(["build_in_public", "vulgarisation", "retour_terrain"]).optional(),
        hashtags: z.array(z.string()).optional(),
      }).parse(args)

      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: parsed.title || null,
          content: parsed.content,
          pillar: parsed.pillar || null,
          hashtags: parsed.hashtags || [],
          status: "draft",
          ai_generated: false,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "list_posts",
    description: "Lister les posts LinkedIn par statut (brouillon, prêt, programmé, publié, archivé)",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["idea", "draft", "ready", "scheduled", "published", "archived"] },
        limit: { type: "number" },
      },
    },
    handler: async (args) => {
      const status = args.status as string | undefined
      const limit = (args.limit as number) || 20
      const supabase = getServiceClient()
      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)
      if (status) query = query.eq("status", status)
      const { data, error } = await query
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "get_post",
    description: "Récupérer le détail d'un post LinkedIn par son ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().parse(args.id)
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "update_post",
    description:
      "Modifier un post LinkedIn existant. Supporte TOUS les champs : contenu, statut, pilier, hashtags, date de programmation (scheduled_at), et images (media_urls). Pour programmer un post : passe status='scheduled' ET scheduled_at='ISO8601'. Pour changer l'heure de programmation : passe juste scheduled_at.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID UUID du post" },
        title: { type: "string" },
        content: { type: "string" },
        pillar: { type: "string", enum: ["build_in_public", "vulgarisation", "retour_terrain"] },
        status: { type: "string", enum: ["idea", "draft", "ready", "scheduled", "published", "archived"] },
        hashtags: { type: "array", items: { type: "string" } },
        scheduled_at: {
          type: "string",
          description:
            "Date/heure ISO 8601 pour la programmation (fuseau UTC). Convertir depuis Montreal (UTC-4 EDT / UTC-5 EST). Ex: 9h45 Montreal EDT = 13:45 UTC → '2026-04-12T13:45:00Z'",
        },
        media_urls: {
          type: "array",
          items: { type: "string" },
          description: "Tableau d'URLs d'images (Supabase Storage). Remplace le tableau existant.",
        },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().parse(args.id)
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (args.title !== undefined) updates.title = args.title
      if (args.content !== undefined) updates.content = args.content
      if (args.pillar !== undefined) updates.pillar = args.pillar
      if (args.status !== undefined) updates.status = args.status
      if (args.hashtags !== undefined) updates.hashtags = args.hashtags
      if (args.scheduled_at !== undefined) updates.scheduled_at = args.scheduled_at
      if (args.media_urls !== undefined) updates.media_urls = args.media_urls

      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "generate_draft",
    description: "Générer un brouillon de post LinkedIn par IA à partir d'un sujet, pilier et ton",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        pillar: { type: "string", enum: ["build_in_public", "vulgarisation", "retour_terrain"] },
        tone: { type: "string" },
      },
      required: ["topic", "pillar"],
    },
    handler: async (args) => {
      const topic = z.string().parse(args.topic)
      const pillar = z.enum(["build_in_public", "vulgarisation", "retour_terrain"]).parse(args.pillar)
      const tone = (args.tone as string) || "accessible"

      const stream = await generateDraft(topic, pillar, tone)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let content = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }

      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: `[IA] ${topic.slice(0, 60)}`,
          content,
          pillar,
          status: "draft",
          ai_generated: true,
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "list_veille_items",
    description: "Lister les sujets de veille récents, triés par pertinence décroissante. À utiliser pour /veille ou toute question sur la veille (sujets, articles détectés, tendances). Retourne titre, résumé, angle PME, source, score, urgence.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Nombre max d'items à retourner (défaut 10)" },
        min_score: { type: "number", description: "Score de pertinence minimum entre 0 et 1 (défaut 0)" },
        status: {
          type: "string",
          enum: ["new", "reviewed", "used", "dismissed"],
          description: "Filtrer par statut (défaut 'new' = non traités)",
        },
      },
    },
    handler: async (args) => {
      const limit = typeof args.limit === "number" ? args.limit : 10
      const minScore = typeof args.min_score === "number" ? args.min_score : 0
      const status = (args.status as string) || "new"
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("veille_items")
        .select(
          "id, title, summary, pme_angle, source_url, source_name, relevance_score, urgency, suggested_format, detected_at"
        )
        .eq("status", status)
        .gte("relevance_score", minScore)
        .order("relevance_score", { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "get_stats",
    description: "Obtenir les métriques du studio : total posts, publiés ce mois, brouillons en attente, nouveaux items de veille, impressions moyennes. À utiliser pour /stats ou toute question sur les chiffres/performances.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const { getDashboardStats } = await import("@/lib/stats")
      return await getDashboardStats()
    },
  },
  {
    name: "add_veille_source",
    description: "Ajouter une source de veille (flux RSS, chaîne YouTube, ou lien vidéo YouTube). Détecte automatiquement le type. Accepte tous les formats YouTube : /channel/, /@handle, /watch?v=, youtu.be/, /shorts/. Le nom est optionnel pour YouTube (auto-détecté via oEmbed).",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL du flux RSS, de la chaîne YouTube, ou d'une vidéo YouTube (le channel sera extrait automatiquement)",
        },
        name: {
          type: "string",
          description: "Nom court de la source. Optionnel pour YouTube (auto-détecté depuis la vidéo/chaîne).",
        },
        category: {
          type: "string",
          enum: ["ai_news", "pme_stories"],
          description: "Catégorie : ai_news (actus IA) ou pme_stories (histoires PME/entrepreneurs)",
        },
        language: {
          type: "string",
          enum: ["en", "fr"],
          description: "Langue principale du contenu : en ou fr",
        },
      },
      required: ["url"],
    },
    handler: async (args) => {
      const url = z.string().url().parse(args.url)
      const category = z
        .enum(["ai_news", "pme_stories"])
        .optional()
        .parse(args.category) || "ai_news"
      const language = z
        .enum(["en", "fr"])
        .optional()
        .parse(args.language) || "en"

      const {
        getVeilleSources,
        saveVeilleSources,
        youtubeToRss,
        resolveYoutubeUrl,
      } = await import("@/lib/veille-sources")

      const isYoutube =
        url.includes("youtube.com") ||
        url.includes("youtu.be")
      const type = isYoutube ? ("youtube" as const) : ("rss" as const)

      let feedUrl = url
      let autoName: string | undefined

      if (isYoutube) {
        // Try sync conversion first (channel ID, existing RSS)
        const syncResult = youtubeToRss(url)
        if (syncResult) {
          feedUrl = syncResult
        } else {
          // Async resolution: @handle, video URL, shorts, youtu.be
          const resolved = await resolveYoutubeUrl(url)
          if (resolved) {
            feedUrl = resolved.rssUrl
            autoName = resolved.suggestedName || undefined
          } else {
            return {
              error: true,
              message: `Impossible de résoudre le channel ID pour ${url}. Vérifie que l'URL est correcte. Astuce : envoie un lien de vidéo de cette chaîne.`,
            }
          }
        }
      }

      // Use provided name, auto-detected name, or fail
      const name = z.string().min(1).optional().parse(args.name)
        || autoName
        || null
      if (!name) {
        return {
          error: true,
          message: `Impossible de détecter le nom de la source. Précise un nom (ex: "ajoute [url] sous le nom TechCrunch AI").`,
        }
      }

      // Check for duplicate URL
      const existing = await getVeilleSources()
      if (existing.some((s) => s.url === feedUrl)) {
        return {
          error: true,
          message: `Cette source existe déjà : "${existing.find((s) => s.url === feedUrl)?.name}"`,
        }
      }

      // Add and save
      const newSource = { name, url: feedUrl, category, language, type }
      await saveVeilleSources([...existing, newSource])

      return {
        success: true,
        source: newSource,
        total_sources: existing.length + 1,
        message: `Source "${name}" ajoutée (${type}, ${language}, ${category}). Elle sera scannée au prochain cron veille.`,
      }
    },
  },
  {
    name: "attach_image_to_post",
    description:
      "Attacher une image à un post LinkedIn. L'image doit être déjà uploadée (URL Supabase présente dans le message sous [Photo reçue : URL]). Ajoute l'URL au tableau media_urls du post.",
    inputSchema: {
      type: "object",
      properties: {
        post_id: {
          type: "string",
          description: "ID UUID du post auquel attacher l'image",
        },
        image_url: {
          type: "string",
          description: "URL publique de l'image (Supabase Storage)",
        },
      },
      required: ["post_id", "image_url"],
    },
    handler: async (args) => {
      const postId = z.string().uuid().parse(args.post_id)
      const imageUrl = z.string().url().parse(args.image_url)
      const supabase = getServiceClient()

      // Fetch current media_urls
      const { data: post, error: fetchErr } = await supabase
        .from("posts")
        .select("id, title, media_urls")
        .eq("id", postId)
        .single()

      if (fetchErr || !post) {
        throw new Error(fetchErr?.message || "Post non trouvé")
      }

      const urls = [...(post.media_urls || []), imageUrl]

      const { data, error } = await supabase
        .from("posts")
        .update({ media_urls: urls, updated_at: new Date().toISOString() })
        .eq("id", postId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return {
        success: true,
        post_id: data.id,
        title: data.title,
        media_count: urls.length,
        message: `Image attachée au post "${data.title}". ${urls.length} image(s) au total.`,
      }
    },
  },
  {
    name: "create_reminder",
    description:
      "Créer un rappel programmé. Le cron envoie un message Telegram à l'heure prévue. Supporte : stats en live, top veille, liste de posts, résumé quotidien, ou un message texte libre. Peut être unique, quotidien ou hebdomadaire.",
    inputSchema: {
      type: "object",
      properties: {
        action_type: {
          type: "string",
          enum: ["custom", "stats", "veille", "posts", "resume", "post_stats"],
          description:
            "Type d'action : 'stats' (métriques studio), 'veille' (top sujets), 'posts' (liste brouillons/publiés), 'resume' (résumé global), 'post_stats' (stats d'un post spécifique — passe post_title dans action_params), 'custom' (texte libre)",
        },
        scheduled_at: {
          type: "string",
          description:
            "Date/heure ISO 8601 UTC. Convertir depuis Montreal (UTC-4 EDT / UTC-5 EST) avant d'envoyer. Ex: lundi 9h Montreal = lundi 13:00 UTC",
        },
        frequency: {
          type: "string",
          enum: ["once", "daily", "weekly"],
          description: "Fréquence : once (une seule fois), daily (chaque jour), weekly (chaque semaine)",
        },
        custom_message: {
          type: "string",
          description: "Message texte libre (uniquement si action_type='custom')",
        },
        action_params: {
          type: "object",
          description:
            "Paramètres optionnels pour l'action. Ex: {limit: 3} pour veille, {status: 'draft'} pour posts",
        },
      },
      required: ["action_type", "scheduled_at"],
    },
    handler: async (args) => {
      const actionType = z
        .enum(["custom", "stats", "veille", "posts", "resume", "post_stats"])
        .parse(args.action_type)
      const scheduledAt = z.string().parse(args.scheduled_at)
      const frequency = z
        .enum(["once", "daily", "weekly"])
        .optional()
        .parse(args.frequency) || "once"
      const customMessage = (args.custom_message as string) || null
      const actionParams =
        (args.action_params as Record<string, unknown>) || {}

      // Validate scheduled_at is a valid future date
      const scheduledDate = new Date(scheduledAt)
      if (isNaN(scheduledDate.getTime())) {
        return { error: true, message: "Date invalide. Utilise le format ISO 8601 (ex: 2026-04-14T13:00:00Z)." }
      }
      if (scheduledDate.getTime() < Date.now() - 5 * 60 * 1000) {
        return {
          error: true,
          message: `La date ${scheduledDate.toLocaleString("fr-CA", { timeZone: "America/Montreal" })} est dans le passé. Précise une date future.`,
        }
      }

      const chatId = process.env.TELEGRAM_AUTHORIZED_CHAT_ID || ""
      const supabase = getServiceClient()

      const { data, error } = await supabase
        .from("telegram_reminders")
        .insert({
          chat_id: chatId,
          action_type: actionType,
          custom_message: customMessage,
          action_params: actionParams,
          scheduled_at: scheduledAt,
          frequency,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      const freqLabel =
        frequency === "daily"
          ? "chaque jour"
          : frequency === "weekly"
            ? "chaque semaine"
            : "une seule fois"

      return {
        success: true,
        reminder_id: data.id,
        message: `Rappel créé (${actionType}, ${freqLabel}). Prochain envoi : ${new Date(scheduledAt).toLocaleString("fr-CA", { timeZone: "America/Montreal" })}`,
      }
    },
  },
  {
    name: "list_reminders",
    description:
      "Lister les rappels actifs programmés.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("telegram_reminders")
        .select("id, action_type, scheduled_at, frequency, custom_message, status")
        .eq("status", "active")
        .order("scheduled_at", { ascending: true })
        .limit(20)

      if (error) throw new Error(error.message)
      return data
    },
  },
  {
    name: "cancel_reminder",
    description: "Annuler un rappel programmé par son ID.",
    inputSchema: {
      type: "object",
      properties: {
        reminder_id: { type: "string", description: "ID UUID du rappel" },
      },
      required: ["reminder_id"],
    },
    handler: async (args) => {
      const id = z.string().uuid().parse(args.reminder_id)
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from("telegram_reminders")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select("id, action_type")
        .single()

      if (error) throw new Error(error.message)
      return {
        success: true,
        message: `Rappel "${data.action_type}" annulé.`,
      }
    },
  },
  {
    name: "delete_post",
    description:
      "Supprimer un post LinkedIn par son ID. Action irréversible. Demande confirmation à Yannick avant de supprimer.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID UUID du post à supprimer" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().uuid().parse(args.id)
      const supabase = getServiceClient()

      // Fetch title for confirmation message
      const { data: post } = await supabase
        .from("posts")
        .select("id, title")
        .eq("id", id)
        .single()

      if (!post) {
        return { error: true, message: "Post non trouvé." }
      }

      const { error } = await supabase.from("posts").delete().eq("id", id)
      if (error) throw new Error(error.message)

      return {
        success: true,
        message: `Post "${post.title || "Sans titre"}" supprimé.`,
      }
    },
  },
  {
    name: "publish_to_linkedin",
    description:
      "Publier un post sur LinkedIn via l'API LinkedIn. C'est la SEULE façon de publier réellement — update_post(status:'published') ne publie PAS sur LinkedIn, il ne fait que changer le statut en base. Utilise ce tool quand Yannick dit 'publie', 'poste-le', 'mets-le en ligne', 'lance-le sur LinkedIn'.",
    inputSchema: {
      type: "object",
      properties: {
        post_id: {
          type: "string",
          description: "ID UUID du post à publier",
        },
      },
      required: ["post_id"],
    },
    handler: async (args) => {
      const postId = z.string().uuid().parse(args.post_id)
      const { publishToLinkedIn } = await import("@/lib/linkedin-publish")
      return await publishToLinkedIn(postId)
    },
  },
  {
    name: "improve_draft",
    description:
      "Améliorer un post LinkedIn existant via IA. Passe le contenu actuel et une instruction d'amélioration. Retourne le texte amélioré (pas de sauvegarde automatique).",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Contenu actuel du post à améliorer" },
        instruction: { type: "string", description: "Instruction d'amélioration (ex: 'rends-le plus punchy', 'ajoute un CTA')" },
      },
      required: ["content", "instruction"],
    },
    handler: async (args) => {
      const content = z.string().min(1).parse(args.content)
      const instruction = z.string().min(1).parse(args.instruction)

      const stream = await improveDraft(content, instruction)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let result = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        result += decoder.decode(value, { stream: true })
      }

      return { improved_content: result }
    },
  },
  {
    name: "draft_from_veille",
    description:
      "Générer un brouillon de post LinkedIn à partir d'un sujet de veille. Récupère le sujet, génère le contenu via IA, crée le post en brouillon, et lie le sujet au post.",
    inputSchema: {
      type: "object",
      properties: {
        veille_item_id: { type: "string", description: "ID UUID du sujet de veille" },
        pillar: {
          type: "string",
          enum: ["build_in_public", "vulgarisation", "retour_terrain"],
          description: "Pilier du post (défaut: vulgarisation)",
        },
      },
      required: ["veille_item_id"],
    },
    handler: async (args) => {
      const veilleId = z.string().uuid().parse(args.veille_item_id)
      const pillar = z.enum(["build_in_public", "vulgarisation", "retour_terrain"]).optional().parse(args.pillar) || "vulgarisation"

      const supabase = getServiceClient()

      // Fetch veille item
      const { data: item, error: fetchErr } = await supabase
        .from("veille_items")
        .select("*")
        .eq("id", veilleId)
        .single()
      if (fetchErr || !item) throw new Error(fetchErr?.message || "Sujet de veille non trouvé")

      // Generate content via AI
      const topic = `${item.title}. ${item.summary || ""} ${item.pme_angle ? `Angle PME : ${item.pme_angle}` : ""}`
      const stream = await generateDraft(topic, pillar)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let content = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }

      // Create post
      const { data: post, error: postErr } = await supabase
        .from("posts")
        .insert({
          title: item.title,
          content,
          pillar,
          status: "draft",
          ai_generated: true,
          source_veille_id: veilleId,
        })
        .select()
        .single()
      if (postErr) throw new Error(postErr.message)

      // Link veille item to post
      await supabase
        .from("veille_items")
        .update({ status: "used", used_in_post_id: post.id })
        .eq("id", veilleId)

      return {
        success: true,
        post_id: post.id,
        title: post.title,
        message: `Brouillon créé depuis "${item.title}". ID: ${post.id}`,
      }
    },
  },
  {
    name: "create_newsletter",
    description:
      "Générer une newsletter IA Friday à partir des sujets de veille et posts publiés des 7 derniers jours. Crée un brouillon de newsletter prêt à être relu et envoyé.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const supabase = getServiceClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Fetch recent veille items
      const { data: veilleItems } = await supabase
        .from("veille_items")
        .select("*")
        .gte("detected_at", sevenDaysAgo)
        .order("relevance_score", { ascending: false })
        .limit(15)

      // Fetch recent published posts
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .gte("published_at", sevenDaysAgo)
        .limit(5)

      const { generateNewsletterDraft } = await import("@/lib/newsletter-ai")
      const draft = await generateNewsletterDraft(veilleItems || [], posts || [])

      // Insert newsletter
      const { data: newsletter, error } = await supabase
        .from("newsletters")
        .insert({
          subject: draft.subject,
          intro: draft.intro,
          content_html: draft.content_html,
          status: "draft",
        })
        .select()
        .single()
      if (error) throw new Error(error.message)

      return {
        success: true,
        newsletter_id: newsletter.id,
        subject: newsletter.subject,
        message: `Newsletter "${newsletter.subject}" générée en brouillon.`,
      }
    },
  },
  {
    name: "regenerate_newsletter",
    description:
      "Régénérer le contenu IA d'une newsletter existante à partir des données veille/posts récentes. Écrase le contenu actuel.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID UUID de la newsletter" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().uuid().parse(args.id)
      const supabase = getServiceClient()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const { data: veilleItems } = await supabase
        .from("veille_items")
        .select("*")
        .gte("detected_at", sevenDaysAgo)
        .order("relevance_score", { ascending: false })
        .limit(15)

      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .gte("published_at", sevenDaysAgo)
        .limit(5)

      const { generateNewsletterDraft } = await import("@/lib/newsletter-ai")
      const draft = await generateNewsletterDraft(veilleItems || [], posts || [])

      const { data, error } = await supabase
        .from("newsletters")
        .update({
          subject: draft.subject,
          intro: draft.intro,
          content_html: draft.content_html,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)

      return {
        success: true,
        newsletter_id: data.id,
        subject: data.subject,
        message: `Newsletter régénérée : "${data.subject}"`,
      }
    },
  },
  {
    name: "send_newsletter",
    description:
      "Envoyer une newsletter aux abonnés actifs via Resend. La newsletter doit exister et ne pas être déjà envoyée. Met à jour le statut à 'sent'.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID UUID de la newsletter à envoyer" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const id = z.string().uuid().parse(args.id)
      const supabase = getServiceClient()

      const { data: newsletter, error: nlErr } = await supabase
        .from("newsletters")
        .select("*")
        .eq("id", id)
        .single()
      if (nlErr || !newsletter) throw new Error("Newsletter introuvable")
      if (newsletter.status === "sent") throw new Error("Newsletter déjà envoyée")

      const { data: subscribers } = await supabase
        .from("subscribers")
        .select("email")
        .eq("status", "active")
      if (!subscribers || subscribers.length === 0) throw new Error("Aucun abonné actif")

      await supabase.from("newsletters").update({ status: "sending" }).eq("id", id)

      const { sendBatchNewsletter } = await import("@/lib/resend")
      const { renderNewsletterHtml } = await import("@/lib/newsletter-template")

      const results = await sendBatchNewsletter(
        subscribers,
        newsletter.subject,
        (unsubscribeUrl: string) => renderNewsletterHtml(newsletter.content_html || "", unsubscribeUrl)
      )

      await supabase
        .from("newsletters")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          recipient_count: results.sent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      return {
        success: true,
        sent: results.sent,
        failed: results.failed,
        message: `Newsletter envoyée à ${results.sent} abonné(s).`,
      }
    },
  },
  {
    name: "check_linkedin_status",
    description:
      "Vérifier le statut de connexion LinkedIn : connecté, expiré, ou déconnecté. Retourne le nom du compte et la date d'expiration.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      const supabase = getServiceClient()
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "linkedin")
        .single()

      if (!data?.value) {
        return { connected: false, message: "LinkedIn non connecté. Va dans /settings pour connecter ton compte." }
      }

      const creds = data.value as Record<string, unknown>
      const expiresAt = creds.expires_at as string | undefined
      const expired = expiresAt ? new Date(expiresAt).getTime() < Date.now() : false

      return {
        connected: true,
        expired,
        name: creds.name || null,
        connected_at: creds.connected_at || null,
        expires_at: expiresAt || null,
        message: expired
          ? `Connexion LinkedIn expirée depuis ${expiresAt}. Reconnecte-toi dans /settings.`
          : `LinkedIn connecté (${creds.name}). Expire le ${expiresAt}.`,
      }
    },
  },
]
