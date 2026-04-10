import { Resend } from "resend"
import { createHmac } from "crypto"

let resendClient: Resend | null = null

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || "fallback-secret"
  return createHmac("sha256", secret).update(email).digest("hex")
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  return generateUnsubscribeToken(email) === token
}

export function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"
  return `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`
}

export async function sendNewsletterEmail(
  to: string,
  subject: string,
  html: string,
  unsubscribeUrl: string
) {
  const resend = getResend()
  const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || "onboarding@resend.dev"

  return resend.emails.send({
    from: `IA Friday — Yannick Maillard <${fromEmail}>`,
    to,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  })
}

export async function sendBatchNewsletter(
  subscribers: Array<{ email: string }>,
  subject: string,
  htmlTemplate: (unsubscribeUrl: string) => string
) {
  const results = { sent: 0, failed: 0, errors: [] as string[] }

  // Resend batch: send individually for unsubscribe link personalization
  for (const sub of subscribers) {
    const unsubUrl = getUnsubscribeUrl(sub.email)
    const html = htmlTemplate(unsubUrl)
    try {
      await sendNewsletterEmail(sub.email, subject, html, unsubUrl)
      results.sent++
    } catch (err) {
      results.failed++
      results.errors.push(`${sub.email}: ${err instanceof Error ? err.message : "unknown"}`)
    }
  }

  return results
}
