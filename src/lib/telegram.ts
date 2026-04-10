const TELEGRAM_API = "https://api.telegram.org/bot"

function getToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || ""
}

function getChatId(): string {
  return process.env.TELEGRAM_AUTHORIZED_CHAT_ID || ""
}

export function isAuthorized(chatId: number | string): boolean {
  return String(chatId) === getChatId()
}

export async function sendMessage(text: string, chatId?: string): Promise<void> {
  const token = getToken()
  const targetChat = chatId || getChatId()
  if (!token || !targetChat) return

  await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChat,
      text,
      parse_mode: "HTML",
    }),
  })
}

export async function editMessage(
  messageId: number,
  text: string,
  chatId?: string
): Promise<void> {
  const token = getToken()
  const targetChat = chatId || getChatId()

  await fetch(`${TELEGRAM_API}${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChat,
      message_id: messageId,
      text,
      parse_mode: "HTML",
    }),
  })
}

export async function sendTyping(chatId?: string): Promise<void> {
  const token = getToken()
  const targetChat = chatId || getChatId()

  await fetch(`${TELEGRAM_API}${token}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: targetChat,
      action: "typing",
    }),
  })
}

export async function setWebhook(url: string): Promise<{ ok: boolean; description?: string }> {
  const token = getToken()
  const res = await fetch(`${TELEGRAM_API}${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  return res.json()
}
