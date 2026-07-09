import { NextRequest, NextResponse } from "next/server"
import { getServiceClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const storedState = request.cookies.get("linkedin_oauth_state")?.value

  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=${error}`)
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=invalid_state`)
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=missing_config`)
  }

  // Exchange code for access token
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${appUrl}/api/auth/linkedin/callback`,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error("[LinkedIn OAuth] Token exchange failed:", err)
    return NextResponse.redirect(
      `${appUrl}/settings?linkedin_error=token_exchange_failed`
    )
  }

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token
  const expiresIn = tokenData.expires_in // seconds

  // Fetch user profile to get the person URN
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!profileRes.ok) {
    console.error("[LinkedIn OAuth] Profile fetch failed:", await profileRes.text())
    return NextResponse.redirect(
      `${appUrl}/settings?linkedin_error=profile_fetch_failed`
    )
  }

  const profile = await profileRes.json()

  // Store in Supabase settings
  const supabase = getServiceClient()
  await supabase.from("settings").upsert({
    key: "linkedin",
    value: {
      access_token: accessToken,
      expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      person_urn: `urn:li:person:${profile.sub}`,
      name: profile.name,
      picture: profile.picture,
      connected_at: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  })

  const response = NextResponse.redirect(
    `${appUrl}/settings?linkedin_connected=true`
  )
  response.cookies.delete("linkedin_oauth_state")
  return response
}
