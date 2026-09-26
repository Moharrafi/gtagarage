"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  className,
  full,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  full?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative mx-auto flex w-full max-w-[440px] flex-col bg-card shadow-2xl animate-in slide-in-from-bottom duration-300",
          full
            ? "h-full max-h-dvh sm:max-h-[920px] rounded-none sm:rounded-[2.25rem] border-0"
            : "max-h-[92dvh] sm:max-h-[850px] rounded-t-3xl border-t border-border",
          className,
        )}
      >
        {!full && (
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
        )}

        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
            <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X className="size-4.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
