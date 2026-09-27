"use client"

import { LucideIcon, Sparkles } from "lucide-react"

interface ScreenLoadingProps {
  title: string
  subtitle?: string
  icon: LucideIcon
  type?: "inventory" | "work_orders" | "invoices" | "analytics" | "general"
}

export function ScreenLoading({
  title,
  subtitle = "Menyiapkan data operasional bengkel...",
  icon: Icon,
  type = "general",
}: ScreenLoadingProps) {
  return (
    <div className="w-full space-y-4 py-3 animate-in fade-in duration-300">
      {/* Central Animated Floating Card */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-b from-blue-50/80 via-background to-card p-6 text-center shadow-lg shadow-blue-500/5 dark:border-blue-900/40 dark:from-slate-900/90 dark:to-card">
        {/* Ambient radial glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 size-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col items-center justify-center space-y-3.5">
          {/* Animated Spinner Icon Container */}
          <div className="relative flex size-16 items-center justify-center">
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-blue-400 animate-spin" />
            <div className="absolute inset-1 rounded-full border border-dashed border-primary/30 animate-spin [animation-duration:5s]" />

            {/* Inner glowing icon pill */}
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-md shadow-primary/30">
              <Icon className="size-5 animate-pulse" />
            </div>

            {/* Ping dot */}
            <span className="absolute -top-0.5 -right-0.5 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          </div>

          {/* Titles & status */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
              <Sparkles className="size-3.5 text-primary animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>

          {/* Micro animated progress bar */}
          <div className="w-48 overflow-hidden rounded-full bg-muted/80 h-1.5 mt-1 border border-border/40">
            <div className="h-full bg-gradient-to-r from-blue-500 via-primary to-cyan-400 rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>

      {/* Realistic Shimmer Skeleton Mockup matching screen layout */}
      <div className="space-y-3 opacity-60 pointer-events-none">
        {/* Search bar & filter skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-10 flex-1 rounded-2xl bg-muted/70 animate-pulse border border-border/40" />
          <div className="h-10 w-24 rounded-2xl bg-muted/70 animate-pulse border border-border/40" />
        </div>

        {/* Filter chips skeleton */}
        <div className="flex items-center gap-2 overflow-hidden py-0.5">
          <div className="h-7 w-20 rounded-xl bg-primary/20 animate-pulse" />
          <div className="h-7 w-24 rounded-xl bg-muted/60 animate-pulse" />
          <div className="h-7 w-28 rounded-xl bg-muted/60 animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-muted/60 animate-pulse" />
        </div>

        {/* Card rows skeleton */}
        <div className="space-y-2.5 pt-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-4 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-muted/80 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-muted/80 animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-muted/60 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-3.5 w-16 ml-auto rounded bg-muted/80 animate-pulse" />
                <div className="h-2.5 w-12 ml-auto rounded bg-muted/60 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
