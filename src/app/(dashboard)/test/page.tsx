"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, Circle, RotateCcw, Download } from "lucide-react"

type Status = "pending" | "pass" | "fail"

interface TestItem {
  id: string
  title: string
  description?: string
}

interface TestSection {
  id: string
  title: string
  items: TestItem[]
}

interface TestResult {
  status: Status
  comment: string
  updatedAt?: string
}

const STORAGE_KEY = "rebirth-test-state-v1"

const SECTIONS: TestSection[] = [
  {
    id: "contacts",
    title: "Page Contacts (nouveau)",
    items: [
      {
        id: "contacts-load",
        title: "La page /contacts charge sans erreur",
        description: "Aller dans la sidebar > Contacts. La page s'affiche, on voit Anais et Billy.",
      },
      {
        id: "contacts-filters",
        title: "Les filtres fonctionnent",
        description: "Cliquer sur 'Actifs', 'Manuel', 'Website'. Le compteur et la liste s'adaptent.",
      },
      {
        id: "contacts-add",
        title: "Ajouter un contact via le Dialog",
        description: "Cliquer sur 'Ajouter un contact', remplir email + prenom + interets, valider. Le contact apparait.",
      },
      {
        id: "contacts-edit",
        title: "Modifier un contact existant",
        description: "Cliquer sur le crayon, changer le prenom ou les interets, sauvegarder. La table se met a jour.",
      },
      {
        id: "contacts-toggle-status",
        title: "Desabonner / reactiver un contact",
        description: "Cliquer sur l'icone UserX. Le badge passe en 'Desabonne'. Cliquer encore pour reactiver.",
      },
      {
        id: "contacts-delete",
        title: "Supprimer un contact",
        description: "Cliquer sur la corbeille, confirmer. Le contact disparait.",
      },
      {
        id: "contacts-conflict",
        title: "Tentative d'ajout d'un email deja existant",
        description: "Essayer d'ajouter morganti.anais@hotmail.com. Doit afficher une erreur 'existe deja'.",
      },
    ],
  },
  {
    id: "veille",
    title: "Page Veille (refonte recente)",
    items: [
      {
        id: "veille-table",
        title: "Tableau s'affiche avec 7 colonnes en desktop",
        description: "Sujet, Source, Score, Format, Urgence, Detecte, Actions.",
      },
      {
        id: "veille-summary-1line",
        title: "Le resume est tronque sur UNE seule ligne",
        description: "Pas de second ligne ni d'angle PME visible dans la table.",
      },
      {
        id: "veille-click-preview",
        title: "Clic sur une ligne ouvre la modal de preview avec backdrop blur",
        description: "L'arriere-plan est floute, la modal montre titre + badges + resume + angle PME + lien.",
      },
      {
        id: "veille-stop-propagation",
        title: "Cliquer sur le bouton 'Modifier' n'ouvre PAS la preview",
        description: "Le crayon ouvre directement la modal d'edition, pas la preview.",
      },
      {
        id: "veille-source-link",
        title: "Cliquer sur le lien de la source ouvre l'article externe (pas la preview)",
        description: "Dans la colonne Source, l'icone lien externe ouvre un nouvel onglet.",
      },
      {
        id: "veille-create-draft",
        title: "Generer un brouillon IA depuis la preview",
        description: "Bouton 'Generer un brouillon IA' dans la modal preview. Redirige vers /posts/[id].",
      },
      {
        id: "veille-scan",
        title: "Bouton 'Scanner' lance un scan manuel",
        description: "Toast affiche le nombre de nouveaux sujets ajoutes.",
      },
    ],
  },
  {
    id: "newsletter",
    title: "Newsletter IA Friday",
    items: [
      {
        id: "nl-page-loads",
        title: "La page /newsletter charge et affiche les editions",
        description: "Liste tabulaire des newsletters (sujet, statut, envoyes, ouverture, clics, date).",
      },
      {
        id: "nl-generate",
        title: "Generation auto d'une newsletter",
        description: "Bouton qui agrege la veille de la semaine et cree un brouillon.",
      },
      {
        id: "nl-edit",
        title: "Edition d'un brouillon",
        description: "Modifier sujet, intro, contenu HTML.",
      },
      {
        id: "nl-send-test",
        title: "Envoi de test (a soi-meme)",
        description: "Verifier que l'email arrive bien dans Gmail/Resend dashboard.",
      },
    ],
  },
  {
    id: "smoke",
    title: "Smoke tests (regression)",
    items: [
      { id: "smoke-dashboard", title: "/ — Dashboard charge sans erreur" },
      { id: "smoke-posts", title: "/posts charge sans erreur" },
      { id: "smoke-veille", title: "/veille charge sans erreur" },
      { id: "smoke-calendrier", title: "/calendrier charge sans erreur" },
      { id: "smoke-newsletter", title: "/newsletter charge sans erreur" },
      { id: "smoke-contacts", title: "/contacts charge sans erreur" },
      { id: "smoke-settings", title: "/settings charge sans erreur" },
      {
        id: "smoke-console",
        title: "Aucune erreur console sur les pages principales",
        description: "Ouvrir la devtools console sur chaque page. Pas d'erreur React, pas de hydration warning.",
      },
    ],
  },
  {
    id: "telegram",
    title: "Bot Telegram",
    items: [
      {
        id: "tg-cmd-veille",
        title: "Commande /veille repond avec les sujets recents",
      },
      {
        id: "tg-cmd-stats",
        title: "Commande /stats repond avec les metriques",
      },
      {
        id: "tg-notification",
        title: "Notifications de sujets chauds arrivent",
        description: "Apres un scan veille, un sujet >0.8 doit declencher une notification.",
      },
    ],
  },
]

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items)

function loadResults(): Record<string, TestResult> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, TestResult>
  } catch {
    return {}
  }
}

function saveResults(results: Record<string, TestResult>) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
}

export default function TestPage() {
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setResults(loadResults())
    setHydrated(true)
  }, [])

  const updateResult = (id: string, patch: Partial<TestResult>) => {
    setResults((prev) => {
      const next = {
        ...prev,
        [id]: {
          status: prev[id]?.status ?? "pending",
          comment: prev[id]?.comment ?? "",
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }
      saveResults(next)
      return next
    })
  }

  const stats = useMemo(() => {
    const total = ALL_ITEMS.length
    let pass = 0
    let fail = 0
    for (const item of ALL_ITEMS) {
      const r = results[item.id]
      if (r?.status === "pass") pass++
      if (r?.status === "fail") fail++
    }
    return { total, pass, fail, pending: total - pass - fail }
  }, [results])

  const handleReset = () => {
    if (!confirm("Reinitialiser tous les resultats ? Tes commentaires seront perdus.")) return
    setResults({})
    saveResults({})
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), results }, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rebirth-tests-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
          <p className="text-muted-foreground mt-1">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
          <p className="text-muted-foreground mt-1">
            {stats.pass}/{stats.total} valides — {stats.fail} echec{stats.fail > 1 ? "s" : ""} — {stats.pending} en attente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reinitialiser
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>📌 Page locale (localStorage uniquement)</span>
            <span>·</span>
            <span>Tes commentaires ne sont pas envoyes au serveur</span>
            <span>·</span>
            <span>Utilise &quot;Exporter&quot; pour archiver tes resultats</span>
          </div>
        </CardContent>
      </Card>

      {SECTIONS.map((section) => {
        const sectionPass = section.items.filter((it) => results[it.id]?.status === "pass").length
        return (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <Badge variant="outline" className="text-xs">
                {sectionPass}/{section.items.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {section.items.map((item) => {
                const r = results[item.id]
                const status = r?.status ?? "pending"
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-1 pt-0.5">
                          <button
                            onClick={() =>
                              updateResult(item.id, {
                                status: status === "pass" ? "pending" : "pass",
                              })
                            }
                            className={
                              status === "pass"
                                ? "text-green-600 hover:text-green-700"
                                : "text-muted-foreground/40 hover:text-green-600"
                            }
                            title="Marquer comme passe"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              updateResult(item.id, {
                                status: status === "fail" ? "pending" : "fail",
                              })
                            }
                            className={
                              status === "fail"
                                ? "text-red-600 hover:text-red-700"
                                : "text-muted-foreground/40 hover:text-red-600"
                            }
                            title="Marquer comme echec"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p
                                className={
                                  status === "pass"
                                    ? "text-sm font-medium text-muted-foreground line-through"
                                    : "text-sm font-medium"
                                }
                              >
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {status === "pending" && (
                              <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                            )}
                            {status === "pass" && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 shrink-0">
                                OK
                              </Badge>
                            )}
                            {status === "fail" && (
                              <Badge variant="secondary" className="bg-red-100 text-red-800 shrink-0">
                                Echec
                              </Badge>
                            )}
                          </div>
                          <Textarea
                            placeholder="Commentaire / bug observe / amelioration..."
                            value={r?.comment ?? ""}
                            onChange={(e) => updateResult(item.id, { comment: e.target.value })}
                            className="min-h-[60px] text-xs resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
