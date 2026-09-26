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
} from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ServiceIcon } from "@/components/workshop/service-icon"
import { WorkStatusBadge } from "@/components/workshop/status-badge"
import { WhatsAppModal } from "@/components/workshop/whatsapp-modal"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { useWorkshop } from "@/lib/store"
import { cn } from "@/lib/utils"
import {
  workOrders,
  parts,
  invoices,
  revenueTrend,
  formatRupiah,
  invoiceTotal,
} from "@/lib/data"
import type { TabKey } from "@/components/workshop/bottom-nav"

const todayRevenue = invoices
  .filter((i) => i.status === "Lunas" && i.date === "25 Sep 2026")
  .reduce((s, i) => s + i.paidAmount, 0)

const activeJobs = workOrders.filter((w) => w.status === "Dikerjakan" || w.status === "Antrian" || w.status === "Menunggu Sparepart")
const readyJobs = workOrders.filter((w) => w.status === "Siap Diambil")
const lowStock = parts.filter((p) => p.stock <= p.minStock)

const stats = [
  {
    label: "Pendapatan Hari Ini",
    value: formatRupiah(todayRevenue || 248000),
    icon: TrendingUp,
    tint: "text-success",
    sub: "+12% vs kemarin",
  },
  { label: "Pekerjaan Aktif", value: `${activeJobs.length}`, icon: Wrench, tint: "text-primary", sub: "Sedang berjalan" },
  { label: "Siap Diambil", value: `${readyJobs.length}`, icon: PackageCheck, tint: "text-chart-2", sub: "Menunggu pelanggan" },
  { label: "Stok Menipis", value: `${lowStock.length}`, icon: AlertTriangle, tint: "text-destructive", sub: "Perlu restock" },
]

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

const chartData = revenueTrend.map((r) => ({ month: r.month, v: r.pendapatan }))

export function DashboardScreen({ onNavigate }: { onNavigate: (t: TabKey) => void }) {
  const { canEdit } = useWorkshop()
  const [waOpen, setWaOpen] = useState(false)
  const monthRevenue = revenueTrend[revenueTrend.length - 1].pendapatan

  const activeQuickActions: QuickAction[] = canEdit
    ? quickActions
    : [
        { label: "Pekerjaan", icon: Plus, go: "pekerjaan" },
        { label: "Invoice", icon: ReceiptText, go: "invoice" },
        { label: "Stok", icon: Package, go: "stok" },
        { label: "Laporan", icon: BarChart3, go: "analitik" },
      ]

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-0 p-3.5 md:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={`size-4 ${s.tint}`} />
            </div>
            <p className="mt-2 text-xl md:text-2xl font-semibold tracking-tight text-balance">{s.value}</p>
            <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{s.sub}</p>
          </Card>
        ))}
      </section>

      <section>
        <div className="grid grid-cols-4 gap-2 md:gap-3.5">
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
              className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-3 md:p-3.5 text-xs font-medium border border-border dark:border-slate-700/80 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-muted/50 dark:hover:bg-slate-800"
            >
              <span
                className={cn(
                  "flex size-10 md:size-11 items-center justify-center rounded-full transition-colors",
                  a.action === "wa"
                    ? "bg-[#25D366]/15 text-[#25D366] dark:bg-[#25D366]/20 dark:text-[#25D366]"
                    : "bg-primary/15 text-primary"
                )}
              >
                <a.icon className="size-5 md:size-5.5" />
              </span>
              <span className="truncate">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      <Card className="gap-3 p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Pendapatan Bulan Ini</p>
            <p className="text-2xl md:text-3xl font-semibold tracking-tight">{formatRupiah(monthRevenue)}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
            <TrendingUp className="size-3.5" /> +6,8%
          </span>
        </div>
        <div className="h-24 md:h-32 min-h-24 md:min-h-32 w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={96}>
            <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#rev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Pekerjaan Aktif</h2>
            <button
              type="button"
              onClick={() => onNavigate("pekerjaan")}
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua <ChevronRight className="size-3.5" />
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
                  <WorkStatusBadge status={w.status} />
                  <span className="text-xs text-muted-foreground">{w.progress}%</span>
                </div>
                <Progress value={w.progress} className="h-1.5" />
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
              className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua <ChevronRight className="size-3.5" />
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

      {canEdit && <WhatsAppModal open={waOpen} onClose={() => setWaOpen(false)} />}
    </div>
  )
}
