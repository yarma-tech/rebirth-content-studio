"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, FileText } from "lucide-react"
import type { Post, PostStatus } from "@/types"
import { STATUS_LABELS, STATUS_COLORS, PILLAR_LABELS, PILLAR_COLORS } from "@/types"
import { formatDistanceToNow, format } from "date-fns"
import { fr } from "date-fns/locale"
import { utcToMontreal } from "@/lib/timezone"

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("limit", "50")
      try {
        const res = await fetch(`/api/posts?${params}`)
        if (res.ok) {
          const data = await res.json()
          setPosts(data.posts || [])
        }
      } catch {
        // handle silently
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Gère tes posts LinkedIn
          </p>
        </div>
        <Link href="/posts/new" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau post
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {(Object.keys(STATUS_LABELS) as PostStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Aucun post</p>
            <p className="text-muted-foreground text-sm mt-1">
              Crée ton premier post LinkedIn assisté par l&apos;IA.
            </p>
            <Link href="/posts/new" className={buttonVariants() + " mt-4"}>
              <Plus className="h-4 w-4 mr-2" />
              Créer un post
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-start justify-between py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {post.title || post.content.slice(0, 80) + "..."}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {post.content.slice(0, 150)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={STATUS_COLORS[post.status]}>
                        {STATUS_LABELS[post.status]}
                      </Badge>
                      {post.pillar && (
                        <Badge variant="secondary" className={PILLAR_COLORS[post.pillar]}>
                          {PILLAR_LABELS[post.pillar]}
                        </Badge>
                      )}
                      {post.ai_generated && (
                        <Badge variant="outline" className="text-xs">
                          IA
                        </Badge>
                      )}
                      {post.scheduled_at && (
                        <Badge variant="outline" className="text-xs">
                          {format(utcToMontreal(post.scheduled_at), "d MMM HH:mm", { locale: fr })}
                        </Badge>
                      )}
                      {post.media_urls && post.media_urls.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {post.media_urls.length} image{post.media_urls.length > 1 ? "s" : ""}
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
