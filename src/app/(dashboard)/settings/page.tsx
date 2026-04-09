"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Database, Bot, Newspaper, Link2, Bell } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-1">
          Configuration de Rebirth Content Studio
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">Base de données Supabase</CardTitle>
                <CardDescription>Connexion à votre instance Supabase</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Configuré via .env
                </Badge>
              </div>
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
                <CardDescription>Génération de contenu assistée par IA</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Configuré via .env
              </Badge>
              <p className="text-sm text-muted-foreground">
                Modèle : Claude Sonnet 4
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base">LinkedIn API</CardTitle>
                <CardDescription>Publication directe et analytics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="outline">Phase 3</Badge>
              <Button variant="outline" size="sm" disabled>
                Connecter LinkedIn
              </Button>
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
            Point d&apos;entrée pour les agents IA externes
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
