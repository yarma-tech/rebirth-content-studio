"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { Database, Bot, Newspaper, Link2, Bell, CheckCircle, AlertCircle, Rss, Plus, Trash2, Video } from "lucide-react"
import { toast } from "sonner"

interface VeilleSource {
  name: string
  url: string
  category: "ai_news" | "pme_stories"
  language: "en" | "fr"
  type: "rss" | "youtube"
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [veilleSources, setVeilleSources] = useState<VeilleSource[]>([])
  const [showAddSource, setShowAddSource] = useState(false)
  const [linkedinStatus, setLinkedinStatus] = useState<{
    connected: boolean
    expired?: boolean
    name?: string
    expires_at?: string
  } | null>(null)

  useEffect(() => {
    if (searchParams.get("linkedin_connected")) {
      toast.success("LinkedIn connecte avec succes !")
    }
    if (searchParams.get("linkedin_error")) {
      toast.error(`Erreur LinkedIn : ${searchParams.get("linkedin_error")}`)
    }

    fetch("/api/linkedin/status")
      .then((r) => r.json())
      .then(setLinkedinStatus)
      .catch(() => setLinkedinStatus({ connected: false }))

    fetch("/api/settings/veille-sources")
      .then((r) => r.json())
      .then((d) => setVeilleSources(d.sources || []))
      .catch(() => {})
  }, [searchParams])

  const handleAddSource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    let url = form.get("url") as string
    const isYoutube = url.includes("youtube.com")

    // Convert YouTube channel URL to RSS
    if (isYoutube && url.includes("/channel/")) {
      const match = url.match(/channel\/([\w-]+)/)
      if (match) url = `https://www.youtube.com/feeds/videos.xml?channel_id=${match[1]}`
    }

    const newSource: VeilleSource = {
      name: form.get("name") as string,
      url,
      category: form.get("category") as VeilleSource["category"],
      language: form.get("language") as VeilleSource["language"],
      type: isYoutube ? "youtube" : "rss",
    }

    const updated = [...veilleSources, newSource]
    try {
      const res = await fetch("/api/settings/veille-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: updated }),
      })
      if (!res.ok) throw new Error()
      setVeilleSources(updated)
      setShowAddSource(false)
      toast.success("Source ajoutee !")
    } catch {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const handleRemoveSource = async (index: number) => {
    const updated = veilleSources.filter((_, i) => i !== index)
    try {
      const res = await fetch("/api/settings/veille-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sources: updated }),
      })
      if (!res.ok) throw new Error()
      setVeilleSources(updated)
      toast.success("Source supprimee")
    } catch {
      toast.error("Erreur")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration de Rebirth Content Studio
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-[#0A66C2]" />
              <div>
                <CardTitle className="text-base">LinkedIn API</CardTitle>
                <CardDescription>Publication directe et analytics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {linkedinStatus === null ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : linkedinStatus.connected ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">
                    Connecte en tant que <span className="font-medium">{linkedinStatus.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Actif
                  </Badge>
                  {linkedinStatus.expires_at && (
                    <span className="text-xs text-muted-foreground">
                      Expire le {new Date(linkedinStatus.expires_at).toLocaleDateString("fr-CA")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {linkedinStatus.expired ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-orange-600">Token expire — reconnecte-toi</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Non connecte</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = "/api/auth/linkedin"}
                >
                  Connecter LinkedIn
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Rss className="h-5 w-5 text-orange-500" />
                <div>
                  <CardTitle className="text-base">Sources de veille</CardTitle>
                  <CardDescription>{veilleSources.length} source(s) configuree(s)</CardDescription>
                </div>
              </div>
              <Dialog open={showAddSource} onOpenChange={setShowAddSource}>
                <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une source de veille</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSource} className="space-y-4">
                    <div>
                      <Label htmlFor="src-name">Nom</Label>
                      <Input id="src-name" name="name" required placeholder="Ex: TechCrunch AI" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="src-url">URL du flux RSS ou chaine YouTube</Label>
                      <Input id="src-url" name="url" required type="url" placeholder="https://..." className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        YouTube : colle l&apos;URL de la chaine (ex: youtube.com/channel/xxx)
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Categorie</Label>
                        <Select name="category" defaultValue="ai_news">
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ai_news">Actualites IA</SelectItem>
                            <SelectItem value="pme_stories">Histoires PME</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Langue</Label>
                        <Select name="language" defaultValue="fr">
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fr">Francais</SelectItem>
                            <SelectItem value="en">Anglais</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Ajouter la source</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {veilleSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune source configuree.</p>
            ) : (
              <div className="space-y-2">
                {veilleSources.map((source, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/50 group">
                    <div className="flex items-center gap-2 min-w-0">
                      {source.type === "youtube" ? (
                        <Video className="h-4 w-4 text-red-500 shrink-0" />
                      ) : (
                        <Rss className="h-4 w-4 text-orange-500 shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">{source.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {source.category === "ai_news" ? "IA" : "PME"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {source.language.toUpperCase()}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={() => handleRemoveSource(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Base de donnees Supabase</CardTitle>
                <CardDescription>Connexion a votre instance Supabase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Configure via .env
              </Badge>
              <p className="text-sm text-muted-foreground">
                Les credentials sont dans les variables d&apos;environnement
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Agent IA (Claude)</CardTitle>
                <CardDescription>Generation de contenu assistee par IA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Configure via .env
              </Badge>
              <p className="text-sm text-muted-foreground">
                Modele : Claude Sonnet 4
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Newspaper className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Newsletter IA Friday</CardTitle>
                <CardDescription>Envoi via Resend</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="outline">Phase 3</Badge>
              <Button variant="outline" size="sm" disabled>
                Configurer Resend
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Telegram Bot</CardTitle>
                <CardDescription>Interface mobile et notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="outline">Phase 3</Badge>
              <Button variant="outline" size="sm" disabled>
                Configurer Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Serveur MCP</CardTitle>
          <CardDescription>
            Point d&apos;entree pour les agents IA externes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Actif
            </Badge>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              /api/mcp
            </code>
          </div>
          <p className="text-sm text-muted-foreground">
            5 tools disponibles : create_draft, list_posts, get_post, update_post, generate_draft
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
