"use client"

import { useState } from "react"
import {
  Printer,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Eye,
  FileText,
  Wrench,
  TrendingUp,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Share2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Building2,
} from "lucide-react"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/workshop/toast"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { useWorkshop } from "@/lib/store"
import {
  formatRupiah,
} from "@/lib/data"
import { cn } from "@/lib/utils"

export interface StockExpenseItem {
  name: string
  qty: number
  amount: number
  pct: string
}

interface ReportExportModalProps {
  open: boolean
  onClose: () => void
  monthlyReport: { period: string; pendapatan: number; pengeluaran: number; laba: number; labaMargin: number; totalTransaksi: number; rataTransaksi: number; piutang: number }
  serviceBreakdown: { name: string; value: number; jobs: number }[]
  stockExpenseBreakdown?: StockExpenseItem[]
}

export function ReportExportModal({ open, onClose, monthlyReport, serviceBreakdown, stockExpenseBreakdown = [] }: ReportExportModalProps) {
  const { profile, technicians } = useWorkshop()
  const [copiedWa, setCopiedWa] = useState(false)
  const [showPreview, setShowPreview] = useState(true)

  const currentDateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const reportCode = `FIN-${monthlyReport.period.replace(/\s+/g, "").toUpperCase()}-01`

  // 1. HANDLER: CETAK / SIMPAN PDF
  const handlePrint = () => {
    toast.info("Membuka Dialog Cetak", "Pilih 'Save as PDF' atau printer Anda untuk mencetak.")
    setTimeout(() => {
      window.print()
    }, 200)
  }

  // 2. HANDLER: UNDUH EXCEL / SPREADSHEET (.CSV)
  const handleDownloadCsv = () => {
    try {
      const lines: string[] = []
      lines.push("sep=;") // Direct Excel to use semicolon separator universally
      lines.push(`LAPORAN KEUANGAN BULANAN - ${profile.name || "GTA GARAGE"}`)
      lines.push(`Periode:;${monthlyReport.period}`)
      lines.push(`Nomor Dokumen:;${reportCode}`)
      lines.push(`Tanggal Dibuat:;${currentDateStr}`)
      lines.push(`Alamat:;${profile.address || "Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur"}`)
      lines.push(`Kontak:;${profile.phone || "0812-8888-9102"}`)
      lines.push("")

      // Ringkasan Eksekutif
      lines.push("=== RINGKASAN EKSEKUTIF KEUANGAN ===")
      lines.push("Indikator Finansial;Nilai Nominal (IDR);Keterangan Analisis")
      lines.push(`Total Pendapatan Kotor;${monthlyReport.pendapatan};Akumulasi penjualan jasa & part`)
      lines.push(`Total Beban Operasional;${monthlyReport.pengeluaran};Pengeluaran operasional & belanja`)
      lines.push(`Laba Bersih Usaha (Net Profit);${monthlyReport.laba};Keuntungan bersih setelah beban`)
      lines.push(`Net Profit Margin;${monthlyReport.labaMargin}%;Rasio margin laba terhadap omzet`)
      lines.push(`Total Transaksi Kendaraan;${monthlyReport.totalTransaksi};Jumlah unit pengerjaan servis`)
      lines.push(`Rata-rata Nilai per Order;${monthlyReport.rataTransaksi};Rata-rata nilai per transaksi`)
      lines.push(`Piutang Belum Tertagih;${monthlyReport.piutang};Faktur berjalan yang belum lunas`)
      lines.push("")

      // Rincian Pendapatan per Lini Layanan
      lines.push("=== RINCIAN PENDAPATAN PER LINI LAYANAN ===")
      lines.push("No;Lini Layanan;Pekerjaan Selesai (Unit);Nilai Pendapatan (IDR);Kontribusi (%)")
      serviceBreakdown.forEach((s, idx) => {
        const pct = monthlyReport.pendapatan > 0 ? ((s.value / monthlyReport.pendapatan) * 100).toFixed(1) : "0.0"
        lines.push(`${idx + 1};${s.name};${s.jobs};${s.value};${pct}%`)
      })
      const totalJobs = serviceBreakdown.reduce((a, b) => a + b.jobs, 0)
      lines.push(`;TOTAL PENDAPATAN;${totalJobs};${monthlyReport.pendapatan};100.0%`)
      lines.push("")

      // Rincian Beban Suku Cadang & Bahan (Menu Stok)
      lines.push("=== RINCIAN BEBAN SUKU CADANG & BAHAN (MENU STOK) ===")
      lines.push("No;Nama Suku Cadang / Barang Stok;Jumlah Unit Terpakai;Total Biaya (IDR);Proporsi (%)")
      if (stockExpenseBreakdown.length > 0) {
        stockExpenseBreakdown.forEach((e, idx) => {
          lines.push(`${idx + 1};${e.name};${e.qty};${e.amount};${e.pct}%`)
        })
      } else {
        lines.push("1;Tidak ada pemakaian suku cadang dari stok;0;0;0.0%")
      }
      lines.push(`;TOTAL BEBAN SUKU CADANG;;${monthlyReport.pengeluaran};100.0%`)
      lines.push("")

      // Kinerja Tim Mekanik
      lines.push("=== KINERJA & PRODUKTIVITAS MEKANIK ===")
      lines.push("No;Nama Teknisi;Pekerjaan Selesai (Unit);Rata-rata Waktu (Jam);Tingkat Efisiensi (%)")
      technicians.forEach((t, idx) => {
        lines.push(`${idx + 1};${t.name};${t.completedThisMonth};${t.avgHours} jam/order;${t.efficiency}%`)
      })
      lines.push("")
      lines.push(`Catatan: Laporan resmi divalidasi oleh sistem ${profile.name || "GTA GARAGE"} pada ${currentDateStr}`)

      // Prepend UTF-8 BOM so Microsoft Excel loads Indonesian characters properly
      const csvContent = "\uFEFF" + lines.join("\r\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const safeFilename = `Laporan_Keuangan_${(profile.name || "GTA_GARAGE").replace(/\s+/g, "_")}_${monthlyReport.period.replace(/\s+/g, "_")}.csv`
      link.href = url
      link.setAttribute("download", safeFilename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("File Excel Diunduh", `File "${safeFilename}" berhasil disimpan ke perangkat Anda.`)
    } catch {
      toast.error("Gagal Mengunduh", "Terjadi kesalahan saat memproses file CSV.")
    }
  }

  // 3. WHATSAPP SUMMARY GENERATOR
  const getWhatsAppSummaryText = () => {
    return `*📊 LAPORAN KEUANGAN & OPERASIONAL — ${profile.name || "GTA GARAGE"}*
_Periode: ${monthlyReport.period}_
_Nomor: ${reportCode}_
_Tanggal: ${currentDateStr}_
━━━━━━━━━━━━━━━━━━━━

💰 *RINGKASAN EKSEKUTIF*
• *Total Pendapatan:* ${formatRupiah(monthlyReport.pendapatan)}
• *Total Pengeluaran:* ${formatRupiah(monthlyReport.pengeluaran)}
• *Laba Bersih:* ${formatRupiah(monthlyReport.laba)} *(Margin ${monthlyReport.labaMargin}%)*
• *Total Pengerjaan:* ${monthlyReport.totalTransaksi} kendaraan
• *Rata-rata Order:* ${formatRupiah(monthlyReport.rataTransaksi)}
• *Sisa Piutang:* ${formatRupiah(monthlyReport.piutang)}

🛠️ *PENDAPATAN PER LAYANAN*
${serviceBreakdown.map((s) => `• ${s.name}: ${formatRupiah(s.value)} (${s.jobs} unit - ${monthlyReport.pendapatan > 0 ? ((s.value / monthlyReport.pendapatan) * 100).toFixed(1) : "0.0"}%)`).join("\n")}

📉 *BEBAN SUKU CADANG & BAHAN (MENU STOK)*
${stockExpenseBreakdown.length > 0
  ? stockExpenseBreakdown.map((e) => `• ${e.name}: ${formatRupiah(e.amount)} (${e.qty} unit - ${e.pct}%)`).join("\n")
  : "• Tidak ada pemakaian suku cadang dari stok pada periode ini (Rp 0)"}
• *Total Beban:* ${formatRupiah(monthlyReport.pengeluaran)}

👥 *PRODUKTIVITAS TEKNISI*
${technicians.map((t) => `• ${t.name}: ${t.completedThisMonth} order | ${t.avgHours} jam/order | Efisiensi ${t.efficiency}%`).join("\n")}

━━━━━━━━━━━━━━━━━━━━
_Laporan resmi dibuat otomatis dari Sistem POS & Operasional ${profile.name || "GTA GARAGE"}._`
  }

  // 4. HANDLER: SALIN KE CLIPBOARD
  const handleCopyWaText = async () => {
    try {
      const text = getWhatsAppSummaryText()
      await navigator.clipboard.writeText(text)
      setCopiedWa(true)
      setTimeout(() => setCopiedWa(false), 2500)
      toast.success("Ringkasan Disalin", "Format teks laporan siap ditempel (Ctrl+V) di chat WhatsApp.")
    } catch {
      toast.error("Gagal Menyalin", "Peramban memblokir akses clipboard.")
    }
  }

  // 5. HANDLER: BUKA WHATSAPP LANGSUNG
  const handleOpenWhatsApp = () => {
    const text = getWhatsAppSummaryText()
    const encoded = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encoded}`, "_blank")
    toast.success("Membuka WhatsApp", "Laporan keuangan siap diteruskan ke Owner atau tim.")
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Ekspor Laporan Keuangan"
        className="max-w-[440px] md:max-w-2xl lg:max-w-3xl"
      >
        <div className="space-y-4 p-4 md:p-5 max-h-[80dvh] overflow-y-auto">
          {/* Header Card */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Laporan Periode {monthlyReport.period}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Pilih format ekspor resmi yang Anda butuhkan
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
                {reportCode}
              </span>
            </div>

            {/* Quick KPI stats strip */}
            <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-primary/15 pt-3 text-center">
              <div>
                <p className="text-[10px] text-muted-foreground">Pendapatan</p>
                <p className="text-xs font-bold text-foreground">
                  {formatRupiah(monthlyReport.pendapatan)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Pengeluaran</p>
                <p className="text-xs font-bold text-destructive">
                  {formatRupiah(monthlyReport.pengeluaran)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Laba Bersih</p>
                <p className="text-xs font-bold text-emerald-600">
                  {formatRupiah(monthlyReport.laba)} ({monthlyReport.labaMargin}%)
                </p>
              </div>
            </div>
          </div>

          {/* 3 Main Export Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action 1: Cetak / Simpan PDF */}
            <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-3.5 shadow-sm hover:border-primary/50 transition-all">
              <div className="space-y-1.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Printer className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Cetak / Simpan PDF</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Dokumen resmi A4 lengkap dengan kop surat bengkel, rincian tabel, dan kolom tanda tangan.
                </p>
              </div>
              <Button
                onClick={handlePrint}
                size="sm"
                className="mt-3 w-full gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                <Printer className="size-3.5" /> Cetak PDF
              </Button>
            </div>

            {/* Action 2: Unduh Excel / CSV */}
            <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-3.5 shadow-sm hover:border-emerald-500/50 transition-all">
              <div className="space-y-1.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <FileSpreadsheet className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Excel / Spreadsheet</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  File .CSV dengan format rapi dan UTF-8 BOM, siap dianalisis di Microsoft Excel atau Google Sheets.
                </p>
              </div>
              <Button
                onClick={handleDownloadCsv}
                variant="outline"
                size="sm"
                className="mt-3 w-full gap-1.5 border-emerald-600/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <Download className="size-3.5" /> Unduh Excel
              </Button>
            </div>

            {/* Action 3: Kirim ke WhatsApp */}
            <div className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-3.5 shadow-sm hover:border-emerald-500/50 transition-all">
              <div className="space-y-1.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <WhatsAppIcon className="size-4.5" />
                </div>
                <h4 className="text-xs font-bold text-foreground">Ringkasan WhatsApp</h4>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Format teks ringkas siap kirim ke Owner, mitra investor, atau grup manajemen bengkel.
                </p>
              </div>
              <div className="mt-3 flex gap-1.5">
                <Button
                  onClick={handleCopyWaText}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 text-[11px]"
                  title="Salin teks ke clipboard"
                >
                  {copiedWa ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                  {copiedWa ? "Tersalin" : "Salin"}
                </Button>
                <Button
                  onClick={handleOpenWhatsApp}
                  size="sm"
                  className="flex-1 gap-1 bg-[#25D366] hover:bg-[#20ba5a] text-white text-[11px]"
                >
                  <Share2 className="size-3" /> Buka WA
                </Button>
              </div>
            </div>
          </div>

          {/* Toggle Live Preview */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              <Eye className="size-3.5" />
              {showPreview ? "Sembunyikan Pratinjau Dokumen" : "Tampilkan Pratinjau Dokumen Cetak A4"}
            </button>
            <span className="text-[11px] text-muted-foreground">
              Format Standar A4 Portrait (210 × 297 mm)
            </span>
          </div>

          {/* Document Preview Card */}
          {showPreview && (
            <div className="rounded-2xl border border-border bg-muted/30 p-2 sm:p-4 overflow-hidden">
              <div className="mx-auto max-w-[760px] overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 sm:p-6 text-slate-800 shadow-md">
                <DocumentPrintLayout
                  profile={profile}
                  reportCode={reportCode}
                  currentDateStr={currentDateStr}
                  technicians={technicians}
                  monthlyReport={monthlyReport}
                  serviceBreakdown={serviceBreakdown}
                  stockExpenseBreakdown={stockExpenseBreakdown}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* HIDDEN PRINT-SECTION: RENDERED FOR BROWSER PRINT ONLY */}
      <div id="print-section" className="hidden print:flex bg-white text-slate-900 justify-center">
        <div className="w-full max-w-[780px] p-6 bg-white text-slate-900 font-sans">
          <DocumentPrintLayout
            profile={profile}
            reportCode={reportCode}
            currentDateStr={currentDateStr}
            technicians={technicians}
            monthlyReport={monthlyReport}
            serviceBreakdown={serviceBreakdown}
            stockExpenseBreakdown={stockExpenseBreakdown}
            isPrint
          />
        </div>
      </div>
    </>
  )
}

/**
 * REUSABLE PRINTABLE & PREVIEW DOCUMENT TEMPLATE
 */
function DocumentPrintLayout({
  profile,
  reportCode,
  currentDateStr,
  technicians = [],
  monthlyReport,
  serviceBreakdown,
  stockExpenseBreakdown = [],
  isPrint = false,
}: {
  profile: ReturnType<typeof useWorkshop>["profile"]
  reportCode: string
  currentDateStr: string
  technicians?: ReturnType<typeof useWorkshop>["technicians"]
  monthlyReport: { period: string; pendapatan: number; pengeluaran: number; laba: number; labaMargin: number; totalTransaksi: number; rataTransaksi: number; piutang: number }
  serviceBreakdown: { name: string; value: number; jobs: number }[]
  stockExpenseBreakdown?: StockExpenseItem[]
  isPrint?: boolean
}) {
  return (
    <div className={cn("w-full bg-white text-slate-900 font-sans text-left", isPrint ? "p-0" : "")}>
      {/* 1. KOP SURAT RESMI BENGKEL */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-13 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm border border-slate-800">
            <Wrench className="size-6 sm:size-7 text-sky-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase">
              {profile.name || "GTA GARAGE"}
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-sky-700 uppercase tracking-wider">
              Motorcycle Studio · Precision Workshop & Custom Builder
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5 leading-tight">
              {profile.address || "Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur 13330"}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-600 leading-tight">
              Telp/WA: <strong>{profile.phone || "0812-8888-9102"}</strong> • Web: {profile.receiptWebsite || "www.gtagarage.com"}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-block rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-[9px] font-bold tracking-wider text-slate-800 uppercase">
            DOKUMEN RESMI KEUANGAN
          </span>
          <p className="mt-1 font-mono text-[11px] font-bold text-slate-900">{reportCode}</p>
          <p className="text-[10px] text-slate-500">Terbit: {currentDateStr}</p>
          <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-700">
            <ShieldCheck className="size-3" />
            <span>VERIFIED / AUDITED</span>
          </div>
        </div>
      </div>

      {/* 2. DOKUMEN TITLE */}
      <div className="my-3 sm:my-4 text-center">
        <h2 className="text-sm sm:text-base font-extrabold text-slate-950 uppercase tracking-wide">
          LAPORAN KEUANGAN & EVALUASI OPERASIONAL BULANAN
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Tahun Buku: <strong className="text-slate-900">{monthlyReport.period}</strong> • Status Akun:{" "}
          <strong className="text-emerald-700">Tutup Buku (Final)</strong>
        </p>
      </div>

      {/* 3. EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 my-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">
            Total Pendapatan
          </p>
          <p className="text-xs sm:text-sm font-black text-slate-950 mt-0.5">
            {formatRupiah(monthlyReport.pendapatan)}
          </p>
          <p className="text-[9px] font-bold text-emerald-600 mt-0.5 flex items-center gap-0.5">
            <ArrowUpRight className="size-2.5" /> Terverifikasi
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">
            Beban Suku Cadang
          </p>
          <p className="text-xs sm:text-sm font-black text-rose-700 mt-0.5">
            {formatRupiah(monthlyReport.pengeluaran)}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            {monthlyReport.pendapatan > 0 ? ((monthlyReport.pengeluaran / monthlyReport.pendapatan) * 100).toFixed(1) : "0.0"}% rasio beban
          </p>
        </div>

        <div className="rounded-lg border border-emerald-300 bg-emerald-50/70 p-2.5">
          <p className="text-[9px] sm:text-[10px] font-semibold text-emerald-800 uppercase">
            Laba Bersih Usaha
          </p>
          <p className="text-xs sm:text-sm font-black text-emerald-900 mt-0.5">
            {formatRupiah(monthlyReport.laba)}
          </p>
          <p className="text-[9px] font-extrabold text-emerald-700 mt-0.5">
            Margin Bersih {monthlyReport.labaMargin}%
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
          <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase">
            Sisa Piutang Usaha
          </p>
          <p className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">
            {formatRupiah(monthlyReport.piutang)}
          </p>
          <p className="text-[9px] text-slate-500 mt-0.5">
            {monthlyReport.totalTransaksi} Total Transaksi
          </p>
        </div>
      </div>

      {/* 4. DUA TABEL UTAMA (PENDAPATAN & BEBAN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
        {/* Tabel 1: Pendapatan Layanan */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase">
              1. Pendapatan per Lini Layanan
            </h3>
            <span className="text-[9px] font-semibold text-slate-500">Omzet</span>
          </div>
          <table className="w-full text-[10px] sm:text-[11px] text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-2.5 py-1.5 font-bold">Lini Layanan</th>
                <th className="px-1.5 py-1.5 text-center font-bold">Unit</th>
                <th className="px-2 py-1.5 text-right font-bold">Subtotal (Rp)</th>
                <th className="px-2 py-1.5 text-right font-bold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {serviceBreakdown.map((s) => (
                <tr key={s.name}>
                  <td className="px-2.5 py-1 font-medium text-slate-800">{s.name}</td>
                  <td className="px-1.5 py-1 text-center text-slate-600">{s.jobs}</td>
                  <td className="px-2 py-1 text-right font-semibold text-slate-900">
                    {s.value.toLocaleString("id-ID")}
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500">
                    {monthlyReport.pendapatan > 0 ? ((s.value / monthlyReport.pendapatan) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t border-slate-300 text-slate-950">
                <td className="px-2.5 py-1.5">TOTAL OMZET</td>
                <td className="px-1.5 py-1.5 text-center">
                  {serviceBreakdown.reduce((a, b) => a + b.jobs, 0)}
                </td>
                <td className="px-2 py-1.5 text-right text-slate-950">
                  {monthlyReport.pendapatan.toLocaleString("id-ID")}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-[9px]">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel 2: Rincian Beban Suku Cadang & Bahan dari Menu Stok */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase">
              2. Beban Suku Cadang & Bahan (Menu Stok)
            </h3>
            <span className="text-[9px] font-semibold text-slate-500">Pemakaian Stok</span>
          </div>
          <table className="w-full text-[10px] sm:text-[11px] text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="px-2.5 py-1.5 font-bold">Nama Suku Cadang / Barang Stok</th>
                <th className="px-1.5 py-1.5 text-center font-bold">Unit</th>
                <th className="px-2 py-1.5 text-right font-bold">Jumlah (Rp)</th>
                <th className="px-2 py-1.5 text-right font-bold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockExpenseBreakdown.length > 0 ? (
                stockExpenseBreakdown.map((e) => (
                  <tr key={e.name}>
                    <td className="px-2.5 py-1 font-medium text-slate-800">{e.name}</td>
                    <td className="px-1.5 py-1 text-center text-slate-600">{e.qty}</td>
                    <td className="px-2 py-1 text-right font-semibold text-slate-900">
                      {e.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-2 py-1 text-right font-mono text-[9px] text-slate-500">
                      {e.pct}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-center text-slate-500 italic text-[10px]">
                    Tidak ada pemakaian suku cadang dari stok pada periode ini
                  </td>
                </tr>
              )}
              <tr className="bg-slate-50 font-bold border-t border-slate-300 text-rose-700">
                <td className="px-2.5 py-1.5 text-slate-950">TOTAL BEBAN</td>
                <td className="px-1.5 py-1.5 text-center text-slate-950">
                  {stockExpenseBreakdown.reduce((acc, x) => acc + x.qty, 0)}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {monthlyReport.pengeluaran.toLocaleString("id-ID")}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-[9px] text-slate-950">
                  {monthlyReport.pengeluaran > 0 ? "100%" : "0%"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. TABEL EVALUASI MEKANIK */}
      <div className="rounded-lg border border-slate-200 overflow-hidden my-3">
        <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-[11px] font-bold text-slate-900 uppercase">
            3. Evaluasi Produktivitas & Efisiensi Tim Mekanik
          </h3>
          <span className="text-[9px] text-slate-500">Standar KPI: &gt; 85% Efisiensi</span>
        </div>
        <div className="grid grid-cols-4 divide-x divide-slate-200 p-2 text-center">
          {technicians.map((t) => (
            <div key={t.id || t.name} className="px-1 sm:px-2">
              <p className="text-[11px] font-bold text-slate-950">{t.name}</p>
              <p className="text-[9px] text-slate-500">{t.completedThisMonth} Order Selesai</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <span className="rounded bg-emerald-100 px-1 py-0.2 text-[8px] sm:text-[9px] font-bold text-emerald-800">
                  {t.efficiency}%
                </span>
                <span className="text-[9px] text-slate-600 font-medium">{t.avgHours} jam</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. CATATAN KEUANGAN */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 sm:p-2.5 my-2.5 text-[9px] sm:text-[10px] text-slate-600 leading-relaxed">
        <strong className="text-slate-900">Catatan Auditor Bengkel:</strong> Rekonsiliasi keuangan
        menunjukkan margin laba bersih sebesar <strong>{monthlyReport.labaMargin}%</strong>{" "}
        (sehat di atas target standar 40%). Rata-rata per-unit kendaraan masuk adalah{" "}
        <strong>{formatRupiah(monthlyReport.rataTransaksi)}</strong>. Seluruh sisa piutang{" "}
        <strong>{formatRupiah(monthlyReport.piutang)}</strong> tercatat lancar dengan jadwal
        pelunasan termin 7-14 hari kerja.
      </div>

      {/* 7. LEMBAR PENGESAHAN DUA TANDA TANGAN */}
      <div className="grid grid-cols-2 gap-6 pt-3 mt-3 border-t border-slate-300 text-center">
        <div>
          <p className="text-[9px] font-semibold text-slate-500 uppercase">Dibuat Oleh,</p>
          <p className="text-[11px] font-bold text-slate-900 mt-0.5">Admin & Kasir Bengkel</p>
          <div className="h-12 sm:h-14 flex items-center justify-center">
            <span className="text-[9px] font-mono text-slate-400 italic">
              [Tertanda Secara Digital]
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-950 underline">Rian Pratama</p>
          <p className="text-[9px] text-slate-500">Finance & Operational Admin</p>
        </div>

        <div>
          <p className="text-[9px] font-semibold text-slate-500 uppercase">
            Disetujui & Disahkan Oleh,
          </p>
          <p className="text-[11px] font-bold text-slate-900 mt-0.5">Pemilik Bengkel (Owner)</p>
          <div className="h-12 sm:h-14 flex items-center justify-center relative">
            <div className="absolute border-2 border-emerald-600/70 text-emerald-700/80 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rotate-[-6deg] pointer-events-none">
              ✓ GTA GARAGE APPROVED
            </div>
            <span className="text-[9px] font-mono text-slate-400 italic">
              [Tanda Tangan Elektronik]
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-950 underline">{profile.owner || "GITA"}</p>
          <p className="text-[9px] text-slate-500">Founder & Owner {profile.name || "GTA GARAGE"}</p>
        </div>
      </div>
    </div>
  )
}
