import { NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function GET() {
  const state = randomBytes(16).toString("hex")
  const clientId = process.env.LINKEDIN_CLIENT_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`

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
