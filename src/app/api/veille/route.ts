import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

const createVeilleSchema = z.object({
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  pme_angle: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  source_name: z.string().nullable().optional(),
  suggested_format: z.enum(["post", "video", "both"]).nullable().optional(),
  urgency: z.enum(["immediate", "this_week", "backlog"]).default("this_week"),
  relevance_score: z.number().min(0).max(1).nullable().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = parseInt(searchParams.get("limit") || "50")

  const supabase = getServiceClient()

  let query = supabase
    .from("veille_items")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createVeilleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("veille_items")
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data }, { status: 201 })
}
