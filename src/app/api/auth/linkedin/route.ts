import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET(request: NextRequest) {
  // Base URL used for the redirect_uri and for redirecting back on error.
  // Fall back to the request origin if NEXT_PUBLIC_APP_URL is not configured.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const clientId = process.env.LINKEDIN_CLIENT_ID

  // Guard: without a client ID we would send `client_id=undefined` to LinkedIn,
  // which surfaces as the confusing "invalid client_id" error. Fail clearly instead.
  if (!clientId) {
    return NextResponse.redirect(`${appUrl}/settings?linkedin_error=missing_config`)
  }

  const state = randomBytes(16).toString("hex")
  const redirectUri = `${appUrl}/api/auth/linkedin/callback`

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "openid profile w_member_social",
  })

  const response = NextResponse.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`
  )

  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  return response
}
