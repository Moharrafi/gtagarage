import type { Invoice, InvoiceItem } from "./data"
import type { WorkshopProfile } from "./store"
import { invoiceSubtotal, invoiceTotal } from "./data"

function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(val))
}

export function calculateReceiptHeightMm(
  invoice: Invoice,
  paperWidth: "58mm" | "80mm" = "80mm"
): number {
  const is58 = paperWidth === "58mm"
  const factor = is58 ? 1.25 : 1.0

  let h = 32 // Header (Brand, slogan, address, phone)
  h += 28 // Meta info (No, date, time, customer, vehicle, plate)

  const jasaItems = invoice.items.filter((it) => {
    const l = it.label.toLowerCase()
    return (
      l.startsWith("jasa") ||
      l.includes("servis") ||
      l.includes("blasting") ||
      l.includes("restorasi") ||
      l.includes("tune up") ||
      l.includes("kustom") ||
      l.includes("setting") ||
      l.includes("overhaul")
    )
  })
  const partItems = invoice.items.filter((it) => !jasaItems.includes(it))

  if (jasaItems.length > 0) {
    h += 6
    for (const it of jasaItems) {
      h += (it.qty > 1 ? 9.5 : 6.5) * factor
    }
  }

  if (partItems.length > 0) {
    h += 6
    for (const it of partItems) {
      h += 9.5 * factor
    }
  }

  if (jasaItems.length === 0 && partItems.length === 0) {
    h += invoice.items.length * 7 * factor
  }

  h += 34 // Financials: subtotal, total, status
  if (invoice.discountAmount && invoice.discountAmount > 0) h += 5.5
  if (invoice.adminFee && invoice.adminFee > 0) h += 5.5
  if (invoice.status !== "Lunas" && invoice.paidAmount > 0) h += 5.5
  if (invoice.paymentRef) h += 5.5

  h += 28 // Footer: warranty, website, barcode, thank you
  h += 10 // Safety padding

  return Math.ceil(Math.max(130, h))
}

/**
 * Generate standalone, self-contained HTML for a 58mm/80mm POS Thermal Receipt.
 * Includes inline CSS for high contrast, clean monospaced layout, dashed dividers,
 * and precise margins for any thermal receipt printer or PDF print preview.
 */
export function generateThermalReceiptHtml(
  invoice: Invoice,
  profile: WorkshopProfile,
  options: { paperWidth?: "58mm" | "80mm" } = {}
): string {
  const paperWidth = options.paperWidth || "80mm"
  const estimatedHeightMm = calculateReceiptHeightMm(invoice, paperWidth)
  const contentWidth = paperWidth === "58mm" ? "52mm" : "74mm"

  const subtotal = invoiceSubtotal(invoice)
  const discount = invoice.discountAmount || 0
  const total = invoiceTotal(invoice)
  const sisa = Math.max(0, total - invoice.paidAmount)
  const isLunas = invoice.status === "Lunas" || sisa === 0
  const adminFee = invoice.adminFee || 0
  const totalWithAdmin = total + adminFee

  const jasaItems: InvoiceItem[] = []
  const partItems: InvoiceItem[] = []

  invoice.items.forEach((it) => {
    const l = it.label.toLowerCase()
    if (
      l.startsWith("jasa") ||
      l.includes("servis") ||
      l.includes("blasting") ||
      l.includes("restorasi") ||
      l.includes("tune up") ||
      l.includes("kustom") ||
      l.includes("setting") ||
      l.includes("overhaul")
    ) {
      jasaItems.push(it)
    } else {
      partItems.push(it)
    }
  })

  // Format date and time
  const now = new Date()
  const printTimeStr = invoice.paidAt || now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  const printDateStr = invoice.date || now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>Struk - ${invoice.number}</title>
  <style>
    @page {
      size: ${paperWidth} ${estimatedHeightMm}mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      margin: 0;
      padding: 0;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace, system-ui;
      font-size: ${paperWidth === "58mm" ? "10px" : "11px"};
      line-height: 1.35;
      width: ${paperWidth};
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden;
    }
    .receipt-container {
      width: ${paperWidth};
      max-width: ${paperWidth};
      margin: 0 auto;
      padding: 2.5mm 3.5mm;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    
    .header {
      text-align: center;
      margin-bottom: 6px;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .brand-sub {
      font-size: 9.5px;
      line-height: 1.25;
      color: #111;
      margin-bottom: 1px;
    }
    .dashed {
      border-top: 1px dashed #000;
      margin: 6px 0;
      width: 100%;
    }
    .double-dashed {
      border-top: 2px dashed #000;
      margin: 6px 0;
      width: 100%;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
      margin-bottom: 2px;
    }
    .row-sm {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
      font-size: 10px;
      margin-bottom: 2px;
    }
    .section-title {
      font-weight: bold;
      font-size: 11px;
      margin-top: 4px;
      margin-bottom: 2px;
    }
    .item-entry {
      margin-bottom: 4px;
      padding-left: 2px;
    }
    .item-label {
      flex: 1;
      word-break: break-word;
    }
    .item-calc {
      font-size: 9.5px;
      color: #333;
      padding-left: 6px;
    }
    .status-badge {
      display: inline-block;
      border: 1px solid #000;
      padding: 1px 6px;
      font-weight: bold;
      font-size: 10.5px;
      letter-spacing: 0.5px;
    }
    .footer {
      text-align: center;
      font-size: 9.5px;
      margin-top: 6px;
      line-height: 1.3;
    }
    .barcode-line {
      letter-spacing: 3px;
      font-size: 13px;
      font-weight: bold;
      margin: 6px 0 2px 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <div class="header">
      <div class="brand-title uppercase">${escapeHtml(profile.name || "GTA GARAGE")}</div>
      ${profile.slogan ? `<div class="brand-sub">${escapeHtml(profile.slogan.replace(/\n/g, " · "))}</div>` : ""}
      ${profile.address ? `<div class="brand-sub">${escapeHtml(profile.address)}</div>` : ""}
      ${profile.phone ? `<div class="brand-sub">Telp: ${escapeHtml(profile.phone)}</div>` : ""}
    </div>

    <div class="dashed"></div>

    <!-- Meta / Customer Info -->
    <div>
      <div class="row">
        <span>No: ${escapeHtml(invoice.number)}</span>
        <span>${escapeHtml(printTimeStr)} WIB</span>
      </div>
      <div class="row">
        <span>Tgl: ${escapeHtml(printDateStr)}</span>
        <span>Kasir: Admin</span>
      </div>
      <div class="row">
        <span>Pelanggan:</span>
        <span class="font-bold">${escapeHtml(invoice.customer?.name || "Umum")}</span>
      </div>
      <div class="row">
        <span>Kendaraan:</span>
        <span>${escapeHtml(`${invoice.vehicle?.brand || ""} ${invoice.vehicle?.model || ""}`.trim() || "-")}</span>
      </div>
      <div class="row">
        <span>Nomor Polisi:</span>
        <span class="font-bold">${escapeHtml(invoice.vehicle?.plate || "-")}</span>
      </div>
    </div>

    <div class="dashed"></div>

    <!-- Jasa Section -->
    ${
      jasaItems.length > 0
        ? `
      <div class="section-title">LAYANAN & JASA:</div>
      ${jasaItems
        .map(
          (item) => `
        <div class="item-entry">
          <div class="row">
            <span class="item-label">${escapeHtml(item.label)}</span>
            <span class="font-bold">Rp ${formatNumber(item.price * item.qty)}</span>
          </div>
          ${
            item.qty > 1
              ? `<div class="item-calc">${item.qty} × Rp ${formatNumber(item.price)}</div>`
              : ""
          }
        </div>
      `
        )
        .join("")}
    `
        : ""
    }

    <!-- Part / Material Section -->
    ${
      partItems.length > 0
        ? `
      <div class="section-title">SUKU CADANG & BAHAN:</div>
      ${partItems
        .map(
          (item) => `
        <div class="item-entry">
          <div class="row">
            <span class="item-label">${escapeHtml(item.label)}</span>
            <span class="font-bold">Rp ${formatNumber(item.price * item.qty)}</span>
          </div>
          <div class="item-calc">${item.qty} × Rp ${formatNumber(item.price)}</div>
        </div>
      `
        )
        .join("")}
    `
        : ""
    }

    <!-- Fallback if uncategorized -->
    ${
      jasaItems.length === 0 && partItems.length === 0
        ? invoice.items
            .map(
              (item) => `
        <div class="item-entry">
          <div class="row">
            <span class="item-label">${escapeHtml(item.label)} (${item.qty}x)</span>
            <span class="font-bold">Rp ${formatNumber(item.price * item.qty)}</span>
          </div>
        </div>
      `
            )
            .join("")
        : ""
    }

    <div class="dashed"></div>

    <!-- Calculations -->
    <div>
      <div class="row">
        <span>Subtotal:</span>
        <span>Rp ${formatNumber(subtotal)}</span>
      </div>
      ${
        discount > 0
          ? `
      <div class="row font-bold">
        <span>Diskon (${escapeHtml(invoice.discountCode || "Promo")}):</span>
        <span>- Rp ${formatNumber(discount)}</span>
      </div>
      `
          : ""
      }
      ${
        adminFee > 0
          ? `
      <div class="row">
        <span>Biaya Gateway (${escapeHtml(invoice.method || "Admin")}):</span>
        <span>Rp ${formatNumber(adminFee)}</span>
      </div>
      `
          : ""
      }
      <div class="double-dashed"></div>
      <div class="row font-bold" style="font-size: 13px;">
        <span>TOTAL:</span>
        <span>Rp ${formatNumber(totalWithAdmin)}</span>
      </div>

      ${
        !isLunas && invoice.paidAmount > 0
          ? `
      <div class="row" style="font-size: 10.5px; margin-top: 2px;">
        <span>Uang Muka / DP:</span>
        <span>Rp ${formatNumber(invoice.paidAmount)}</span>
      </div>
      `
          : ""
      }

      <div class="dashed"></div>

      <!-- Payment & Status -->
      <div class="row" style="align-items: center;">
        <span class="font-bold">STATUS PEMBAYARAN:</span>
        <span class="status-badge">${isLunas ? "LUNAS ✓" : escapeHtml(invoice.status.toUpperCase())}</span>
      </div>

      ${
        isLunas
          ? `
      <div class="row-sm" style="margin-top: 4px;">
        <span>Metode Pembayaran:</span>
        <span class="font-bold">${escapeHtml(
          invoice.method === "QRIS"
            ? "QRIS Midtrans"
            : invoice.method === "Transfer"
            ? `Transfer VA ${invoice.bankName || ""}`.trim()
            : invoice.method === "Kartu"
            ? "Kartu Debit/Kredit"
            : invoice.method === "Tunai"
            ? "Tunai Kasir"
            : invoice.method || "Tunai"
        )}</span>
      </div>
      `
          : ""
      }

      ${
        invoice.paymentRef
          ? `
      <div class="row-sm">
        <span>Ref Transaksi:</span>
        <span>${escapeHtml(invoice.paymentRef)}</span>
      </div>
      `
          : ""
      }

      ${
        !isLunas
          ? `
      <div class="row font-bold" style="margin-top: 4px;">
        <span>SISA TAGIHAN:</span>
        <span>Rp ${formatNumber(sisa)}</span>
      </div>
      `
          : ""
      }
    </div>

    <div class="dashed"></div>

    <!-- Footer -->
    <div class="footer">
      ${profile.receiptWarranty ? `<div>${escapeHtml(profile.receiptWarranty)}</div>` : ""}
      ${profile.receiptWebsite ? `<div>${escapeHtml(profile.receiptWebsite)}</div>` : ""}
      <div class="barcode-line">*${escapeHtml(invoice.number.replace(/[^A-Za-z0-9]/g, ""))}*</div>
      <div class="font-bold" style="margin-top: 3px;">
        ${escapeHtml(profile.receiptFooterMsg || "*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***")}
      </div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Robust thermal receipt printing engine using an isolated hidden iframe.
 * Completely immune to modal/drawer z-index collisions, body scroll locking,
 * Tailwind dark mode styling, and parent display:none inheritance.
 */
export function printThermalReceipt(
  invoice: Invoice,
  profile: WorkshopProfile,
  options: { paperWidth?: "58mm" | "80mm" } = {}
) {
  if (typeof window === "undefined") return

  try {
    // 1. Remove previous print iframe if still around
    const oldFrame = document.getElementById("gta-receipt-print-frame")
    if (oldFrame) {
      oldFrame.remove()
    }

    // 2. Create isolated hidden iframe
    const iframe = document.createElement("iframe")
    iframe.id = "gta-receipt-print-frame"
    iframe.setAttribute(
      "style",
      "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;border:none;z-index:-9999;"
    )
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (!doc) {
      // Fallback
      window.print()
      return
    }

    const receiptHtml = generateThermalReceiptHtml(invoice, profile, options)

    doc.open()
    doc.write(receiptHtml)
    doc.close()

    // 3. Trigger printing once iframe DOM is parsed
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (printErr) {
        console.warn("Iframe print invocation failed, falling back:", printErr)
        window.print()
      } finally {
        // Clean up iframe after print dialog resolves or closes
        setTimeout(() => {
          try {
            iframe.remove()
          } catch {}
        }, 3000)
      }
    }, 150)
  } catch (err) {
    console.error("printThermalReceipt encountered an error:", err)
    window.print()
  }
}
