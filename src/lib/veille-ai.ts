import Anthropic from "@anthropic-ai/sdk"

export interface RawFeedItem {
  title: string
  link: string
  description: string
  pubDate: string
  sourceName: string
  sourceCategory: string
  sourceLanguage: string
}

export interface ScoredItem {
  title: string
  link: string
  relevance_score: number
  summary: string
  pme_angle: string | null
  urgency: "immediate" | "this_week" | "backlog"
  suggested_format: "post" | "video" | "both"
}

function getClient() {
  return new Anthropic({
    apiKey: process.env.REBIRTH_ANTHROPIC_KEY,
  })
}

const SCORING_PROMPT = `Tu es un moteur de veille IA pour Yannick Maillard, qui cree du contenu LinkedIn pour les dirigeants de PME (1-50 salaries).

CRITERES DE PERTINENCE (score 0 a 1) :
- 0.8-1.0 : Histoire concrete d'un entrepreneur/PME qui a implemente l'IA (succes ou echec). Bonus si Quebec, France ou Antilles.
- 0.6-0.8 : Actualite IA avec impact direct sur les PME (nouvel outil accessible, changement de prix, reglementation).
- 0.4-0.6 : Actualite IA interessante mais angle PME indirect (grosse annonce, nouveau modele).
- 0.2-0.4 : Contenu tech general, peu d'interet pour les PME.
- 0.0-0.2 : Recherche academique pure, enterprise-only, pas pertinent.

Pour chaque article, retourne :
- relevance_score (float 0-1)
- summary (2-3 phrases en francais, non technique, angle PME)
- pme_angle (1 phrase : en quoi ca concerne un dirigeant de PME, ou null si non pertinent)
- urgency : "immediate" (publier aujourd'hui), "this_week", "backlog"
- suggested_format : "post" (texte LinkedIn), "video" (face camera), "both"

Reponds UNIQUEMENT avec un tableau JSON valide, sans markdown, sans commentaire.
Format : [{"index": 0, "relevance_score": 0.7, "summary": "...", "pme_angle": "...", "urgency": "this_week", "suggested_format": "post"}, ...]`

export async function scoreVeilleItems(items: RawFeedItem[]): Promise<ScoredItem[]> {
  if (items.length === 0) return []

  const itemsList = items
    .map((item, i) => `[${i}] "${item.title}" — ${item.description?.slice(0, 200) || "Pas de description"} (Source: ${item.sourceName}, ${item.sourceLanguage})`)
    .join("\n")

  const client = getClient()
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    system: SCORING_PROMPT,
    messages: [
      {
        role: "user",
        content: `Analyse et score ces ${items.length} articles :\n\n${itemsList}`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""

  // Parse JSON response — handle potential markdown wrapping
  const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()

  let scored: Array<{
    index: number
    relevance_score: number
    summary: string
    pme_angle: string | null
    urgency: string
    suggested_format: string
  }>

  try {
    scored = JSON.parse(jsonStr)
  } catch {
    console.error("[veille-ai] Failed to parse scoring response:", text.slice(0, 500))
    return []
  }

  return scored
    .filter((s) => s.relevance_score >= 0.3)
    .map((s) => ({
      title: items[s.index]?.title ?? "Sans titre",
      link: items[s.index]?.link ?? "",
      relevance_score: s.relevance_score,
      summary: s.summary,
      pme_angle: s.pme_angle,
      urgency: (s.urgency as ScoredItem["urgency"]) || "this_week",
      suggested_format: (s.suggested_format as ScoredItem["suggested_format"]) || "post",
    }))
}
