import type { Metadata } from "next"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "IA Friday — Newsletter hebdomadaire IA pour les PME",
  description: "Chaque vendredi, le recap des meilleures actus IA vulgarisees pour les dirigeants de PME. Par Yannick Maillard.",
  openGraph: {
    title: "IA Friday — Newsletter IA pour les PME",
    description: "Le recap hebdomadaire des actus IA qui comptent pour ton business.",
    type: "website",
  },
}

const INTERESTS = [
  "Claude Code",
  "ChatGPT",
  "Gouvernance IA",
  "IA et PME",
  "Automatisation",
]

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">IA Friday</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            L&apos;IA expliquee simplement,<br />chaque vendredi.
          </h1>
          <p className="text-muted-foreground text-lg">
            Le recap des actus IA qui comptent pour ton business.<br />
            Zero jargon. Direct. Actionnable.
          </p>
        </div>

        {/* Form */}
        <form
          action="/api/newsletter/subscribe"
          method="POST"
          className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm"
        >
          {/* Honeypot */}
          <div className="hidden" aria-hidden="true">
            <input type="text" name="company_name" tabIndex={-1} autoComplete="off" />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="ton@email.com"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label htmlFor="first_name" className="block text-sm font-medium mb-1.5">
              Prenom <span className="text-muted-foreground font-normal">(facultatif)</span>
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              placeholder="Yannick"
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium mb-2">
              Centres d&apos;interet <span className="text-muted-foreground font-normal">(facultatif)</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <label
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-input bg-background text-sm cursor-pointer hover:bg-accent transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary/30"
                >
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest}
                    className="sr-only"
                  />
                  <span>{interest}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            Recevoir IA Friday
          </button>

          <p className="text-xs text-muted-foreground text-center">
            1 email par semaine, le vendredi soir. Desabonnement en 1 clic.
          </p>
        </form>

        {/* Social proof */}
        <p className="text-center text-sm text-muted-foreground">
          Par <span className="font-medium text-foreground">Yannick Maillard</span> — Vibe Coder, Montreal
        </p>
      </div>
    </div>
  )
}
