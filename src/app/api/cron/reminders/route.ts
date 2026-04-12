import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import { sendMessage } from "@/lib/telegram"
import { getDashboardStats } from "@/lib/stats"

const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rebirth-content-studio.vercel.app"

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
  const errors: Array<{ id: string; error: string }> = []

  // 1. Fetch due reminders
  const { data: reminders } = await supabase
    .from("telegram_reminders")
    .select("*")
    .eq("status", "active")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(20)

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ success: true, processed: 0 })
  }

  let sent = 0

  for (const reminder of reminders) {
    try {
      // 2. Build message based on action_type
      const message = await buildReminderMessage(reminder, supabase)

      // 3. Send to Telegram
      await sendMessage(message, reminder.chat_id)
      sent++

      // 4. Update status
      if (reminder.frequency === "once") {
        await supabase
          .from("telegram_reminders")
          .update({ status: "sent", last_sent_at: now })
          .eq("id", reminder.id)
      } else {
        // Recurring: compute next scheduled_at
        const next = computeNextSchedule(
          reminder.scheduled_at,
          reminder.frequency
        )
        await supabase
          .from("telegram_reminders")
          .update({ scheduled_at: next, last_sent_at: now })
          .eq("id", reminder.id)
      }
    } catch (err) {
      errors.push({
        id: reminder.id,
        error: String(err instanceof Error ? err.message : err).slice(0, 200),
      })
    }
  }

  return NextResponse.json({
    success: true,
    processed: reminders.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  })
}

// ─── Build message from action type ─────────────────────────────────

interface Reminder {
  action_type: string
  custom_message?: string | null
  action_params?: Record<string, unknown> | null
}

async function buildReminderMessage(
  reminder: Reminder,
  supabase: ReturnType<typeof getServiceClient>
): Promise<string> {
  switch (reminder.action_type) {
    case "stats": {
      const stats = await getDashboardStats()
      return [
        "⏰ <b>Rappel — Tes stats</b>",
        "",
        `📊 <b>${stats.totalPosts}</b> posts au total`,
        `✅ <b>${stats.publishedThisMonth}</b> publiés ce mois`,
        `📝 <b>${stats.draftsCount}</b> brouillons en attente`,
        `🔍 <b>${stats.newVeilleItems}</b> nouveaux sujets de veille`,
        `👀 <b>${stats.avgImpressions}</b> impressions moyennes`,
        "",
        `👉 ${DASHBOARD_URL}`,
      ].join("\n")
    }

    case "veille": {
      const limit =
        (reminder.action_params?.limit as number) || 5
      const minScore =
        (reminder.action_params?.min_score as number) || 0
      const { data: items } = await supabase
        .from("veille_items")
        .select(
          "title, summary, relevance_score, source_name, urgency"
        )
        .eq("status", "new")
        .gte("relevance_score", minScore)
        .order("relevance_score", { ascending: false })
        .limit(limit)

      if (!items || items.length === 0) {
        return "⏰ <b>Rappel veille</b> — Aucun nouveau sujet détecté."
      }

      const lines = items.map((v, i) => {
        const pct = Math.round(v.relevance_score * 100)
        const src = v.source_name ? ` — ${v.source_name}` : ""
        const summary = v.summary
          ? `\n   ${v.summary.slice(0, 80)}...`
          : ""
        return `${i + 1}. <b>${v.title}</b> (${pct}%)${src}${summary}`
      })

      return [
        `⏰ <b>Rappel — Top ${items.length} veille</b>`,
        "",
        ...lines,
        "",
        `👉 ${DASHBOARD_URL}/veille`,
      ].join("\n")
    }

    case "posts": {
      const limit =
        (reminder.action_params?.limit as number) || 5
      const status =
        (reminder.action_params?.status as string) || "draft"
      const { data: posts } = await supabase
        .from("posts")
        .select("id, title, status, created_at")
        .eq("status", status)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (!posts || posts.length === 0) {
        return `⏰ <b>Rappel posts</b> — Aucun post en statut "${status}".`
      }

      const lines = posts.map(
        (p, i) => `${i + 1}. <b>${p.title || "Sans titre"}</b>`
      )

      return [
        `⏰ <b>Rappel — ${posts.length} posts (${status})</b>`,
        "",
        ...lines,
        "",
        `👉 ${DASHBOARD_URL}/posts`,
      ].join("\n")
    }

    case "resume": {
      const stats = await getDashboardStats()
      const { data: veille } = await supabase
        .from("veille_items")
        .select("title, relevance_score")
        .eq("status", "new")
        .order("relevance_score", { ascending: false })
        .limit(3)

      const veilleLines = (veille || []).map(
        (v) =>
          `• ${v.title} (${Math.round(v.relevance_score * 100)}%)`
      )

      return [
        "⏰ <b>Rappel — Résumé du jour</b>",
        "",
        `📊 <b>${stats.publishedThisMonth}</b> publiés ce mois · <b>${stats.draftsCount}</b> brouillons`,
        "",
        veilleLines.length > 0
          ? `🔍 Top veille :\n${veilleLines.join("\n")}`
          : "🔍 Pas de nouveau sujet de veille",
        "",
        `👉 ${DASHBOARD_URL}`,
      ].join("\n")
    }

    case "post_stats": {
      const postId = reminder.action_params?.post_id as string | undefined
      const postTitle = reminder.action_params?.post_title as string | undefined

      let postQuery = supabase
        .from("posts")
        .select("id, title, status, published_at")
      if (postId) postQuery = postQuery.eq("id", postId)
      else if (postTitle) postQuery = postQuery.ilike("title", `%${postTitle}%`)
      else return "⏰ <b>Rappel post_stats</b> — Aucun post spécifié."

      const { data: post } = await postQuery.limit(1).single()
      if (!post) return `⏰ <b>Rappel</b> — Post "${postTitle || postId}" non trouvé.`

      const { data: analytics } = await supabase
        .from("post_analytics")
        .select("impressions, likes, comments, shares, clicks, engagement_rate")
        .eq("post_id", post.id)
        .order("snapshot_at", { ascending: false })
        .limit(1)
        .single()

      if (!analytics) {
        return [
          `⏰ <b>Stats — "${post.title}"</b>`,
          "",
          "Pas encore de données analytics pour ce post.",
          `Statut : ${post.status}`,
          "",
          `👉 ${DASHBOARD_URL}/posts/${post.id}`,
        ].join("\n")
      }

      return [
        `⏰ <b>Stats — "${post.title}"</b>`,
        "",
        `👀 <b>${analytics.impressions}</b> impressions`,
        `👍 <b>${analytics.likes}</b> likes`,
        `💬 <b>${analytics.comments}</b> commentaires`,
        `🔄 <b>${analytics.shares}</b> partages`,
        analytics.engagement_rate
          ? `📈 Engagement : <b>${(analytics.engagement_rate * 100).toFixed(1)}%</b>`
          : "",
        "",
        `👉 ${DASHBOARD_URL}/posts/${post.id}`,
      ]
        .filter(Boolean)
        .join("\n")
    }

    case "custom":
    default:
      return `⏰ <b>Rappel</b>\n\n${reminder.custom_message || "Tu m'as demandé de te rappeler ça !"}`
  }
}

// ─── Compute next occurrence for recurring reminders ─────────────────

function computeNextSchedule(
  currentSchedule: string,
  frequency: string
): string {
  const now = new Date()
  const next = new Date(currentSchedule)
  const incrementDays = frequency === "weekly" ? 7 : 1

  // Advance until the next occurrence is in the future
  while (next <= now) {
    next.setDate(next.getDate() + incrementDays)
  }

  return next.toISOString()
}
