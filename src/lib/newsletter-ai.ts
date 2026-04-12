import { getAnthropicClient } from "@/lib/anthropic"
import type { VeilleItem, Post } from "@/types"

const NEWSLETTER_PROMPT = `Tu generes la newsletter hebdomadaire "IA Friday" de Yannick Maillard.

CONTEXTE :
Yannick est un vibe coder a Montreal (ex-producteur video, originaire de Guadeloupe) qui democratise l'IA pour les dirigeants de PME.

STRUCTURE DE LA NEWSLETTER (4 sections) :
1. EDITO (3-4 lignes) : Ton personnel, direct, vouvoiement. Ce qui m'a marque cette semaine dans l'IA.
2. TOP ACTUS IA (3-5 items) : Les actus les plus pertinentes pour les PME. Pour chaque : titre en gras, 2-3 lignes d'explication non technique, angle PME.
3. POST DE LA SEMAINE : Le meilleur post LinkedIn de Yannick cette semaine (resume + lien si dispo).
4. CTA : Question ouverte ou invitation a repondre a l'email.

REGLES :
- Ton accessible, zero jargon, VOUVOIEMENT obligatoire (jamais de "tu/ton/tes")
- Tout en francais
- HTML valide pour email (pas de CSS externe, inline styles uniquement)
- Pas de section "Ressource de la semaine"
- Les titres de sections en <h2> avec style inline
- Les liens en bleu (#2563eb)

Retourne un JSON valide :
{
  "subject": "IA Friday #X — [accroche courte]",
  "intro": "[edito 3-4 lignes]",
  "content_html": "[HTML complet des 4 sections]"
}`

export async function generateNewsletterDraft(
  veilleItems: VeilleItem[],
  publishedPosts: Post[]
): Promise<{ subject: string; intro: string; content_html: string }> {
  const client = getAnthropicClient()

  const veilleContext = veilleItems
    .slice(0, 10)
    .map((item, i) => `${i + 1}. "${item.title}" (score: ${item.relevance_score}) — ${item.summary || ""}`)
    .join("\n")

  const postsContext = publishedPosts
    .slice(0, 5)
    .map((p, i) => `${i + 1}. "${p.title || p.content.slice(0, 60)}" (pilier: ${p.pillar || "non defini"})`)
    .join("\n")

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: NEWSLETTER_PROMPT,
    messages: [
      {
        role: "user",
        content: `Genere la newsletter IA Friday de cette semaine.

VEILLE DE LA SEMAINE (top items par pertinence) :
${veilleContext || "Aucun item de veille cette semaine."}

POSTS LINKEDIN PUBLIES CETTE SEMAINE :
${postsContext || "Aucun post publie cette semaine."}`,
      },
    ],
  })

  const text = response.content[0].type === "text" ? response.content[0].text : ""
  const jsonStr = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim()

  try {
    const data = JSON.parse(jsonStr)
    return {
      subject: data.subject || "IA Friday — Le recap de la semaine",
      intro: data.intro || "",
      content_html: data.content_html || "",
    }
  } catch {
    return {
      subject: "IA Friday — Le recap de la semaine",
      intro: "",
      content_html: `<p>Erreur de generation. Contenu brut :</p><pre>${text.slice(0, 1000)}</pre>`,
    }
  }
}
