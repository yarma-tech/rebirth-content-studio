import { NextRequest, NextResponse } from "next/server"
import Parser from "rss-parser"
import { getVeilleSources } from "@/lib/veille-sources"
import { scoreVeilleItems, type RawFeedItem } from "@/lib/veille-ai"
import { getServiceClient } from "@/lib/supabase"

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "RebirthContentStudio/1.0",
  },
})

export async function GET(request: NextRequest) {
  // Auth check: Vercel Cron sends Authorization header, bypass in dev
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  const isDev = process.env.NODE_ENV === "development"

  if (!isDev) {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const startedAt = new Date()
  const supabase = getServiceClient()
  const errors: Array<{ source: string; error: string }> = []

  // 1. Get configured sources
  const sources = await getVeilleSources()

  // 2. Fetch all RSS feeds in parallel
  const feedResults = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url)
      return { source, items: feed.items || [] }
    })
  )

  // 3. Collect raw items
  const rawItems: RawFeedItem[] = []

  for (const result of feedResults) {
    if (result.status === "rejected") {
      const sourceName = sources[feedResults.indexOf(result)]?.name ?? "Unknown"
      errors.push({ source: sourceName, error: String(result.reason).slice(0, 200) })
      continue
    }

    const { source, items } = result.value
    for (const item of items.slice(0, 10)) { // Max 10 items per feed
      if (item.link) {
        rawItems.push({
          title: item.title || "Sans titre",
          link: item.link,
          description: item.contentSnippet || item.content || "",
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          sourceName: source.name,
          sourceCategory: source.category,
          sourceLanguage: source.language,
        })
      }
    }
  }

  // 4. Deduplicate against existing items
  const existingUrls = new Set<string>()
  if (rawItems.length > 0) {
    const links = rawItems.map((i) => i.link)
    const { data: existing } = await supabase
      .from("veille_items")
      .select("source_url")
      .in("source_url", links)

    if (existing) {
      for (const row of existing) {
        if (row.source_url) existingUrls.add(row.source_url)
      }
    }
  }

  const newItems = rawItems.filter((item) => !existingUrls.has(item.link))

  // 5. Score with AI (if any new items)
  let scoredItems: Awaited<ReturnType<typeof scoreVeilleItems>> = []
  if (newItems.length > 0) {
    try {
      // Process in batches of 25 to stay within token limits
      const batches = []
      for (let i = 0; i < newItems.length; i += 25) {
        batches.push(newItems.slice(i, i + 25))
      }

      for (const batch of batches) {
        const scored = await scoreVeilleItems(batch)
        scoredItems.push(...scored)
      }
    } catch (error) {
      errors.push({
        source: "AI Scoring",
        error: String(error instanceof Error ? error.message : error).slice(0, 200),
      })
    }
  }

  // 6. Insert scored items
  let insertedCount = 0
  if (scoredItems.length > 0) {
    // Index raw items by link for O(1) lookups instead of O(n) find()
    const rawItemsByLink = new Map(rawItems.map((r) => [r.link, r]))

    const rows = scoredItems.map((item) => {
      const raw = rawItemsByLink.get(item.link)
      return {
        title: item.title,
        summary: item.summary,
        pme_angle: item.pme_angle,
        source_url: item.link,
        source_name: raw?.sourceName || null,
        suggested_format: item.suggested_format,
        urgency: item.urgency,
        relevance_score: item.relevance_score,
        status: "new" as const,
        auto_detected: true,
        raw_data: {
          original_title: item.title,
          pub_date: raw?.pubDate,
          source_category: raw?.sourceCategory,
        },
      }
    })

    const { data: inserted, error: insertError } = await supabase
      .from("veille_items")
      .insert(rows)
      .select("id")

    if (insertError) {
      // Unique constraint violation on source_url is expected for duplicates
      if (insertError.code === "23505") {
        // Insert one by one to skip duplicates
        for (const row of rows) {
          const { error: singleErr } = await supabase
            .from("veille_items")
            .insert(row)
          if (!singleErr) insertedCount++
        }
      } else {
        errors.push({ source: "DB Insert", error: insertError.message })
      }
    } else {
      insertedCount = inserted?.length ?? 0
    }
  }

  // 6.5 Notify urgent items (relevance_score > 0.8)
  const urgentItems = scoredItems.filter((i) => i.relevance_score > 0.8)
  if (urgentItems.length > 0) {
    try {
      const { notifyUrgentVeille } = await import("@/lib/telegram-notifications")
      const { sendMessage } = await import("@/lib/telegram")

      if (urgentItems.length <= 3) {
        // Individual notifications for 1-3 urgent items
        for (const item of urgentItems) {
          const sourceName =
            rawItems.find((r) => r.link === item.link)?.sourceName ?? null
          await notifyUrgentVeille({
            title: item.title,
            summary: item.summary,
            source_name: sourceName,
            relevance_score: item.relevance_score,
          })
        }
      } else {
        // Grouped summary for 4+ urgent items (avoid spam)
        const lines = [
          `🔴 <b>${urgentItems.length} sujets chauds detectes</b>`,
          "",
          ...urgentItems.slice(0, 10).map((item) => {
            const pct = Math.round(item.relevance_score * 100)
            return `• <b>${item.title}</b> (${pct}%)`
          }),
          "",
          "Va sur la veille pour les traiter.",
        ]
        await sendMessage(lines.join("\n"))
      }
    } catch (err) {
      errors.push({
        source: "Telegram notify",
        error: String(err instanceof Error ? err.message : err).slice(0, 200),
      })
    }
  }

  // 7. Log the scan
  await supabase.from("veille_scan_log").insert({
    started_at: startedAt.toISOString(),
    feeds_checked: sources.length,
    items_found: rawItems.length,
    items_scored: scoredItems.length,
    items_inserted: insertedCount,
    errors: errors.length > 0 ? errors : [],
    completed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    feeds_checked: sources.length,
    items_found: rawItems.length,
    new_items: newItems.length,
    items_scored: scoredItems.length,
    items_inserted: insertedCount,
    errors: errors.length > 0 ? errors : undefined,
    duration_ms: Date.now() - startedAt.getTime(),
  })
}
