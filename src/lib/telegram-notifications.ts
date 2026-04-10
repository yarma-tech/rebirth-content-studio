import { sendMessage } from "@/lib/telegram"

export async function notifyUrgentVeille(item: {
  title: string
  summary?: string | null
  source_name?: string | null
  relevance_score?: number | null
}): Promise<void> {
  const score = item.relevance_score
    ? ` (${Math.round(item.relevance_score * 100)}%)`
    : ""
  const source = item.source_name ? ` — ${item.source_name}` : ""

  const text = [
    `🔴 <b>Sujet urgent detecte</b>${score}${source}`,
    "",
    `<b>${item.title}</b>`,
    item.summary ? `\n${item.summary}` : "",
    "",
    "Reponds /draft pour generer un post dessus.",
  ]
    .filter(Boolean)
    .join("\n")

  await sendMessage(text)
}

export async function notifyNewsletterReady(newsletter: {
  subject: string
  id: string
}): Promise<void> {
  await sendMessage(
    [
      `📧 <b>Newsletter prete a valider</b>`,
      "",
      `Sujet : ${newsletter.subject}`,
      "",
      `Va sur le dashboard pour la relire et l'envoyer.`,
    ].join("\n")
  )
}

export async function notifyError(context: string, error: string): Promise<void> {
  await sendMessage(
    `⚠️ <b>Erreur ${context}</b>\n\n<code>${error.slice(0, 500)}</code>`
  )
}
