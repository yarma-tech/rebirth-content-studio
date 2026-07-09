import { NextRequest, NextResponse } from "next/server"

// Diagnostic endpoint to verify what the server actually receives from the
// environment. Helps debug the "invalid client_id" OAuth error without touching
// Vercel logs. The client_id is public (it appears in the OAuth redirect URL),
// so it is safe to return; the client secret is NEVER returned — only a boolean.
export async function GET(request: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID ?? null
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET ?? null
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  return NextResponse.json({
    clientIdConfigured: Boolean(clientId),
    // Public value — compare this with the Client ID shown in the LinkedIn app.
    clientId,
    // Detect stray whitespace/quotes that break the match on LinkedIn's side.
    clientIdLength: clientId?.length ?? 0,
    clientIdHasWhitespace: clientId ? /\s/.test(clientId) : false,
    clientSecretConfigured: Boolean(clientSecret),
    appUrlSource: process.env.NEXT_PUBLIC_APP_URL ? "env" : "request_origin",
    appUrl,
    // Must match EXACTLY an authorized Redirect URL in the LinkedIn app.
    redirectUri: `${appUrl}/api/auth/linkedin/callback`,
  })
}
