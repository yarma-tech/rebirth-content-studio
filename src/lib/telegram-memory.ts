import Anthropic from "@anthropic-ai/sdk"
import { getServiceClient } from "@/lib/supabase"

const MAX_HISTORY_TOKENS = 3000
const MAX_AGE_HOURS = 24
const MAX_MESSAGES = 30

// ─── Token estimation ────────────────────────────────────────────────
// ~3.5 chars per token for mixed FR/EN content (conservative)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5)
}

// ─── Save messages ───────────────────────────────────────────────────

export async function saveMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from("telegram_messages").insert({
    chat_id: chatId,
    role,
    content,
    token_estimate: estimateTokens(content),
  })
}

export async function saveToolSummary(
  chatId: string,
  toolName: string,
  rawResult: unknown
): Promise<void> {
  const summary = summarizeToolResult(toolName, rawResult)
  const supabase = getServiceClient()
  await supabase.from("telegram_messages").insert({
    chat_id: chatId,
    role: "tool_summary",
    content: summary,
    token_estimate: estimateTokens(summary),
  })
}

// ─── Load history within token budget ────────────────────────────────

export async function loadHistory(
  chatId: string,
  maxTokens: number = MAX_HISTORY_TOKENS
): Promise<Anthropic.MessageParam[]> {
  const supabase = getServiceClient()

  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

  const { data: rows } = await supabase
    .from("telegram_messages")
    .select("role, content, token_estimate")
    .eq("chat_id", chatId)
    .gt("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(MAX_MESSAGES)

  if (!rows || rows.length === 0) return []

  // Walk from newest to oldest, accumulate within budget
  let budget = maxTokens
  const selected: typeof rows = []

  for (const row of rows) {
    if (budget - row.token_estimate < 0 && selected.length > 0) break
    budget -= row.token_estimate
    selected.push(row)
  }

  // Reverse to chronological order
  selected.reverse()

  // Convert to Anthropic message format
  // tool_summary rows are injected as "user" context (Claude sees them as prior context)
  // We must ensure alternation: user → assistant → user → ...
  const messages: Anthropic.MessageParam[] = []

  for (const row of selected) {
    const apiRole: "user" | "assistant" =
      row.role === "assistant" ? "assistant" : "user"

    const last = messages[messages.length - 1]
    if (last && last.role === apiRole) {
      // Merge consecutive same-role messages
      last.content += "\n" + row.content
    } else {
      messages.push({ role: apiRole, content: row.content })
    }
  }

  // Ensure first message is from user (Anthropic API requirement)
  if (messages.length > 0 && messages[0].role !== "user") {
    messages.shift()
  }

  // Ensure alternation (strip duplicate roles)
  const clean: Anthropic.MessageParam[] = []
  for (const msg of messages) {
    const last = clean[clean.length - 1]
    if (last && last.role === msg.role) {
      last.content += "\n" + (msg.content as string)
    } else {
      clean.push(msg)
    }
  }

  return clean
}

// ─── Purge old messages ──────────────────────────────────────────────

export async function purgeOldMessages(chatId: string): Promise<void> {
  const supabase = getServiceClient()
  const cutoff = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()

  await supabase
    .from("telegram_messages")
    .delete()
    .eq("chat_id", chatId)
    .lt("created_at", cutoff)
}

// ─── Tool result summarization (10x compression) ────────────────────

function summarizeToolResult(toolName: string, rawResult: unknown): string {
  try {
    const data = rawResult as Record<string, unknown>[] | Record<string, unknown>

    if (toolName === "list_veille_items" && Array.isArray(data)) {
      const top = data
        .slice(0, 3)
        .map(
          (v, i) =>
            `${i + 1}. "${v.title}" (${Math.round((v.relevance_score as number) * 100)}%) — ${v.source_name || "?"}`
        )
        .join("\n")
      return `[list_veille_items] ${data.length} items. Top 3 :\n${top}`
    }

    if (toolName === "list_posts" && Array.isArray(data)) {
      const byStatus: Record<string, number> = {}
      for (const p of data) {
        const s = (p.status as string) || "unknown"
        byStatus[s] = (byStatus[s] || 0) + 1
      }
      const statusStr = Object.entries(byStatus)
        .map(([s, n]) => `${n} ${s}`)
        .join(", ")
      const recent = data[0]?.title || "—"
      return `[list_posts] ${data.length} posts. Statuts : ${statusStr}. Dernier : "${recent}"`
    }

    if (toolName === "get_stats" && !Array.isArray(data)) {
      const d = data as Record<string, number>
      return `[get_stats] ${d.totalPosts} posts, ${d.publishedThisMonth} publiés ce mois, ${d.draftsCount} brouillons, ${d.newVeilleItems} veille, ${d.avgImpressions} impressions moy.`
    }

    if (toolName === "get_daily_summary") {
      const d = data as Record<string, unknown>
      const posts = Array.isArray(d.recent_posts) ? d.recent_posts.length : 0
      const drafts = d.pending_drafts_count ?? 0
      const veille = Array.isArray(d.top_veille_items) ? d.top_veille_items.length : 0
      return `[get_daily_summary] ${posts} posts récents, ${drafts} brouillons en attente, ${veille} items veille`
    }

    if (
      (toolName === "generate_draft" || toolName === "create_draft") &&
      !Array.isArray(data)
    ) {
      const title = (data.title as string) || "Sans titre"
      const pillar = (data.pillar as string) || "?"
      const words = ((data.content as string) || "").split(/\s+/).length
      const id = data.id as string
      return `[${toolName}] Draft créé : "${title}" (${pillar}, ~${words} mots, id:${id})`
    }

    if (toolName === "update_post" && !Array.isArray(data)) {
      return `[update_post] Post modifié : "${data.title}" (status:${data.status})`
    }

    if (toolName === "get_post" && !Array.isArray(data)) {
      return `[get_post] "${data.title}" (status:${data.status}, pillar:${data.pillar})`
    }

    if (toolName === "add_veille_source" && !Array.isArray(data)) {
      if (data.error) return `[add_veille_source] Erreur : ${data.message}`
      const s = data.source as Record<string, unknown>
      return `[add_veille_source] Source ajoutée : "${s?.name}" (${s?.type}, ${s?.language}). Total : ${data.total_sources}`
    }

    if (toolName === "attach_image_to_post" && !Array.isArray(data)) {
      if (data.error) return `[attach_image_to_post] Erreur : ${data.message}`
      return `[attach_image_to_post] Image attachée au post "${data.title}" (${data.media_count} image(s))`
    }

    if (toolName === "create_reminder" && !Array.isArray(data)) {
      return `[create_reminder] ${data.message || "Rappel créé"}`
    }

    if (toolName === "list_reminders" && Array.isArray(data)) {
      if (data.length === 0) return "[list_reminders] Aucun rappel actif"
      const items = data.slice(0, 5).map(
        (r) => `• ${r.action_type} (${r.frequency}) — ${new Date(String(r.scheduled_at)).toLocaleString("fr-CA", { timeZone: "America/Montreal" })}`
      ).join("\n")
      return `[list_reminders] ${data.length} rappel(s) actif(s) :\n${items}`
    }

    if (toolName === "cancel_reminder" && !Array.isArray(data)) {
      return `[cancel_reminder] ${data.message || "Rappel annulé"}`
    }

    if (toolName === "publish_to_linkedin" && !Array.isArray(data)) {
      if (!data.success) return `[publish_to_linkedin] Erreur : ${data.error}`
      return `[publish_to_linkedin] Post "${data.post_title}" publié sur LinkedIn (ID: ${data.linkedin_post_id})`
    }

    // Fallback: truncated JSON
    const json = JSON.stringify(data)
    return `[${toolName}] ${json.slice(0, 200)}${json.length > 200 ? "..." : ""}`
  } catch {
    return `[${toolName}] Résultat reçu`
  }
}
