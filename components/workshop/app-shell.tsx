"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, useRef } from "react"
import { Bell, Wrench, Home, Package, ReceiptText, BarChart3, Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BottomNav, type TabKey } from "@/components/workshop/bottom-nav"
import { Toaster } from "@/components/workshop/toast"
import { ConfirmDialog } from "@/components/workshop/confirm-dialog"
import { cn } from "@/lib/utils"
import { WorkshopProvider, useWorkshop, initials } from "@/lib/store"
import { LoginScreen } from "@/components/workshop/login-screen"
import { DashboardScreen } from "@/components/workshop/screens/dashboard"

import { ScreenLoading } from "@/components/workshop/screen-loading"

const WorkOrdersScreen = dynamic(
  () => import("@/components/workshop/screens/work-orders").then((mod) => mod.WorkOrdersScreen),
  {
    loading: () => (
      <ScreenLoading
        title="Memuat Data Pekerjaan..."
        subtitle="Menyiapkan antrian servis & status unit kendaraan..."
        icon={Wrench}
        type="work_orders"
      />
    ),
  }
)

const InventoryScreen = dynamic(
  () => import("@/components/workshop/screens/inventory").then((mod) => mod.InventoryScreen),
  {
    loading: () => (
      <ScreenLoading
        title="Memuat Katalog Suku Cadang..."
        subtitle="Menyiapkan stok, SKU & ketersediaan sparepart..."
        icon={Package}
        type="inventory"
      />
    ),
  }
)

const InvoicesScreen = dynamic(
  () => import("@/components/workshop/screens/invoices").then((mod) => mod.InvoicesScreen),
  {
    loading: () => (
      <ScreenLoading
        title="Memuat Kasir & Invoice..."
        subtitle="Sinkronisasi tagihan, status lunas & QRIS Midtrans..."
        icon={ReceiptText}
        type="invoices"
      />
    ),
  }
)

const AnalyticsScreen = dynamic(
  () => import("@/components/workshop/screens/analytics").then((mod) => mod.AnalyticsScreen),
  {
    loading: () => (
      <ScreenLoading
        title="Memuat Analitik & Laporan..."
        subtitle="Mengalkulasi performa omset & efisiensi bengkel..."
        icon={BarChart3}
        type="analytics"
      />
    ),
  }
)

const SettingsModal = dynamic(
  () => import("@/components/workshop/settings-modal").then((mod) => mod.SettingsModal)
)

const NotificationsPanel = dynamic(
  () => import("@/components/workshop/notifications-panel").then((mod) => mod.NotificationsPanel)
)

const titles: Record<TabKey, { title: string; subtitle: string }> = {
  beranda: { title: "GTA GARAGE", subtitle: "Sistem Operasional & Kasir Bengkel" },
  pekerjaan: { title: "Pekerjaan", subtitle: "Order servis & perbaikan kendaraan" },
  stok: { title: "Stok Suku Cadang", subtitle: "Inventaris & riwayat pakai sparepart" },
  invoice: { title: "Invoice & Pembayaran", subtitle: "Tagihan, QRIS Midtrans & transaksi" },
  analitik: { title: "Analitik & Laporan", subtitle: "Performa pendapatan & keuangan bengkel" },
}

const navItems: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "beranda", label: "Beranda", icon: Home },
  { key: "pekerjaan", label: "Pekerjaan", icon: Wrench },
  { key: "stok", label: "Stok Suku Cadang", icon: Package },
  { key: "invoice", label: "Invoice & Kasir", icon: ReceiptText },
  { key: "analitik", label: "Analitik & Laporan", icon: BarChart3 },
]

function AppShellInner() {
  const [tab, setTab] = useState<TabKey>("beranda")
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { profile, currentUser, authLoaded, unreadNotifCount, workOrders, parts } = useWorkshop()
  const head = titles[tab]
  const displayTitle = tab === "beranda" ? (profile.name || head.title) : head.title
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Listen for Service Worker messages to play sound and vibrate
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PLAY_SOUND' && event.data.sound) {
        if (audioRef.current) {
          audioRef.current.src = event.data.sound;
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(e => console.error("Error playing sound via DOM:", e));
          }
        }
        
        if (event.data.vibrate && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200, 100, 400]);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const activeJobsCount = workOrders.filter((w) => w.status !== "Selesai").length
  const lowStockCount = parts.filter((p) => p.stock <= p.minStock).length

  if (!currentUser) {
    return (
      <>
        <LoginScreen />
        <Toaster />
      </>
    )
  }

  return (
    <div className="flex min-h-dvh w-full justify-center bg-gradient-to-br from-muted/60 to-background sm:p-3 md:p-5 lg:p-6">
      <audio ref={audioRef} className="hidden" preload="auto" />
      <div className="relative flex h-dvh w-full max-w-[440px] md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex-col md:flex-row overflow-hidden bg-background shadow-xl sm:h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2.5rem)] sm:rounded-[2rem] sm:ring-1 sm:ring-border">
        {/* Tablet / Desktop Sidebar Rail */}
        <aside className="hidden md:flex md:w-56 lg:w-64 md:flex-col md:border-r md:border-border md:bg-card/75 md:backdrop-blur-md shrink-0">
          {/* Brand header */}
          <div className="flex items-center gap-3 p-4 border-b border-border/70">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-md shadow-primary/25">
              <Wrench className="size-5" strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-sm font-bold text-foreground tracking-tight">
                  {profile.name || "GTA GARAGE"}
                </h2>
                <span className="rounded bg-primary/10 px-1 py-0.5 text-[9px] font-bold text-primary">
                  POS
                </span>
              </div>
              <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                {profile.slogan?.split("\n")[0] || "Motorcycle Studio & Garage"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar" aria-label="Navigasi Menu Utama">
            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Menu Utama
            </p>
            {navItems.map(({ key, label, icon: Icon }) => {
              const isActive = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all text-left group",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs shadow-primary/20"
                      : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="flex-1 truncate">{label}</span>
                  {key === "pekerjaan" && activeJobsCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        isActive
                          ? "bg-primary-foreground/25 text-primary-foreground"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {activeJobsCount}
                    </span>
                  )}
                  {key === "stok" && lowStockCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9.5px] font-bold",
                        isActive
                          ? "bg-primary-foreground/25 text-primary-foreground"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {lowStockCount} tipis
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer User Card */}
          <div className="p-3 border-t border-border/70 space-y-2 bg-muted/20">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-accent transition-colors"
            >
              <div className="relative">
                <Avatar className="size-9 ring-1 ring-border">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {currentUser.avatarInitials || initials(profile.owner || "GI")}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
                    currentUser.role === "Owner"
                      ? "bg-blue-500"
                      : currentUser.role === "Admin"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground leading-tight">
                  {currentUser.name}
                </p>
                <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                  {currentUser.role} · Pengaturan Bengkel
                </p>
              </div>
              <Settings className="size-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        </aside>

        {/* Main section */}
        <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Header - DANA 2-Tone Style */}
          <header
            className={cn(
              "z-20 flex items-center gap-3 bg-primary px-4 md:px-6 text-white shrink-0 shadow-xs",
              tab === "beranda" ? "border-b-0 pt-3.5 pb-2" : "border-b border-primary/20 py-3.5 shadow-sm shadow-primary/20",
              "dark:border-slate-800 dark:bg-slate-900"
            )}
          >
            {tab === "beranda" ? (
              <span className="flex size-9 md:hidden items-center justify-center rounded-xl bg-white/20 text-white shadow-sm ring-1 ring-white/30 backdrop-blur-xs">
                <Wrench className="size-5" strokeWidth={2.4} />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base md:text-lg font-bold leading-tight text-white tracking-tight">{displayTitle}</h1>
                {currentUser.role === "Mekanik" && (
                  <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white border border-white/30">
                    Mode Mekanik
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-blue-100/90 dark:text-slate-300">{head.subtitle}</p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setNotifOpen(true)}
                aria-label="Buka notifikasi"
                className="relative flex size-9 items-center justify-center rounded-full text-white hover:bg-white/15 active:scale-95 transition-all"
              >
                <Bell className="size-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-primary animate-in zoom-in duration-200">
                    {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                aria-label="Buka Pengaturan"
                title={`Pengaturan Bengkel & Akun (${currentUser.name} - ${currentUser.role})`}
                className="group relative flex size-9 items-center justify-center rounded-full transition-transform active:scale-95 hover:ring-2 hover:ring-white/50 focus:outline-none"
              >
                <Avatar className="size-9 ring-2 ring-white/50 group-hover:ring-white transition-all shadow-sm">
                  <AvatarFallback className="bg-white text-xs font-bold text-primary shadow-xs">
                    {currentUser.avatarInitials || initials(profile.owner || "GI")}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-primary",
                    currentUser.role === "Owner"
                      ? "bg-sky-400"
                      : currentUser.role === "Admin"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  )}
                  title={`Role: ${currentUser.role}`}
                />
              </button>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="relative flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 pb-24 md:pb-6 pt-4 no-scrollbar bg-background">
            <div className="relative mx-auto w-full max-w-5xl">
              {tab === "beranda" && <DashboardScreen onNavigate={setTab} />}
              {tab === "pekerjaan" && <WorkOrdersScreen />}
              {tab === "stok" && <InventoryScreen />}
              {tab === "invoice" && <InvoicesScreen />}
              {tab === "analitik" && <AnalyticsScreen />}
            </div>
          </main>

          {/* Mobile Bottom Navigation (Hidden on Tablet) */}
          <div className="md:hidden">
            <BottomNav active={tab} onChange={setTab} />
          </div>
        </div>
        <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} onNavigate={setTab} />
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <Toaster />
        <ConfirmDialog />
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
