"use client"

import { useState } from "react"
import {
  QrCode,
  Landmark,
  CreditCard,
  Wallet,
  Check,
  FileText,
  ChevronRight,
  ShieldCheck,
  Wrench,
  Printer,
  Copy,
  Download,
  Image as ImageIcon,
  Tag,
  Ticket,
  Percent,
  Plus,
  X,
  Search,
  Eye,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { PaymentStatusBadge } from "@/components/workshop/status-badge"
import { ServiceIcon } from "@/components/workshop/service-icon"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { toast } from "@/components/workshop/toast"
import {
  invoices,
  formatRupiah,
  invoiceTotal,
  invoiceSubtotal,
  type Invoice,
  type PaymentStatus,
  type Voucher,
} from "@/lib/data"
import { useWorkshop, type WorkshopProfile } from "@/lib/store"
import { getInvoiceImageDataUrl, getInvoiceImageBlob } from "@/lib/invoice-canvas"

export type InvoiceFilter = "Belum Lunas" | "Belum Bayar" | "Sebagian" | "Jatuh Tempo" | "Lunas" | "Semua"

const filters: InvoiceFilter[] = [
  "Belum Lunas",
  "Belum Bayar",
  "Sebagian",
  "Jatuh Tempo",
  "Lunas",
  "Semua",
]

const methods = [
  { key: "QRIS", label: "QRIS", desc: "Scan dengan e-wallet apa pun", icon: QrCode },
  { key: "Transfer", label: "Transfer Bank", desc: "Virtual account otomatis", icon: Landmark },
  { key: "Kartu", label: "Kartu Debit/Kredit", desc: "Visa · Mastercard", icon: CreditCard },
  { key: "Tunai", label: "Tunai", desc: "Bayar di kasir", icon: Wallet },
] as const

function formatNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val)
}

function ThermalReceipt({ invoice, isPrint = false }: { invoice: Invoice; isPrint?: boolean }) {
  const { profile } = useWorkshop()
  const subtotal = invoiceSubtotal(invoice)
  const discount = invoice.discountAmount || 0
  const total = invoiceTotal(invoice)
  const sisa = Math.max(0, total - invoice.paidAmount)
  const isLunas = invoice.status === "Lunas" || sisa === 0

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

  return (
    <div
      className={cn(
        "w-full font-mono text-[11.5px] leading-relaxed",
        isPrint ? "text-black" : "text-slate-800",
      )}
    >
      {/* Header */}
      <div className="text-center space-y-0.5 pb-1">
        <h3
          className={cn(
            "font-bold text-sm tracking-wide uppercase",
            isPrint ? "text-black" : "text-slate-900",
          )}
        >
          {profile.name || "MOTOCRAFT STUDIO & GARAGE"}
        </h3>
        {profile.slogan && (
          <p className={cn("text-[10px] leading-tight whitespace-pre-line", isPrint ? "text-black" : "text-slate-600")}>
            {profile.slogan}
          </p>
        )}
        {profile.address && (
          <p className={cn("text-[9.5px] leading-tight", isPrint ? "text-black" : "text-slate-600")}>
            {profile.address}
          </p>
        )}
        {profile.phone && (
          <p className={cn("text-[9.5px]", isPrint ? "text-black" : "text-slate-600")}>
            Telp: {profile.phone}
          </p>
        )}
      </div>

      {/* Dashed Separator */}
      <div className={cn("border-b border-dashed my-2", isPrint ? "border-black" : "border-slate-400")} />

      {/* Meta Information */}
      <div className={cn("space-y-0.5 text-[11px]", isPrint ? "text-black" : "text-slate-700")}>
        <div className="flex justify-between">
          <span>No: {invoice.number}</span>
          <span>19.06</span>
        </div>
        <div className="flex justify-between">
          <span>Tgl: {invoice.date}</span>
          <span>Kasir: Admin</span>
        </div>
        <div>Cust: {invoice.customer.name}</div>
        <div>
          Unit: {invoice.vehicle.brand} {invoice.vehicle.model}
          {invoice.vehicle.year ? ` ${invoice.vehicle.year}` : ""}
        </div>
        <div className={cn("font-bold", isPrint ? "text-black" : "text-slate-900")}>
          Plat: {invoice.vehicle.plate}
        </div>
      </div>

      {/* Dashed Separator */}
      <div className={cn("border-b border-dashed my-2", isPrint ? "border-black" : "border-slate-400")} />

      {/* Jasa Section */}
      {jasaItems.length > 0 && (
        <div className="space-y-1 mb-2">
          <p className={cn("font-bold", isPrint ? "text-black" : "text-slate-900")}>Jasa:</p>
          {jasaItems.map((item, idx) => (
            <div key={idx} className="pl-2 space-y-0.5">
              <div className="flex justify-between items-start gap-2">
                <span className="flex-1 leading-snug">{item.label}</span>
                <span className={cn("shrink-0 font-medium", isPrint ? "text-black" : "text-slate-900")}>
                  Rp {formatNumber(item.price * item.qty)}
                </span>
              </div>
              {item.qty > 1 && (
                <p className={cn("text-[10px]", isPrint ? "text-black/70" : "text-slate-500")}>
                  {item.qty} × {formatNumber(item.price)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Part / Bahan Section */}
      {partItems.length > 0 && (
        <div className="space-y-1.5 mb-2">
          <p className={cn("font-bold", isPrint ? "text-black" : "text-slate-900")}>Part / Bahan:</p>
          {partItems.map((item, idx) => (
            <div key={idx} className="pl-2 space-y-0.5">
              <p className="leading-snug">{item.label}</p>
              <div className="flex justify-between items-center text-[10px]">
                <span className={isPrint ? "text-black/70" : "text-slate-500"}>
                  {item.qty} x {formatNumber(item.price)}
                </span>
                <span className={cn("font-medium text-[11px]", isPrint ? "text-black" : "text-slate-900")}>
                  Rp {formatNumber(item.price * item.qty)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback if all items are uncategorized */}
      {jasaItems.length === 0 && partItems.length === 0 && (
        <div className="space-y-1 mb-2">
          {invoice.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center text-xs">
              <span>{item.label} ({item.qty}x)</span>
              <span>Rp {formatNumber(item.price * item.qty)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dashed Separator */}
      <div className={cn("border-b border-dashed my-2", isPrint ? "border-black" : "border-slate-400")} />

      {/* Financials */}
      <div className="space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span className={isPrint ? "text-black/80" : "text-slate-600"}>Subtotal:</span>
          <span className={cn("font-medium", isPrint ? "text-black" : "text-slate-900")}>
            Rp {formatNumber(subtotal)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span className={isPrint ? "text-black/80" : "text-emerald-700 dark:text-emerald-400"}>
              Diskon ({invoice.discountCode || "Promo"}):
            </span>
            <span className={cn("font-semibold", isPrint ? "text-black" : "text-emerald-700 dark:text-emerald-400")}>
              - Rp {formatNumber(discount)}
            </span>
          </div>
        )}
        <div className={cn("border-b border-dashed my-1.5", isPrint ? "border-black" : "border-slate-400")} />
        <div className={cn("flex justify-between font-bold text-xs", isPrint ? "text-black" : "text-slate-900")}>
          <span>TOTAL:</span>
          <span>Rp {formatNumber(total)}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar / DP:</span>
          <span>Rp {formatNumber(invoice.paidAmount)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>STATUS: {isLunas ? "LUNAS" : invoice.status.toUpperCase()}</span>
          <span>Rp {formatNumber(sisa)}</span>
        </div>
      </div>

      {/* Dashed Separator */}
      <div className={cn("border-b border-dashed my-2", isPrint ? "border-black" : "border-slate-400")} />

      {/* Footer */}
      <div
        className={cn(
          "text-center text-[10px] space-y-0.5 pt-1",
          isPrint ? "text-black/80" : "text-slate-600",
        )}
      >
        {profile.receiptWarranty && <p>{profile.receiptWarranty}</p>}
        {profile.receiptWebsite && <p>{profile.receiptWebsite}</p>}
        <p className={cn("font-bold tracking-wider pt-1", isPrint ? "text-black" : "text-slate-900")}>
          {profile.receiptFooterMsg || "*** TERIMA KASIH ***"}
        </p>
      </div>
    </div>
  )
}

function generateInvoiceWaMessage(inv: Invoice, profile: WorkshopProfile, customName?: string): string {
  const nama = customName || inv.customer.name
  const motor = `${inv.vehicle.brand} ${inv.vehicle.model}`
  const total = invoiceTotal(inv)
  const sisa = Math.max(0, total - inv.paidAmount)
  const isLunas = inv.status === "Lunas" || sisa === 0
  const bengkel = profile.name || "MOTOCRAFT STUDIO & GARAGE"

  if (isLunas) {
    return `Halo Bpk/Ibu *${nama}*,

Pemberitahuan dari *${bengkel}*:
Pengerjaan kendaraan/mesin/komponen *${motor}* (${inv.vehicle.plate}) telah *SELESAI & SIAP DIAMBIL* (Status: *LUNAS*).
${inv.discountAmount && inv.discountAmount > 0 ? `• *Diskon Khusus:* -${formatRupiah(inv.discountAmount)} (${inv.discountCode || "Promo"})\n` : ""}
Berikut kami lampirkan gambar bukti pembayaran / invoice resminya. Unit sudah selesai diuji dan siap diambil kapan saja di bengkel kami.

${profile.address ? `• *Alamat:* ${profile.address}\n` : ""}${profile.phone ? `• *Telp/WA:* ${profile.phone}\n` : ""}${profile.receiptWebsite ? `• *Laman Online:* ${profile.receiptWebsite}\n` : ""}
Terima kasih banyak atas kepercayaan Anda kepada bengkel kami.`
  }

  return `Halo Bpk/Ibu *${nama}*,

Pemberitahuan dari *${bengkel}*:
Pengerjaan kendaraan/mesin/komponen *${motor}* (${inv.vehicle.plate}) telah *SELESAI & SIAP DIAMBIL*.

Berikut kami lampirkan gambar rincian invoice tagihannya.
*Sisa Tagihan:* *${formatRupiah(sisa)}*
${inv.discountAmount && inv.discountAmount > 0 ? `• *Diskon Khusus:* -${formatRupiah(inv.discountAmount)} (${inv.discountCode || "Promo"})\n` : ""}
Mohon untuk dapat segera melakukan pembayaran. Pembayaran bisa dilakukan via Transfer Bank / QRIS agar saat tiba di bengkel tinggal serah terima unit, atau bayar langsung di kasir saat pengambilan.

${profile.address ? `• *Alamat:* ${profile.address}\n` : ""}${profile.phone ? `• *Telp/WA:* ${profile.phone}\n` : ""}${profile.receiptWebsite ? `• *Laman Online:* ${profile.receiptWebsite}\n` : ""}
Terima kasih banyak atas kepercayaan Anda kepada bengkel kami.`
}

export function InvoicesScreen() {
  const { profile, vouchers, dismissTip, isTipDismissed, canEdit } = useWorkshop()
  const [invoiceList, setInvoiceList] = useState<Invoice[]>(invoices)
  const [filter, setFilter] = useState<InvoiceFilter>("Belum Lunas")
  const [active, setActive] = useState<Invoice | null>(null)
  const [sheetTab, setSheetTab] = useState<"detail" | "struk">("detail")
  const [payFor, setPayFor] = useState<Invoice | null>(null)
  const [method, setMethod] = useState<(typeof methods)[number]["key"] | null>(null)
  const [paid, setPaid] = useState(false)

  // Discount Modal State
  const [discountFor, setDiscountFor] = useState<Invoice | null>(null)
  const [discountTab, setDiscountTab] = useState<"voucher" | "manual">("voucher")
  const [voucherInput, setVoucherInput] = useState("")
  const [manualType, setManualType] = useState<"fixed" | "percent">("fixed")
  const [manualAmount, setManualAmount] = useState<number>(0)
  const [manualNote, setManualNote] = useState<string>("")

  function handleApplyVoucher(inv: Invoice, v: Voucher) {
    const today = new Date().toISOString().split("T")[0]
    if (v.validUntil < today) {
      toast.error("Voucher Kadaluarsa", `Kode ${v.code} sudah melewati batas waktu (${v.validUntil}).`)
      return
    }
    if (!v.isActive) {
      toast.error("Voucher Tidak Aktif", `Kode ${v.code} sedang dinonaktifkan oleh bengkel.`)
      return
    }
    if (v.targetService && v.targetService !== "Semua Layanan" && v.targetService !== inv.service) {
      toast.error(
        "Voucher Tidak Sesuai Layanan",
        `Kode ${v.code} hanya berlaku untuk layanan "${v.targetService}", sedangkan invoice ini untuk "${inv.service}".`
      )
      return
    }
    const subtotal = invoiceSubtotal(inv)
    if (v.minPurchase > 0 && subtotal < v.minPurchase) {
      toast.error("Minimal Belanja Belum Cukup", `Voucher ini membutuhkan minimal transaksi ${formatRupiah(v.minPurchase)}. Subtotal Anda: ${formatRupiah(subtotal)}.`)
      return
    }

    let disc = 0
    if (v.type === "fixed") {
      disc = v.value
    } else {
      disc = Math.round((subtotal * v.value) / 100)
      if (v.maxDiscount && disc > v.maxDiscount) {
        disc = v.maxDiscount
      }
    }

    const updated: Invoice = {
      ...inv,
      discountType: "voucher",
      discountCode: v.code,
      discountAmount: disc,
    }

    setInvoiceList((prev) => prev.map((item) => (item.id === inv.id ? updated : item)))
    if (active && active.id === inv.id) setActive(updated)
    if (payFor && payFor.id === inv.id) setPayFor(updated)
    toast.success("Voucher Diterapkan!", `Potongan ${formatRupiah(disc)} berhasil dipotong dari invoice.`)
    setDiscountFor(null)
  }

  function handleApplyManualDiscount(inv: Invoice) {
    const subtotal = invoiceSubtotal(inv)
    let disc = 0
    if (manualType === "fixed") {
      disc = Number(manualAmount) || 0
    } else {
      disc = Math.round((subtotal * Number(manualAmount)) / 100)
    }

    if (disc <= 0) {
      toast.error("Nominal Belum Diisi", "Masukkan jumlah potongan diskon yang valid.")
      return
    }

    if (disc > subtotal) {
      toast.error("Diskon Terlalu Besar", `Diskon tidak boleh melebihi subtotal tagihan (${formatRupiah(subtotal)}).`)
      return
    }

    const codeLabel = manualNote.trim() || (manualType === "percent" ? `Diskon ${manualAmount}%` : "Diskon Khusus")
    const updated: Invoice = {
      ...inv,
      discountType: "manual",
      discountCode: codeLabel,
      discountAmount: disc,
    }

    setInvoiceList((prev) => prev.map((item) => (item.id === inv.id ? updated : item)))
    if (active && active.id === inv.id) setActive(updated)
    if (payFor && payFor.id === inv.id) setPayFor(updated)
    toast.success("Diskon Diterapkan!", `Potongan ${formatRupiah(disc)} berhasil diberikan.`)
    setDiscountFor(null)
  }

  function handleRemoveDiscount(invId: string) {
    setInvoiceList((prev) =>
      prev.map((item) =>
        item.id === invId
          ? {
              ...item,
              discountType: "none",
              discountCode: undefined,
              discountAmount: 0,
            }
          : item
      )
    )
    if (active && active.id === invId) {
      setActive({
        ...active,
        discountType: "none",
        discountCode: undefined,
        discountAmount: 0,
      })
    }
    if (payFor && payFor.id === invId) {
      setPayFor({
        ...payFor,
        discountType: "none",
        discountCode: undefined,
        discountAmount: 0,
      })
    }
    toast.info("Diskon Dihapus", "Potongan diskon telah dibatalkan.")
  }

  // WhatsApp Sending State
  const [waInvoice, setWaInvoice] = useState<Invoice | null>(null)
  const [waPhone, setWaPhone] = useState("")
  const [waName, setWaName] = useState("")
  const [waMessage, setWaMessage] = useState("")
  const [waCopied, setWaCopied] = useState(false)
  const [waImageCopied, setWaImageCopied] = useState(false)
  const [waImageDataUrl, setWaImageDataUrl] = useState<string>("")

  function openWa(inv: Invoice) {
    setWaInvoice(inv)
    setWaName(inv.customer.name)
    setWaPhone(inv.customer.phone || "")
    setWaMessage(generateInvoiceWaMessage(inv, profile, inv.customer.name))
    setWaImageCopied(false)
    setWaCopied(false)

    try {
      const url = getInvoiceImageDataUrl(inv, profile)
      setWaImageDataUrl(url)
    } catch (e) {
      console.error("Failed to generate invoice image", e)
    }
  }

  function handleDownloadImage() {
    if (!waInvoice || !waImageDataUrl) return
    const a = document.createElement("a")
    a.href = waImageDataUrl
    a.download = `Invoice-${waInvoice.number.replace(/[^a-zA-Z0-9]/g, "-")}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success("Gambar Terunduh", "Gambar invoice siap dikirim ke WhatsApp!")
  }

  async function handleCopyImage() {
    if (!waInvoice) return
    try {
      const blob = await getInvoiceImageBlob(waInvoice, profile)
      if (blob && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setWaImageCopied(true)
        toast.success("Gambar Disalin ke Clipboard", "Tinggal tekan Ctrl + V (Tempel) di chat WhatsApp!")
        setTimeout(() => setWaImageCopied(false), 2500)
        return true
      } else {
        handleDownloadImage()
        return false
      }
    } catch (e) {
      console.warn("Copy image failed, fallback to download", e)
      handleDownloadImage()
      return false
    }
  }

  async function handleSendWa() {
    let clean = waPhone.replace(/[^0-9]/g, "")
    if (clean.startsWith("0")) clean = "62" + clean.slice(1)
    else if (clean.startsWith("8")) clean = "62" + clean
    if (!clean) {
      toast.error("Nomor WA Belum Diisi", "Silakan masukkan nomor WhatsApp pelanggan.")
      return
    }

    // Copy image to clipboard so user can easily paste into WhatsApp
    await handleCopyImage()

    const encoded = encodeURIComponent(waMessage)
    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`, "_blank")
    toast.success("Membuka WhatsApp", "Gambar invoice telah disalin! Tekan Ctrl+V di chat WhatsApp.")
  }

  async function handleCopyWa() {
    try {
      await navigator.clipboard.writeText(waMessage)
      setWaCopied(true)
      toast.success("Pesan Disalin", "Teks pengantar WhatsApp berhasil disalin.")
      setTimeout(() => setWaCopied(false), 2000)
    } catch {
      toast.error("Gagal Menyalin", "Tidak dapat menyalin ke clipboard.")
    }
  }

  const list =
    filter === "Semua"
      ? invoiceList
      : filter === "Belum Lunas"
      ? invoiceList.filter((i) => i.status !== "Lunas")
      : invoiceList.filter((i) => i.status === filter)

  const outstanding = invoiceList
    .filter((i) => i.status !== "Lunas")
    .reduce((s, i) => s + (invoiceTotal(i) - i.paidAmount), 0)
  const collected = invoiceList.reduce((s, i) => s + i.paidAmount, 0)

  const getFilterCount = (f: InvoiceFilter) => {
    if (f === "Semua") return invoiceList.length
    if (f === "Belum Lunas") return invoiceList.filter((i) => i.status !== "Lunas").length
    return invoiceList.filter((i) => i.status === f).length
  }

  function openPay(inv: Invoice) {
    setActive(null)
    setPayFor(inv)
    setMethod(null)
    setPaid(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => setFilter("Belum Lunas")}
          className={cn(
            "cursor-pointer gap-0 bg-primary p-3.5 text-primary-foreground transition-all active:scale-[0.98]",
            filter === "Belum Lunas"
              ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950 shadow-md"
              : "opacity-90 hover:opacity-100",
          )}
        >
          <span className="text-xs opacity-80">Belum Tertagih</span>
          <p className="mt-2 text-lg font-semibold tracking-tight">{formatRupiah(outstanding)}</p>
          <span className="mt-0.5 text-[0.7rem] opacity-80">
            {invoiceList.filter((i) => i.status !== "Lunas").length} invoice
          </span>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          onClick={() => setFilter("Lunas")}
          className={cn(
            "cursor-pointer gap-0 p-3.5 transition-all active:scale-[0.98] border border-border dark:border-slate-700/80",
            filter === "Lunas"
              ? "bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/40 ring-offset-2 dark:ring-offset-slate-950"
              : "hover:bg-muted/50",
          )}
        >
          <span className="text-xs text-muted-foreground">Terkumpul Bulan Ini</span>
          <p className="mt-2 text-lg font-semibold tracking-tight text-success">{formatRupiah(collected)}</p>
          <span className="mt-0.5 text-[0.7rem] text-muted-foreground">
            {invoiceList.filter((i) => i.status === "Lunas").length} invoice lunas
          </span>
        </Card>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
        {filters.map((f) => {
          const count = getFilterCount(f)
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:text-foreground dark:border-slate-700/80 dark:hover:bg-slate-800 dark:hover:text-slate-100",
              )}
            >
              {f}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.65rem] font-medium transition-colors",
                  filter === f
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <Eye className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Mode Mekanik: Akses baca saja (melihat rincian tagihan &amp; cetak struk).</span>
        </div>
      )}

      <div className="space-y-2.5">
        {list.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground dark:border-slate-800">
            <FileText className="size-10 stroke-[1.5] text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">Tidak Ada Invoice</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              {filter === "Belum Lunas"
                ? "Semua tagihan sudah berstatus lunas. Tidak ada tagihan yang tertunggak."
                : `Tidak ada data invoice dengan status "${filter}".`}
            </p>
          </Card>
        ) : (
          list.map((inv) => (
            <Card key={inv.id} className="gap-0 p-0">
              <button
                type="button"
                onClick={() => {
                  setActive(inv)
                  setSheetTab("detail")
                }}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <ServiceIcon service={inv.service} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.number} · {inv.date}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <PaymentStatusBadge status={inv.status} />
                    {inv.discountAmount && inv.discountAmount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <Tag className="size-2.5" />
                        {inv.discountCode || "Diskon"} (-{formatRupiah(inv.discountAmount)})
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatRupiah(invoiceTotal(inv))}</p>
                  <ChevronRight className="ml-auto mt-1 size-4 text-muted-foreground" />
                </div>
              </button>
            </Card>
          ))
        )}
      </div>

      {/* Invoice detail */}
      <BottomSheet open={!!active} onClose={() => setActive(null)} title="Detail Invoice">
        {active && (
          <div className="space-y-4">
            {/* View switcher tabs */}
            <div className="flex rounded-xl bg-muted/70 p-1 text-xs border border-border dark:bg-slate-900/90 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setSheetTab("detail")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 font-medium transition-all",
                  sheetTab === "detail"
                    ? "bg-card text-foreground shadow-xs font-semibold border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md"
                    : "text-muted-foreground hover:text-foreground dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
                )}
              >
                Rincian Tagihan
              </button>
              <button
                type="button"
                onClick={() => setSheetTab("struk")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 font-medium transition-all",
                  sheetTab === "struk"
                    ? "bg-card text-foreground shadow-xs font-semibold border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md"
                    : "text-muted-foreground hover:text-foreground dark:hover:bg-slate-800/60 dark:hover:text-slate-100",
                )}
              >
                Format Struk Thermal
              </button>
            </div>

            {sheetTab === "detail" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{active.customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {active.vehicle.brand} {active.vehicle.model} · {active.vehicle.plate}
                    </p>
                  </div>
                  <PaymentStatusBadge status={active.status} />
                </div>
                <div className="rounded-xl bg-muted/50 p-3 text-xs border border-border dark:border-slate-700/80 dark:bg-slate-900/60">
                  <div className="flex justify-between text-muted-foreground">
                    <span>No. Invoice</span>
                    <span className="font-medium text-foreground">{active.number}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-muted-foreground">
                    <span>Ref. Pekerjaan</span>
                    <span className="font-medium text-foreground">{active.workOrderCode}</span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {active.items.map((it, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        {it.label} {it.qty > 1 && <span className="text-foreground/60">×{it.qty}</span>}
                      </span>
                      <span className="shrink-0 font-medium">{formatRupiah(it.qty * it.price)}</span>
                    </li>
                  ))}
                </ul>

                <Separator />
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">{formatRupiah(invoiceSubtotal(active))}</span>
                  </div>

                  {active.discountAmount && active.discountAmount > 0 ? (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Tag className="size-3.5 shrink-0" />
                        <span className="font-semibold truncate">{active.discountCode || "Diskon"}</span>
                        <span className="text-[10px] opacity-75 shrink-0">
                          ({active.discountType === "voucher" ? "Voucher" : "Diskon Manual"})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold">- {formatRupiah(active.discountAmount)}</span>
                        {active.status !== "Lunas" && canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDiscount(active.id)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-emerald-500/20 hover:text-foreground"
                            title="Hapus diskon"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : active.status !== "Lunas" && canEdit ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountFor(active)
                        setVoucherInput("")
                        setManualAmount(0)
                        setManualNote("")
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-primary/5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Tag className="size-3" />
                      + Pasang Voucher Promo / Diskon Manual
                    </button>
                  ) : null}

                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-border/80">
                    <span className="text-sm font-semibold text-foreground">Total Tagihan</span>
                    <span className="text-lg font-bold text-foreground">{formatRupiah(invoiceTotal(active))}</span>
                  </div>

                  {active.paidAmount > 0 && active.status !== "Lunas" && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Sudah dibayar (DP)</span>
                      <span>{formatRupiah(active.paidAmount)}</span>
                    </div>
                  )}

                  {active.status !== "Lunas" && (
                    <div className="flex items-center justify-between font-semibold text-destructive">
                      <span>Sisa Pembayaran</span>
                      <span>{formatRupiah(Math.max(0, invoiceTotal(active) - active.paidAmount))}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 max-h-[55vh] overflow-y-auto no-scrollbar">
                <div className="mx-auto w-full max-w-[330px] rounded-2xl bg-white p-5 text-slate-900 shadow-2xl border-2 border-slate-300">
                  <ThermalReceipt invoice={active} />
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-black hover:underline"
                    >
                      <Printer className="size-3.5" /> Cetak Kertas Thermal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Always visible Bottom Action Buttons */}
            {active.status === "Lunas" ? (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-success/15 py-2.5 text-sm font-medium text-success">
                  <Check className="size-4" /> Lunas via {active.method || "Tunai"}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/40 font-semibold"
                    onClick={() => openWa(active)}
                  >
                    <WhatsAppIcon className="size-4 text-emerald-500 fill-emerald-500" /> Kirim Kwitansi WA
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent" onClick={() => window.print()}>
                    <Printer className="size-4" /> Cetak Struk
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className={cn(
                    "gap-2 border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/40 font-semibold",
                    canEdit ? "flex-1" : "w-full"
                  )}
                  onClick={() => openWa(active)}
                >
                  <WhatsAppIcon className="size-4 text-emerald-500 fill-emerald-500" /> Kirim ke WA
                </Button>
                {canEdit && (
                  <Button className="flex-1 gap-2" onClick={() => openPay(active)}>
                    <Wallet className="size-4" /> Bayar Sekarang
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      {/* WhatsApp Invoice BottomSheet */}
      <BottomSheet open={!!waInvoice} onClose={() => setWaInvoice(null)} title="Kirim Gambar Invoice via WhatsApp">
        {waInvoice && (
          <div className="space-y-3.5 max-h-[82vh] overflow-y-auto pr-0.5 no-scrollbar">
            {/* Info Banner */}
            {!isTipDismissed("invoices_wa_info") && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-start justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2 flex-1">
                  <WhatsAppIcon className="size-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                  <div className="space-y-0.5 leading-relaxed">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                      Kirim Gambar Invoice + Pesan Singkat
                    </p>
                    <p className="text-[11px] opacity-90">
                      Gambar invoice digital siap dikirim ke WhatsApp dengan pengantar singkat: pengerjaan selesai &amp; instruksi pembayaran.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dismissTip("invoices_wa_info")
                    toast.info("Info Ditutup", "Tips WhatsApp ini tidak akan ditampilkan lagi.")
                  }}
                  className="shrink-0 rounded-lg p-1 text-emerald-700/60 hover:bg-emerald-500/20 hover:text-emerald-900 dark:text-emerald-400/60 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200 transition-colors"
                  title="Tutup & jangan tampilkan lagi"
                  aria-label="Tutup info"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Gambar Invoice Card Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  <span>Gambar Invoice Digital</span>
                </span>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-primary/25">
                  Format PNG HD
                </span>
              </div>

              {/* Scrollable image card */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-slate-900/5 p-2 shadow-xs dark:bg-slate-950 dark:border-slate-800">
                {waImageDataUrl ? (
                  <div className="max-h-[220px] overflow-y-auto rounded-xl border border-border bg-white shadow-inner dark:bg-slate-900 dark:border-slate-700/80 no-scrollbar">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={waImageDataUrl}
                      alt="Pratinjau Gambar Invoice"
                      className="w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                    Membuat gambar invoice...
                  </div>
                )}

                {/* Quick actions for image */}
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs bg-card dark:border-slate-700 hover:bg-accent"
                    onClick={handleDownloadImage}
                  >
                    <Download className="size-3.5" />
                    Unduh Gambar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs bg-card dark:border-slate-700 hover:bg-accent"
                    onClick={handleCopyImage}
                  >
                    {waImageCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    {waImageCopied ? "Gambar Disalin!" : "Salin Gambar"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Info Pelanggan & No WA */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Pelanggan</label>
                <input
                  type="text"
                  value={waName}
                  onChange={(e) => {
                    setWaName(e.target.value)
                    if (waInvoice) {
                      setWaMessage(generateInvoiceWaMessage(waInvoice, profile, e.target.value))
                    }
                  }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">No. WhatsApp</label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="0812xxxxxxx"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>
            </div>

            {/* Pesan Pendek Singkat */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Pesan Pengantar WhatsApp (Singkat)</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Siap Diambil &amp; Bayar Dahulu
                </span>
              </div>
              <textarea
                rows={4}
                value={waMessage}
                onChange={(e) => setWaMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-2.5 font-sans text-xs leading-relaxed focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                type="button"
                className="flex-1 gap-1.5 text-xs bg-transparent dark:border-slate-700"
                onClick={handleCopyWa}
              >
                {waCopied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {waCopied ? "Teks Disalin!" : "Salin Teks"}
              </Button>
              <Button
                type="button"
                className="flex-[1.4] gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-98"
                onClick={handleSendWa}
              >
                <WhatsAppIcon className="size-4 fill-white" />
                Buka WhatsApp &amp; Kirim
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">
              Tip: Gambar invoice otomatis disalin ke clipboard. Tekan <strong>Ctrl + V</strong> di WhatsApp untuk langsung menempel gambar.
            </p>
          </div>
        )}
      </BottomSheet>

      {/* Payment */}
      <BottomSheet
        open={!!payFor}
        onClose={() => setPayFor(null)}
        title={paid ? undefined : "Metode Pembayaran"}
      >
        {payFor && !paid && (
          <div className="space-y-4">
            {/* Financial card with voucher / discount button */}
            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2 dark:border-slate-800">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal ({payFor.items.length} item)</span>
                <span className="font-medium text-foreground">{formatRupiah(invoiceSubtotal(payFor))}</span>
              </div>

              {payFor.discountAmount && payFor.discountAmount > 0 ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="size-3.5 shrink-0" />
                    <span className="font-semibold truncate">{payFor.discountCode || "Diskon"}</span>
                    <span className="text-[10px] opacity-75 shrink-0">
                      ({payFor.discountType === "voucher" ? "Voucher" : "Manual"})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold">- {formatRupiah(payFor.discountAmount)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiscount(payFor.id)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-emerald-500/20 hover:text-foreground"
                      title="Hapus diskon"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDiscountFor(payFor)
                    setVoucherInput("")
                    setManualAmount(0)
                    setManualNote("")
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="size-3.5" /> Ada Voucher Promo atau Diskon Khusus?
                  </span>
                  <span className="text-[11px] underline">Gunakan</span>
                </button>
              )}

              {payFor.paidAmount > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sudah Dibayar (DP)</span>
                  <span>{formatRupiah(payFor.paidAmount)}</span>
                </div>
              )}

              <div className="border-t border-dashed border-border pt-1.5 flex items-baseline justify-between">
                <span className="text-xs font-medium text-foreground">Sisa yang Harus Dibayar</span>
                <span className="text-lg font-bold text-primary">
                  {formatRupiah(Math.max(0, invoiceTotal(payFor) - payFor.paidAmount))}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {methods.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    method === m.key ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
                  )}
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    <m.icon className="size-4.5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                  </div>
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      method === m.key ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                    )}
                  >
                    {method === m.key && <Check className="size-3" />}
                  </span>
                </button>
              ))}
            </div>

            {method === "QRIS" && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-7 gap-0.5 rounded-lg bg-background p-3">
                  {Array.from({ length: 49 }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "size-3 rounded-[2px]",
                        // deterministic pseudo-random pattern
                        (i * 7 + ((i * i) % 5)) % 3 === 0 ? "bg-foreground" : "bg-transparent",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Scan untuk membayar via QRIS</p>
              </div>
            )}

            <Button
              className="w-full gap-2"
              disabled={!method}
              onClick={() => {
                setPaid(true)
                if (payFor) {
                  const total = invoiceTotal(payFor)
                  const sisa = total - payFor.paidAmount
                  setInvoiceList((prev) =>
                    prev.map((item) =>
                      item.id === payFor.id
                        ? {
                            ...item,
                            status: "Lunas",
                            paidAmount: total,
                            method: method || "QRIS",
                          }
                        : item,
                    ),
                  )
                  setActive((prev) =>
                    prev && prev.id === payFor.id
                      ? {
                          ...prev,
                          status: "Lunas",
                          paidAmount: total,
                          method: method || "QRIS",
                        }
                      : prev,
                  )
                  toast.success("Pembayaran Berhasil", `${formatRupiah(sisa)} via ${method} tercatat lunas.`)
                }
              }}
            >
              <ShieldCheck className="size-4" />
              Konfirmasi Pembayaran
            </Button>
            <p className="text-center text-[0.7rem] text-muted-foreground">
              Pembayaran diproses aman. Integrasi gateway (Stripe/QRIS) menyusul.
            </p>
          </div>
        )}

        {payFor && paid && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
              <Check className="size-8" strokeWidth={2.5} />
            </span>
            <div>
              <p className="text-lg font-semibold">Pembayaran Berhasil</p>
              <p className="text-sm text-muted-foreground">
                {formatRupiah(invoiceTotal(payFor) - payFor.paidAmount)} via {method}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Notifikasi WhatsApp kwitansi otomatis dikirim ke {payFor.customer.name}.
            </p>
            <Button className="mt-1 w-full" onClick={() => setPayFor(null)}>
              Selesai
            </Button>
          </div>
        )}
      </BottomSheet>

      {/* Discount / Voucher BottomSheet */}
      <BottomSheet
        open={!!discountFor}
        onClose={() => setDiscountFor(null)}
        title="Diskon & Voucher Promo"
      >
        {discountFor && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-0.5 no-scrollbar">
            {/* Invoice Info bar */}
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs dark:border-slate-800 space-y-1">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Invoice: <strong className="text-foreground">{discountFor.number}</strong> ({discountFor.customer.name})</span>
                <span className="font-semibold text-foreground">Subtotal: {formatRupiah(invoiceSubtotal(discountFor))}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                <span>Jenis Layanan Bengkel:</span>
                <span className="font-semibold text-primary">{discountFor.service}</span>
              </div>
            </div>

            {/* Discount Tabs: Voucher vs Manual */}
            <div className="flex rounded-xl bg-muted/70 p-1 text-xs border border-border dark:bg-slate-900/90 dark:border-slate-700/80">
              <button
                type="button"
                onClick={() => setDiscountTab("voucher")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                  discountTab === "voucher"
                    ? "bg-card text-foreground shadow-xs font-semibold border border-border/80 dark:bg-slate-800 dark:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Tag className="size-3.5" />
                Voucher Promo Bengkel
              </button>
              <button
                type="button"
                onClick={() => setDiscountTab("manual")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 font-medium transition-all",
                  discountTab === "manual"
                    ? "bg-card text-foreground shadow-xs font-semibold border border-border/80 dark:bg-slate-800 dark:text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Percent className="size-3.5" />
                Diskon Manual Kasir
              </button>
            </div>

            {discountTab === "voucher" ? (
              <div className="space-y-3.5">
                {/* Code input form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                    placeholder="Ketik kode promo (misal: VAPOR25K)"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => {
                      const code = voucherInput.trim().toUpperCase()
                      if (!code) {
                        toast.error("Kode Kosong", "Masukkan kode voucher terlebih dahulu.")
                        return
                      }
                      const found = vouchers.find((v) => v.code.toUpperCase() === code)
                      if (!found) {
                        toast.error("Voucher Tidak Ditemukan", `Kode "${code}" tidak terdaftar di sistem.`)
                        return
                      }
                      if (found.targetService && found.targetService !== "Semua Layanan" && found.targetService !== discountFor.service) {
                        toast.error(
                          "Voucher Tidak Sesuai Layanan",
                          `Voucher "${found.code}" hanya berlaku untuk layanan "${found.targetService}", sedangkan invoice ini untuk "${discountFor.service}".`
                        )
                        return
                      }
                      handleApplyVoucher(discountFor, found)
                    }}
                  >
                    Terapkan
                  </Button>
                </div>

                {/* Available Vouchers List (Filtered by Service or Umum) */}
                {(() => {
                  const applicableVouchers = vouchers.filter((v) => {
                    if (!v.targetService || v.targetService === "Semua Layanan") return true
                    return v.targetService === discountFor.service
                  })

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span>Voucher untuk:</span>
                          <span className="font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                            {discountFor.service}
                          </span>
                        </span>
                        <span>{applicableVouchers.filter((v) => v.isActive).length} voucher cocok</span>
                      </div>

                      {applicableVouchers.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-muted/20 space-y-1.5">
                          <Tag className="size-6 mx-auto text-muted-foreground/50" />
                          <p className="font-semibold text-foreground">Tidak Ada Voucher untuk Layanan "{discountFor.service}"</p>
                          <p className="text-[11px] max-w-[280px] mx-auto">
                            Voucher promo khusus layanan lain (seperti Sandblasting/Vapor) otomatis disembunyikan. Anda dapat menggunakan <strong>Diskon Manual Kasir</strong> di tab sebelah.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[260px] overflow-y-auto no-scrollbar">
                          {applicableVouchers.map((v) => {
                            const today = new Date().toISOString().split("T")[0]
                            const isExpired = v.validUntil < today
                            const subtotal = invoiceSubtotal(discountFor)
                            const isBelowMin = v.minPurchase > 0 && subtotal < v.minPurchase
                            const isDisabled = !v.isActive || isExpired || isBelowMin
                            const isCurrentlyApplied = discountFor.discountCode === v.code

                            return (
                              <div
                                key={v.id}
                                className={cn(
                                  "rounded-xl border p-3 transition-all",
                                  isCurrentlyApplied
                                    ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-950/20"
                                    : isDisabled
                                    ? "border-border/60 bg-muted/20 opacity-60 dark:border-slate-800"
                                    : "border-border bg-card hover:border-primary/50 dark:border-slate-700/80"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-xs font-bold text-primary">{v.code}</span>
                                      {v.type === "fixed" ? (
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                          Potongan {formatRupiah(v.value)}
                                        </span>
                                      ) : (
                                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                          Diskon {v.value}% {v.maxDiscount ? `(Maks ${formatRupiah(v.maxDiscount)})` : ""}
                                        </span>
                                      )}
                                      {v.targetService && v.targetService !== "Semua Layanan" ? (
                                        <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/25">
                                          Khusus: {v.targetService}
                                        </span>
                                      ) : (
                                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                          Semua Layanan (Umum)
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs font-medium text-foreground">{v.title}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      Min. Belanja: {v.minPurchase > 0 ? formatRupiah(v.minPurchase) : "Tanpa minimal"} · Berlaku s/d {v.validUntil}
                                    </p>
                                    {isExpired && (
                                      <p className="text-[10px] font-semibold text-destructive">Sudah kadaluarsa</p>
                                    )}
                                    {!v.isActive && !isExpired && (
                                      <p className="text-[10px] font-semibold text-amber-500">Sedang dinonaktifkan</p>
                                    )}
                                    {isBelowMin && !isExpired && v.isActive && (
                                      <p className="text-[10px] font-semibold text-amber-500">
                                        Kurang {formatRupiah(v.minPurchase - subtotal)} lagi untuk pakai
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    {isCurrentlyApplied ? (
                                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                        <Check className="size-3" /> Digunakan
                                      </span>
                                    ) : (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={isDisabled ? "outline" : "default"}
                                        disabled={isDisabled}
                                        className="h-7 text-xs px-2.5"
                                        onClick={() => handleApplyVoucher(discountFor, v)}
                                      >
                                        Gunakan
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              /* TAB 2: DISKON MANUAL LANGSUNG */
              <div className="space-y-3.5">
                {!isTipDismissed("invoices_manual_discount_info") && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-2 animate-in fade-in duration-200">
                    <p className="flex-1">
                      Diskon manual diinput langsung oleh admin/kasir untuk pelanggan istimewa, promo khusus, komplain pengerjaan, atau nego di tempat.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        dismissTip("invoices_manual_discount_info")
                        toast.info("Info Ditutup", "Keterangan diskon ini tidak akan ditampilkan lagi.")
                      }}
                      className="shrink-0 rounded-lg p-1 text-amber-800/60 hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-300/60 dark:hover:bg-amber-900/50 dark:hover:text-amber-100 transition-colors"
                      title="Tutup & jangan tampilkan lagi"
                      aria-label="Tutup info"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}

                {/* Type selector: Nominal Rp vs Persentase % */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualType("fixed")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all",
                      manualType === "fixed"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent dark:border-slate-700"
                    )}
                  >
                    Nominal Langsung (Rp)
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType("percent")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-semibold transition-all",
                      manualType === "percent"
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-accent dark:border-slate-700"
                    )}
                  >
                    Persentase (%)
                  </button>
                </div>

                {/* Amount input */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {manualType === "fixed" ? "Nominal Potongan (Rp)" : "Persentase Potongan (%)"}
                  </label>
                  <div className="relative">
                    {manualType === "fixed" ? (
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">Rp</span>
                    ) : null}
                    <input
                      type="number"
                      min={0}
                      max={manualType === "percent" ? 100 : undefined}
                      value={manualAmount || ""}
                      onChange={(e) => setManualAmount(Number(e.target.value))}
                      placeholder={manualType === "fixed" ? "Contoh: 20000" : "Contoh: 10"}
                      className={cn(
                        "w-full rounded-xl border border-border bg-background py-2 text-sm font-semibold focus:border-primary focus:outline-none dark:border-slate-700",
                        manualType === "fixed" ? "pl-9 pr-3" : "px-3"
                      )}
                    />
                    {manualType === "percent" ? (
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-muted-foreground">%</span>
                    ) : null}
                  </div>
                </div>

                {/* Quick Presets for Manual */}
                <div className="flex flex-wrap gap-1.5">
                  {manualType === "fixed" ? (
                    [10000, 20000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setManualAmount(amt)}
                        className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-primary/10 hover:text-primary dark:border-slate-700"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))
                  ) : (
                    [5, 10, 15, 20, 25, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setManualAmount(pct)}
                        className="rounded-lg border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:bg-primary/10 hover:text-primary dark:border-slate-700"
                      >
                        {pct}%
                      </button>
                    ))
                  )}
                </div>

                {/* Reason note */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Alasan / Keterangan Diskon (Opsional)
                  </label>
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Contoh: Teman Owner, Pelanggan Loyal, Kompensasi Waktu"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>

                {/* Live Preview Calculation */}
                {(() => {
                  const sub = invoiceSubtotal(discountFor)
                  const calcDisc =
                    manualType === "fixed"
                      ? Number(manualAmount) || 0
                      : Math.round((sub * (Number(manualAmount) || 0)) / 100)
                  const grandTotal = Math.max(0, sub - calcDisc)

                  return (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 space-y-1 text-xs dark:border-slate-700">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal Tagihan:</span>
                        <span>{formatRupiah(sub)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400">
                        <span>Potongan Diskon:</span>
                        <span>- {formatRupiah(calcDisc)}</span>
                      </div>
                      <div className="border-t border-dashed border-border pt-1 flex justify-between font-bold text-foreground">
                        <span>Total Setelah Diskon:</span>
                        <span className="text-primary">{formatRupiah(grandTotal)}</span>
                      </div>
                    </div>
                  )
                })()}

                <Button
                  type="button"
                  className="w-full gap-1.5"
                  onClick={() => handleApplyManualDiscount(discountFor)}
                >
                  <Check className="size-4" />
                  Terapkan Diskon Manual
                </Button>
              </div>
            )}

            {/* Remove discount button if already applied */}
            {discountFor.discountAmount && discountFor.discountAmount > 0 ? (
              <div className="pt-2 border-t border-border dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 text-xs"
                  onClick={() => {
                    handleRemoveDiscount(discountFor.id)
                    setDiscountFor(null)
                  }}
                >
                  <X className="size-3.5 mr-1" />
                  Hapus Diskon dari Invoice Ini
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </BottomSheet>
      {/* Printable Thermal Receipt View */}
      {active && (
        <div id="print-section" className="hidden print:block bg-white text-black font-mono">
          <div className="w-[340px] mx-auto p-5 bg-white text-black border-2 border-black rounded-2xl">
            <ThermalReceipt invoice={active} isPrint />
          </div>
        </div>
      )}
    </div>
  )
}
