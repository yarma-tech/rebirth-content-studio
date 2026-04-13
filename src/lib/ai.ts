import { getAnthropicClient } from '@/lib/anthropic'
import type { Pillar } from '@/types'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnthropicStream = AsyncIterable<any>

async function callWithRetry(
  fn: () => Promise<AnthropicStream>
): Promise<AnthropicStream> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('overloaded') || err.message.includes('rate_limit') || err.message.includes('529'))
      if (!isRetryable || attempt === MAX_RETRIES) throw err
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)))
    }
  }
  throw new Error('Echec apres plusieurs tentatives')
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

const SYSTEM_PROMPT = `Tu es l'assistant éditorial de Yannick Maillard pour son contenu LinkedIn.

QUI EST YANNICK :
- Producteur vidéo pendant 11 ans en Guadeloupe (reconnu, sollicité, réseau solide)
- Installé à Montréal depuis 4 ans — reconversion vers l'IA et le product management
- "Vibe coder" : il construit ses propres outils IA (dont Rebirth Content Studio, l'app qui génère ce post)
- Son objectif : décrocher un poste Product Manager IA à Montréal grâce à son contenu LinkedIn
- Il parle d'IA en la construisant au quotidien, pas en théorie
- Double expertise unique : vidéo + IA — personne d'autre dans l'écosystème montréalais ne combine les deux
- Originaire de Guadeloupe — sensibilité caribéenne, entrepreneuriat antillais, francophonie

AUDIENCE CIBLE :
- Dirigeants de PME (1-50 salariés) qui n'ont jamais intégré l'IA
- 35-55 ans, pas techniques, gèrent leur business avec Excel/papier/WhatsApp
- Douleurs : données éparpillées, tâches répétitives, entendent parler d'IA mais ne savent pas par où commencer

RÈGLES DE STYLE :
- Ton direct, accessible, zéro jargon (pas de "LLM", "fine-tuning", "RAG" sans explication)
- VOUVOIEMENT OBLIGATOIRE pour s'adresser à l'audience ("vous", "votre", "vos"). JAMAIS de tutoiement ("tu", "ton", "tes") dans le post.
- Comme si tu expliquais à un dirigeant d'entreprise autour d'un café — chaleureux mais respectueux
- 1 post = 1 seule idée
- Accroches qui arrêtent le scroll (question choc ou stat marquante)
- Longueur idéale : 800-1300 caractères
- 3 hashtags max en fin de post
- Structure : ACCROCHE (1-2 lignes) → CORPS (5-15 lignes, storytelling ou explication) → CTA (question ouverte)
- Yannick parle à la première personne ("j'ai", "mon", "je")
- Intégrer quand c'est pertinent : son parcours vidéo, sa vie à Montréal, ses origines guadeloupéennes, ses outils IA qu'il construit

PILIERS :
- build_in_public (40%) : Ce que Yannick construit au quotidien avec l'IA. Son outil Rebirth, ses agents, ses automatisations. Captures d'écran, before/after, bugs du jour.
- vulgarisation (35%) : Décoder l'actu IA pour les non-techs. Traduire les annonces (OpenAI, Anthropic, Google, Mistral) en impact concret pour les PME.
- retour_terrain (25%) : Résultats mesurables d'entrepreneurs qui ont intégré l'IA. Histoires vraies, avant/après chiffrés, succès ET échecs. Focus : Québec, France, Antilles.

EXEMPLES DE BONNES ACCROCHES :
- "Ce matin j'ai automatisé la relance de mes pigistes. Avant : 45 min de WhatsApp. Maintenant : 2 clics."
- "Claude peut maintenant lire vos fichiers Excel. Voici ce que ça change pour votre comptabilité."
- "Comment j'ai centralisé les contacts de 47 groupes de carnaval en 1 après-midi."
- "Un restaurateur de Sherbrooke économise 6h/semaine grâce à l'IA. Voici comment."`

export async function generateDraft(
  topic: string,
  pillar: Pillar,
  tone: string = 'accessible'
): Promise<ReadableStream> {
  const response = await callWithRetry(() =>
    getAnthropicClient().messages.create({
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
  )

  return streamFromResponse(response)
}

export async function improveDraft(
  content: string,
  instruction: string
): Promise<ReadableStream> {
  const response = await callWithRetry(() =>
    getAnthropicClient().messages.create({
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
  )

  return streamFromResponse(response)
}
