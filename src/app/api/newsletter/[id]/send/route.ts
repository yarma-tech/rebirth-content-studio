import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import { sendBatchNewsletter } from "@/lib/resend"
import { renderNewsletterHtml } from "@/lib/newsletter-template"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  // Get newsletter
  const { data: newsletter, error: nlError } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single()

  if (nlError || !newsletter) {
    return NextResponse.json({ error: "Newsletter introuvable" }, { status: 404 })
  }

  if (newsletter.status === "sent") {
    return NextResponse.json({ error: "Newsletter deja envoyee" }, { status: 400 })
  }

  // Get active subscribers
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("email")
    .eq("status", "active")

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: "Aucun abonne actif" }, { status: 400 })
  }

  // Update status to sending
  await supabase
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", id)

  // Send
  const results = await sendBatchNewsletter(
    subscribers,
    newsletter.subject,
    (unsubscribeUrl) => renderNewsletterHtml(newsletter.content_html || "", unsubscribeUrl)
  )

  // Update status to sent
  await supabase
    .from("newsletters")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      recipient_count: results.sent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  return NextResponse.json({
    success: true,
    sent: results.sent,
    failed: results.failed,
  })
}
