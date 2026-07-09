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
import { Textarea } from "@/components/ui/textarea"
import { Database, Bot, Newspaper, Link2, Bell, CheckCircle, AlertCircle, Rss, Plus, Trash2, Video, Brain, Target, Save, Loader2, X } from "lucide-react"
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

  // Agent profile & strategy state
  const [agentProfile, setAgentProfile] = useState<Record<string, unknown> | null>(null)
  const [contentStrategy, setContentStrategy] = useState<Record<string, unknown> | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [strategySaving, setStrategySaving] = useState(false)
  const [newAvoidTopic, setNewAvoidTopic] = useState("")

  useEffect(() => {
    if (searchParams.get("linkedin_connected")) {
      toast.success("LinkedIn connecte avec succes !")
    }
    const linkedinError = searchParams.get("linkedin_error")
    if (linkedinError) {
      const messages: Record<string, string> = {
        missing_config:
          "Configuration LinkedIn manquante cote serveur : verifie que LINKEDIN_CLIENT_ID et LINKEDIN_CLIENT_SECRET sont definis dans Vercel.",
        invalid_state: "Session OAuth invalide ou expiree. Reessaie la connexion.",
        token_exchange_failed:
          "Echange du code echoue. Verifie le client secret et l'URL de redirection dans l'app LinkedIn.",
        profile_fetch_failed: "Impossible de recuperer ton profil LinkedIn. Reessaie.",
        unauthorized_scope_error:
          "Scopes non autorises : active les produits 'Sign In with LinkedIn using OpenID Connect' et 'Share on LinkedIn' dans l'app LinkedIn.",
      }
      toast.error(messages[linkedinError] || `Erreur LinkedIn : ${linkedinError}`)
    }

    fetch("/api/linkedin/status")
      .then((r) => r.json())
      .then(setLinkedinStatus)
      .catch(() => setLinkedinStatus({ connected: false }))

    fetch("/api/settings/veille-sources")
      .then((r) => r.json())
      .then((d) => setVeilleSources(d.sources || []))
      .catch(() => {})

    fetch("/api/settings/agent-profile")
      .then((r) => r.json())
      .then((d) => setAgentProfile(d.profile))
      .catch(() => {})

    fetch("/api/settings/content-strategy")
      .then((r) => r.json())
      .then((d) => setContentStrategy(d.strategy))
      .catch(() => {})
  }, [searchParams])

  const handleSaveProfile = async () => {
    if (!agentProfile) return
    setProfileSaving(true)
    try {
      const res = await fetch("/api/settings/agent-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: agentProfile }),
      })
      if (!res.ok) throw new Error()
      toast.success("Profil agent sauvegarde !")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setProfileSaving(false)
    }
  }

  const handleSaveStrategy = async () => {
    if (!contentStrategy) return
    setStrategySaving(true)
    try {
      const res = await fetch("/api/settings/content-strategy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: contentStrategy }),
      })
      if (!res.ok) throw new Error()
      toast.success("Strategie sauvegardee !")
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setStrategySaving(false)
    }
  }

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
                  {linkedinStatus.expired ? "Reconnecter LinkedIn" : "Connecter LinkedIn"}
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
                Modele : Claude Sonnet 5
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Agent Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-violet-500" />
                <div>
                  <CardTitle className="text-base">Profil Agent IA</CardTitle>
                  <CardDescription>Ce que l&apos;agent sait sur toi et ton audience</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveProfile}
                disabled={profileSaving || !agentProfile}
              >
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Sauvegarder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!agentProfile ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-name">Nom</Label>
                    <Input
                      id="profile-name"
                      value={(agentProfile.name as string) || ""}
                      onChange={(e) => setAgentProfile({ ...agentProfile, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-role">Role actuel</Label>
                    <Input
                      id="profile-role"
                      value={(agentProfile.current_role as string) || ""}
                      onChange={(e) => setAgentProfile({ ...agentProfile, current_role: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-background">Parcours (bio detaillee)</Label>
                  <Textarea
                    id="profile-background"
                    rows={3}
                    value={(agentProfile.background as string) || ""}
                    onChange={(e) => setAgentProfile({ ...agentProfile, background: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="profile-objective">Objectif</Label>
                  <Input
                    id="profile-objective"
                    value={(agentProfile.objective as string) || ""}
                    onChange={(e) => setAgentProfile({ ...agentProfile, objective: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="profile-location">Localisation</Label>
                    <Input
                      id="profile-location"
                      value={(agentProfile.location as string) || ""}
                      onChange={(e) => setAgentProfile({ ...agentProfile, location: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="profile-origin">Origine</Label>
                    <Input
                      id="profile-origin"
                      value={(agentProfile.origin as string) || ""}
                      onChange={(e) => setAgentProfile({ ...agentProfile, origin: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Differenciateurs</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(agentProfile.differentiators) ? agentProfile.differentiators as string[] : []).map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {d}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => {
                            const arr = [...(agentProfile.differentiators as string[])]
                            arr.splice(i, 1)
                            setAgentProfile({ ...agentProfile, differentiators: arr })
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Ajouter un differenciateur..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault()
                          const arr = Array.isArray(agentProfile.differentiators) ? [...agentProfile.differentiators as string[]] : []
                          arr.push(e.currentTarget.value.trim())
                          setAgentProfile({ ...agentProfile, differentiators: arr })
                          e.currentTarget.value = ""
                        }
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="profile-tone">Notes sur le ton</Label>
                  <Input
                    id="profile-tone"
                    value={(agentProfile.tone_notes as string) || ""}
                    onChange={(e) => setAgentProfile({ ...agentProfile, tone_notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Strategy Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-emerald-500" />
                <div>
                  <CardTitle className="text-base">Strategie de contenu</CardTitle>
                  <CardDescription>Piliers, formats preferes et sujets a eviter</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveStrategy}
                disabled={strategySaving || !contentStrategy}
              >
                {strategySaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Sauvegarder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!contentStrategy ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Piliers de contenu</Label>
                  <div className="space-y-2 mt-2">
                    {(Array.isArray(contentStrategy.pillars) ? contentStrategy.pillars as Array<Record<string, unknown>> : []).map((pillar, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-accent/30">
                        <Badge variant="outline" className="shrink-0 mt-0.5">
                          {pillar.weight as number}%
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{pillar.label as string}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{pillar.description as string}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label>Sujets a eviter</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(Array.isArray(contentStrategy.avoid_topics) ? contentStrategy.avoid_topics as string[] : []).map((topic, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        {topic}
                        <button
                          className="ml-1 hover:text-white"
                          onClick={() => {
                            const arr = [...(contentStrategy.avoid_topics as string[])]
                            arr.splice(i, 1)
                            setContentStrategy({ ...contentStrategy, avoid_topics: arr })
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {(contentStrategy.avoid_topics as string[] || []).length === 0 && (
                      <span className="text-sm text-muted-foreground">Aucun sujet a eviter</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Ajouter un sujet a eviter..."
                      value={newAvoidTopic}
                      onChange={(e) => setNewAvoidTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newAvoidTopic.trim()) {
                          e.preventDefault()
                          const arr = Array.isArray(contentStrategy.avoid_topics) ? [...contentStrategy.avoid_topics as string[]] : []
                          arr.push(newAvoidTopic.trim())
                          setContentStrategy({ ...contentStrategy, avoid_topics: arr })
                          setNewAvoidTopic("")
                        }
                      }}
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newAvoidTopic.trim()) {
                          const arr = Array.isArray(contentStrategy.avoid_topics) ? [...contentStrategy.avoid_topics as string[]] : []
                          arr.push(newAvoidTopic.trim())
                          setContentStrategy({ ...contentStrategy, avoid_topics: arr })
                          setNewAvoidTopic("")
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label>Formats preferes</Label>
                  <div className="space-y-1 mt-1">
                    {(Array.isArray(contentStrategy.preferred_formats) ? contentStrategy.preferred_formats as string[] : []).map((f, i) => (
                      <p key={i} className="text-sm text-muted-foreground">• {f}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            22 tools disponibles dont get_agent_profile et update_agent_memory
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
