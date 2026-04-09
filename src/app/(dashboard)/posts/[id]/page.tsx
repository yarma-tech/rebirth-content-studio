"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PostEditor } from "@/components/post-editor"
import { Skeleton } from "@/components/ui/skeleton"
import type { Post } from "@/types"

export default function EditPostPage() {
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/posts/${params.id}`)
        if (!res.ok) throw new Error("Post introuvable")
        const data = await res.json()
        setPost(data.post)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-destructive">{error || "Post introuvable"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Éditer le post</h1>
        <p className="text-muted-foreground mt-1">
          {post.title || "Sans titre"}
        </p>
      </div>
      <PostEditor post={post} mode="edit" />
    </div>
  )
}
