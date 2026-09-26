"use client"

import { useState, useMemo, useEffect } from "react"
import { Send, Copy, Check, Phone, MessageSquare, CheckCircle2, Bike, Download, ImageIcon, X } from "lucide-react"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { toast } from "@/components/workshop/toast"
import { useWorkshop } from "@/lib/store"
import { formatRupiah, workOrderTotal, type WorkOrder } from "@/lib/data"
import { workOrderToInvoice, getInvoiceImageDataUrl, getInvoiceImageBlob } from "@/lib/invoice-canvas"
import { cn } from "@/lib/utils"

interface WhatsAppModalProps {
  open: boolean
  onClose: () => void
  initialWorkOrderId?: string
}

export function WhatsAppModal({ open, onClose, initialWorkOrderId }: WhatsAppModalProps) {
  const { workOrders, profile, dismissTip, isTipDismissed, canEdit } = useWorkshop()
  const [selectedWoId, setSelectedWoId] = useState<string>("")

  if (!canEdit) return null
  const [phone, setPhone] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [message, setMessage] = useState("")
  const [copied, setCopied] = useState(false)
  const [imageCopied, setImageCopied] = useState(false)
  const [imageDataUrl, setImageDataUrl] = useState<string>("")

  // Khusus ambil daftar pekerjaan yang berstatus "Siap Diambil"
  const readyOrders = useMemo(() => {
    const ready = workOrders.filter((w) => w.status === "Siap Diambil")
    if (initialWorkOrderId && !ready.some((w) => w.id === initialWorkOrderId)) {
      const specific = workOrders.find((w) => w.id === initialWorkOrderId)
      if (specific) return [specific, ...ready]
    }
    return ready
  }, [workOrders, initialWorkOrderId])

  // Template pesan pembuka singkat & jelas
  function generateReadyMessage(wo?: WorkOrder, customName?: string) {
    const nama = customName || wo?.customer.name || "Pelanggan"
    const motor = wo ? `${wo.vehicle.brand} ${wo.vehicle.model}` : "Kendaraan"
    const plat = wo?.vehicle.plate || "-"
    const total = wo ? formatRupiah(workOrderTotal(wo)) : "Rp 0"
    const bengkel = profile.name || "MOTOCRAFT STUDIO & GARAGE"

    return `Halo Bpk/Ibu *${nama}*,

Pemberitahuan dari *${bengkel}*:
Pengerjaan kendaraan/mesin/komponen *${motor}* (${plat}) Anda telah *SELESAI & SIAP DIAMBIL*.

Berikut kami lampirkan gambar rincian invoice tagihannya.
*Total Tagihan:* *${total}*

Mohon untuk dapat segera melakukan pembayaran. Pembayaran bisa dilakukan via Transfer Bank / QRIS agar saat tiba di bengkel tinggal serah terima unit, atau bayar langsung di kasir saat pengambilan.

${profile.address ? `• *Alamat:* ${profile.address}\n` : ""}${profile.phone ? `• *Telp/WA:* ${profile.phone}\n` : ""}${profile.receiptWebsite ? `• *Laman Online:* ${profile.receiptWebsite}\n` : ""}
Terima kasih banyak atas kepercayaan Anda kepada bengkel kami.`
  }

  // Generate image & update state when target order changes
  const updateOrderData = (wo: WorkOrder, nameOverride?: string) => {
    const name = nameOverride ?? wo.customer.name
    setCustomerName(name)
    setPhone(wo.customer.phone || "")
    setMessage(generateReadyMessage(wo, name))

    try {
      const invoiceData = workOrderToInvoice(wo)
      const dataUrl = getInvoiceImageDataUrl(invoiceData, profile)
      setImageDataUrl(dataUrl)
    } catch (e) {
      console.error("Gagal membuat gambar invoice:", e)
    }
  }

  // Set default pilihan saat modal dibuka
  useEffect(() => {
    if (!open) return
    const defaultWo =
      (initialWorkOrderId ? readyOrders.find((w) => w.id === initialWorkOrderId) : null) ||
      readyOrders[0]

    if (defaultWo) {
      setSelectedWoId(defaultWo.id)
      updateOrderData(defaultWo)
    }
  }, [open, initialWorkOrderId, readyOrders, profile])

  const selectedWo = useMemo(() => {
    return readyOrders.find((w) => w.id === selectedWoId) || readyOrders[0]
  }, [readyOrders, selectedWoId])

  const handleSelectWo = (id: string) => {
    setSelectedWoId(id)
    const target = readyOrders.find((w) => w.id === id)
    if (target) {
      updateOrderData(target)
    }
  }

  const cleanPhone = useMemo(() => {
    let clean = phone.replace(/[^0-9]/g, "")
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1)
    } else if (clean.startsWith("8")) {
      clean = "62" + clean
    }
    return clean
  }, [phone])

  const handleDownloadImage = () => {
    if (!selectedWo || !imageDataUrl) return
    const a = document.createElement("a")
    a.href = imageDataUrl
    a.download = `Invoice-${selectedWo.code.replace(/[^a-zA-Z0-9]/g, "-")}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success("Gambar Terunduh", "Gambar invoice siap dikirim ke WhatsApp!")
  }

  const handleCopyImage = async () => {
    if (!selectedWo) return false
    try {
      const invoiceData = workOrderToInvoice(selectedWo)
      const blob = await getInvoiceImageBlob(invoiceData, profile)
      if (blob && navigator.clipboard && typeof ClipboardItem !== "undefined") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setImageCopied(true)
        toast.success("Gambar Disalin ke Clipboard", "Tinggal tekan Ctrl + V (Tempel) di chat WhatsApp!")
        setTimeout(() => setImageCopied(false), 2500)
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

  const handleSendWA = async () => {
    if (!cleanPhone) {
      toast.error("Nomor WA Belum Diisi", "Silakan masukkan nomor WhatsApp pelanggan.")
      return
    }

    // Auto copy gambar invoice ke clipboard sebelum buka WA
    await handleCopyImage()

    const encoded = encodeURIComponent(message)
    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
    toast.success("Membuka WhatsApp", "Gambar invoice telah disalin! Tekan Ctrl+V di chat WhatsApp.")
    window.open(url, "_blank")
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      toast.success("Pesan Disalin", "Draf pesan WhatsApp telah disalin ke clipboard.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Gagal Menyalin", "Tidak dapat menyalin ke clipboard.")
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Kirim Gambar Invoice via WhatsApp">
      {readyOrders.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Tidak Ada Unit Siap Diambil</p>
            <p className="text-xs text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
              Fitur WhatsApp ini khusus untuk memberitahu pelanggan saat servis selesai. Ubah status pekerjaan menjadi <span className="font-semibold text-emerald-600">"Siap Diambil"</span> di menu Pekerjaan untuk memunculkan pelanggan di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[82vh] overflow-y-auto pr-0.5 no-scrollbar">
          {/* Info Banner */}
          {!isTipDismissed("whatsapp_modal_info") && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-start justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-start gap-2 flex-1">
                <WhatsAppIcon className="size-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                <div className="space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Kirim Gambar Invoice + Pesan Singkat
                  </p>
                  <p className="text-[11px] opacity-90">
                    Gambar invoice digital siap dikirim ke WhatsApp dengan pengantar singkat: pengerjaan selesai &amp; instruksi pembayaran segera.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  dismissTip("whatsapp_modal_info")
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

          {/* Pilih Kendaraan Siap Diambil */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Bike className="size-3.5 text-emerald-600" />
                Pilih Kendaraan / Mesin ({readyOrders.length})
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Siap Diambil
              </span>
            </label>
            <select
              value={selectedWoId}
              onChange={(e) => handleSelectWo(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-xs"
            >
              {readyOrders.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.customer.name} — {w.vehicle.brand} {w.vehicle.model} ({w.vehicle.plate})
                </option>
              ))}
            </select>
          </div>

          {/* Pratinjau Gambar Invoice Digital */}
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

            <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-slate-900/5 p-2 shadow-xs dark:bg-slate-950 dark:border-slate-800">
              {imageDataUrl ? (
                <div className="max-h-[200px] overflow-y-auto rounded-xl border border-border bg-white shadow-inner dark:bg-slate-900 dark:border-slate-700/80 no-scrollbar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageDataUrl}
                    alt="Pratinjau Gambar Invoice"
                    className="w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-28 items-center justify-center text-xs text-muted-foreground">
                  Membuat gambar invoice...
                </div>
              )}

              {/* Tombol aksi cepat gambar */}
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-xs hover:bg-muted/70 active:scale-[0.98] transition-all"
                >
                  <Download className="size-3.5 text-muted-foreground" />
                  <span>Unduh Gambar</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium shadow-xs hover:bg-muted/70 active:scale-[0.98] transition-all"
                >
                  {imageCopied ? (
                    <>
                      <Check className="size-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-muted-foreground" />
                      <span>Salin Gambar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info Pelanggan & No WA */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Pelanggan</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value)
                  if (selectedWo) {
                    setMessage(generateReadyMessage(selectedWo, e.target.value))
                  }
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-emerald-600 focus:outline-none dark:border-slate-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">No. WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxx"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-emerald-600 focus:outline-none dark:border-slate-700"
              />
            </div>
          </div>

          {/* Pesan Pengantar Singkat */}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Pesan Pengantar WhatsApp (Singkat)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Selesai &amp; Segera Bayar
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background p-2.5 font-sans text-xs leading-relaxed focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900/80"
              placeholder="Tulis pesan pengantar WhatsApp..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-transparent px-3 py-2.5 text-xs font-medium hover:bg-muted/50 active:scale-[0.98] transition-all"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSendWA}
              className="flex flex-[1.4] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98]"
            >
              <WhatsAppIcon className="size-4 fill-white" />
              <span>Buka WhatsApp &amp; Kirim</span>
            </button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            Tip: Gambar invoice otomatis disalin ke clipboard. Tekan <strong>Ctrl + V</strong> di WhatsApp untuk langsung menempel gambar.
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
