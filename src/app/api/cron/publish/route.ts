import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import { publishToLinkedIn } from "@/lib/linkedin-publish"
import { sendMessage } from "@/lib/telegram"

export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = getServiceClient()
  const now = new Date().toISOString()

  // Fetch posts scheduled for now or earlier
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title")
    .eq("status", "scheduled")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(5)

  if (!posts || posts.length === 0) {
    return NextResponse.json({ success: true, published: 0 })
  }

  let published = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const post of posts) {
    try {
      const result = await publishToLinkedIn(post.id)

      if (result.success) {
        published++
        // Notify via Telegram
        await sendMessage(
          [
            `✅ <b>Post publié automatiquement !</b>`,
            "",
            `"${post.title || "Sans titre"}"`,
            result.linkedin_post_id
              ? `LinkedIn ID: <code>${result.linkedin_post_id}</code>`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
        ).catch(() => {})
      } else {
        errors.push({ id: post.id, error: result.error || "Unknown error" })

        // Notify failure via Telegram
        await sendMessage(
          [
            `❌ <b>Échec publication programmée</b>`,
            "",
            `"${post.title || "Sans titre"}"`,
            `Erreur : ${result.error}`,
          ].join("\n")
        ).catch(() => {})
      }
    } catch (err) {
      errors.push({
        id: post.id,
        error: String(err instanceof Error ? err.message : err).slice(0, 200),
      })
    }
  }

  return NextResponse.json({
    success: true,
    checked: posts.length,
    published,
    errors: errors.length > 0 ? errors : undefined,
  })
}
