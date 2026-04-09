"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Eye, Plus, ExternalLink, PenLine, X } from "lucide-react"
import { toast } from "sonner"
import type { VeilleItem } from "@/types"

export default function VeillePage() {
  const [items, setItems] = useState<VeilleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

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

  useEffect(() => { loadItems() }, [loadItems])

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = {
      title: form.get("title") as string,
      summary: (form.get("summary") as string) || null,
      pme_angle: (form.get("pme_angle") as string) || null,
      source_url: (form.get("source_url") as string) || null,
      source_name: (form.get("source_name") as string) || null,
      urgency: form.get("urgency") as string,
      suggested_format: (form.get("suggested_format") as string) || null,
    }

    try {
      const res = await fetch("/api/veille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success("Sujet de veille ajouté !")
      setShowAdd(false)
      loadItems()
    } catch {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      const res = await fetch(`/api/veille/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success("Sujet écarté")
    } catch {
      toast.error("Erreur")
    }
  }

  const handleCreateDraft = async (item: VeilleItem) => {
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          content: `${item.summary || ""}\n\nAngle PME : ${item.pme_angle || "À définir"}`,
          pillar: null,
          status: "idea",
          source_veille_id: item.id,
          ai_generated: false,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Brouillon créé à partir du sujet de veille !")
    } catch {
      toast.error("Erreur")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veille</h1>
          <p className="text-muted-foreground mt-1">
            Sujets détectés pour ton contenu LinkedIn
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un sujet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau sujet de veille</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input id="title" name="title" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="summary">Résumé</Label>
                <Textarea id="summary" name="summary" className="mt-1" rows={3} />
              </div>
              <div>
                <Label htmlFor="pme_angle">Angle PME</Label>
                <Input id="pme_angle" name="pme_angle" className="mt-1" placeholder="En quoi ça concerne les PME ?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source_url">URL source</Label>
                  <Input id="source_url" name="source_url" type="url" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="source_name">Source</Label>
                  <Input id="source_name" name="source_name" className="mt-1" placeholder="TechCrunch, etc." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Urgence</Label>
                  <Select name="urgency" defaultValue="this_week">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immédiat</SelectItem>
                      <SelectItem value="this_week">Cette semaine</SelectItem>
                      <SelectItem value="backlog">Backlog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Format suggéré</Label>
                  <Select name="suggested_format">
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Format" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="post">Post</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="both">Les deux</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Ajouter</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
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
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{item.title}</h3>
                      {item.relevance_score != null && (
                        <Badge variant="outline">
                          {Math.round(item.relevance_score * 100)}%
                        </Badge>
                      )}
                    </div>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-1">{item.summary}</p>
                    )}
                    {item.pme_angle && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Angle PME :</span> {item.pme_angle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {item.source_name && (
                        <Badge variant="secondary">{item.source_name}</Badge>
                      )}
                      {item.urgency && (
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
                      )}
                      {item.suggested_format && (
                        <Badge variant="outline">{item.suggested_format}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: "ghost", size: "icon" })}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleCreateDraft(item)}>
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDismiss(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
