import Anthropic from '@anthropic-ai/sdk'
import type { Pillar } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const SYSTEM_PROMPT = `Tu es l'assistant éditorial de Yannick Maillard pour son contenu LinkedIn.
Tu génères des posts LinkedIn destinés aux dirigeants de PME (1-50 salariés) qui n'ont jamais intégré l'IA.

RÈGLES DE STYLE :
- Ton direct, accessible, zéro jargon technique (pas de "LLM", "fine-tuning", "RAG" sans explication)
- Tutoiement par défaut
- 1 post = 1 seule idée
- Accroches qui arrêtent le scroll
- Longueur idéale : 800-1300 caractères
- 3 hashtags max en fin de post
- Structure : ACCROCHE (1-2 lignes) → CORPS (5-15 lignes, storytelling ou explication) → CTA (question ouverte)

PILIERS :
- build_in_public : Ce que Yannick construit au quotidien avec l'IA, pourquoi, comment
- vulgarisation : Décoder l'actu IA pour les non-techs, traduire les annonces en impact PME
- retour_terrain : Résultats mesurables, avant/après, témoignages, cas concrets d'entrepreneurs`

export async function generateDraft(
  topic: string,
  pillar: Pillar,
  tone: string = 'accessible'
): Promise<ReadableStream> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    stream: true,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Génère un post LinkedIn sur le pilier "${pillar}".

Sujet/idée : ${topic}
Ton souhaité : ${tone}

Génère UNIQUEMENT le post LinkedIn (accroche + corps + CTA + hashtags). Pas de commentaire ni d'explication avant ou après.`,
      },
    ],
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for await (const event of response) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })
}

export async function improveDraft(
  content: string,
  instruction: string
): Promise<ReadableStream> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    stream: true,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Voici un brouillon de post LinkedIn :

---
${content}
---

Instruction d'amélioration : ${instruction}

Génère UNIQUEMENT la version améliorée du post. Pas de commentaire ni d'explication.`,
      },
    ],
  })

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      for await (const event of response) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }
      controller.close()
    },
  })
}
