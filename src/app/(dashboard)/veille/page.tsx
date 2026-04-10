"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Eye, Plus, ExternalLink, Pencil, FileText, X, Zap, User, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import type { VeilleItem } from "@/types"

function VeilleForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<VeilleItem>
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  submitLabel: string
}) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const form = new FormData(e.currentTarget)
    await onSubmit({
      title: form.get("title") as string,
      summary: (form.get("summary") as string) || null,
      pme_angle: (form.get("pme_angle") as string) || null,
      source_url: (form.get("source_url") as string) || null,
      source_name: (form.get("source_name") as string) || null,
      urgency: form.get("urgency") as string,
      suggested_format: (form.get("suggested_format") as string) || null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" required className="mt-1" defaultValue={defaultValues?.title ?? ""} />
      </div>
      <div>
        <Label htmlFor="summary">Resume</Label>
        <Textarea id="summary" name="summary" className="mt-1 max-h-[120px] overflow-y-auto resize-none" rows={3} defaultValue={defaultValues?.summary ?? ""} />
      </div>
      <div>
        <Label htmlFor="pme_angle">Angle PME</Label>
        <Input id="pme_angle" name="pme_angle" className="mt-1" placeholder="En quoi ca concerne les PME ?" defaultValue={defaultValues?.pme_angle ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="source_url">URL source</Label>
          <Input id="source_url" name="source_url" type="url" className="mt-1" defaultValue={defaultValues?.source_url ?? ""} />
        </div>
        <div>
          <Label htmlFor="source_name">Source</Label>
          <Input id="source_name" name="source_name" className="mt-1" placeholder="TechCrunch, etc." defaultValue={defaultValues?.source_name ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Urgence</Label>
          <Select name="urgency" defaultValue={defaultValues?.urgency ?? "this_week"}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediat</SelectItem>
              <SelectItem value="this_week">Cette semaine</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Format suggere</Label>
          <Select name="suggested_format" defaultValue={defaultValues?.suggested_format ?? undefined}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Format" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="post">Post</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="both">Les deux</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "..." : submitLabel}
      </Button>
    </form>
  )
}

export default function VeillePage() {
  const router = useRouter()
  const [items, setItems] = useState<VeilleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<VeilleItem | null>(null)
  const [filter, setFilter] = useState<"all" | "auto" | "manual">("all")
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/veille?limit=50")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
    fetch("/api/veille/last-scan")
      .then((r) => r.json())
      .then((d) => { if (d.completed_at) setLastScan(d.completed_at) })
      .catch(() => {})
  }, [loadItems])

  const handleAdd = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Sujet de veille ajoute !")
      setShowAdd(false)
      loadItems()
    } catch {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editingItem) return
    try {
      const res = await fetch(`/api/veille/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Sujet mis a jour !")
      setEditingItem(null)
      loadItems()
    } catch {
      toast.error("Erreur lors de la mise a jour")
    }
  }

  const handleManualScan = async () => {
    setScanning(true)
    try {
      const res = await fetch("/api/cron/veille")
      const data = await res.json()
      if (data.success) {
        toast.success(`Scan termine : ${data.items_inserted} nouveaux sujets`)
        setLastScan(new Date().toISOString())
        loadItems()
      } else {
        toast.error("Erreur lors du scan")
      }
    } catch {
      toast.error("Erreur de connexion")
    } finally {
      setScanning(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === "auto") return (item as VeilleItem & { auto_detected?: boolean }).auto_detected === true
    if (filter === "manual") return (item as VeilleItem & { auto_detected?: boolean }).auto_detected !== true
    return true
  })

  const handleDismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/veille/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success("Sujet ecarte")
    } catch {
      toast.error("Erreur")
    }
  }

  const [generatingDraftFor, setGeneratingDraftFor] = useState<string | null>(null)

  const handleCreateDraft = async (item: VeilleItem) => {
    setGeneratingDraftFor(item.id)
    toast.info("Generation du brouillon en cours...")
    try {
      // 1. Generate content via AI
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${item.title}. ${item.summary || ""} ${item.pme_angle ? `Angle PME : ${item.pme_angle}` : ""}`,
          pillar: "vulgarisation",
        }),
      })
      if (!genRes.ok) throw new Error("Erreur generation IA")

      const reader = genRes.body?.getReader()
      if (!reader) throw new Error("No stream")
      const decoder = new TextDecoder()
      let content = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
      }

      // 2. Save as draft
      const postRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          content,
          pillar: "vulgarisation",
          status: "draft",
          source_veille_id: item.id,
          ai_generated: true,
        }),
      })
      if (!postRes.ok) throw new Error("Erreur sauvegarde")
      const data = await postRes.json()
      toast.success("Brouillon IA genere !")
      router.push(`/posts/${data.post.id}`)
    } catch {
      toast.error("Erreur lors de la generation")
    } finally {
      setGeneratingDraftFor(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veille</h1>
          <p className="text-muted-foreground mt-1">
            {lastScan ? (
              <>Dernier scan : {formatDistanceToNow(new Date(lastScan), { addSuffix: true, locale: fr })} — {items.filter((i) => (i as VeilleItem & { auto_detected?: boolean }).auto_detected).length} auto-detectes</>
            ) : (
              "Sujets detectes pour ton contenu LinkedIn"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleManualScan} disabled={scanning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scan..." : "Scanner"}
          </Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger className={buttonVariants()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau sujet de veille</DialogTitle>
            </DialogHeader>
            <VeilleForm onSubmit={handleAdd} submitLabel="Ajouter" />
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["all", "auto", "manual"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" && "Tous"}
            {f === "auto" && <><Zap className="h-3.5 w-3.5 mr-1" />Auto</>}
            {f === "manual" && <><User className="h-3.5 w-3.5 mr-1" />Manuel</>}
          </Button>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le sujet</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <VeilleForm
              key={editingItem.id}
              defaultValues={editingItem}
              onSubmit={handleEdit}
              submitLabel="Sauvegarder"
            />
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Eye className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Aucun sujet de veille</p>
            <p className="text-muted-foreground text-sm mt-1">
              Ajoute manuellement des sujets ou configure la veille automatique.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Sujet</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Source</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Score</th>
                <th className="text-center px-4 py-3 font-medium hidden lg:table-cell">Format</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Urgence</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Detecte</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const isAuto = (item as VeilleItem & { auto_detected?: boolean }).auto_detected
                return (
                  <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    {/* Sujet */}
                    <td className="px-4 py-3 max-w-md">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        {isAuto ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs shrink-0">
                            <Zap className="h-3 w-3 mr-0.5" />Auto
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            <User className="h-3 w-3 mr-0.5" />Manuel
                          </Badge>
                        )}
                      </div>
                      {item.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
                      )}
                      {item.pme_angle && (
                        <p className="text-xs mt-1 text-muted-foreground italic">
                          <span className="font-medium not-italic">Angle :</span> {item.pme_angle}
                        </p>
                      )}
                    </td>
                    {/* Source */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {item.source_name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">{item.source_name}</span>
                          {item.source_url && (
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    {/* Score */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {item.relevance_score != null ? (
                        <Badge
                          variant="outline"
                          className={
                            item.relevance_score >= 0.8
                              ? "border-green-300 bg-green-50 text-green-700"
                              : item.relevance_score >= 0.6
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : item.relevance_score >= 0.4
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                              : "border-gray-300 bg-gray-50 text-gray-600"
                          }
                        >
                          {Math.round(item.relevance_score * 100)}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    {/* Format */}
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {item.suggested_format ? (
                        <Badge variant="outline" className="capitalize">{item.suggested_format}</Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    {/* Urgence */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      {item.urgency ? (
                        <Badge
                          variant="secondary"
                          className={
                            item.urgency === "immediate"
                              ? "bg-red-100 text-red-800"
                              : item.urgency === "this_week"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {item.urgency === "immediate" ? "Urgent" : item.urgency === "this_week" ? "Cette semaine" : "Backlog"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <Tooltip>
                        <TooltipTrigger className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.detected_at || item.created_at), { addSuffix: true, locale: fr })}
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(item.detected_at || item.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingItem(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleCreateDraft(item)}
                              disabled={generatingDraftFor === item.id}
                            >
                              {generatingDraftFor === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FileText className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Brouillon IA</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDismiss(item.id)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ecarter</TooltipContent>
                        </Tooltip>
                      </div>
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
