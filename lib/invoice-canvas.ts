import { formatRupiah, invoiceTotal, invoiceSubtotal, type Invoice, type WorkOrder, workOrderTotal } from "@/lib/data"
import type { WorkshopProfile } from "@/lib/store"

/**
 * Adapter to convert a WorkOrder to an Invoice format for image generation
 */
export function workOrderToInvoice(wo: WorkOrder): Invoice {
  const items: { label: string; qty: number; price: number }[] = [
    { label: `Jasa/Layanan: ${wo.service}`, qty: 1, price: wo.laborCost },
    ...(wo.usedParts || []).map((p) => ({ label: p.name, qty: p.qty, price: p.price })),
  ]
  return {
    id: `inv-wo-${wo.id}`,
    number: wo.code.startsWith("WO-") ? wo.code.replace("WO-", "INV-") : `INV-${wo.code}`,
    workOrderCode: wo.code,
    date: wo.createdAt ? wo.createdAt.split(" ")[0] : "Hari ini",
    customer: wo.customer,
    vehicle: wo.vehicle,
    service: wo.service,
    items,
    paidAmount: 0,
    status: "Belum Bayar",
  }
}

/**
 * Render a high-resolution, beautiful digital invoice card to an HTML5 Canvas.
 */
export function drawInvoiceCanvas(invoice: Invoice, profile: WorkshopProfile): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  const width = 640
  const items = invoice.items || []
  const total = invoiceTotal(invoice)
  const sisa = Math.max(0, total - invoice.paidAmount)
  const isLunas = invoice.status === "Lunas" || sisa === 0
  const hasDiscount = Boolean(invoice.discountAmount && invoice.discountAmount > 0)

  // 1. Calculate dynamic height precisely
  const sloganLines = profile.slogan ? profile.slogan.split("\n").map((s) => s.trim()).filter(Boolean) : []
  let calculatedHeader = 36 + 22 + sloganLines.length * 16
  if (profile.address) calculatedHeader += 16
  if (profile.phone) calculatedHeader += 18
  calculatedHeader += 18 // separator line

  const metaHeight = 85
  const itemRowHeight = 28
  const itemsHeight = 36 + items.length * itemRowHeight + 18
  let summaryHeight = 76
  if (hasDiscount) summaryHeight += 38
  if (invoice.paidAmount > 0 && !isLunas) summaryHeight += 20
  const bannerHeight = 60
  
  let footerHeight = 24
  if (profile.receiptWarranty) footerHeight += 16
  if (profile.receiptWebsite) footerHeight += 16
  footerHeight += 28 // footer message & bottom padding

  const totalHeight = Math.ceil(calculatedHeader + metaHeight + itemsHeight + summaryHeight + bannerHeight + footerHeight + 10)

  // Retina 2x scale for ultra crisp text on mobile & desktop screens
  const scale = 2
  canvas.width = width * scale
  canvas.height = totalHeight * scale
  ctx.scale(scale, scale)

  // Background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, totalHeight)

  // Subtle Outer Card Border
  ctx.strokeStyle = "#e2e8f0"
  ctx.lineWidth = 1.5
  ctx.strokeRect(1, 1, width - 2, totalHeight - 2)

  // Top Accent Gradient Bar (Automotive Blue-Cyan gradient)
  const grad = ctx.createLinearGradient(0, 0, width, 0)
  grad.addColorStop(0, "#1d4ed8")
  grad.addColorStop(0.5, "#2563eb")
  grad.addColorStop(1, "#0284c7")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, 8)

  let y = 34

  // Top Badge: "INVOICE RESMI DIGITAL"
  ctx.fillStyle = isLunas ? "#dcfce7" : "#eff6ff"
  roundRect(ctx, width - 150, 16, 125, 20, 6)
  ctx.fill()
  ctx.strokeStyle = isLunas ? "#86efac" : "#bfdbfe"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.textAlign = "center"
  ctx.fillStyle = isLunas ? "#15803d" : "#1d4ed8"
  ctx.font = "bold 9.5px 'Segoe UI', system-ui, -apple-system, sans-serif"
  ctx.fillText(isLunas ? "✓ LUNAS RESMI" : "INVOICE RESMI", width - 87, 29.5)

  // 1. WORKSHOP BRANDING HEADER
  ctx.textAlign = "center"
  ctx.fillStyle = "#0f172a"
  ctx.font = "bold 17.5px 'Segoe UI', system-ui, -apple-system, sans-serif"
  ctx.fillText((profile.name || "MOTOCRAFT STUDIO & GARAGE").toUpperCase(), width / 2, y)

  y += 18
  if (sloganLines.length > 0) {
    ctx.fillStyle = "#475569"
    ctx.font = "500 11px 'Segoe UI', system-ui, sans-serif"
    for (const sLine of sloganLines) {
      ctx.fillText(sLine, width / 2, y)
      y += 15
    }
  }

  ctx.fillStyle = "#64748b"
  ctx.font = "normal 10.5px 'Segoe UI', system-ui, sans-serif"
  if (profile.address) {
    ctx.fillText(profile.address, width / 2, y)
    y += 15
  }

  if (profile.phone) {
    ctx.fillText(`Telp / WA: ${profile.phone}`, width / 2, y)
    y += 18
  }

  // Dashed Separator
  drawDashedLine(ctx, 28, y, width - 28, y)
  y += 18

  // 2. METADATA (Two-column layout)
  ctx.textAlign = "left"
  const col1X = 35
  const col2X = width / 2 + 10

  const drawField = (label: string, val: string, x: number, currentY: number) => {
    ctx.fillStyle = "#64748b"
    ctx.font = "normal 11px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText(label, x, currentY)
    ctx.fillStyle = "#0f172a"
    ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText(val, x + 82, currentY)
  }

  drawField("No. Invoice:", invoice.number, col1X, y)
  drawField("Pelanggan:", invoice.customer.name, col2X, y)
  y += 20

  drawField("Tanggal:", invoice.date, col1X, y)
  const vehicleText = `${invoice.vehicle.brand} ${invoice.vehicle.model}`
  drawField("Unit/Mesin:", vehicleText.length > 22 ? vehicleText.slice(0, 21) + "…" : vehicleText, col2X, y)
  y += 20

  drawField("Layanan:", invoice.service, col1X, y)
  drawField("No. Polisi:", invoice.vehicle.plate, col2X, y)
  y += 22

  // Dashed Separator
  drawDashedLine(ctx, 28, y, width - 28, y)
  y += 15

  // 3. ITEMS TABLE
  // Table Header Box
  ctx.fillStyle = "#f1f5f9"
  roundRect(ctx, 28, y, width - 56, 26, 6)
  ctx.fill()
  ctx.strokeStyle = "#e2e8f0"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = "#334155"
  ctx.font = "bold 10.5px 'Segoe UI', system-ui, sans-serif"
  ctx.textAlign = "left"
  ctx.fillText("DESKRIPSI PEKERJAAN / SPAREPART", 40, y + 17)
  ctx.textAlign = "right"
  ctx.fillText("SUBTOTAL", width - 40, y + 17)
  y += 32

  // Item Rows
  items.forEach((it, idx) => {
    // Subtle alternating row background
    if (idx % 2 === 1) {
      ctx.fillStyle = "#f8fafc"
      roundRect(ctx, 28, y, width - 56, itemRowHeight - 4, 4)
      ctx.fill()
    }

    ctx.textAlign = "left"
    ctx.fillStyle = "#1e293b"
    ctx.font = "500 11.5px 'Segoe UI', system-ui, sans-serif"
    const label = `${idx + 1}. ${it.label} ${it.qty > 1 ? `(${it.qty}x)` : ""}`
    ctx.fillText(label, 40, y + 16)

    ctx.textAlign = "right"
    ctx.fillStyle = "#0f172a"
    ctx.font = "600 11.5px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText(formatRupiah(it.price * it.qty), width - 40, y + 16)

    y += itemRowHeight
  })

  y += 4
  drawDashedLine(ctx, 28, y, width - 28, y)
  y += 18

  // 4. SUMMARY (Subtotal, Diskon, Total, DP, & Sisa)
  if (hasDiscount) {
    const subtotal = invoiceSubtotal(invoice)
    ctx.textAlign = "left"
    ctx.fillStyle = "#64748b"
    ctx.font = "normal 11.5px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText("Subtotal Pengerjaan", 40, y)

    ctx.textAlign = "right"
    ctx.fillStyle = "#0f172a"
    ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText(formatRupiah(subtotal), width - 40, y)
    y += 18

    ctx.textAlign = "left"
    ctx.fillStyle = "#059669"
    ctx.font = "500 11px 'Segoe UI', system-ui, sans-serif"
    const discLabel = `Diskon / Potongan (${invoice.discountCode || "Promo"})`
    ctx.fillText(discLabel, 40, y)

    ctx.textAlign = "right"
    ctx.fillStyle = "#059669"
    ctx.font = "bold 12px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText(`- ${formatRupiah(invoice.discountAmount || 0)}`, width - 40, y)
    y += 20
  }

  ctx.textAlign = "left"
  ctx.fillStyle = "#64748b"
  ctx.font = "normal 12px 'Segoe UI', system-ui, sans-serif"
  ctx.fillText(hasDiscount ? "Total Setelah Diskon" : "Total Biaya Pengerjaan", 40, y)

  ctx.textAlign = "right"
  ctx.fillStyle = "#0f172a"
  ctx.font = "bold 14px 'Segoe UI', system-ui, sans-serif"
  ctx.fillText(formatRupiah(total), width - 40, y)
  y += 20

  if (invoice.paidAmount > 0 && !isLunas) {
    ctx.textAlign = "left"
    ctx.fillStyle = "#64748b"
    ctx.font = "normal 11.5px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText("Sudah Dibayar (Uang Muka / DP)", 40, y)

    ctx.textAlign = "right"
    ctx.fillStyle = "#059669"
    ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif"
    ctx.fillText(formatRupiah(invoice.paidAmount), width - 40, y)
    y += 20
  }

  // Sisa Tagihan Box Highlight
  ctx.fillStyle = isLunas ? "#f0fdf4" : "#fef2f2"
  roundRect(ctx, 28, y - 4, width - 56, 32, 6)
  ctx.fill()
  ctx.strokeStyle = isLunas ? "#bbf7d0" : "#fecaca"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.textAlign = "left"
  ctx.fillStyle = isLunas ? "#15803d" : "#b91c1c"
  ctx.font = "bold 12.5px 'Segoe UI', system-ui, sans-serif"
  ctx.fillText(isLunas ? "STATUS PEMBAYARAN" : "SISA PEMBAYARAN (SEGERA)", 40, y + 17)

  ctx.textAlign = "right"
  ctx.fillStyle = isLunas ? "#15803d" : "#dc2626"
  ctx.font = "bold 16px 'Segoe UI', system-ui, sans-serif"
  ctx.fillText(isLunas ? "LUNAS ✓" : formatRupiah(sisa), width - 40, y + 17)
  y += 38

  // 5. BANNER PEMBERITAHUAN SIAP DIAMBIL & PEMBAYARAN
  ctx.fillStyle = isLunas ? "#ecfdf5" : "#eff6ff"
  roundRect(ctx, 28, y, width - 56, 46, 8)
  ctx.fill()
  ctx.strokeStyle = isLunas ? "#a7f3d0" : "#bfdbfe"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.textAlign = "center"
  ctx.fillStyle = isLunas ? "#065f46" : "#1e40af"
  ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif"
  ctx.fillText(
    isLunas
      ? "✓ UNIT SELESAI & SIAP DIAMBIL · PEMBAYARAN LUNAS"
      : "● KENDARAAN / MESIN SELESAI & SIAP DIAMBIL · SEGERA DILUNASI",
    width / 2,
    y + 19,
  )

  ctx.font = "normal 10px 'Segoe UI', system-ui, sans-serif"
  ctx.fillStyle = isLunas ? "#047857" : "#2563eb"
  ctx.fillText(
    isLunas
      ? "Kwitansi digital ini merupakan bukti transaksi sah bengkel kami"
      : "Bisa bayar terlebih dahulu via Transfer Bank / QRIS atau di kasir saat ambil unit",
    width / 2,
    y + 35,
  )

  y += 56

  // 6. FOOTER
  drawDashedLine(ctx, 28, y, width - 28, y)
  y += 18

  ctx.textAlign = "center"
  ctx.fillStyle = "#64748b"
  ctx.font = "500 10.5px 'Segoe UI', system-ui, sans-serif"
  if (profile.receiptWarranty) {
    ctx.fillText(profile.receiptWarranty, width / 2, y)
    y += 16
  }

  if (profile.receiptWebsite) {
    ctx.fillText(`Laman Online: ${profile.receiptWebsite}`, width / 2, y)
    y += 16
  }

  ctx.fillStyle = "#0f172a"
  ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif"
  ctx.fillText(profile.receiptFooterMsg || "*** TERIMA KASIH ***", width / 2, y)

  return canvas
}

function drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = "#cbd5e1"
  ctx.lineWidth = 1
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Convert canvas to Blob
 */
export function getInvoiceImageBlob(invoice: Invoice, profile: WorkshopProfile): Promise<Blob | null> {
  const canvas = drawInvoiceCanvas(invoice, profile)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95)
  })
}

/**
 * Convert canvas to Data URL for instant <img src="..." /> preview
 */
export function getInvoiceImageDataUrl(invoice: Invoice, profile: WorkshopProfile): string {
  const canvas = drawInvoiceCanvas(invoice, profile)
  return canvas.toDataURL("image/png")
}
