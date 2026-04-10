import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

const updateSchema = z.object({
  first_name: z.string().nullable().optional(),
  interests: z.array(z.string()).optional(),
  source: z.enum(["linkedin", "website", "manual", "other"]).optional(),
  status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
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

  const updates: Record<string, unknown> = { ...parsed.data }
  if (parsed.data.status === "unsubscribed") {
    updates.unsubscribed_at = new Date().toISOString()
  } else if (parsed.data.status === "active") {
    updates.unsubscribed_at = null
  }

  const { data, error } = await supabase
    .from("subscribers")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscriber: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = getServiceClient()

  const { error } = await supabase.from("subscribers").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
