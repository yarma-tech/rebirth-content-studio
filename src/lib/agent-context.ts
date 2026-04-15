import { getServiceClient } from "@/lib/supabase"

// ─── Types ──────────────────────────────────────────────────────────

export interface AgentProfile {
  name: string
  background: string
  current_role: string
  location: string
  origin: string
  objective: string
  differentiators: string[]
  audience: {
    description: string
    age_range: string
    pain_points: string[]
    industries: string[]
  }
  tone_notes: string
  personal_touches: string[]
}

export interface ContentStrategyPillar {
  key: string
  label: string
  weight: number
  description: string
}

export interface ContentStrategy {
  pillars: ContentStrategyPillar[]
  posting_days: string[]
  newsletter_day: string
  target_posts_per_week: number
  avoid_topics: string[]
  preferred_formats: string[]
  cta_styles: string[]
  accroche_patterns: string[]
}

interface RecentPost {
  title: string | null
  pillar: string | null
  status: string
  created_at: string
}

interface TopPost {
  title: string | null
  pillar: string | null
  impressions: number
  likes: number
  engagement_rate: number | null
}

// ─── In-memory cache ────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  fetchedAt: number
}

const PROFILE_TTL = 5 * 60 * 1000 // 5 minutes
const POSTS_TTL = 60 * 1000 // 1 minute

let profileCache: CacheEntry<AgentProfile | null> | null = null
let strategyCache: CacheEntry<ContentStrategy | null> | null = null
let recentPostsCache: CacheEntry<RecentPost[]> | null = null
let topPostsCache: CacheEntry<TopPost[]> | null = null

function isFresh<T>(entry: CacheEntry<T> | null, ttl: number): entry is CacheEntry<T> {
  return entry !== null && Date.now() - entry.fetchedAt < ttl
}

// ─── Loaders ────────────────────────────────────────────────────────

export async function loadAgentProfile(): Promise<AgentProfile | null> {
  if (isFresh(profileCache, PROFILE_TTL)) return profileCache.data

  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "agent_profile")
    .single()

  const profile = (data?.value as unknown as AgentProfile) ?? null
  profileCache = { data: profile, fetchedAt: Date.now() }
  return profile
}

export async function loadContentStrategy(): Promise<ContentStrategy | null> {
  if (isFresh(strategyCache, PROFILE_TTL)) return strategyCache.data

  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "content_strategy")
    .single()

  const strategy = (data?.value as unknown as ContentStrategy) ?? null
  strategyCache = { data: strategy, fetchedAt: Date.now() }
  return strategy
}

export async function loadRecentPosts(limit = 10): Promise<RecentPost[]> {
  if (isFresh(recentPostsCache, POSTS_TTL)) return recentPostsCache.data

  const supabase = getServiceClient()
  const { data } = await supabase
    .from("posts")
    .select("title, pillar, status, created_at")
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(limit)

  const posts = (data as RecentPost[]) ?? []
  recentPostsCache = { data: posts, fetchedAt: Date.now() }
  return posts
}

export async function loadTopPerformers(limit = 5): Promise<TopPost[]> {
  if (isFresh(topPostsCache, POSTS_TTL)) return topPostsCache.data

  const supabase = getServiceClient()
  const { data } = await supabase
    .from("post_analytics")
    .select("impressions, likes, engagement_rate, post_id, posts(title, pillar)")
    .order("impressions", { ascending: false })
    .limit(limit)

  if (!data || data.length === 0) {
    topPostsCache = { data: [], fetchedAt: Date.now() }
    return []
  }

  const posts: TopPost[] = data.map((row) => {
    const post = row.posts as unknown as { title: string | null; pillar: string | null } | null
    return {
      title: post?.title ?? null,
      pillar: post?.pillar ?? null,
      impressions: row.impressions,
      likes: row.likes,
      engagement_rate: row.engagement_rate,
    }
  })

  topPostsCache = { data: posts, fetchedAt: Date.now() }
  return posts
}

// ─── Formatters ─────────────────────────────────────────────────────

function formatProfile(p: AgentProfile): string {
  return `QUI EST ${p.name.toUpperCase()} :
- ${p.background}
- Poste actuel : ${p.current_role}
- Localisation : ${p.location} (originaire de ${p.origin})
- Objectif : ${p.objective}
- Ce qui le différencie : ${p.differentiators.join(" / ")}
- Touches personnelles : ${p.personal_touches.join(", ")}`
}

function formatAudience(p: AgentProfile): string {
  return `AUDIENCE CIBLE :
- ${p.audience.description}
- ${p.audience.age_range}, pas techniques
- Douleurs : ${p.audience.pain_points.join(" ; ")}
- Industries : ${p.audience.industries.join(", ")}`
}

function formatStrategy(s: ContentStrategy): string {
  const pillars = s.pillars
    .map((p) => `- ${p.key} (${p.weight}%) : ${p.description}`)
    .join("\n")

  let text = `PILIERS :\n${pillars}`

  if (s.avoid_topics.length > 0) {
    text += `\n\nSUJETS A EVITER : ${s.avoid_topics.join(", ")}`
  }

  return text
}

function formatRecentPosts(posts: RecentPost[]): string {
  if (posts.length === 0) return ""

  const lines = posts.map((p, i) => {
    const date = new Date(p.created_at).toLocaleDateString("fr-CA")
    return `${i + 1}. "${p.title || "Sans titre"}" (${p.pillar || "?"}, ${p.status}, ${date})`
  })

  return `POSTS RECENTS (${posts.length} derniers) :\n${lines.join("\n")}\nINSTRUCTION : Ne répète pas ces sujets. Propose un angle frais.`
}

function formatTopPerformers(posts: TopPost[]): string {
  if (posts.length === 0) return ""

  const lines = posts.map(
    (p) =>
      `- "${p.title || "?"}" (${p.pillar || "?"}) — ${p.impressions} impressions, ${p.likes} likes`
  )

  return `MEILLEURS POSTS :\n${lines.join("\n")}`
}

// ─── Build dynamic context ──────────────────────────────────────────

export async function buildDynamicContext(
  mode: "post_generation" | "telegram"
): Promise<string> {
  const [profile, strategy, recentPosts, topPosts] = await Promise.all([
    loadAgentProfile(),
    loadContentStrategy(),
    loadRecentPosts(mode === "telegram" ? 5 : 10),
    loadTopPerformers(5),
  ])

  const sections: string[] = []

  if (profile) {
    sections.push(formatProfile(profile))
    sections.push(formatAudience(profile))
    if (mode === "telegram") {
      sections.push(`TON : ${profile.tone_notes}`)
    }
  }

  if (strategy) {
    sections.push(formatStrategy(strategy))
  }

  if (recentPosts.length > 0) {
    sections.push(formatRecentPosts(recentPosts))
  }

  // Top performers only for post generation (saves tokens on Telegram)
  if (mode === "post_generation" && topPosts.length > 0) {
    sections.push(formatTopPerformers(topPosts))
  }

  return sections.join("\n\n")
}
