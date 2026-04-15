import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import type { AgentProfile } from "@/lib/agent-context"

export async function GET() {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "agent_profile")
    .single()

  return NextResponse.json({ profile: data?.value ?? null })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const profile = body.profile as AgentProfile

  if (!profile || !profile.name || !profile.background) {
    return NextResponse.json(
      { error: "profile.name et profile.background sont requis" },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()
  await supabase.from("settings").upsert({
    key: "agent_profile",
    value: profile as unknown as Record<string, unknown>,
  })

  return NextResponse.json({ profile })
}
