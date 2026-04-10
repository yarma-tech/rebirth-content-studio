import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import { generateNewsletterDraft } from "@/lib/newsletter-ai"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "20")

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ newsletters: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const autoGenerate = body.auto_generate !== false

  const supabase = getServiceClient()

  if (autoGenerate) {
    // Fetch this week's veille and published posts
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
      .insert({
        subject: draft.subject,
        intro: draft.intro,
        content_html: draft.content_html,
        content_json: { generated: true, veille_count: veilleRes.data?.length || 0 },
        status: "draft",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ newsletter: data }, { status: 201 })
  }

  // Manual creation
  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      subject: body.subject || "IA Friday",
      intro: body.intro || null,
      content_html: body.content_html || null,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ newsletter: data }, { status: 201 })
}
