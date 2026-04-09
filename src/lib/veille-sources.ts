import { getServiceClient } from "@/lib/supabase"

export interface VeilleSource {
  name: string
  url: string
  category: "ai_news" | "pme_stories"
  language: "en" | "fr"
  type: "rss" | "youtube"
}

const DEFAULT_SOURCES: VeilleSource[] = [
  { name: "TLDR AI", url: "https://tldr.tech/ai/feed.xml", category: "ai_news", language: "en", type: "rss" },
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "ai_news", language: "en", type: "rss" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "ai_news", language: "en", type: "rss" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "ai_news", language: "en", type: "rss" },
  { name: "Maddyness", url: "https://www.maddyness.com/feed/", category: "pme_stories", language: "fr", type: "rss" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/rss/feed.xml", category: "ai_news", language: "en", type: "rss" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "ai_news", language: "en", type: "rss" },
  { name: "AI Explained (YouTube)", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCNJ1Ymd5yFuUPtn21xtRbbw", category: "ai_news", language: "en", type: "youtube" },
]

export function getDefaultSources(): VeilleSource[] {
  return DEFAULT_SOURCES
}

export async function getVeilleSources(): Promise<VeilleSource[]> {
  const supabase = getServiceClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "veille_sources")
    .single()

  if (data?.value && Array.isArray(data.value)) {
    return data.value as VeilleSource[]
  }

  return DEFAULT_SOURCES
}

export async function saveVeilleSources(sources: VeilleSource[]): Promise<void> {
  const supabase = getServiceClient()
  await supabase.from("settings").upsert({
    key: "veille_sources",
    value: sources as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  })
}

/**
 * Convert a YouTube channel URL to its RSS feed URL.
 * Supports formats:
 * - https://www.youtube.com/@handle
 * - https://www.youtube.com/channel/CHANNEL_ID
 * - https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID (passthrough)
 */
export function youtubeToRss(url: string): string | null {
  // Already an RSS feed
  if (url.includes("/feeds/videos.xml")) return url

  // Channel ID format
  const channelMatch = url.match(/youtube\.com\/channel\/([\w-]+)/)
  if (channelMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`
  }

  // Handle format - requires API lookup, return null (caller must resolve)
  if (url.includes("youtube.com/@")) {
    return null // Cannot resolve @handle to channel_id without API call
  }

  return null
}
