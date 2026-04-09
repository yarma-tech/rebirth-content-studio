"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LinkedInPreview } from "@/components/linkedin-preview"
import { Sparkles, Save, Copy, Check, Loader2, Wand2, Calendar } from "lucide-react"
import { toast } from "sonner"
import type { Post, Pillar, PostStatus } from "@/types"
import { PILLAR_LABELS, STATUS_LABELS } from "@/types"

interface PostEditorProps {
  post?: Post
  mode: "create" | "edit"
}

export function PostEditor({ post, mode }: PostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [pillar, setPillar] = useState<Pillar | "">(post?.pillar ?? "")
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft")
  const [hashtagsInput, setHashtagsInput] = useState(
    post?.hashtags?.join(", ") ?? ""
  )
  const [scheduledAt, setScheduledAt] = useState(post?.scheduled_at ?? "")
  const [generating, setGenerating] = useState(false)
  const [improving, setImproving] = useState(false)
  const [improveInstruction, setImproveInstruction] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [aiTopic, setAiTopic] = useState("")

  const hashtags = hashtagsInput
    .split(",")
    .map((h) => h.trim().replace(/^#/, ""))
    .filter(Boolean)

  const handleGenerate = useCallback(async () => {
    if (!aiTopic.trim() || !pillar) {
      toast.error("Remplis le sujet et le pilier avant de générer")
      return
    }
    setGenerating(true)
    setContent("")
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic, pillar }),
      })
      if (!res.ok) throw new Error("Erreur de génération")
      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream")
      const decoder = new TextDecoder()
      let accumulated = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setContent(accumulated)
      }
      toast.success("Brouillon généré !")
    } catch {
      toast.error("Erreur lors de la génération")
    } finally {
      setGenerating(false)
    }
  }, [aiTopic, pillar])

  const handleImprove = useCallback(async () => {
    if (!content.trim() || !improveInstruction.trim()) {
      toast.error("Le post et l'instruction sont requis")
      return
    }
    setImproving(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          instruction: improveInstruction,
          mode: "improve",
        }),
      })
      if (!res.ok) throw new Error("Erreur")
      const reader = res.body?.getReader()
      if (!reader) throw new Error("No stream")
      const decoder = new TextDecoder()
      let accumulated = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setContent(accumulated)
      }
      setImproveInstruction("")
      toast.success("Post amélioré !")
    } catch {
      toast.error("Erreur lors de l'amélioration")
    } finally {
      setImproving(false)
    }
  }, [content, improveInstruction])

  const handleSave = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Le contenu est requis")
      return
    }
    setSaving(true)
    try {
      const body = {
        title: title || null,
        content,
        pillar: pillar || null,
        status: scheduledAt ? "scheduled" as const : status,
        hashtags,
        ai_generated: post?.ai_generated ?? false,
        scheduled_at: scheduledAt || null,
      }
      const url = mode === "create" ? "/api/posts" : `/api/posts/${post!.id}`
      const method = mode === "create" ? "POST" : "PATCH"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erreur de sauvegarde")
      const data = await res.json()
      toast.success(mode === "create" ? "Post créé !" : "Post mis à jour !")
      if (mode === "create") {
        router.push(`/posts/${data.post.id}`)
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }, [content, title, pillar, status, hashtags, mode, post, router])

  const handleCopy = useCallback(() => {
    const fullText =
      content + (hashtags.length > 0 ? "\n\n" + hashtags.map((h) => `#${h}`).join(" ") : "")
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    toast.success("Copié dans le presse-papier !")
    setTimeout(() => setCopied(false), 2000)
  }, [content, hashtags])

  const handleMarkPublished = useCallback(async () => {
    if (!post?.id) return
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published", published_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error()
      setStatus("published")
      toast.success("Post marqué comme publié !")
    } catch {
      toast.error("Erreur")
    }
  }, [post?.id])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor panel */}
      <div className="space-y-6">
        {/* AI Generation */}
        <div className="p-4 border border-dashed border-primary/30 rounded-lg bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Génération IA</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Sujet ou idée du post..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleGenerate}
              disabled={generating || !aiTopic.trim() || !pillar}
              size="sm"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="ml-1.5">Générer</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Titre interne (optionnel)</Label>
            <Input
              id="title"
              placeholder="Titre pour te repérer..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pilier</Label>
              <Select
                value={pillar}
                onValueChange={(v) => setPillar(v as Pillar)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choisir un pilier" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PILLAR_LABELS) as Pillar[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PILLAR_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as PostStatus)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as PostStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Contenu du post</Label>
            <Textarea
              id="content"
              placeholder="Écris ton post LinkedIn ici..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1.5 min-h-[250px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length} caractères
              {content.length >= 800 && content.length <= 1300 && (
                <span className="text-green-600"> — longueur optimale ✓</span>
              )}
            </p>
          </div>

          {/* Improve */}
          {content.trim() && (
            <div className="flex gap-2">
              <Input
                placeholder="Instruction d'amélioration (ex: change l'accroche)..."
                value={improveInstruction}
                onChange={(e) => setImproveInstruction(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleImprove}
                disabled={improving || !improveInstruction.trim()}
              >
                {improving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span className="ml-1.5">Améliorer</span>
              </Button>
            </div>
          )}

          {/* Scheduling */}
          <div className="p-4 border border-border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Programmer la publication</Label>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="datetime-local"
                value={scheduledAt ? scheduledAt.slice(0, 16) : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setScheduledAt(new Date(e.target.value).toISOString())
                    setStatus("scheduled")
                  } else {
                    setScheduledAt("")
                    if (status === "scheduled") setStatus("draft")
                  }
                }}
                className="max-w-[250px]"
              />
              {scheduledAt && (
                <button
                  onClick={() => {
                    setScheduledAt("")
                    if (status === "scheduled") setStatus("draft")
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Annuler
                </button>
              )}
            </div>
            {scheduledAt && (
              <p className="text-xs text-muted-foreground">
                Programmé pour le{" "}
                {new Date(scheduledAt).toLocaleDateString("fr-CA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="hashtags">Hashtags (séparés par des virgules)</Label>
            <Input
              id="hashtags"
              placeholder="IA, PME, Automatisation"
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              className="mt-1.5"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtags.map((h) => (
                <Badge key={h} variant="secondary">
                  #{h}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving || !content.trim()}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === "create" ? "Créer" : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!content.trim()}>
              {copied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              Copier
            </Button>
            {mode === "edit" && status !== "published" && (
              <Button variant="secondary" onClick={handleMarkPublished}>
                Marquer comme publié
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Preview panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Prévisualisation LinkedIn</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs"
          >
            {showPreview ? "Masquer" : "Afficher"}
          </Button>
        </div>
        {showPreview && (
          <LinkedInPreview content={content} hashtags={hashtags} />
        )}
      </div>
    </div>
  )
}
