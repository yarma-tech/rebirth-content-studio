"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Save, Send, Loader2, RefreshCw, Eye } from "lucide-react"
import { toast } from "sonner"
import type { Newsletter } from "@/types"
import { NEWSLETTER_STATUS_LABELS } from "@/types"

export default function NewsletterEditorPage() {
  const params = useParams()
  const [nl, setNl] = useState<Newsletter | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [subject, setSubject] = useState("")
  const [intro, setIntro] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetch(`/api/newsletter/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setNl(d.newsletter)
        setSubject(d.newsletter.subject || "")
        setIntro(d.newsletter.intro || "")
        setContentHtml(d.newsletter.content_html || "")
      })
      .catch(() => toast.error("Newsletter introuvable"))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/newsletter/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, intro, content_html: contentHtml }),
      })
      if (!res.ok) throw new Error()
      toast.success("Sauvegarde !")
    } catch {
      toast.error("Erreur")
    } finally {
      setSaving(false)
    }
  }

  const handleMarkReady = async () => {
    try {
      const res = await fetch(`/api/newsletter/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ready" }),
      })
      if (!res.ok) throw new Error()
      setNl((prev) => prev ? { ...prev, status: "ready" } : prev)
      toast.success("Newsletter marquee comme prete !")
    } catch {
      toast.error("Erreur")
    }
  }

  const handleSend = async () => {
    setSending(true)
    try {
      const res = await fetch(`/api/newsletter/${params.id}/send`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Erreur d'envoi")
        return
      }
      setNl((prev) => prev ? { ...prev, status: "sent" } : prev)
      toast.success(`Newsletter envoyee a ${data.sent} abonnes !`)
    } catch {
      toast.error("Erreur de connexion")
    } finally {
      setSending(false)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/newsletter/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSubject(data.newsletter.subject)
      setIntro(data.newsletter.intro || "")
      setContentHtml(data.newsletter.content_html || "")
      toast.success("Contenu regenere !")
    } catch {
      toast.error("Erreur de regeneration")
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>
  }

  if (!nl) {
    return <p className="text-center py-16 text-destructive">Newsletter introuvable</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editer la newsletter</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{NEWSLETTER_STATUS_LABELS[nl.status]}</Badge>
            {nl.recipient_count > 0 && (
              <span className="text-sm text-muted-foreground">{nl.recipient_count} envois</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Objet</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" disabled={nl.status === "sent"} />
          </div>
          <div>
            <Label htmlFor="intro">Edito</Label>
            <Textarea id="intro" value={intro} onChange={(e) => setIntro(e.target.value)} className="mt-1" rows={3} disabled={nl.status === "sent"} />
          </div>
          <div>
            <Label htmlFor="html">Contenu HTML</Label>
            <Textarea id="html" value={contentHtml} onChange={(e) => setContentHtml(e.target.value)} className="mt-1 font-mono text-xs" rows={15} disabled={nl.status === "sent"} />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border flex-wrap">
            {nl.status !== "sent" && (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={handleRegenerate} disabled={regenerating}>
                  {regenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Regenerer
                </Button>
                {nl.status === "draft" && (
                  <Button variant="secondary" onClick={handleMarkReady}>Marquer prete</Button>
                )}
                {(nl.status === "ready" || nl.status === "draft") && (
                  <Button onClick={handleSend} disabled={sending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Envoyer
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />{showPreview ? "Masquer" : "Preview"}
            </Button>
          </div>
        </div>

        {showPreview && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 text-sm font-medium border-b border-border">Apercu email</div>
            <iframe
              srcDoc={contentHtml}
              className="w-full min-h-[500px] bg-white"
              sandbox="allow-same-origin"
              title="Newsletter preview"
            />
          </div>
        )}
      </div>
    </div>
  )
}
