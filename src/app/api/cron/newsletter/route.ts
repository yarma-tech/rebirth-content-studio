import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import { generateNewsletterDraft } from "@/lib/newsletter-ai"
import { sendBatchNewsletter } from "@/lib/resend"
import { renderNewsletterHtml } from "@/lib/newsletter-template"
import { notifyNewsletterReady } from "@/lib/telegram-notifications"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = getServiceClient()

  // Check for a newsletter marked as "ready" and scheduled for now or earlier
  const { data: readyNewsletter } = await supabase
    .from("newsletters")
    .select("*")
    .eq("status", "ready")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single()

  if (readyNewsletter) {
    // Send it
    const { data: subscribers } = await supabase
      .from("subscribers")
      .select("email")
      .eq("status", "active")

    if (subscribers && subscribers.length > 0) {
      await supabase
        .from("newsletters")
        .update({ status: "sending" })
        .eq("id", readyNewsletter.id)

      const results = await sendBatchNewsletter(
        subscribers,
        readyNewsletter.subject,
        (unsubUrl) => renderNewsletterHtml(readyNewsletter.content_html || "", unsubUrl)
      )

      await supabase
        .from("newsletters")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          recipient_count: results.sent,
        })
        .eq("id", readyNewsletter.id)

      return NextResponse.json({
        action: "sent",
        newsletter_id: readyNewsletter.id,
        sent: results.sent,
        failed: results.failed,
      })
    }
  }

  // No ready newsletter — auto-generate a draft
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [veilleRes, postsRes] = await Promise.all([
    supabase
      .from("veille_items")
      .select("*")
      .gte("detected_at", oneWeekAgo)
      .order("relevance_score", { ascending: false })
      .limit(15),
    supabase
      .from("posts")
      .select("*")
      .eq("status", "published")
      .gte("published_at", oneWeekAgo)
      .limit(10),
  ])

  const draft = await generateNewsletterDraft(
    veilleRes.data || [],
    postsRes.data || []
  )

  const { data: newNl } = await supabase
    .from("newsletters")
    .insert({
      subject: draft.subject,
      intro: draft.intro,
      content_html: draft.content_html,
      status: "draft",
    })
    .select()
    .single()

  // Notify via Telegram
  if (newNl) {
    await notifyNewsletterReady({ subject: draft.subject, id: newNl.id }).catch(console.error)
  }

  return NextResponse.json({
    action: "generated_draft",
    newsletter_id: newNl?.id,
    subject: draft.subject,
  })
}
