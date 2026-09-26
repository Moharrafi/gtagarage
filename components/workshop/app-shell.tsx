"use client"

import { useState } from "react"
import { Bell, Wrench } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BottomNav, type TabKey } from "@/components/workshop/bottom-nav"
import { NotificationsPanel } from "@/components/workshop/notifications-panel"
import { SettingsModal } from "@/components/workshop/settings-modal"
import { Toaster } from "@/components/workshop/toast"
import { WorkshopProvider, useWorkshop, initials } from "@/lib/store"
import { DashboardScreen } from "@/components/workshop/screens/dashboard"
import { WorkOrdersScreen } from "@/components/workshop/screens/work-orders"
import { InventoryScreen } from "@/components/workshop/screens/inventory"
import { InvoicesScreen } from "@/components/workshop/screens/invoices"
import { AnalyticsScreen } from "@/components/workshop/screens/analytics"

const titles: Record<TabKey, { title: string; subtitle: string }> = {
  beranda: { title: "BengkelPro", subtitle: "Kamis, 25 September 2026" },
  pekerjaan: { title: "Pekerjaan", subtitle: "Order servis & perbaikan" },
  stok: { title: "Stok Suku Cadang", subtitle: "Inventaris & riwayat pakai" },
  invoice: { title: "Invoice & Pembayaran", subtitle: "Tagihan & transaksi digital" },
  analitik: { title: "Analitik & Laporan", subtitle: "Performa & keuangan bengkel" },
}

function AppShellInner() {
  const [tab, setTab] = useState<TabKey>("beranda")
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { profile } = useWorkshop()
  const head = titles[tab]
  const displayTitle = tab === "beranda" ? (profile.name || head.title) : head.title

  return (
    <div className="flex min-h-dvh w-full justify-center bg-gradient-to-br from-muted/60 to-background sm:p-6">
      <div className="relative flex h-dvh w-full max-w-[440px] flex-col overflow-hidden bg-background shadow-xl sm:h-[calc(100dvh-3rem)] sm:max-h-[920px] sm:rounded-[2.25rem] sm:ring-1 sm:ring-border">
        {/* Header */}
        <header className="z-20 flex items-center gap-3 border-b border-border bg-card/80 px-4 py-3.5 backdrop-blur-md">
          {tab === "beranda" ? (
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground shadow-sm shadow-primary/30">
              <Wrench className="size-5" strokeWidth={2.4} />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold leading-tight">{displayTitle}</h1>
            <p className="truncate text-xs text-muted-foreground">{head.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            aria-label="Buka notifikasi"
            className="relative flex size-9 items-center justify-center rounded-full text-foreground hover:bg-accent"
          >
            <Bell className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-card" />
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Buka Pengaturan"
            title="Pengaturan Bengkel & Tarif"
            className="group relative flex size-9 items-center justify-center rounded-full transition-transform active:scale-95 hover:ring-2 hover:ring-primary/40 focus:outline-none"
          >
            <Avatar className="size-9 ring-1 ring-border group-hover:ring-primary/60 transition-all">
              <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {initials(profile.owner || "RM")}
              </AvatarFallback>
            </Avatar>
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overscroll-contain px-4 pb-24 pt-4 no-scrollbar">
          {tab === "beranda" && <DashboardScreen onNavigate={setTab} />}
          {tab === "pekerjaan" && <WorkOrdersScreen />}
          {tab === "stok" && <InventoryScreen />}
          {tab === "invoice" && <InvoicesScreen />}
          {tab === "analitik" && <AnalyticsScreen />}
        </main>

        <BottomNav active={tab} onChange={setTab} />
        <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <Toaster />
      </div>
    </div>
  )
}

export function AppShell() {
  return (
    <WorkshopProvider>
      <AppShellInner />
    </WorkshopProvider>
  )
}
