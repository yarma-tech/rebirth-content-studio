import Image from "next/image"

import { LoginForm } from "@/components/login-form"

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Ce lien a expiré ou est invalide. Demande un nouveau lien ci-dessous.",
  missing_code: "Le lien d'authentification est incomplet. Réessaie depuis ton email.",
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] ?? null : null

  return (
    <main className="dark relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,_oklch(0.488_0.243_264.376_/_0.18),_transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-40 right-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_oklch(0.7_0.16_320_/_0.10),_transparent_70%)] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      <div className="relative grid min-h-dvh md:grid-cols-[3fr_2fr]">
        <section className="flex flex-col justify-between gap-12 px-8 py-10 md:px-16 md:py-14">
          <header className="flex items-center gap-3">
            <Image
              src="/logo-rebirth-v2.png"
              alt="Rebirth Content Studio"
              width={1000}
              height={1000}
              priority
              className="size-12 md:size-14"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground md:text-base">
              Rebirth Studio
            </span>
          </header>

          <div className="max-w-2xl space-y-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Rebirth · Content Studio
            </p>
            <h1 className="text-[clamp(2.25rem,5vw,4rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              <span className="text-muted-foreground">L&apos;écriture augmentée,</span>{" "}
              <span className="text-foreground">pas remplacée.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              LinkedIn, newsletter, veille — un partenaire de rédaction qui comprend votre voix et la garde intacte.
            </p>
          </div>

          <footer className="flex items-center justify-between text-xs text-muted-foreground">
            <span>© 2026 — yarma.tech</span>
            <span className="font-mono uppercase tracking-wider">v0.1</span>
          </footer>
        </section>

        <section className="flex items-center justify-center border-t border-border/40 bg-card/40 px-6 py-12 backdrop-blur-sm md:border-l md:border-t-0 md:px-10">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Connexion</h2>
              <p className="text-sm text-muted-foreground">
                Accédez à votre studio en un clic. Lien magique par email — pas de mot de passe.
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {errorMessage}
              </div>
            )}

            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  )
}
