import { NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"

export async function GET() {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "linkedin")
    .single()

  if (!data?.value) {
    return NextResponse.json({ connected: false })
  }

  const creds = data.value as {
    access_token: string
    expires_at: string
    name: string
    picture: string
    connected_at: string
  }

  const expired = new Date(creds.expires_at) < new Date()

  return NextResponse.json({
    connected: !expired,
    expired,
    name: creds.name,
    picture: creds.picture,
    connected_at: creds.connected_at,
    expires_at: creds.expires_at,
  })
}
