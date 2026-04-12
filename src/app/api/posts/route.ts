import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

const createPostSchema = z.object({
  title: z.string().nullable().optional(),
  content: z.string().min(1, "Le contenu est requis"),
  pillar: z.enum(["build_in_public", "vulgarisation", "retour_terrain"]).nullable().optional(),
  status: z.enum(["idea", "draft", "ready", "scheduled", "published", "archived"]).default("draft"),
  hashtags: z.array(z.string()).default([]),
  media_urls: z.array(z.string().url()).default([]),
  ai_generated: z.boolean().default(false),
  scheduled_at: z.string().nullable().optional(),
  source_veille_id: z.string().uuid().nullable().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const limit = parseInt(searchParams.get("limit") || "50")

  const supabase = getServiceClient()

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  if (from) {
    query = query.gte("scheduled_at", from)
  }
  if (to) {
    query = query.lte("scheduled_at", to)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createPostSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("posts")
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data }, { status: 201 })
}
