import { getServiceClient } from "@/lib/supabase"

export interface DashboardStats {
  totalPosts: number
  publishedThisMonth: number
  draftsCount: number
  newVeilleItems: number
  avgImpressions: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getServiceClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [postsRes, publishedRes, draftsRes, veilleRes, analyticsRes] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .gte("published_at", startOfMonth),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "ready"]),
    supabase
      .from("veille_items")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase.from("post_analytics").select("impressions"),
  ])

  const avgImpressions =
    analyticsRes.data && analyticsRes.data.length > 0
      ? Math.round(
          analyticsRes.data.reduce((sum, a) => sum + (a.impressions || 0), 0) /
            analyticsRes.data.length
        )
      : 0

  return {
    totalPosts: postsRes.count ?? 0,
    publishedThisMonth: publishedRes.count ?? 0,
    draftsCount: draftsRes.count ?? 0,
    newVeilleItems: veilleRes.count ?? 0,
    avgImpressions,
  }
}
