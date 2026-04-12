import { NextRequest, NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/stats"

export async function GET(request: NextRequest) {
  // Block external requests: allow cron (with secret) or same-origin
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron) {
    const origin = request.headers.get("origin") || request.headers.get("referer") || ""
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
    if (!origin.startsWith(appUrl)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const stats = await getDashboardStats()
  return NextResponse.json(stats)
}
