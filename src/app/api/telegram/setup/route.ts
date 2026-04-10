import { NextRequest, NextResponse } from "next/server"
import { setWebhook } from "@/lib/telegram"

export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development"
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl || baseUrl.includes("localhost")) {
    return NextResponse.json({
      error: "Webhook requires a public URL. Deploy to Vercel first, then set NEXT_PUBLIC_APP_URL.",
      hint: "In dev, use ngrok or similar to expose localhost.",
    }, { status: 400 })
  }

  const webhookUrl = `${baseUrl}/api/telegram/webhook`
  const result = await setWebhook(webhookUrl)

  return NextResponse.json({
    success: result.ok,
    webhook_url: webhookUrl,
    telegram_response: result,
  })
}
