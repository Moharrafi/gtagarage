"use client"

import { Home, Wrench, Package, ReceiptText, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

export type TabKey = "beranda" | "pekerjaan" | "stok" | "invoice" | "analitik"

const tabs: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "pekerjaan", label: "Pekerjaan", icon: Wrench },
  { key: "stok", label: "Stok", icon: Package },
  { key: "invoice", label: "Invoice", icon: ReceiptText },
  { key: "analitik", label: "Analitik", icon: BarChart3 },
]

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav
      aria-label="Navigasi utama"
      className="absolute inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-md"
    >
      <ul className="flex items-stretch justify-around px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg py-1.5 text-[0.65rem] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-primary/15",
                  )}
                >
                  <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
