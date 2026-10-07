"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { AlertTriangle, Trash2, RotateCcw, Power, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ConfirmVariant = "destructive" | "warning" | "default"
export type ConfirmIconType = "trash" | "alert" | "reset" | "power"

export interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  icon?: ConfirmIconType
}

type ConfirmResolver = (value: boolean) => void

interface ConfirmState {
  options: Required<ConfirmOptions>
  resolve: ConfirmResolver
}

let activeConfirm: ConfirmState | null = null
let confirmListener: ((state: ConfirmState | null) => void) | null = null

/**
 * Trigger a beautiful in-app confirmation modal instead of native window.confirm.
 */
export function confirmModal(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (activeConfirm) {
      activeConfirm.resolve(false)
      activeConfirm = null
    }

    const fullOptions: Required<ConfirmOptions> = {
      title: options.title,
      description: options.description,
      confirmText: options.confirmText || "Ya, Lanjutkan",
      cancelText: options.cancelText || "Batal",
      variant: options.variant || "destructive",
      icon: options.icon || (options.variant === "warning" ? "alert" : "trash"),
    }

    activeConfirm = {
      options: fullOptions,
      resolve,
    }

    if (confirmListener) {
      confirmListener(activeConfirm)
    }
  })
}

export function ConfirmDialog() {
  const [current, setCurrent] = useState<ConfirmState | null>(null)
  const [mounted, setMounted] = useState(false)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
    confirmListener = setCurrent
    return () => {
      confirmListener = null
      if (activeConfirm) {
        activeConfirm.resolve(false)
        activeConfirm = null
      }
    }
  }, [])

  const handleAction = useCallback((ok: boolean) => {
    if (activeConfirm) {
      const { resolve } = activeConfirm
      activeConfirm = null
      setCurrent(null)
      resolve(ok)
    } else {
      setCurrent(null)
    }
  }, [])

  // Auto focus confirm button when opened
  useEffect(() => {
    if (current) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [current])

  // Keyboard shortcut: Esc to cancel, Enter to confirm
  useEffect(() => {
    if (!current) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        handleAction(false)
      } else if (e.key === "Enter") {
        e.preventDefault()
        e.stopPropagation()
        handleAction(true)
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true })
  }, [current, handleAction])

  if (!mounted || !current || typeof document === "undefined") return null

  const { options } = current

  const renderIcon = () => {
    switch (options.icon) {
      case "power":
        return <Power className="size-5" />
      case "reset":
        return <RotateCcw className="size-5" />
      case "alert":
        return <AlertTriangle className="size-5" />
      case "trash":
      default:
        return <Trash2 className="size-5" />
    }
  }

  const iconClasses =
    options.variant === "warning"
      ? "bg-amber-500/15 text-amber-600 ring-4 ring-amber-500/10 dark:text-amber-400"
      : options.variant === "destructive"
      ? "bg-rose-500/15 text-rose-600 ring-4 ring-rose-500/10 dark:text-rose-400"
      : "bg-primary/15 text-primary ring-4 ring-primary/10"

  const confirmBtnClasses =
    options.variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/25"
      : options.variant === "destructive"
      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/25"
      : "bg-primary hover:bg-primary/90 text-white shadow-sm shadow-primary/25"

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none duration-150 animate-in fade-in pointer-events-auto"
      style={{ pointerEvents: "auto" }}
      onClick={() => handleAction(false)}
      onPointerDown={(e) => {
        // Prevent background drawers/sheets from receiving pointer events
        e.stopPropagation()
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-border/80 bg-card p-5 shadow-2xl space-y-4 duration-200 animate-in zoom-in-95 dark:border-slate-800 dark:bg-slate-900 focus:outline-none pointer-events-auto"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleAction(false)
          }}
          aria-label="Tutup konfirmasi"
          className="absolute right-3.5 top-3.5 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header with Icon */}
        <div className="flex items-center gap-3 pr-6">
          <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", iconClasses)}>
            {renderIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 id="confirm-dialog-title" className="text-sm font-bold text-foreground truncate">
              {options.title}
            </h3>
            <p className="text-[11px] text-muted-foreground">Konfirmasi Tindakan</p>
          </div>
        </div>

        {/* Message */}
        <div
          id="confirm-dialog-desc"
          className="rounded-2xl bg-muted/50 p-3.5 text-xs leading-relaxed text-foreground/90 border border-border/70 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-200"
        >
          {options.description}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleAction(false)
            }}
            className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.98] transition-all cursor-pointer dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {options.cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleAction(true)
            }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98] text-white cursor-pointer [&>svg]:text-white [&>svg]:stroke-white",
              confirmBtnClasses
            )}
          >
            {renderIcon()}
            <span className="text-white font-semibold">{options.confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
