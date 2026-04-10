import { NextRequest, NextResponse } from "next/server"
import { isAuthorized, sendMessage, sendTyping } from "@/lib/telegram"
import { processTelegramMessage } from "@/lib/telegram-ai"

interface TelegramUpdate {
  message?: {
    message_id: number
    chat: { id: number }
    text?: string
    from?: { first_name?: string }
  }
}

export async function POST(request: NextRequest) {
  let update: TelegramUpdate
  try {
    update = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = update.message
  if (!message?.text || !message.chat) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const text = message.text

  // Auth check
  if (!isAuthorized(chatId)) {
    return NextResponse.json({ ok: true })
  }

  // Handle /start
  if (text === "/start") {
    await sendMessage(
      [
        `👋 <b>Salut Yannick !</b>`,
        "",
        "Je suis ton assistant Rebirth Content Studio.",
        "",
        "<b>Commandes :</b>",
        "/resume — Resume du jour",
        "/veille — Top sujets de veille",
        "/draft <i>sujet</i> — Generer un brouillon",
        "/posts — Derniers posts",
        "",
        "Ou parle-moi en langage naturel !",
      ].join("\n"),
      String(chatId)
    )
    return NextResponse.json({ ok: true })
  }

  // Handle /help
  if (text === "/help") {
    await sendMessage(
      [
        "<b>Commandes disponibles :</b>",
        "",
        "/resume — Resume quotidien (veille + posts + stats)",
        "/veille — Top 5 sujets de veille",
        "/draft <i>sujet</i> — Generer un brouillon de post",
        "/posts — Lister les derniers posts",
        "/newsletter — Statut de la newsletter",
        "",
        "Tu peux aussi me parler normalement !",
      ].join("\n"),
      String(chatId)
    )
    return NextResponse.json({ ok: true })
  }

  // Send typing indicator
  await sendTyping(String(chatId))

  // Process with AI
  try {
    const response = await processTelegramMessage(text)
    await sendMessage(response, String(chatId))
  } catch (err) {
    console.error("[telegram] AI error:", err)
    await sendMessage(
      "⚠️ Erreur lors du traitement. Reessaie dans quelques secondes.",
      String(chatId)
    )
  }

  return NextResponse.json({ ok: true })
}
