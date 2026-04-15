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

export async function sendVeilleSuggestions(items: Array<{
  title: string
  source_name: string | null
  relevance_score: number
  pme_angle: string | null
}>): Promise<void> {
  const header = `🔍 <b>Suggestions du jour</b> — ${items.length} sujet${items.length > 1 ? "s pertinents" : " pertinent"}`

  const lines = items.map((item, i) => {
    const pct = Math.round(item.relevance_score * 100)
    const source = item.source_name ? ` — ${item.source_name}` : ""
    const angle = item.pme_angle
      ? `\n   ${item.pme_angle.length > 80 ? item.pme_angle.slice(0, 77) + "..." : item.pme_angle}`
      : ""
    return `${i + 1}. <b>${item.title}</b> (${pct}%)${source}${angle}`
  })

  const text = [
    header,
    "",
    ...lines,
    "",
    "Reponds avec le titre pour que je redige un brouillon 👇",
  ].join("\n")

  await sendMessage(text)
}

export async function notifyError(context: string, error: string): Promise<void> {
  await sendMessage(
    `⚠️ <b>Erreur ${context}</b>\n\n<code>${error.slice(0, 500)}</code>`
  )
}
