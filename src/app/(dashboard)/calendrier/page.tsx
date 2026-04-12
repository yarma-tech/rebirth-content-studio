"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  isSameDay,
  isToday,
  getDay,
} from "date-fns"
import { fr } from "date-fns/locale"
import { utcToMontreal } from "@/lib/timezone"
import type { Post, Pillar } from "@/types"
import { PILLAR_LABELS, PILLAR_COLORS, STATUS_COLORS, STATUS_LABELS } from "@/types"

type ViewMode = "week" | "month"

// Mardi et jeudi = jours de publication recommandes
const POSTING_DAYS = [2, 4] // 0=dimanche, 2=mardi, 4=jeudi

export default function CalendrierPage() {
  const [view, setView] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const { start, end, days } = getDays(currentDate, view)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      from: start.toISOString(),
      to: end.toISOString(),
      limit: "100",
    })
    try {
      const res = await fetch(`/api/posts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [start, end])

  useEffect(() => { loadPosts() }, [loadPosts])

  const navigate = (dir: "prev" | "next") => {
    if (view === "week") {
      setCurrentDate((d) => dir === "next" ? addWeeks(d, 1) : subWeeks(d, 1))
    } else {
      setCurrentDate((d) => dir === "next" ? addMonths(d, 1) : subMonths(d, 1))
    }
  }

  const title = view === "week"
    ? `Semaine du ${format(start, "d MMMM", { locale: fr })} au ${format(end, "d MMMM yyyy", { locale: fr })}`
    : format(currentDate, "MMMM yyyy", { locale: fr })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-muted-foreground mt-1 capitalize">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-sm ${view === "week" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-sm ${view === "month" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              Mois
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            <CalendarDays className="h-4 w-4 mr-1" />
            Aujourd&apos;hui
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className={`grid ${view === "week" ? "grid-cols-7" : "grid-cols-7"} gap-1`}>
        {/* Day headers */}
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dayPosts = posts.filter((p) =>
            p.scheduled_at && isSameDay(new Date(p.scheduled_at), day)
          )
          const isPostingDay = POSTING_DAYS.includes(getDay(day))
          const today = isToday(day)
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()

          return (
            <div
              key={day.toISOString()}
              className={`
                ${view === "week" ? "min-h-[200px]" : "min-h-[100px]"}
                border border-border rounded-lg p-2
                ${today ? "bg-primary/5 border-primary/30" : ""}
                ${isPostingDay && !today ? "bg-accent/30" : ""}
                ${!isCurrentMonth && view === "month" ? "opacity-40" : ""}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {format(day, "d")}
                </span>
                {isPostingDay && (
                  <span className="text-[10px] text-muted-foreground">Pub</span>
                )}
              </div>
              <div className="space-y-1">
                {dayPosts.map((post) => (
                  <Link key={post.id} href={`/posts/${post.id}`}>
                    <Card className="p-1.5 hover:bg-accent/50 transition-colors cursor-pointer">
                      <p className="text-xs font-medium line-clamp-2">
                        {post.title || post.content.slice(0, 40)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {post.pillar && (
                          <Badge
                            variant="secondary"
                            className={`${PILLAR_COLORS[post.pillar]} text-[10px] px-1 py-0`}
                          >
                            {PILLAR_LABELS[post.pillar].slice(0, 3)}
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={`${STATUS_COLORS[post.status]} text-[10px] px-1 py-0`}
                        >
                          {STATUS_LABELS[post.status]}
                        </Badge>
                      </div>
                      {post.scheduled_at && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(utcToMontreal(post.scheduled_at), "HH:mm")}
                        </p>
                      )}
                    </Card>
                  </Link>
                ))}
              </div>
              {loading && dayPosts.length === 0 && (
                <div className="h-4 w-full bg-muted/50 rounded animate-pulse mt-1" />
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-primary/10 border border-primary/30" /> Aujourd&apos;hui
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-accent/30 border border-border" /> Jour de publication
        </span>
        {(["build_in_public", "vulgarisation", "retour_terrain"] as Pillar[]).map((p) => (
          <span key={p} className="flex items-center gap-1">
            <Badge variant="secondary" className={`${PILLAR_COLORS[p]} text-[10px] px-1 py-0`}>
              {PILLAR_LABELS[p].slice(0, 3)}
            </Badge>
            {PILLAR_LABELS[p]}
          </span>
        ))}
      </div>
    </div>
  )
}

function getDays(date: Date, view: ViewMode) {
  if (view === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })
    return { start, end, days: eachDayOfInterval({ start, end }) }
  } else {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const start = startOfWeek(monthStart, { weekStartsOn: 1 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return { start, end, days: eachDayOfInterval({ start, end }) }
  }
}
