import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  const supabase = await createSupabaseServerClient()

  // Flow token_hash (magic link SSR) : sans code_verifier -> marche meme si
  // le lien est ouvert dans un autre navigateur que celui de la demande.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) {
      console.error("[auth/callback] verifyOtp:", error.message)
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Flow PKCE (?code) : OAuth / fallback. Exige le code_verifier en cookie
  // (meme navigateur que la demande).
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("[auth/callback] exchangeCodeForSession:", error.message)
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/?error=missing_code`)
}
