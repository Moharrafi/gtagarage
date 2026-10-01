"use client"

import { useState } from "react"
import { ReportExportModal } from "@/components/workshop/report-export-modal"
import {
  TrendingUp,
  Users,
  Timer,
  Download,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react"
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useWorkshop } from "@/lib/store"
import {
  formatRupiah,
  formatCompact,
} from "@/lib/data"
import { getAnalyticsData, getTechnicianStats } from "@/lib/analytics"

const pieColors = ["var(--chart-3)", "var(--chart-2)", "var(--chart-5)", "var(--chart-1)"]

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  currency?: boolean
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}:{" "}
          <span className="font-medium text-foreground">
            {currency && p.name !== "Kunjungan" ? formatRupiah(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  )
}

const periods = ["Mingguan", "Bulanan", "Tahunan"] as const

export function AnalyticsScreen() {
  const { technicians, invoices, workOrders, stockInLogs } = useWorkshop()
  const [period, setPeriod] = useState<(typeof periods)[number]>("Bulanan")
  const [exportOpen, setExportOpen] = useState(false)
  
  const { totalPendapatan, deltaPendapatan, totalKunjungan, deltaKunjungan, rataServis, deltaRataServis, revenueTrend, dailyVisits, serviceBreakdown, monthlyReport, stockExpenseBreakdown } = getAnalyticsData(invoices, workOrders, period, stockInLogs)
  const realTechnicians = getTechnicianStats(technicians, workOrders)
  
  const totalJobs = serviceBreakdown.reduce((s, x) => s + x.jobs, 0)

  const kpis = [
    { label: "Pendapatan", value: formatCompact(monthlyReport.pendapatan), icon: TrendingUp, delta: deltaPendapatan, up: !deltaPendapatan.startsWith("-") },
    { label: "Kunjungan", value: `${monthlyReport.totalTransaksi}`, icon: Users, delta: deltaKunjungan, up: !deltaKunjungan.startsWith("-") },
    { label: "Rata Servis", value: String(rataServis).includes(" ") ? String(rataServis) : `${rataServis} jam`, icon: Timer, delta: deltaRataServis, up: !deltaRataServis.startsWith("-") },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-full bg-muted p-1">
        {periods.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              "flex-1 rounded-full py-1.5 text-xs font-medium transition-colors",
              period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <Card key={k.label} className="gap-0 p-3">
            <k.icon className="size-4 text-primary" />
            <p className="mt-2 text-base font-semibold tracking-tight">{k.value}</p>
            <p className="text-[0.7rem] text-muted-foreground">{k.label}</p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-0.5 text-[0.65rem] font-medium",
                k.up ? "text-success" : "text-destructive",
              )}
            >
              {k.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {k.delta}
            </span>
          </Card>
        ))}
      </div>

      <Card className="gap-3 p-4">
        <div>
          <h2 className="text-sm font-semibold">Tren Pendapatan & Kunjungan</h2>
          <p className="text-xs text-muted-foreground">
            {period === "Mingguan"
              ? "7 hari terakhir"
              : period === "Bulanan"
              ? `Bulan ${new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`
              : `Tahun ${new Date().getFullYear()}`}
          </p>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={revenueTrend} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => formatCompact(v as number)}
              />
              <YAxis yAxisId="right" orientation="right" hide />
              <Tooltip content={<ChartTooltip currency />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar yAxisId="left" dataKey="pendapatan" name="Pendapatan" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={26} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="kunjungan"
                name="Kunjungan"
                stroke="var(--chart-2)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "var(--chart-2)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="gap-3 p-4">
          <h2 className="text-sm font-semibold">Kunjungan Harian</h2>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyVisits} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Bar dataKey="masuk" name="Masuk" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={14} />
                <Bar dataKey="selesai" name="Selesai" fill="var(--chart-4)" radius={[4, 4, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-chart-3" /> Masuk
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-chart-4" /> Selesai
            </span>
          </div>
        </Card>

        <Card className="gap-3 p-4">
          <h2 className="text-sm font-semibold">Pendapatan per Layanan</h2>
          <div className="flex items-center gap-2">
            <div className="h-40 w-1/2 flex items-center justify-center">
              {totalJobs > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={38}
                      outerRadius={62}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {serviceBreakdown.map((_, i) => (
                        <Cell key={i} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip currency />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-muted-foreground">Belum ada data</span>
              )}
            </div>
            <ul className="flex-1 space-y-2">
              {serviceBreakdown.map((s, i) => (
                <li key={s.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: pieColors[i] }} />
                  <span className="flex-1 truncate text-muted-foreground">{s.name}</span>
                  <span className="font-medium">{totalJobs > 0 ? Math.round((s.jobs / totalJobs) * 100) : 0}%</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="gap-3 p-4">
          <h2 className="text-sm font-semibold">Efisiensi Teknisi</h2>
          <ul className="space-y-3">
            {realTechnicians.map((t) => (
              <li key={t.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground">
                    {t.completedThisMonth} job · {t.avgTimeFormatted || `${t.avgHours} jam`}/job
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={t.efficiency} className="h-1.5 flex-1" />
                  <span className="w-9 text-right text-xs font-semibold">{t.efficiency}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="gap-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Laporan Keuangan</h2>
              <p className="text-xs text-muted-foreground">{monthlyReport.period}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportOpen(true)}
              className="gap-1.5 bg-card hover:bg-accent text-foreground shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Download className="size-3.5" /> Ekspor
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                <ArrowUpRight className="size-3 text-success" /> Pendapatan
              </p>
              <p className="mt-1 text-sm font-semibold">{formatRupiah(monthlyReport.pendapatan)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                <ArrowDownRight className="size-3 text-destructive" /> Pengeluaran
              </p>
              <p className="mt-1 text-sm font-semibold">{formatRupiah(monthlyReport.pengeluaran)}</p>
            </div>
          </div>

          <div className="rounded-xl bg-primary/10 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Wallet className="size-4" /> Laba Bersih
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[0.7rem] font-medium text-primary">
                margin {monthlyReport.labaMargin}%
              </span>
            </div>
            <p className="mt-1.5 text-xl font-semibold">{formatRupiah(monthlyReport.laba)}</p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Piutang belum tertagih</span>
            <span className="font-medium text-foreground">{formatRupiah(monthlyReport.piutang)}</span>
          </div>
        </Card>
      </div>

      <p className="pb-2 text-center text-[0.7rem] text-muted-foreground">
        Data laporan ini bersumber dari database dan diperbarui secara berkala.
      </p>

      <ReportExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        monthlyReport={monthlyReport}
        serviceBreakdown={serviceBreakdown}
        stockExpenseBreakdown={stockExpenseBreakdown}
      />
    </div>
  )
}
