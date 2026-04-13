import { NextRequest, NextResponse } from "next/server"
import { isAuthorized, sendMessage, sendTyping } from "@/lib/telegram"
import { processTelegramMessage } from "@/lib/telegram-ai"
import { uploadFromTelegram } from "@/lib/image-upload"

interface TelegramPhoto {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

interface TelegramUpdate {
  message?: {
    message_id: number
    chat: { id: number }
    text?: string
    caption?: string
    photo?: TelegramPhoto[]
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
  if (!message?.chat) {
    return NextResponse.json({ ok: true })
  }

  const chatId = message.chat.id
  const hasPhoto = message.photo && message.photo.length > 0
  const text = message.text || message.caption || ""

  // Ignore messages with no text AND no photo
  if (!text && !hasPhoto) {
    return NextResponse.json({ ok: true })
  }

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
        "/stats — Metriques du studio",
        "/draft <i>sujet</i> — Generer un brouillon",
        "/posts — Derniers posts",
        "📷 Envoie une photo pour l'attacher a un post",
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
        "/stats — Metriques (posts, publies, brouillons, veille, impressions)",
        "/draft <i>sujet</i> — Generer un brouillon de post",
        "/posts — Lister les derniers posts",
        "/newsletter — Statut de la newsletter",
        "📷 Photo + caption — Attacher une image a un post",
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
    let imageUrl: string | undefined

    // Upload photo to Supabase if present
    if (hasPhoto && message.photo) {
      try {
        // Take the largest resolution (last in the array)
        const largestPhoto = message.photo[message.photo.length - 1]
        imageUrl = await uploadFromTelegram(largestPhoto.file_id)
      } catch (err) {
        console.error("[telegram] Photo upload error:", err)
        await sendMessage(
          "⚠️ Erreur lors de l'upload de la photo. Reessaie.",
          String(chatId)
        )
        return NextResponse.json({ ok: true })
      }
    }

    const response = await processTelegramMessage(
      text,
      String(chatId),
      imageUrl
    )
    await sendMessage(response, String(chatId))
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error("[telegram] AI error:", errMsg, err)
    await sendMessage(
      `⚠️ Erreur lors du traitement: ${errMsg.slice(0, 200)}`,
      String(chatId)
    )
  }

  return NextResponse.json({ ok: true })
}
