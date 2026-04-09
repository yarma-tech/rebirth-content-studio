import { NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"

export async function GET() {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("veille_scan_log")
    .select("*")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single()

  if (!data) {
    return NextResponse.json({ completed_at: null })
  }

  return NextResponse.json(data)
}
