"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomSheet({
  open,
  onClose,
  title,
  header,
  children,
  className,
  bodyClassName,
  full,
}: {
  open: boolean
  onClose: () => void
  title?: string
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
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
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center overflow-hidden p-0 md:p-6">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 transition-opacity duration-200 animate-in fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || "Panel Dialog"}
        className={cn(
          "relative mx-auto flex w-full flex-col bg-card shadow-2xl animate-sheet-mobile overflow-hidden",
          "max-w-[440px] md:max-w-[640px] lg:max-w-[720px]",
          full
            ? "h-full max-h-dvh md:max-h-[90dvh] rounded-none md:rounded-3xl border-0 md:border md:border-border"
            : "max-h-[92dvh] md:max-h-[86dvh] rounded-t-3xl md:rounded-3xl border-t md:border border-border",
          className,
        )}
      >
        {!full && (
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 md:hidden" />
        )}

        {header !== undefined ? (
          header
        ) : title ? (
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
        ) : null}

        <div
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] no-scrollbar",
            bodyClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
