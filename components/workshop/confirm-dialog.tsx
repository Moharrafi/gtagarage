"use client"

import { useState, useEffect, useCallback } from "react"
import { AlertTriangle, Trash2, RotateCcw, Power, AlertCircle, X } from "lucide-react"
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
 * Usage:
 *   const ok = await confirmModal({
 *     title: "Hapus Tarif Layanan?",
 *     description: 'Hapus tarif layanan "Repaint Tangki"?',
 *     confirmText: "Hapus Tarif",
 *     variant: "destructive",
 *     icon: "trash",
 *   })
 *   if (ok) { ... }
 */
export function confirmModal(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
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

  useEffect(() => {
    confirmListener = setCurrent
    return () => {
      confirmListener = null
    }
  }, [])

  const handleAction = useCallback((ok: boolean) => {
    if (activeConfirm) {
      const { resolve } = activeConfirm
      activeConfirm = null
      setCurrent(null)
      resolve(ok)
    }
  }, [])

  // Keyboard shortcut: Esc to cancel
  useEffect(() => {
    if (!current) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleAction(false)
      } else if (e.key === "Enter") {
        e.preventDefault()
        handleAction(true)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [current, handleAction])

  if (!current) return null

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
      ? "bg-amber-600 hover:bg-amber-700 text-white"
      : options.variant === "destructive"
      ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xs shadow-destructive/25"
      : "bg-primary hover:bg-primary/90 text-primary-foreground"

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => handleAction(false)}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X button */}
        <button
          type="button"
          onClick={() => handleAction(false)}
          aria-label="Tutup konfirmasi"
          className="absolute right-3.5 top-3.5 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
          className="rounded-2xl bg-muted/40 p-3 text-xs leading-relaxed text-foreground border border-border/70 dark:bg-slate-950/60 dark:border-slate-800"
        >
          {options.description}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAction(false)}
            className="flex-1 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground hover:bg-accent active:scale-[0.98] transition-all dark:border-slate-700 dark:hover:bg-slate-800"
          >
            {options.cancelText}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => handleAction(true)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-[0.98]",
              confirmBtnClasses
            )}
          >
            {renderIcon()}
            <span>{options.confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
