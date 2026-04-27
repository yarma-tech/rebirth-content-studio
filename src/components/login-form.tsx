"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

type Status = "idle" | "loading" | "sent"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email) return
    setStatus("loading")

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus("idle")
      toast.error("Impossible d'envoyer le lien", { description: error.message })
      return
    }

    setStatus("sent")
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-border/60 bg-card/40 px-5 py-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-5 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Lien envoyé</p>
          <p className="text-sm text-muted-foreground">
            Vérifie <span className="text-foreground">{email}</span>. Le lien expire dans 1 heure.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus("idle")
            setEmail("")
          }}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Utiliser un autre email
        </button>
      </div>
    )
  }

  const loading = status === "loading"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@entreprise.fr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            className="h-11 pl-9 text-sm"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={loading}
        className="group h-11 w-full text-sm"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            Recevoir le lien
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Pas de mot de passe. Un lien magique arrive dans votre boîte mail. Premier accès ? Le compte est créé automatiquement.
      </p>
    </form>
  )
}
