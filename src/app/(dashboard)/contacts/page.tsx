"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Users, Plus, Pencil, Trash2, UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Subscriber } from "@/types"

type FilterKey = "all" | "active" | "unsubscribed" | "manual" | "website" | "linkedin"

function ContactForm({
  defaultValues,
  showStatus,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<Subscriber>
  showStatus?: boolean
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  submitLabel: string
}) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const form = new FormData(e.currentTarget)
    const interestsRaw = (form.get("interests") as string) || ""
    const interests = interestsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const data: Record<string, unknown> = {
      email: form.get("email") as string,
      first_name: (form.get("first_name") as string) || null,
      source: form.get("source") as string,
      interests,
    }
    if (showStatus) {
      data.status = form.get("status") as string
    }
    await onSubmit(data)
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1"
          defaultValue={defaultValues?.email ?? ""}
          disabled={!!defaultValues?.email}
        />
      </div>
      <div>
        <Label htmlFor="first_name">Prenom</Label>
        <Input
          id="first_name"
          name="first_name"
          className="mt-1"
          defaultValue={defaultValues?.first_name ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="interests">Interets (separes par des virgules)</Label>
        <Input
          id="interests"
          name="interests"
          className="mt-1"
          placeholder="Automatisation, IA, PME"
          defaultValue={defaultValues?.interests?.join(", ") ?? ""}
        />
      </div>
      <div className={showStatus ? "grid grid-cols-2 gap-4" : ""}>
        <div>
          <Label>Source</Label>
          <Select name="source" defaultValue={defaultValues?.source ?? "manual"}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manuel</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {showStatus && (
          <div>
            <Label>Statut</Label>
            <Select name="status" defaultValue={defaultValues?.status ?? "active"}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="unsubscribed">Desabonne</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "..." : submitLabel}
      </Button>
    </form>
  )
}

export default function ContactsPage() {
  const [items, setItems] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Subscriber | null>(null)
  const [filter, setFilter] = useState<FilterKey>("all")

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/subscribers?limit=200")
      if (res.ok) {
        const data = await res.json()
        setItems(data.subscribers || [])
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleAdd = async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erreur")
      }
      toast.success("Contact ajoute !")
      setShowAdd(false)
      loadItems()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'ajout")
    }
  }

  const handleEdit = async (data: Record<string, unknown>) => {
    if (!editingItem) return
    // Email is not editable
    delete data.email
    try {
      const res = await fetch(`/api/subscribers/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Contact mis a jour !")
      setEditingItem(null)
      loadItems()
    } catch {
      toast.error("Erreur lors de la mise a jour")
    }
  }

  const handleToggleStatus = async (item: Subscriber) => {
    const next = item.status === "active" ? "unsubscribed" : "active"
    try {
      const res = await fetch(`/api/subscribers/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) throw new Error()
      toast.success(next === "active" ? "Contact reactive" : "Contact desabonne")
      loadItems()
    } catch {
      toast.error("Erreur")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer definitivement ce contact ?")) return
    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success("Contact supprime")
    } catch {
      toast.error("Erreur")
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true
    if (filter === "active") return item.status === "active"
    if (filter === "unsubscribed") return item.status === "unsubscribed"
    if (filter === "manual") return item.source === "manual"
    if (filter === "website") return item.source === "website"
    if (filter === "linkedin") return item.source === "linkedin"
    return true
  })

  const totalActive = items.filter((i) => i.status === "active").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} contact{items.length > 1 ? "s" : ""} au total — {totalActive} actif{totalActive > 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger className={buttonVariants()}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un contact
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau contact</DialogTitle>
            </DialogHeader>
            <ContactForm onSubmit={handleAdd} submitLabel="Ajouter" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(
          [
            { key: "all", label: "Tous" },
            { key: "active", label: "Actifs" },
            { key: "unsubscribed", label: "Desabonnes" },
            { key: "manual", label: "Manuel" },
            { key: "website", label: "Website" },
            { key: "linkedin", label: "LinkedIn" },
          ] as { key: FilterKey; label: string }[]
        ).map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog
        open={!!editingItem}
        onOpenChange={(open) => {
          if (!open) setEditingItem(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le contact</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <ContactForm
              key={editingItem.id}
              defaultValues={editingItem}
              showStatus
              onSubmit={handleEdit}
              submitLabel="Sauvegarder"
            />
          )}
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Aucun contact</p>
            <p className="text-muted-foreground text-sm mt-1">
              Utilise le bouton &quot;Ajouter un contact&quot; pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Interets</th>
                <th className="text-center px-4 py-3 font-medium hidden sm:table-cell">Source</th>
                <th className="text-center px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Inscrit</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Email */}
                  <td className="px-4 py-3">
                    <div className="font-medium">{item.email}</div>
                    {item.first_name && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.first_name}
                      </div>
                    )}
                  </td>
                  {/* Interets */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {item.interests && item.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.interests.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.interests.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  {/* Source */}
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <Badge
                      variant="secondary"
                      className={
                        item.source === "linkedin"
                          ? "bg-cyan-100 text-cyan-800"
                          : item.source === "website"
                          ? "bg-blue-100 text-blue-800"
                          : item.source === "manual"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-500"
                      }
                    >
                      {item.source === "linkedin"
                        ? "LinkedIn"
                        : item.source === "website"
                        ? "Website"
                        : item.source === "manual"
                        ? "Manuel"
                        : "Autre"}
                    </Badge>
                  </td>
                  {/* Statut */}
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={
                        item.status === "active"
                          ? "bg-green-100 text-green-800"
                          : item.status === "unsubscribed"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {item.status === "active"
                        ? "Actif"
                        : item.status === "unsubscribed"
                        ? "Desabonne"
                        : "Bounced"}
                    </Badge>
                  </td>
                  {/* Inscrit */}
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <Tooltip>
                      <TooltipTrigger className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.subscribed_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(item.subscribed_at), "dd/MM/yyyy HH:mm", {
                          locale: fr,
                        })}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingItem(item)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleStatus(item)}
                            >
                              {item.status === "active" ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          }
                        />
                        <TooltipContent>
                          {item.status === "active" ? "Desabonner" : "Reactiver"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <TooltipContent>Supprimer</TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
