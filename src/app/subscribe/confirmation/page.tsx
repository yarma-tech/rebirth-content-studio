import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Inscription confirmee — IA Friday",
  robots: { index: false },
}

export default function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mx-auto">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenue dans IA Friday !
        </h1>
        <p className="text-muted-foreground text-lg">
          Tu recevras ton premier recap IA vendredi soir.<br />
          En attendant, retrouve-moi sur LinkedIn.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="https://www.linkedin.com/in/yannick-maillard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:bg-[#004182] transition-colors"
          >
            Suivre sur LinkedIn
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-accent transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Decouvrir Rebirth
          </Link>
        </div>
      </div>
    </div>
  )
}
