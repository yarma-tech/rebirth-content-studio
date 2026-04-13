import { getAnthropicClient } from '@/lib/anthropic'
import { buildDynamicContext } from '@/lib/agent-context'
import type { Pillar } from '@/types'

const PRIMARY_MODEL = 'claude-sonnet-4-20250514'
const FALLBACK_MODEL = 'claude-haiku-4-5-20251001'
const SONNET_RETRIES = 3
const RETRY_DELAY_MS = 2000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnthropicStream = AsyncIterable<any>

async function callStreamWithFallback(
  params: { system: string; messages: { role: "user" | "assistant"; content: string }[]; max_tokens: number }
): Promise<AnthropicStream> {
  const client = getAnthropicClient()
  const createParams = { ...params, stream: true as const }

  // Try Sonnet 3 times
  for (let attempt = 1; attempt <= SONNET_RETRIES; attempt++) {
    try {
      return await client.messages.create({ ...createParams, model: PRIMARY_MODEL })
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('overloaded') || err.message.includes('rate_limit') || err.message.includes('529'))
      if (!isRetryable) throw err
      if (attempt < SONNET_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)))
      }
    }
  }
  // Fallback to Haiku
  console.log('[ai] Sonnet overloaded, fallback to Haiku')
  return await client.messages.create({ ...createParams, model: FALLBACK_MODEL })
}

function streamFromResponse(response: AnthropicStream): ReadableStream {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur de generation'
        controller.enqueue(encoder.encode(`\n\n[ERREUR: ${msg}]`))
        controller.close()
      }
    },
  })
}

// Base style rules (static) — profile, audience, strategy loaded dynamically from DB
const BASE_STYLE_RULES = `RÈGLES DE STYLE :
- Ton direct, accessible, zéro jargon (pas de "LLM", "fine-tuning", "RAG" sans explication)
- VOUVOIEMENT OBLIGATOIRE pour s'adresser à l'audience ("vous", "votre", "vos"). JAMAIS de tutoiement ("tu", "ton", "tes") dans le post.
- Comme si tu expliquais à un dirigeant d'entreprise autour d'un café — chaleureux mais respectueux
- 1 post = 1 seule idée
- Accroches qui arrêtent le scroll (question choc ou stat marquante)
- Longueur idéale : 800-1300 caractères
- 3 hashtags max en fin de post
- Structure : ACCROCHE (1-2 lignes) → CORPS (5-15 lignes, storytelling ou explication) → CTA (question ouverte)
- Yannick parle à la première personne ("j'ai", "mon", "je")
- Intégrer quand c'est pertinent : son parcours vidéo, sa vie à Montréal, ses origines guadeloupéennes, ses outils IA qu'il construit`

async function getEnrichedSystemPrompt(): Promise<string> {
  const dynamicContext = await buildDynamicContext("post_generation")

  return `Tu es l'assistant éditorial de Yannick Maillard pour son contenu LinkedIn.

${dynamicContext}

${BASE_STYLE_RULES}`
}

export async function generateDraft(
  topic: string,
  pillar: Pillar,
  tone: string = 'accessible'
): Promise<ReadableStream> {
  const systemPrompt = await getEnrichedSystemPrompt()
  const response = await callStreamWithFallback({
    system: systemPrompt,
    max_tokens: 1500,
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

  return streamFromResponse(response)
}

export async function improveDraft(
  content: string,
  instruction: string
): Promise<ReadableStream> {
  const systemPrompt = await getEnrichedSystemPrompt()
  const response = await callStreamWithFallback({
    system: systemPrompt,
    max_tokens: 1500,
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

  return streamFromResponse(response)
}
