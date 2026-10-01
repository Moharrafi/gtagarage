"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

type ToastListener = (toasts: ToastItem[]) => void

let activeToasts: ToastItem[] = []
const listeners = new Set<ToastListener>()

function notifyListeners() {
  listeners.forEach((listener) => listener([...activeToasts]))
}

export const toast = {
  success(title: string, description?: string, duration = 3500) {
    return this.show("success", title, description, duration)
  },
  error(title: string, description?: string, duration = 4000) {
    return this.show("error", title, description, duration)
  },
  info(title: string, description?: string, duration = 3500) {
    return this.show("info", title, description, duration)
  },
  warning(title: string, description?: string, duration = 3500) {
    return this.show("warning", title, description, duration)
  },
  show(type: ToastType, title: string, description?: string, duration = 3500) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const item: ToastItem = { id, type, title, description, duration }
    activeToasts = [item, ...activeToasts].slice(0, 3)
    notifyListeners()

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id)
      }, duration)
    }
    return id
  },
  dismiss(id: string) {
    activeToasts = activeToasts.filter((t) => t.id !== id)
    notifyListeners()
  },
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => {
      setToasts(newToasts)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-[100] w-full max-w-[420px] px-3.5 flex flex-col gap-2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
    >
      {toasts.map((t) => {
        return (
          <div
            key={t.id}
            role="status"
            onClick={() => toast.dismiss(t.id)}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-2xl border p-3 shadow-xl transition-all duration-300 animate-in slide-in-from-top-3 fade-in cursor-pointer select-none active:scale-[0.98]",
              t.type === "success" && "border-emerald-500/30 bg-card text-foreground dark:border-emerald-500/25",
              t.type === "error" && "border-destructive/30 bg-card text-foreground dark:border-destructive/30",
              t.type === "warning" && "border-amber-500/30 bg-card text-foreground dark:border-amber-500/30",
              t.type === "info" && "border-primary/30 bg-card text-foreground dark:border-primary/30",
            )}
          >
            {/* Status Icon */}
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-xl",
                t.type === "success" && "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
                t.type === "error" && "bg-destructive/15 text-destructive",
                t.type === "warning" && "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
                t.type === "info" && "bg-primary/15 text-primary",
              )}
            >
              {t.type === "success" && <CheckCircle2 className="size-4" strokeWidth={2.4} />}
              {t.type === "error" && <AlertCircle className="size-4" strokeWidth={2.4} />}
              {t.type === "warning" && <AlertTriangle className="size-4" strokeWidth={2.4} />}
              {t.type === "info" && <Info className="size-4" strokeWidth={2.4} />}
            </span>

            {/* Text content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-xs font-semibold leading-tight text-foreground">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-[0.72rem] leading-snug text-muted-foreground">{t.description}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
