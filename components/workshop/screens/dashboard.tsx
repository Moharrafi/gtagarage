"use client"

import { useState } from "react"
import {
  TrendingUp,
  Wrench,
  PackageCheck,
  AlertTriangle,
  Plus,
  ReceiptText,
  Package,
  ChevronRight,
  BarChart3,
  Clock,
} from "lucide-react"
import dynamic from "next/dynamic"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ServiceIcon } from "@/components/workshop/service-icon"
import { WorkStatusBadge } from "@/components/workshop/status-badge"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { useWorkshop } from "@/lib/store"
import { cn } from "@/lib/utils"

const WhatsAppModal = dynamic(
  () => import("@/components/workshop/whatsapp-modal").then((m) => m.WhatsAppModal),
  { ssr: false }
)
import {
  formatRupiah,
} from "@/lib/data"
import { getDashboardStats } from "@/lib/analytics"
import type { TabKey } from "@/components/workshop/bottom-nav"

interface QuickAction {
  label: string
  icon: React.ComponentType<{ className?: string }>
  go?: TabKey
  action?: "wa"
}

const quickActions: QuickAction[] = [
  { label: "Pekerjaan", icon: Plus, go: "pekerjaan" },
  { label: "Invoice", icon: ReceiptText, go: "invoice" },
  { label: "Stok", icon: Package, go: "stok" },
  { label: "Kirim WA", icon: WhatsAppIcon, action: "wa" },
]



function SparklineArea({ data }: { data: { month: string; v: number }[] }) {
  const width = 500
  const height = 95
  const padTop = 10
  const padBottom = 8
  const padLeft = 4
  const padRight = 4

  const values = data.map((d) => d.v)
  const minVal = Math.min(...values) * 0.85
  const maxVal = Math.max(...values) * 1.05
  const range = maxVal - minVal || 1

  const usableWidth = width - padLeft - padRight
  const usableHeight = height - padTop - padBottom

  const points = data.map((d, i) => {
    const x = padLeft + (i / (data.length - 1)) * usableWidth
    const y = padTop + usableHeight - ((d.v - minVal) / range) * usableHeight
    return { x, y }
  })

  // Monotone cubic bezier path calculation
  const linePath = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    const prev = arr[i - 1]
    const cx1 = prev.x + (point.x - prev.x) * 0.5
    const cy1 = prev.y
    const cx2 = prev.x + (point.x - prev.x) * 0.5
    const cy2 = point.y
    return `${acc} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
  }, "")

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(1)} ${height} L ${firstPoint.x.toFixed(1)} ${height} Z`

  return (
    <div className="w-full flex flex-col justify-end">
      <div className="h-20 md:h-24 w-full relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="dashboard-spark-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#dashboard-spark-grad)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--chart-1)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex justify-between items-center px-1 pt-1.5 text-[11px] font-medium text-muted-foreground select-none">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}

export function DashboardScreen({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const { canEdit, workOrders, parts, invoices } = useWorkshop()
  const [waOpen, setWaOpen] = useState(false)
  
  const { todayRevenue, monthRevenue, queuedJobs, activeJobs, readyJobs, lowStock, revenueTrend } = getDashboardStats(invoices, workOrders, parts)
  const chartData = revenueTrend.map((r) => ({ month: r.month, v: r.pendapatan }))
  
  const stats = [
    {
      label: "Antrian Masuk",
      value: `${queuedJobs.length}`,
      icon: Clock,
      tint: "text-amber-500 dark:text-amber-400",
      sub: "Menunggu giliran",
    },
    { label: "Pekerjaan Aktif", value: `${activeJobs.length}`, icon: Wrench, tint: "text-primary", sub: "Sedang berjalan" },
    { label: "Siap Diambil", value: `${readyJobs.length}`, icon: PackageCheck, tint: "text-emerald-600 dark:text-emerald-400", sub: "Menunggu pelanggan" },
    { label: "Stok Menipis", value: `${lowStock.length}`, icon: AlertTriangle, tint: "text-destructive", sub: "Perlu restock" },
  ]

  const activeQuickActions: QuickAction[] = canEdit
    ? quickActions
    : [
        { label: "Pekerjaan", icon: Plus, go: "pekerjaan" },
        { label: "Invoice", icon: ReceiptText, go: "invoice" },
        { label: "Stok", icon: Package, go: "stok" },
        { label: "Laporan", icon: BarChart3, go: "analitik" },
      ]

  return (
    <div className="space-y-0">
      {/* ================= DANA STYLE BLUE TOP HERO SECTION ================= */}
      <section className="-mx-4 md:-mx-6 -mt-4 bg-primary px-4 md:px-6 pt-1 pb-9 text-white shadow-xs dark:bg-slate-900">
        {/* Today's Revenue Highlight & Shop Status */}
        <div className="flex items-center justify-between pb-3 pt-1">
          <div>
            <p className="text-[11px] font-medium text-blue-100/90 uppercase tracking-wider">
              Pendapatan Hari Ini
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {formatRupiah(todayRevenue || 248000)}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                <TrendingUp className="size-3" /> +12%
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100 border border-emerald-300/30">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Bengkel Buka
          </span>
        </div>

        {/* 4 Quick Actions directly on the BLUE background (DANA Style) */}
        <div className="grid grid-cols-4 gap-2 pt-2 pb-1">
          {activeQuickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              aria-label={`Menu cepat ${a.label}`}
              onClick={() => {
                if (a.action === "wa") {
                  setWaOpen(true)
                } else if (a.go) {
                  onNavigate(a.go)
                }
              }}
              className="group flex flex-col items-center gap-1.5 transition-transform active:scale-95"
            >
              <span className="flex size-12 md:size-14 items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 text-white ring-1 ring-white/30 shadow-xs transition-all group-hover:scale-105 group-hover:bg-white/30">
                <a.icon className="size-6 text-white" />
              </span>
              <span className="truncate text-xs font-semibold text-white tracking-tight drop-shadow-xs">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ================= DANA STYLE WHITE BOTTOM SECTION ================= */}
      <div className="relative -mt-4 rounded-t-[28px] md:rounded-t-3xl bg-background px-4 md:px-6 pt-5 space-y-4 md:space-y-5 -mx-4 md:-mx-6">
        {/* KPI Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="gap-0 p-3.5 md:p-4 bg-card border-border shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`size-4 ${s.tint}`} />
              </div>
              <p className="mt-2 text-xl md:text-2xl font-semibold tracking-tight text-balance">{s.value}</p>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{s.sub}</p>
            </Card>
          ))}
        </section>

        {/* Monthly Revenue Chart Card */}
        <Card className="gap-2.5 p-4 md:p-5 bg-card border-border shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pendapatan Bulan Ini</p>
              <p className="text-2xl md:text-3xl font-semibold tracking-tight">{formatRupiah(monthRevenue)}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
              <TrendingUp className="size-3.5" /> +6,8%
            </span>
          </div>
          <SparklineArea data={chartData} />
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pekerjaan Aktif</h2>
            <button
              type="button"
              onClick={() => onNavigate("pekerjaan")}
              aria-label="Lihat semua daftar pekerjaan aktif"
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <div className="space-y-2.5">
            {activeJobs.slice(0, 3).map((w) => (
              <Card key={w.id} className="gap-2.5 p-3.5 hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-3">
                  <ServiceIcon service={w.service} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {w.vehicle.brand} {w.vehicle.model}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">{w.code}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.vehicle.plate} · {w.customer.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <WorkStatusBadge status={w.status} />
                    {w.technician && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                        <Wrench className="size-2.5 text-primary" /> {w.technician}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-foreground">{w.progress}%</span>
                </div>
                <Progress
                  value={w.progress}
                  className="h-1.5"
                  aria-label={`Progres pengerjaan ${w.vehicle.brand} ${w.vehicle.model}: ${w.progress}%`}
                />
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Invoice Terbaru</h2>
            <button
              type="button"
              onClick={() => onNavigate("invoice")}
              aria-label="Lihat semua riwayat invoice"
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <Card className="divide-y divide-border p-0 overflow-hidden">
            {invoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{inv.number} · {inv.service}</p>
                </div>
                <div className="text-right">
                  <p className="shrink-0 text-sm font-semibold text-foreground">{formatRupiah(invoiceTotal(inv))}</p>
                  <span className="text-[10px] text-muted-foreground">{inv.status}</span>
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>

      </div>

      {canEdit && <WhatsAppModal open={waOpen} onClose={() => setWaOpen(false)} />}
    </div>
  )
}
