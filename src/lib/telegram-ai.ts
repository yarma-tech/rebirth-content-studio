import Anthropic from "@anthropic-ai/sdk"
import { MCP_TOOLS } from "@/lib/mcp/tools"
import { getServiceClient } from "@/lib/supabase"

function getClient() {
  return new Anthropic({
    apiKey: process.env.REBIRTH_ANTHROPIC_KEY,
  })
}

const SYSTEM_PROMPT = `Tu es l'assistant Telegram de Yannick Maillard pour Rebirth Content Studio.

Yannick est un vibe coder a Montreal qui cree du contenu LinkedIn pour democratiser l'IA pour les PME.

Tu peux :
- Donner un resume quotidien (veille, brouillons en attente, stats)
- Generer un brouillon de post LinkedIn
- Lister les posts par statut
- Consulter la veille recente
- Repondre a des questions sur le contenu ou la strategie

REGLES :
- Reponds en francais, ton direct et concis
- Utilise le HTML pour formater (<b>, <i>, <code>)
- Pas de markdown (Telegram utilise HTML)
- Sois bref — c'est un chat mobile, pas un email
- Si Yannick demande de generer un post, utilise le tool generate_draft
- Si on te demande un resume, query les posts et la veille

COMMANDES RACCOURCIES (mais tu comprends aussi le langage naturel) :
/resume — Resume quotidien
/veille — Top sujets de veille
/draft <sujet> — Generer un brouillon de post
/posts — Lister les derniers posts`

export async function processTelegramMessage(
  messageText: string
): Promise<string> {
  const client = getClient()

  // Build tool definitions for Claude
  const tools: Anthropic.Tool[] = MCP_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
  }))

  // Add a summary tool
  tools.push({
    name: "get_daily_summary",
    description: "Obtenir le resume quotidien : posts recents, brouillons en attente, sujets de veille",
    input_schema: { type: "object" as const, properties: {} },
  })

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: messageText },
  ]

  let response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    tools,
    messages,
  })

  // Handle tool use loop (max 3 iterations)
  let iterations = 0
  while (response.stop_reason === "tool_use" && iterations < 3) {
    iterations++
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ContentBlock & { type: "tool_use" } => b.type === "tool_use"
    )

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      let result: string

      if (toolUse.name === "get_daily_summary") {
        result = await getDailySummary()
      } else {
        const mcpTool = MCP_TOOLS.find((t) => t.name === toolUse.name)
        if (mcpTool) {
          try {
            const toolResult = await mcpTool.handler(toolUse.input as Record<string, unknown>)
            result = JSON.stringify(toolResult, null, 2)
          } catch (err) {
            result = `Error: ${err instanceof Error ? err.message : "Unknown error"}`
          }
        } else {
          result = `Tool ${toolUse.name} not found`
        }
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: result,
      })
    }

    messages.push({ role: "assistant", content: response.content })
    messages.push({ role: "user", content: toolResults })

    response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    })
  }

  // Extract final text response
  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === "text"
  )

  return textBlocks.map((b) => b.text).join("\n") || "Pas de reponse."
}

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
