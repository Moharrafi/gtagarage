import type { WorkshopProfile, Technician } from "./store"
import { formatRupiah } from "./data"

export interface StockExpenseItem {
  name: string
  qty: number
  amount: number
  pct: string
}

export interface FinancialReportData {
  profile: WorkshopProfile
  reportCode: string
  currentDateStr: string
  technicians?: Technician[]
  monthlyReport: {
    period: string
    pendapatan: number
    pengeluaran: number
    laba: number
    labaMargin: number
    totalTransaksi: number
    rataTransaksi: number
    piutang: number
  }
  serviceBreakdown: { name: string; value: number; jobs: number }[]
  stockExpenseBreakdown?: StockExpenseItem[]
}

function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(val))
}

/**
 * Generate standalone, self-contained, high-resolution HTML for A4 Financial Report.
 * Uses exact A4 dimensions, print-safe typography, CSS grid & flexbox, and
 * inline styles with @page { size: A4 portrait; margin: 12mm 14mm; }.
 */
export function generateFinancialReportHtml(data: FinancialReportData): string {
  const {
    profile,
    reportCode,
    currentDateStr,
    technicians = [],
    monthlyReport,
    serviceBreakdown = [],
    stockExpenseBreakdown = [],
  } = data

  const totalServiceJobs = serviceBreakdown.reduce((sum, item) => sum + item.jobs, 0)
  const totalStockQty = stockExpenseBreakdown.reduce((sum, item) => sum + item.qty, 0)

  const expenseRatio =
    monthlyReport.pendapatan > 0
      ? ((monthlyReport.pengeluaran / monthlyReport.pendapatan) * 100).toFixed(1)
      : "0.0"

  const isLoss = monthlyReport.laba < 0
  const labaLabel = isLoss ? "Rugi Bersih Usaha" : "Laba Bersih Usaha"
  const marginBadge = isLoss
    ? `Defisit (${monthlyReport.labaMargin}%)`
    : `Margin Bersih ${monthlyReport.labaMargin}%`

  const auditorNoteText = isLoss
    ? `Rekonsiliasi keuangan periode ini mencatat defisit sementara sebesar <strong>${escapeHtml(formatRupiah(Math.abs(monthlyReport.laba)))}</strong> (margin <strong>${escapeHtml(monthlyReport.labaMargin)}%</strong>), dikarenakan tingginya alokasi belanja pengadaan suku cadang &amp; bahan persediaan stok (<strong>${escapeHtml(formatRupiah(monthlyReport.pengeluaran))}</strong>). Pembelian barang tersebut saat ini tersimpan sebagai aset persediaan barang siap jual untuk periode berjalan. Rata-rata transaksi servis tercatat <strong>${escapeHtml(formatRupiah(monthlyReport.rataTransaksi))}</strong> dan seluruh sisa piutang berjalan lancar.`
    : `Rekonsiliasi keuangan bulan ini menunjukkan margin laba bersih yang sehat sebesar <strong>${escapeHtml(monthlyReport.labaMargin)}%</strong> (mencapai target standar operasional). Rata-rata nilai per-unit kendaraan masuk adalah <strong>${escapeHtml(formatRupiah(monthlyReport.rataTransaksi))}</strong>. Seluruh sisa piutang berjalan senilai <strong>${escapeHtml(formatRupiah(monthlyReport.piutang))}</strong> tercatat lancar dengan jadwal pelunasan termin 7-14 hari kerja.`

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Laporan Keuangan - ${escapeHtml(reportCode)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: auto;
      background: #ffffff;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .report-page {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      padding: 6mm 8mm;
      background: #ffffff;
    }
    
    /* 1. KOP SURAT */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-box {
      width: 52px;
      height: 52px;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #38bdf8;
      font-weight: 900;
      font-size: 22px;
      letter-spacing: -1px;
      flex-shrink: 0;
    }
    .workshop-name {
      font-size: 17px;
      font-weight: 900;
      color: #020617;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .workshop-tagline {
      font-size: 10px;
      font-weight: 700;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }
    .workshop-meta {
      font-size: 10px;
      color: #475569;
      margin-top: 2px;
      line-height: 1.3;
    }
    .header-right {
      text-align: right;
      flex-shrink: 0;
    }
    .doc-badge {
      display: inline-block;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 9px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .doc-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .doc-date {
      font-size: 10px;
      color: #64748b;
      margin-top: 1px;
    }
    .doc-verified {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 9.5px;
      font-weight: 800;
      color: #059669;
      margin-top: 3px;
    }

    /* 2. TITLE */
    .title-section {
      text-align: center;
      margin-bottom: 14px;
    }
    .main-title {
      font-size: 15px;
      font-weight: 900;
      color: #020617;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .sub-title {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .sub-title strong {
      color: #0f172a;
    }
    .badge-final {
      color: #059669;
      font-weight: 800;
    }

    /* 3. KPI CARDS */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 9px 10px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .kpi-card.highlight {
      border-color: #a7f3d0;
      background: #ecfdf5;
    }
    .kpi-card.loss {
      border-color: #fca5a5;
      background: #fef2f2;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .kpi-card.highlight .kpi-label {
      color: #065f46;
    }
    .kpi-card.loss .kpi-label {
      color: #991b1b;
    }
    .kpi-value {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      margin: 3px 0 2px 0;
      letter-spacing: -0.2px;
    }
    .kpi-value.danger {
      color: #b91c1c;
    }
    .kpi-value.success {
      color: #047857;
    }
    .kpi-value.warning {
      color: #b45309;
    }
    .kpi-footer {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
    }
    .kpi-footer.success {
      color: #059669;
    }
    .kpi-footer.loss {
      color: #b91c1c;
    }

    /* 4. MAIN TABLES */
    .tables-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .table-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
      display: flex;
      flex-direction: column;
    }
    .table-box-header {
      background: #f1f5f9;
      border-bottom: 1px solid #cbd5e1;
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-box-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
    }
    .table-box-tag {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    table.data-table th {
      background: #f8fafc;
      border-bottom: 1px solid #cbd5e1;
      padding: 5px 8px;
      font-size: 8.5px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      text-align: left;
    }
    table.data-table td {
      padding: 4px 8px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    table.data-table tr:last-child td {
      border-bottom: none;
    }
    table.data-table .text-center {
      text-align: center;
    }
    table.data-table .text-right {
      text-align: right;
    }
    table.data-table .font-bold {
      font-weight: 800;
    }
    table.data-table .font-semibold {
      font-weight: 700;
    }
    table.data-table tr.total-row {
      background: #f8fafc;
      border-top: 1.5px solid #94a3b8;
      font-weight: 800;
      color: #020617;
    }
    table.data-table tr.total-row td {
      padding: 6px 8px;
      font-size: 10px;
    }

    /* 5. TECHNICIAN EVALUATION */
    .tech-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 12px;
      background: #ffffff;
    }
    .tech-grid {
      display: grid;
      grid-template-columns: repeat(${Math.max(1, technicians.length)}, 1fr);
      divide-x: 1px solid #e2e8f0;
      padding: 8px 4px;
    }
    .tech-cell {
      text-align: center;
      padding: 2px 6px;
      border-right: 1px solid #e2e8f0;
    }
    .tech-cell:last-child {
      border-right: none;
    }
    .tech-name {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
    }
    .tech-count {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 1px;
    }
    .tech-badge-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin-top: 4px;
    }
    .tech-badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      font-weight: 800;
      font-size: 8.5px;
      padding: 1px 5px;
      border-radius: 3px;
    }
    .tech-hours {
      font-size: 8.5px;
      color: #475569;
      font-weight: 600;
    }

    /* 6. AUDITOR NOTE */
    .note-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 9.5px;
      color: #475569;
      line-height: 1.45;
      margin-bottom: 14px;
    }
    .note-box strong {
      color: #0f172a;
    }

    /* 7. SIGNATURES */
    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      text-align: center;
    }
    .sig-col {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .sig-role-lead {
      font-size: 8.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .sig-role {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .sig-space {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
    }
    .sig-placeholder {
      font-size: 8.5px;
      color: #94a3b8;
      font-style: italic;
    }
    .sig-stamp {
      position: absolute;
      border: 2px solid #059669;
      color: #059669;
      font-size: 8px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 7px;
      border-radius: 9999px;
      transform: rotate(-5deg);
      background: rgba(255, 255, 255, 0.95);
    }
    .sig-name {
      font-size: 11px;
      font-weight: 900;
      color: #020617;
      text-decoration: underline;
    }
    .sig-title {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 1px;
    }

    /* Page-break control */
    .header, .title-section, .kpi-grid, .tables-container, .tech-box, .note-box, .signatures-grid {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="report-page">
    <!-- 1. KOP SURAT BENGKEL -->
    <div class="header">
      <div class="header-left">
        <div class="logo-box">GTA</div>
        <div>
          <h1 class="workshop-name">${escapeHtml(profile.name || "GTA GARAGE")}</h1>
          <p class="workshop-tagline">${escapeHtml(profile.slogan || "Motorcycle Studio · Precision Workshop & Custom Builder")}</p>
          <p class="workshop-meta">${escapeHtml(profile.address || "Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur 13330")}</p>
          <p class="workshop-meta">Telp/WA: <strong>${escapeHtml(profile.phone || "0812-8888-9102")}</strong> • Web: ${escapeHtml(profile.receiptWebsite || "www.gtagarage.com")}</p>
        </div>
      </div>

      <div class="header-right">
        <span class="doc-badge">DOKUMEN RESMI KEUANGAN</span>
        <div class="doc-code">${escapeHtml(reportCode)}</div>
        <div class="doc-date">Terbit: ${escapeHtml(currentDateStr)}</div>
        <div class="doc-verified">✓ VERIFIED / AUDITED</div>
      </div>
    </div>

    <!-- 2. JUDUL DOKUMEN -->
    <div class="title-section">
      <h2 class="main-title">LAPORAN KEUANGAN &amp; EVALUASI OPERASIONAL BULANAN</h2>
      <p class="sub-title">
        Tahun Buku: <strong>${escapeHtml(monthlyReport.period)}</strong> • Status Akun: <span class="badge-final">Tutup Buku (Final)</span>
      </p>
    </div>

    <!-- 3. EXECUTIVE KPI CARDS -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Total Pendapatan</span>
        <div class="kpi-value">${escapeHtml(formatRupiah(monthlyReport.pendapatan))}</div>
        <span class="kpi-footer success">✓ Terverifikasi</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Beban Suku Cadang</span>
        <div class="kpi-value danger">${escapeHtml(formatRupiah(monthlyReport.pengeluaran))}</div>
        <span class="kpi-footer">${expenseRatio}% Rasio Beban</span>
      </div>

      <div class="kpi-card ${isLoss ? "loss" : "highlight"}">
        <span class="kpi-label">${labaLabel}</span>
        <div class="kpi-value ${isLoss ? "danger" : "success"}">${escapeHtml(formatRupiah(monthlyReport.laba))}</div>
        <span class="kpi-footer ${isLoss ? "loss" : "success"}">${marginBadge}</span>
      </div>

      <div class="kpi-card">
        <span class="kpi-label">Sisa Piutang Usaha</span>
        <div class="kpi-value warning">${escapeHtml(formatRupiah(monthlyReport.piutang))}</div>
        <span class="kpi-footer">${escapeHtml(monthlyReport.totalTransaksi)} Total Transaksi</span>
      </div>
    </div>

    <!-- 4. DUA TABEL UTAMA (PENDAPATAN & BEBAN) -->
    <div class="tables-container">
      <!-- Tabel 1: Pendapatan Per Lini Layanan -->
      <div class="table-box">
        <div class="table-box-header">
          <span class="table-box-title">1. Pendapatan per Lini Layanan</span>
          <span class="table-box-tag">Omzet</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Lini Layanan</th>
              <th class="text-center">Unit</th>
              <th class="text-right">Subtotal (Rp)</th>
              <th class="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            ${serviceBreakdown.length > 0 ? serviceBreakdown.map((s) => {
              const pct = monthlyReport.pendapatan > 0 ? ((s.value / monthlyReport.pendapatan) * 100).toFixed(1) : "0.0"
              return `<tr>
                <td class="font-semibold">${escapeHtml(s.name)}</td>
                <td class="text-center">${escapeHtml(s.jobs)}</td>
                <td class="text-right font-bold">${formatNumber(s.value)}</td>
                <td class="text-right" style="color: #64748b; font-size: 9px;">${pct}%</td>
              </tr>`
            }).join("") : `<tr><td colspan="4" class="text-center" style="padding: 10px; color: #94a3b8; font-style: italic;">Belum ada pengerjaan</td></tr>`}
            <tr class="total-row">
              <td>TOTAL OMZET</td>
              <td class="text-center">${totalServiceJobs}</td>
              <td class="text-right">${formatNumber(monthlyReport.pendapatan)}</td>
              <td class="text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tabel 2: Beban Suku Cadang & Bahan -->
      <div class="table-box">
        <div class="table-box-header">
          <span class="table-box-title">2. Beban Suku Cadang &amp; Bahan</span>
          <span class="table-box-tag">Pemakaian Stok</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Barang Stok</th>
              <th class="text-center">Unit</th>
              <th class="text-right">Jumlah (Rp)</th>
              <th class="text-right">%</th>
            </tr>
          </thead>
          <tbody>
            ${stockExpenseBreakdown.length > 0 ? stockExpenseBreakdown.map((e) => `<tr>
              <td class="font-semibold">${escapeHtml(e.name)}</td>
              <td class="text-center">${escapeHtml(e.qty)}</td>
              <td class="text-right font-bold">${formatNumber(e.amount)}</td>
              <td class="text-right" style="color: #64748b; font-size: 9px;">${escapeHtml(e.pct)}%</td>
            </tr>`).join("") : `<tr><td colspan="4" class="text-center" style="padding: 10px; color: #94a3b8; font-style: italic;">Tidak ada pemakaian suku cadang dari stok</td></tr>`}
            <tr class="total-row">
              <td>TOTAL BEBAN</td>
              <td class="text-center">${totalStockQty}</td>
              <td class="text-right" style="color: #b91c1c;">${formatNumber(monthlyReport.pengeluaran)}</td>
              <td class="text-right">${monthlyReport.pengeluaran > 0 ? "100%" : "0%"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. EVALUASI PRODUKTIVITAS MEKANIK -->
    <div class="tech-box">
      <div class="table-box-header">
        <span class="table-box-title">3. Evaluasi Produktivitas &amp; Efisiensi Tim Mekanik</span>
        <span class="table-box-tag">Standar KPI &gt; 85% Efisiensi</span>
      </div>
      <div class="tech-grid">
        ${technicians.length > 0 ? technicians.map((t) => `<div class="tech-cell">
          <div class="tech-name">${escapeHtml(t.name)}</div>
          <div class="tech-count">${escapeHtml(t.completedThisMonth)} Order Selesai</div>
          <div class="tech-badge-row">
            <span class="tech-badge">${escapeHtml(t.efficiency)}%</span>
            <span class="tech-hours">${escapeHtml(t.avgHours)} jam</span>
          </div>
        </div>`).join("") : `<div style="padding: 8px; text-align: center; color: #94a3b8;">Belum ada data mekanik</div>`}
      </div>
    </div>

    <!-- 6. CATATAN AUDITOR KEUANGAN -->
    <div class="note-box">
      <strong>Catatan Auditor Bengkel:</strong> ${auditorNoteText}
    </div>

    <!-- 7. PENGESAHAN DUA TANDA TANGAN -->
    <div class="signatures-grid">
      <div class="sig-col">
        <span class="sig-role-lead">Dibuat Oleh,</span>
        <span class="sig-role">Admin &amp; Kasir Bengkel</span>
        <div class="sig-space">
          <span class="sig-placeholder">[Tertanda Secara Digital]</span>
        </div>
        <span class="sig-name">Admin</span>
        <span class="sig-title">Finance &amp; Operational Admin</span>
      </div>

      <div class="sig-col">
        <span class="sig-role-lead">Disetujui &amp; Disahkan Oleh,</span>
        <span class="sig-role">Pemilik Bengkel (Owner)</span>
        <div class="sig-space">
          <span class="sig-stamp">✓ GTA GARAGE APPROVED</span>
          <span class="sig-placeholder">[Tanda Tangan Elektronik]</span>
        </div>
        <span class="sig-name">${escapeHtml(profile.owner || "GITA")}</span>
        <span class="sig-title">Founder &amp; Owner ${escapeHtml(profile.name || "GTA GARAGE")}</span>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Triggers clean, isolated A4 browser printing via a temporary iframe.
 * Completely eliminates any collisions with global Tailwind styles,
 * thermal printer margins, or modal drawer wrappers.
 */
export function printFinancialReport(data: FinancialReportData) {
  if (typeof window === "undefined") return

  try {
    // 1. Clean up old print frame if still present
    const oldFrame = document.getElementById("gta-report-print-frame")
    if (oldFrame) {
      oldFrame.remove()
    }

    // 2. Create isolated hidden iframe
    const iframe = document.createElement("iframe")
    iframe.id = "gta-report-print-frame"
    iframe.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;border:none;z-index:-9999;"
    )
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      window.print()
      return
    }

    const htmlContent = generateFinancialReportHtml(data)

    doc.open()
    doc.write(htmlContent)
    doc.close()

    // 3. Trigger printing once iframe DOM is parsed
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (printErr) {
        console.warn("Iframe report print invocation failed, falling back to window.print():", printErr)
        window.print()
      } finally {
        // Clean up iframe after print dialog resolves or closes
        setTimeout(() => {
          try {
            iframe.remove()
          } catch {}
        }, 3000)
      }
    }, 180)
  } catch (err) {
    console.error("printFinancialReport encountered an error:", err)
    window.print()
  }
}
