"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  TrendingUp,
  Eye,
  PenLine,
  Plus,
  ArrowRight,
} from "lucide-react"
import type { Post, VeilleItem, DashboardStats } from "@/types"
import { PILLAR_LABELS, PILLAR_COLORS, STATUS_LABELS, STATUS_COLORS } from "@/types"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [veilleItems, setVeilleItems] = useState<VeilleItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, postsRes, veilleRes] = await Promise.all([
          fetch("/api/stats"),
          fetch("/api/posts?limit=5"),
          fetch("/api/veille?status=new&limit=5"),
        ])
        if (statsRes.ok) setStats(await statsRes.json())
        if (postsRes.ok) {
          const data = await postsRes.json()
          setRecentPosts(data.posts || [])
        }
        if (veilleRes.ok) {
          const data = await veilleRes.json()
          setVeilleItems(data.items || [])
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue, Yannick. Voici ton activité récente.
          </p>
        </div>
        <Link href="/posts/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau post
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Posts publiés"
          value={stats?.publishedThisMonth ?? 0}
          subtitle="ce mois"
          icon={FileText}
          loading={loading}
        />
        <StatCard
          title="Brouillons"
          value={stats?.draftsCount ?? 0}
          subtitle="en attente"
          icon={PenLine}
          loading={loading}
        />
        <StatCard
          title="Impressions moy."
          value={stats?.avgImpressions ?? 0}
          subtitle="par post"
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Veille"
          value={stats?.newVeilleItems ?? 0}
          subtitle="nouveaux sujets"
          icon={Eye}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent posts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Posts récents</CardTitle>
            <Link href="/posts" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun post encore.</p>
                <Link href="/posts/new" className={buttonVariants({ variant: "link" }) + " mt-2"}>
                  Créer ton premier post
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="flex items-start justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {post.title || post.content.slice(0, 60) + "..."}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="secondary"
                          className={STATUS_COLORS[post.status]}
                        >
                          {STATUS_LABELS[post.status]}
                        </Badge>
                        {post.pillar && (
                          <Badge
                            variant="secondary"
                            className={PILLAR_COLORS[post.pillar]}
                          >
                            {PILLAR_LABELS[post.pillar]}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Veille items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Veille récente</CardTitle>
            <Link href="/veille" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : veilleItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun sujet de veille détecté.</p>
                <p className="text-xs mt-1">
                  Ajoute des sujets manuellement ou configure la veille auto.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {veilleItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        {item.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      {item.relevance_score != null && (
                        <Badge variant="outline" className="ml-2 shrink-0">
                          {Math.round(item.relevance_score * 100)}%
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {item.source_name && (
                        <span className="text-xs text-muted-foreground">
                          {item.source_name}
                        </span>
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
                          {item.urgency === "immediate"
                            ? "Urgent"
                            : item.urgency === "this_week"
                            ? "Cette semaine"
                            : "Backlog"}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  loading,
}: {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
