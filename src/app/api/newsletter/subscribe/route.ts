import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get("email") as string
  const firstName = formData.get("first_name") as string | null
  const honeypot = formData.get("company_name") as string | null
  const interests = formData.getAll("interests") as string[]

  // Honeypot check
  if (honeypot) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/confirmation`
    )
  }

  if (!email || !email.includes("@")) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?error=invalid_email`
    )
  }

  const supabase = getServiceClient()

  // Upsert: if already exists and unsubscribed, re-activate
  const { error } = await supabase.from("subscribers").upsert(
    {
      email: email.toLowerCase().trim(),
      first_name: firstName?.trim() || null,
      interests: interests.length > 0 ? interests : [],
      source: "website",
      status: "active",
      subscribed_at: new Date().toISOString(),
      unsubscribed_at: null,
    },
    { onConflict: "email" }
  )

  if (error) {
    console.error("[subscribe] Error:", error.message)
  }

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/subscribe/confirmation`
  )
}
