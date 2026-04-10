"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Newspaper, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import type { Newsletter } from "@/types"
import { NEWSLETTER_STATUS_LABELS } from "@/types"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  ready: "bg-emerald-100 text-emerald-800",
  sending: "bg-blue-100 text-blue-800",
  sent: "bg-green-100 text-green-800",
}

export default function NewsletterPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetch("/api/newsletter?limit=20")
      .then((r) => r.json())
      .then((d) => setNewsletters(d.newsletters || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_generate: true }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      toast.success("Newsletter generee !")
      window.location.href = `/newsletter/${data.newsletter.id}`
    } catch {
      toast.error("Erreur lors de la generation")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter</h1>
          <p className="text-muted-foreground mt-1">IA Friday — recap hebdomadaire</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {generating ? "Generation..." : "Nouvelle newsletter"}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : newsletters.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Aucune newsletter</p>
          <p className="text-sm mt-1">Genere ta premiere IA Friday.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Sujet</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Envoyes</th>
                <th className="text-right px-4 py-3 font-medium">Ouverture</th>
                <th className="text-right px-4 py-3 font-medium">Clics</th>
                <th className="text-right px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {newsletters.map((nl) => {
                const openRate = nl.recipient_count > 0
                  ? Math.round((nl.open_count / nl.recipient_count) * 100)
                  : 0
                const clickRate = nl.recipient_count > 0
                  ? Math.round((nl.click_count / nl.recipient_count) * 100)
                  : 0

                return (
                  <tr key={nl.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3">
                      <Link href={`/newsletter/${nl.id}`} className="font-medium hover:text-primary transition-colors">
                        {nl.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={STATUS_COLORS[nl.status]}>
                        {NEWSLETTER_STATUS_LABELS[nl.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {nl.recipient_count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {nl.status === "sent" ? `${openRate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {nl.status === "sent" ? `${clickRate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {nl.sent_at
                        ? formatDistanceToNow(new Date(nl.sent_at), { addSuffix: true, locale: fr })
                        : formatDistanceToNow(new Date(nl.created_at), { addSuffix: true, locale: fr })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
