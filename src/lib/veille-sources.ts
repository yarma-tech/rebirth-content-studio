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
 * Convert a YouTube channel URL to its RSS feed URL (sync, no network).
 * Supports: /channel/CHANNEL_ID, /feeds/videos.xml?channel_id=...
 * Returns null for formats that need network (use resolveYoutubeUrl instead).
 */
export function youtubeToRss(url: string): string | null {
  if (url.includes("/feeds/videos.xml")) return url

  const channelMatch = url.match(/youtube\.com\/channel\/([\w-]+)/)
  if (channelMatch) {
    return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelMatch[1]}`
  }

  return null
}

interface YoutubeResolution {
  rssUrl: string
  suggestedName?: string
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"

/**
 * Resolve ANY YouTube URL to an RSS feed URL + optional channel name.
 * Supports all formats:
 * - /channel/CHANNEL_ID → direct (no network)
 * - /feeds/videos.xml?channel_id=... → passthrough (no network)
 * - /@handle → page fetch for channelId
 * - /watch?v=VIDEO_ID → oEmbed for name + page fetch for channelId
 * - youtu.be/VIDEO_ID → same as watch?v
 */
export async function resolveYoutubeUrl(
  url: string
): Promise<YoutubeResolution | null> {
  // 1. Already RSS or /channel/ → sync conversion
  const syncResult = youtubeToRss(url)
  if (syncResult) return { rssUrl: syncResult }

  // 2. Video URL (watch?v= or youtu.be/) → oEmbed + page fetch
  const videoId = extractVideoId(url)
  if (videoId) {
    return resolveFromVideo(videoId)
  }

  // 3. @handle → page fetch
  if (url.includes("/@")) {
    return resolveFromPageFetch(url)
  }

  return null
}

// ─── Internal helpers ────────────────────────────────────────────────

function extractVideoId(url: string): string | null {
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([\w-]{11})/)
  if (watchMatch) return watchMatch[1]

  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([\w-]{11})/)
  if (shortMatch) return shortMatch[1]

  // youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]{11})/)
  if (shortsMatch) return shortsMatch[1]

  return null
}

async function resolveFromVideo(
  videoId: string
): Promise<YoutubeResolution | null> {
  // Strategy A: oEmbed (reliable public API, gives channel name)
  let suggestedName: string | undefined

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
    const oembedRes = await fetch(oembedUrl)
    if (oembedRes.ok) {
      const data = (await oembedRes.json()) as Record<string, string>
      suggestedName = data.author_name || undefined
    }
  } catch {
    // oEmbed failed, continue
  }

  // Strategy B: fetch the video page to extract channelId
  const channelId = await extractChannelIdFromPage(
    `https://www.youtube.com/watch?v=${videoId}`
  )

  if (channelId) {
    return {
      rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      suggestedName,
    }
  }

  return null
}

async function resolveFromPageFetch(
  url: string
): Promise<YoutubeResolution | null> {
  const channelId = await extractChannelIdFromPage(url)
  if (!channelId) return null

  // Try to extract name from the page too
  return {
    rssUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
  }
}

async function extractChannelIdFromPage(
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA },
      redirect: "follow",
    })
    if (!res.ok) return null

    const html = await res.text()

    // Pattern 1: "channelId":"UCxxxxxxx" (most reliable)
    const jsonMatch = html.match(/"channelId"\s*:\s*"(UC[\w-]+)"/)
    if (jsonMatch) return jsonMatch[1]

    // Pattern 2: /channel/UCxxxxxxx in links
    const linkMatch = html.match(/\/channel\/(UC[\w-]+)/)
    if (linkMatch) return linkMatch[1]

    return null
  } catch {
    return null
  }
}
