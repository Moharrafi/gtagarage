"use client"

import { useState, useRef, useEffect } from "react"
import { Search, SlidersHorizontal, ChevronDown, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface SearchFilterOption {
  key: string
  label: string
  placeholder?: string
}

interface SearchFilterBarProps {
  query: string
  onQueryChange: (q: string) => void
  selectedField: string
  onFieldChange: (fieldKey: string) => void
  options: SearchFilterOption[]
  className?: string
  ariaLabel?: string
}

export function SearchFilterBar({
  query,
  onQueryChange,
  selectedField,
  onFieldChange,
  options,
  className,
  ariaLabel = "Pencarian data",
}: SearchFilterBarProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const activeOption = options.find((o) => o.key === selectedField) || options[0]

  // Close dropdown menu on click outside or escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  const placeholderText =
    activeOption?.placeholder ||
    (activeOption?.key === "all"
      ? "Cari data..."
      : `Cari berdasarkan ${activeOption?.label.toLowerCase()}...`)

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search Input Container */}
      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholderText}
          className="pl-9 pr-9 h-10 rounded-2xl bg-card border-border dark:border-slate-700/80 shadow-2xs text-xs md:text-sm placeholder:text-muted-foreground/70"
          aria-label={ariaLabel}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Hapus teks pencarian"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filter Criteria Button & Dropdown */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-10 items-center gap-1.5 rounded-2xl border px-3 text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer",
            selectedField !== "all"
              ? "border-primary bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20"
              : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground dark:border-slate-700/80"
          )}
          title="Pilih kriteria pencarian spesifik"
        >
          <SlidersHorizontal className="size-3.5 shrink-0" />
          <span className="hidden sm:inline-block max-w-[120px] truncate">
            {activeOption?.label || "Filter"}
          </span>
          <span className="sm:hidden font-medium">
            {activeOption?.key === "all" ? "Semua" : activeOption?.label.split(" ")[0]}
          </span>
          <ChevronDown
            className={cn("size-3 shrink-0 transition-transform duration-200", open && "rotate-180")}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[200px] overflow-hidden rounded-2xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-md dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-2.5 py-1.5 border-b border-border/60 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Cari Berdasarkan:
              </p>
            </div>
            <div className="space-y-0.5">
              {options.map((opt) => {
                const isSelected = selectedField === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onFieldChange(opt.key)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors text-left cursor-pointer",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground hover:bg-muted dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="size-3.5 shrink-0 ml-2" />}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchFilterBar

