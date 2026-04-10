import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServiceClient } from "@/lib/supabase"

const createSubscriberSchema = z.object({
  email: z.string().email(),
  first_name: z.string().nullable().optional(),
  source: z.enum(["linkedin", "website", "manual", "other"]).default("manual"),
  interests: z.array(z.string()).default([]),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const source = searchParams.get("source")
  const limit = parseInt(searchParams.get("limit") || "100")

  const supabase = getServiceClient()

  let query = supabase
    .from("subscribers")
    .select("*", { count: "exact" })
    .order("subscribed_at", { ascending: false })
    .limit(limit)

  if (status) {
    query = query.eq("status", status)
  }
  if (source) {
    query = query.eq("source", source)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscribers: data, total: count ?? 0 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = createSubscriberSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from("subscribers")
    .insert({
      email: parsed.data.email.toLowerCase().trim(),
      first_name: parsed.data.first_name?.trim() || null,
      source: parsed.data.source,
      interests: parsed.data.interests,
      status: "active",
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Un contact avec cet email existe deja" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscriber: data }, { status: 201 })
}
