import { NextRequest } from "next/server"
import { getServiceClient } from "@/lib/supabase"
import { verifyUnsubscribeToken } from "@/lib/resend"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  const token = searchParams.get("token")

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return new Response(
      `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h1>Lien invalide</h1>
        <p>Ce lien de desinscription est invalide ou a expire.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } }
    )
  }

  const supabase = getServiceClient()
  await supabase
    .from("subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("email", email.toLowerCase())

  return new Response(
    `<!DOCTYPE html><html lang="fr"><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h1>Desinscription confirmee</h1>
      <p>Tu ne recevras plus IA Friday. A bientot peut-etre !</p>
      <p style="margin-top:24px;"><a href="https://www.linkedin.com/in/yannick-maillard">Suivre Yannick sur LinkedIn</a></p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" } }
  )
}
