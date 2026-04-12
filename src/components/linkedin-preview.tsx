"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, MessageCircle, Repeat2, Send } from "lucide-react"

interface LinkedInPreviewProps {
  content: string
  hashtags?: string[]
  mediaUrls?: string[]
}

export function LinkedInPreview({ content, hashtags = [], mediaUrls = [] }: LinkedInPreviewProps) {
  const charCount = content.length
  const isOptimal = charCount >= 800 && charCount <= 1300

  return (
    <div className="border border-border rounded-lg bg-white dark:bg-zinc-900 shadow-sm max-w-lg w-full">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            YM
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground">Yannick Maillard</p>
          <p className="text-xs text-muted-foreground">
            Vibe Coder | IA pour les PME | Build in Public
          </p>
          <p className="text-xs text-muted-foreground">Maintenant · 🌐</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
          {content || (
            <span className="text-muted-foreground italic">
              Commence à écrire ton post...
            </span>
          )}
        </div>
        {hashtags.length > 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            {hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")}
          </p>
        )}
      </div>

      {/* Image */}
      {mediaUrls.length > 0 && (
        <div className="w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrls[0]}
            alt="Post image"
            className="w-full object-cover max-h-[400px]"
          />
          {mediaUrls.length > 1 && (
            <p className="text-xs text-muted-foreground px-4 py-1">
              +{mediaUrls.length - 1} autre{mediaUrls.length > 2 ? "s" : ""} image{mediaUrls.length > 2 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Engagement bar */}
      <div className="px-4 py-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>👍 12</span>
          <span>3 commentaires · 1 partage</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-1 border-t border-border flex items-center justify-around">
        {[
          { icon: ThumbsUp, label: "J'aime" },
          { icon: MessageCircle, label: "Commenter" },
          { icon: Repeat2, label: "Republier" },
          { icon: Send, label: "Envoyer" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 py-3 px-2 text-xs text-muted-foreground hover:bg-accent rounded transition-colors"
            disabled
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Char count */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs">
        <span
          className={
            isOptimal
              ? "text-green-600 dark:text-green-400"
              : charCount > 1300
              ? "text-red-500"
              : "text-muted-foreground"
          }
        >
          {charCount} caractères
          {isOptimal && " ✓ optimal"}
          {charCount > 3000 && " ⚠ trop long"}
        </span>
        <span className="text-muted-foreground">
          {charCount > 0 ? "~" + Math.ceil(charCount / 200) + " min de lecture" : ""}
        </span>
      </div>
    </div>
  )
}
