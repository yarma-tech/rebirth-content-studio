import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Newsletter introuvable" }, { status: 404 })
  }
  return NextResponse.json({ newsletter: data })
}

const patchSchema = z.object({
  subject: z.string().min(1).optional(),
  intro: z.string().nullable().optional(),
  content_html: z.string().nullable().optional(),
  status: z.enum(["draft", "ready", "sending", "sent"]).optional(),
  regenerate: z.literal(true).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  // Regenerate: re-run AI draft generation and update in place
  if (parsed.data.regenerate) {
    const { generateNewsletterDraft } = await import("@/lib/newsletter-ai")

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

    const { data, error } = await supabase
      .from("newsletters")
      .update({
        subject: draft.subject,
        intro: draft.intro,
        content_html: draft.content_html,
        content_json: { regenerated: true, veille_count: veilleRes.data?.length || 0 },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ newsletter: data })
  }

  // Normal update with validated fields only
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.subject !== undefined) updates.subject = parsed.data.subject
  if (parsed.data.intro !== undefined) updates.intro = parsed.data.intro
  if (parsed.data.content_html !== undefined) updates.content_html = parsed.data.content_html
  if (parsed.data.status !== undefined) updates.status = parsed.data.status

  const { data, error } = await supabase
    .from("newsletters")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ newsletter: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()
  const { error } = await supabase.from("newsletters").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
