import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  summary: z.string().nullable().optional(),
  pme_angle: z.string().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  source_name: z.string().nullable().optional(),
  suggested_format: z.enum(["post", "video", "both"]).nullable().optional(),
  urgency: z.enum(["immediate", "this_week", "backlog"]).optional(),
  relevance_score: z.number().min(0).max(1).nullable().optional(),
  status: z.enum(["new", "reviewed", "used", "dismissed"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("veille_items")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}
