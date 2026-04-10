"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Eye,
  CalendarDays,
  Newspaper,
  Users,
  Settings,
  Sparkles,
  Menu,
  X,
  CheckSquare,
} from "lucide-react"
import { useState } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/veille", label: "Veille", icon: Eye },
  { href: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { href: "/newsletter", label: "Newsletter", icon: Newspaper },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/test", label: "Tests", icon: CheckSquare },
  { href: "/settings", label: "Paramètres", icon: Settings },
]

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2" onClick={onClose}>
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Rebirth</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Content Studio</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">YM</span>
          </div>
          <div>
            <p className="text-sm font-medium">Yannick</p>
            <p className="text-xs text-muted-foreground">Content Creator</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card">
      <NavContent />
    </aside>
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-card border-b border-border">
      <Link href="/" className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-bold">Rebirth</span>
      </Link>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className={buttonVariants({ variant: "ghost", size: "icon" })}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
