import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import type { ContentStrategy } from "@/lib/agent-context"

export async function GET() {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "content_strategy")
    .single()

  return NextResponse.json({ strategy: data?.value ?? null })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const strategy = body.strategy as ContentStrategy

  if (!strategy || !Array.isArray(strategy.pillars)) {
    return NextResponse.json(
      { error: "strategy.pillars est requis" },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()
  await supabase.from("settings").upsert({
    key: "content_strategy",
    value: strategy as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ strategy })
}
