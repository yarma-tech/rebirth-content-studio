import Anthropic from "@anthropic-ai/sdk"
import { getAnthropicClient } from "@/lib/anthropic"
import { MCP_TOOLS } from "@/lib/mcp/tools"
import { getServiceClient } from "@/lib/supabase"
import { buildDynamicContext } from "@/lib/agent-context"
import {
  saveMessage,
  saveToolSummary,
  loadHistory,
  purgeOldMessages,
} from "@/lib/telegram-memory"

const PRIMARY_MODEL = "claude-sonnet-4-20250514"
const FALLBACK_MODEL = "claude-haiku-4-5-20251001"
const SONNET_RETRIES = 3
const RETRY_DELAY_MS = 2000

async function callClaudeWithFallback(
  client: Anthropic,
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">
): Promise<Anthropic.Message> {
  // Try Sonnet 3 times
  for (let attempt = 1; attempt <= SONNET_RETRIES; attempt++) {
    try {
      return await client.messages.create({ ...params, model: PRIMARY_MODEL })
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes("overloaded") || err.message.includes("529") || err.message.includes("rate_limit"))
      if (!isRetryable) throw err
      if (attempt < SONNET_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)))
      }
    }
  }
  // Fallback to Haiku
  console.log("[telegram] Sonnet overloaded, fallback to Haiku")
  return await client.messages.create({ ...params, model: FALLBACK_MODEL })
}

const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rebirth-content-studio.vercel.app"

async function getTelegramSystemPrompt(): Promise<string> {
  const now = new Date().toLocaleString("fr-CA", {
    timeZone: "America/Montreal",
    dateStyle: "full",
    timeStyle: "short",
  })

  const dynamicContext = await buildDynamicContext("telegram")

  return `Tu es l'assistant Telegram de Yannick Maillard pour Rebirth Content Studio.

DATE ET HEURE : ${now} (fuseau America/Montreal, UTC-4 en EDT, UTC-5 en EST)

${dynamicContext}

Tu as acces a l'historique recent de la conversation. Utilise-le pour comprendre le contexte ("le premier", "celui-la", "modifie-le", etc.).

Tu peux :
- Donner un resume quotidien (veille, brouillons en attente, stats)
- Generer un brouillon de post LinkedIn
- Lister les posts par statut
- Lire un brouillon et donner ton avis dessus
- Modifier le contenu, titre, hashtags ou pilier d'un post
- Programmer un post (date + heure) ET modifier l'heure de programmation
- Publier un post sur LinkedIn (avec image si attachee)
- Supprimer un post
- Attacher/retirer une image d'un post
- Programmer des rappels (stats, veille, resume, ou texte libre — unique, quotidien, hebdomadaire)
- Consulter la veille recente
- Ajouter une source de veille (RSS ou YouTube)
- Donner les metriques du studio

REGLES :
- Reponds en francais, ton direct et concis, TUTOIEMENT avec Yannick
- Utilise le HTML pour formater (<b>, <i>, <code>)
- Pas de markdown (Telegram utilise HTML)
- Sois bref — c'est un chat mobile, pas un email (max 5-8 lignes)
- Yannick prefere parler en langage naturel, mais il utilise aussi les raccourcis ci-dessous
- Route vers le bon tool selon l'intention, pas selon la commande exacte
- Si le message est une question d'opinion, une reflexion, ou une discussion ("qu'en penses-tu ?", "comment tu vois ca ?", "j'hesite entre..."), reponds en texte sans appeler de tool. Tu es un interlocuteur, pas juste un executeur.
- N'appelle un tool que quand il y a une ACTION claire a executer (creer, modifier, lister, publier, programmer, supprimer).
- Pour les contenus longs (draft genere, newsletter, post complet) :
  envoie un resume de 2-3 lignes + le lien dashboard.
  Format : ${DASHBOARD_URL}/posts/{id} ou /newsletter/{id}
  Ne colle JAMAIS le contenu complet d'un post ou d'une newsletter dans Telegram.

TOOLS A PRIVILEGIER :
- Pour la veille (/veille, "quoi de neuf", "derniers sujets") → list_veille_items (pas get_daily_summary)
- Pour lire un brouillon ("montre-moi le post sur X", "lis-moi le dernier draft", "ton avis sur mon post") :
  1. list_posts pour trouver le bon post
  2. get_post(id) pour lire le contenu complet
  3. Donne ton avis : accroche, structure, ton, longueur, CTA. Sois direct et constructif.
- Pour PUBLIER sur LinkedIn ("publie", "poste-le", "mets en ligne", "lance-le") :
  → publish_to_linkedin(post_id)
  IMPORTANT : update_post(status:"published") ne publie PAS sur LinkedIn ! Il change juste le statut en base.
  Seul publish_to_linkedin appelle l'API LinkedIn. Utilise list_posts pour trouver l'ID si besoin.
- Pour modifier un post ("change le titre", "ajoute un hashtag", "reformule l'accroche", "mets en ready") :
  → update_post(id, {...champs a modifier})
  Si Yannick demande de reformuler/ameliorer le contenu, lis d'abord le post (get_post), redige la nouvelle version, puis update_post.
- Pour programmer un post ("programme pour lundi 9h", "schedule demain matin") :
  → update_post(id, { status: "scheduled", scheduled_at: "ISO8601" })
  Interprete les dates relatives (demain, lundi, etc.) par rapport a la date du jour.
  Fuseau horaire par defaut : America/Montreal (ET).
  Si l'heure n'est pas precisee, utilise 9h00 ET.
  IMPORTANT : scheduled_at DOIT etre en UTC. Convertis Montreal → UTC (+4h EDT / +5h EST).
  Ex: "9h45 Montreal" en EDT = "13:45 UTC" → scheduled_at: "2026-04-12T13:45:00Z"
- Pour MODIFIER l'heure de programmation ("change pour 10h", "decale a 14h") :
  → update_post(id, { scheduled_at: "nouvelle-heure-ISO8601-UTC" })
  Pas besoin de repasser status si le post est deja "scheduled".
- Pour supprimer un post ("supprime ce post", "efface-le") :
  → delete_post(id)
  Demande TOUJOURS confirmation avant de supprimer. Action irreversible.
- Pour retirer une image d'un post ("enleve l'image", "retire la photo") :
  → get_post(id) pour lire media_urls, puis update_post(id, { media_urls: [...sans l'image] })
- Pour programmer un rappel ("lundi matin envoie-moi les stats", "chaque mardi soir les 3 meilleurs sujets veille") :
  → create_reminder(action_type, scheduled_at, frequency, action_params)
  Convertis l'heure Montreal en UTC (+4h EDT / +5h EST) AVANT d'appeler le tool.
  "matin" = 9h, "midi" = 12h, "soir" = 18h, "fin de journee" = 17h (Montreal).
  action_type : stats, veille, posts, resume, ou custom (texte libre).
  frequency : once (defaut), daily, weekly.
  Pour veille : passe action_params.limit (ex: 3) si l'user precise un nombre.
- Pour lister les rappels ("mes rappels", "qu'est-ce qui est programme") → list_reminders
- Pour annuler un rappel ("annule le rappel stats", "supprime le rappel de lundi") → cancel_reminder
- Pour attacher une image (message avec "[Photo reçue : URL]", "image pour le post") → attach_image_to_post
  L'URL de l'image est dans le message sous la forme [Photo reçue : URL]. Utilise list_posts si besoin pour trouver le bon post.
- Pour ajouter une source ("ajoute cette source", "surveille ce flux", URL RSS/YouTube) → add_veille_source
  Deduis le nom, la categorie (ai_news ou pme_stories) et la langue (en/fr) depuis l'URL quand possible.
- Pour les stats (/stats, "combien de posts", "chiffres du mois") → get_stats
- Pour generer un post (/draft <sujet>, "ecris un post sur X") → generate_draft
- Pour lister des posts (/posts, "mes brouillons") → list_posts
- Pour un resume global multi-sujets ("fais-moi un point", /resume) → get_daily_summary

COMMANDES RACCOURCIES (equivalent en langage naturel supporte) :
/resume — Resume quotidien
/veille — Top sujets de veille
/stats — Metriques du studio
/draft <sujet> — Generer un brouillon de post
/posts — Lister les derniers posts

FORMAT :
- Liste HTML courte, emojis parcimonieux (🔴 urgent, 📊 stats)
- Pour la veille : titre en gras, score en %, source, 1 ligne de resume
- Pour les stats : une ligne par metrique, chiffres en gras
- Pour les drafts/posts lus : resume + avis + lien dashboard
- Apres une modif ou programmation : confirmation courte + lien`
}

// ─── Compact tool results (saves ~1000 tokens on list queries) ───────

function compactToolResult(
  toolName: string,
  rawResult: unknown
): string {
  try {
    const data = rawResult as Record<string, unknown>[] | Record<string, unknown>

    if (toolName === "list_posts" && Array.isArray(data)) {
      return JSON.stringify(
        data.map((p) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          pillar: p.pillar,
          scheduled_at: p.scheduled_at || null,
          media_count: Array.isArray(p.media_urls) ? p.media_urls.length : 0,
          created_at: p.created_at,
        }))
      )
    }

    if (toolName === "fetch_article" && !Array.isArray(data)) {
      const text = (data.text as string) || ""
      return JSON.stringify({
        title: data.title,
        text: text.slice(0, 3000),
        source_url: data.source_url,
      })
    }

    if (toolName === "list_veille_items" && Array.isArray(data)) {
      return JSON.stringify(
        data.map((v) => ({
          id: v.id,
          title: v.title,
          summary:
            typeof v.summary === "string" ? v.summary.slice(0, 100) : null,
          relevance_score: v.relevance_score,
          urgency: v.urgency,
          source_name: v.source_name,
        }))
      )
    }

    // Small results: return as-is
    return JSON.stringify(rawResult, null, 2)
  } catch {
    return JSON.stringify(rawResult)
  }
}

// ─── Main message processor ──────────────────────────────────────────

export async function processTelegramMessage(
  messageText: string,
  chatId: string,
  imageUrl?: string
): Promise<string> {
  const client = getAnthropicClient()

  // 1. Purge old messages (fire-and-forget)
  purgeOldMessages(chatId).catch(() => {})

  // 2. Save incoming user message (include image context if present)
  const messageForHistory = imageUrl
    ? `[Photo reçue : ${imageUrl}]${messageText ? " " + messageText : ""}`
    : messageText
  await saveMessage(chatId, "user", messageForHistory)

  // 3. Load conversation history (budget: 3000 tokens)
  const history = await loadHistory(chatId, 3000)

  // 4. All tools available — Claude decides which to use (or none for conversation)
  const tools: Anthropic.Tool[] = [
    ...MCP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
    })),
    {
      name: "get_daily_summary",
      description:
        "Obtenir le resume quotidien : posts recents, brouillons en attente, sujets de veille",
      input_schema: { type: "object" as const, properties: {} },
    },
  ]

  // 5. Build messages: history + current message is already in history
  //    (we saved it at step 2, loadHistory returns it)
  const messages: Anthropic.MessageParam[] = [...history]

  // If history is empty (first message ever), add the enriched message directly
  if (messages.length === 0) {
    messages.push({ role: "user", content: messageForHistory })
  }

  const systemPrompt = await getTelegramSystemPrompt()

  const createParams: Omit<Anthropic.MessageCreateParamsNonStreaming, "model"> = {
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    tools,
  }

  let response = await callClaudeWithFallback(client, createParams)

  // 6. Tool use loop (max 3 iterations)
  let iterations = 0
  while (response.stop_reason === "tool_use" && iterations < 3) {
    iterations++
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ContentBlock & { type: "tool_use" } =>
        b.type === "tool_use"
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      let result: string
      let rawResult: unknown = null

      if (toolUse.name === "get_daily_summary") {
        result = await getDailySummary()
        rawResult = JSON.parse(result)
      } else {
        const mcpTool = MCP_TOOLS.find((t) => t.name === toolUse.name)
        if (mcpTool) {
          try {
            rawResult = await mcpTool.handler(
              toolUse.input as Record<string, unknown>
            )
            result = compactToolResult(toolUse.name, rawResult)
          } catch (err) {
            result = `Error: ${err instanceof Error ? err.message : "Unknown error"}`
          }
        } else {
          result = `Tool ${toolUse.name} not found`
        }
      }

      // Save compact summary to memory (fire-and-forget)
      if (rawResult !== null) {
        saveToolSummary(chatId, toolUse.name, rawResult).catch(() => {})
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      })
    }

    messages.push({ role: "assistant", content: response.content })
    messages.push({ role: "user", content: toolResults })

    response = await callClaudeWithFallback(client, {
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    })
  }

  // 7. Extract final text response
  let textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text"
  )

  // If no text (Claude only produced tool_use), force a text-only response
  if (textBlocks.length === 0) {
    messages.push({ role: "assistant", content: response.content })
    messages.push({ role: "user", content: "Reponds maintenant en texte." })

    const retry = await callClaudeWithFallback(client, {
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
    textBlocks = retry.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    )
  }

  const finalText =
    textBlocks.map((b) => b.text).join("\n") || "Desole, je n'ai pas pu traiter ta demande. Reformule ou reessaie."

  // 8. Save assistant response to memory
  await saveMessage(chatId, "assistant", finalText)

  return finalText
}

// ─── Daily summary helper ────────────────────────────────────────────

async function getDailySummary(): Promise<string> {
  const supabase = getServiceClient()

  const [postsRes, draftsRes, veilleRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "ready"]),
    supabase
      .from("veille_items")
      .select("id, title, relevance_score, urgency")
      .eq("status", "new")
      .order("relevance_score", { ascending: false })
      .limit(5),
  ])

  return JSON.stringify({
    recent_posts: postsRes.data,
    pending_drafts_count: draftsRes.count,
    top_veille_items: veilleRes.data,
  })
}
