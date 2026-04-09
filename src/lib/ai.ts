import Anthropic from '@anthropic-ai/sdk'
import type { Pillar } from '@/types'

function getClient() {
  return new Anthropic({
    apiKey: process.env.REBIRTH_ANTHROPIC_KEY,
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
- Tutoiement par défaut
- Comme si tu expliquais à un pote entrepreneur autour d'un café
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
- "Claude peut maintenant lire tes fichiers Excel. Voici ce que ça change pour ta comptabilité."
- "Comment j'ai centralisé les contacts de 47 groupes de carnaval en 1 après-midi."
- "Un restaurateur de Sherbrooke économise 6h/semaine grâce à l'IA. Voici comment."`

export async function generateDraft(
  topic: string,
  pillar: Pillar,
  tone: string = 'accessible'
): Promise<ReadableStream> {
  const response = await getClient().messages.create({
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
  const response = await getClient().messages.create({
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
