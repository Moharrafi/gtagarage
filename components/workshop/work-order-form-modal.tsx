"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, Plus, Trash2, Search, Package } from "lucide-react"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/workshop/toast"
import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/data"
import type {
  WorkOrder,
  WorkStatus,
  ServiceType,
  Part,
  ServiceRate,
  Technician,
} from "@/lib/data"
import type { WorkOrderInput } from "@/lib/store"

const statusProgressMap: Record<WorkStatus, number> = {
  "Antrian": 0,
  "Menunggu Sparepart": 30,
  "Dikerjakan": 60,
  "Siap Diambil": 90,
  "Selesai": 100,
}

const serviceTypes: ServiceType[] = ["Servis", "Vapor Blasting", "Sand Blasting", "Kustomisasi"]
const statuses: WorkStatus[] = [
  "Antrian",
  "Dikerjakan",
  "Menunggu Sparepart",
  "Siap Diambil",
  "Selesai",
]

const emptyForm: WorkOrderInput = {
  customerName: "",
  customerPhone: "",
  brand: "",
  model: "",
  plate: "",
  service: "Servis",
  complaint: "",
  technician: "Agus Pratama",
  laborCost: 150000,
  status: "Antrian",
  usedParts: [],
}

function fromWorkOrder(w: WorkOrder): WorkOrderInput {
  return {
    customerName: w.customer.name,
    customerPhone: w.customer.phone || "",
    plate: w.vehicle.plate,
    brand: w.vehicle.brand,
    model: w.vehicle.model,
    service: w.service,
    complaint: w.complaint,
    technician: w.technician,
    laborCost: w.laborCost,
    status: w.status,
    usedParts: w.usedParts || [],
  }
}

const labelCls = "mb-1 block text-xs font-medium text-muted-foreground"
const selectCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-slate-400 placeholder:font-normal dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"

interface WorkOrderFormModalProps {
  open: boolean
  onClose: () => void
  editItem: WorkOrder | null
  technicians: Technician[]
  serviceRates: ServiceRate[]
  parts: Part[]
  activeJobsByTech: Record<string, number>
  onSave: (data: WorkOrderInput, editId?: string) => void
}

export const WorkOrderFormModal = React.memo(function WorkOrderFormModal({
  open,
  onClose,
  editItem,
  technicians,
  serviceRates,
  parts,
  activeJobsByTech,
  onSave,
}: WorkOrderFormModalProps) {
  const [form, setForm] = useState<WorkOrderInput>(emptyForm)

  // Full-Screen / Mobile Part Picker State
  const [partPickerOpen, setPartPickerOpen] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")
  const [pickerCategory, setPickerCategory] = useState("all")

  // Reset / sync form whenever modal is opened
  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm(fromWorkOrder(editItem))
      } else {
        setForm({
          ...emptyForm,
          technician: technicians[0]?.name || "Agus Pratama",
        })
      }
      setPartPickerOpen(false)
      setPickerSearch("")
      setPickerCategory("all")
    }
  }, [open, editItem, technicians])

  const filteredPickerParts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase()
    return parts.filter((p) => {
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)

      let matchCat = true
      if (pickerCategory === "bengkel") {
        matchCat =
          /pelumas|oli|rem|brake|busi|spark|pengapian|filter|rantai|gir|kopling|cvt|aki|bat|ban|tyre|suspensi|shock|gasket|packing|baut/i.test(
            `${p.category} ${p.name}`
          )
      } else if (pickerCategory === "vapor") {
        matchCat =
          /vapor|glass bead|degreaser|ultrasonic|soda blast/i.test(
            `${p.category} ${p.name}`
          )
      } else if (pickerCategory === "sand") {
        matchCat =
          /sand|pasir|silika|garnet|oxide|steel grit/i.test(
            `${p.category} ${p.name}`
          )
      } else if (pickerCategory === "kustom") {
        matchCat =
          /kustom|custom|modif|powder|coating|cat|paint|epoxy|bracket|plat/i.test(
            `${p.category} ${p.name}`
          )
      }

      return matchQ && matchCat
    })
  }, [parts, pickerSearch, pickerCategory])

  function addPartToForm(part: Part, qtyToAdd = 1) {
    const current = [...(form.usedParts || [])]
    const existingIdx = current.findIndex((p) => p.partId === part.id)
    if (existingIdx !== -1) {
      current[existingIdx].qty += qtyToAdd
    } else {
      current.push({
        partId: part.id,
        name: part.name,
        price: part.price,
        qty: qtyToAdd,
      })
    }
    setForm((prev) => ({ ...prev, usedParts: current }))
    toast.success("Suku Cadang Ditambahkan", `+${qtyToAdd} ${part.name} masuk ke SPK.`)
  }

  function updatePartQtyInForm(partId: string, delta: number) {
    const current = [...(form.usedParts || [])]
    const existingIdx = current.findIndex((p) => p.partId === partId)
    if (existingIdx === -1) return
    const newQty = current[existingIdx].qty + delta
    if (newQty <= 0) {
      current.splice(existingIdx, 1)
    } else {
      current[existingIdx].qty = newQty
    }
    setForm((prev) => ({ ...prev, usedParts: current }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerName.trim() || !form.brand.trim() || !form.plate.trim()) {
      toast.error(
        "Gagal Menyimpan",
        "Mohon isi nama pelanggan, merk kendaraan, dan plat nomor."
      )
      return
    }
    onSave(form, editItem ? editItem.id : undefined)
    onClose()
  }

  return (
    <>
      <BottomSheet
        open={open}
        onClose={onClose}
        title={editItem ? "Edit Pekerjaan" : "Kendaraan Masuk"}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="modal-wo-name">
                Nama Pelanggan
              </label>
              <Input
                id="modal-wo-name"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="cth. Budi Santoso"
                required
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="modal-wo-phone">
                No. WhatsApp
              </label>
              <Input
                id="modal-wo-phone"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({ ...form, customerPhone: e.target.value })
                }
                placeholder="0812-xxxx-xxxx"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} htmlFor="modal-wo-brand">
                Merek
              </label>
              <Input
                id="modal-wo-brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Honda"
                required
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="modal-wo-model">
                Model
              </label>
              <Input
                id="modal-wo-model"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="CBR250RR"
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="modal-wo-plate">
                Plat
              </label>
              <Input
                id="modal-wo-plate"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                placeholder="B 1234 XY"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="modal-wo-service">
              Jenis Layanan
            </label>
            <select
              id="modal-wo-service"
              className={selectCls}
              value={form.service}
              onChange={(e) =>
                setForm({ ...form, service: e.target.value as ServiceType })
              }
            >
              {serviceTypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="modal-wo-complaint">
              Keluhan / Permintaan
            </label>
            <textarea
              id="modal-wo-complaint"
              value={form.complaint}
              onChange={(e) => setForm({ ...form, complaint: e.target.value })}
              placeholder="cth. Servis rutin + vapor blasting blok mesin"
              rows={2}
              className={cn(selectCls, "resize-none")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="modal-wo-tech">
                Teknisi
              </label>
              <select
                id="modal-wo-tech"
                className={selectCls}
                value={form.technician}
                onChange={(e) =>
                  setForm({ ...form, technician: e.target.value })
                }
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({activeJobsByTech[t.name] || 0} unit aktif)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="modal-wo-status">
                Status
              </label>
              <select
                id="modal-wo-status"
                className={selectCls}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as WorkStatus })
                }
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s} ({statusProgressMap[s]}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <label className={labelCls}>Suku Cadang Terpakai (Spareparts)</label>
              <span className="text-[10px] text-muted-foreground font-normal">
                Opsional · Kosongkan jika order jasa saja
              </span>
            </div>

            {/* List suku cadang yang sudah ditambahkan */}
            {form.usedParts && form.usedParts.length > 0 && (
              <div className="space-y-2">
                {form.usedParts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg bg-card p-2 text-xs ring-1 ring-border shadow-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-muted-foreground text-[11px]">
                        {p.qty}x @ {formatRupiah(p.price)} ={" "}
                        <strong className="text-foreground">
                          {formatRupiah(p.qty * p.price)}
                        </strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updatePartQtyInForm(p.partId, -1)}
                        className="flex size-6 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-semibold text-xs">
                        {p.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updatePartQtyInForm(p.partId, 1)}
                        className="flex size-6 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newParts = [...(form.usedParts || [])]
                          newParts.splice(idx, 1)
                          setForm({ ...form, usedParts: newParts })
                        }}
                        className="ml-1 p-1 text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
                        title="Hapus part"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tombol Buka Full-Screen Picker */}
            <button
              type="button"
              onClick={(e) => {
                ;(e.currentTarget as HTMLElement)?.blur()
                setPickerSearch("")
                setPickerCategory("all")
                setPartPickerOpen(true)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 py-3 px-4 text-xs font-semibold text-primary transition-all active:scale-[0.99] cursor-pointer"
            >
              <Plus className="size-4" />
              <span>
                {form.usedParts && form.usedParts.length > 0
                  ? "Tambah Suku Cadang Lainnya"
                  : "Pilih Suku Cadang dari Stok"}
              </span>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={labelCls} htmlFor="modal-wo-labor">
                Estimasi Biaya Jasa (Rp)
              </label>
              <span className="text-[0.68rem] text-muted-foreground">
                Pilih tarif atau ketik manual
              </span>
            </div>
            {serviceRates && serviceRates.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  const rate = serviceRates.find((r) => r.id === e.target.value)
                  if (rate) setForm({ ...form, laborCost: rate.price })
                  e.target.value = ""
                }}
                className="w-full text-xs text-primary bg-primary/10 border border-primary/25 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
              >
                <option value="" disabled>
                  ⚡ Pilih tarif standar (Vapor / Servis / Blasting)...
                </option>
                {serviceRates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {formatRupiah(r.price)}
                  </option>
                ))}
              </select>
            )}
            <Input
              id="modal-wo-labor"
              type="number"
              min={0}
              value={form.laborCost || ""}
              onChange={(e) =>
                setForm({ ...form, laborCost: Number(e.target.value) })
              }
              placeholder="150000"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-[0.99] cursor-pointer"
          >
            {editItem ? "Simpan Perubahan" : "Simpan Pekerjaan"}
          </button>
        </form>
      </BottomSheet>

      {/* FULL SCREEN MOBILE-FRIENDLY PART PICKER MODAL */}
      {partPickerOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-background/95 sm:items-center sm:justify-center sm:p-4 animate-in fade-in duration-150">
          <div className="flex h-full w-full flex-col bg-card sm:h-[88vh] sm:max-w-xl sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl overflow-hidden animate-sheet-mobile">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground">Pilih Suku Cadang</h3>
                <p className="text-[11px] text-muted-foreground">
                  Cari dan pilih suku cadang yang terpakai
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPartPickerOpen(false)}
                className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Sticky Search Input */}
            <div className="p-3 border-b border-border bg-card shrink-0 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Ketik nama sparepart / SKU..."
                  className="w-full rounded-xl border border-input bg-muted/40 pl-9 pr-9 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {pickerSearch && (
                  <button
                    type="button"
                    onClick={() => setPickerSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
                {[
                  { id: "all", label: "Semua" },
                  { id: "bengkel", label: "🔧 Sparepart" },
                  { id: "vapor", label: "💧 Vapor" },
                  { id: "sand", label: "🏖️ Sandblast" },
                  { id: "kustom", label: "⚡ Kustom" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setPickerCategory(c.id)}
                    className={cn(
                      "shrink-0 rounded-lg px-2.5 py-1 font-medium transition-colors cursor-pointer",
                      pickerCategory === c.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Parts List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredPickerParts.length > 0 ? (
                filteredPickerParts.map((p) => {
                  const alreadySelected = form.usedParts?.find(
                    (x) => x.partId === p.id
                  )
                  const isBulk =
                    p.price === 0 ||
                    /pasir|silika|garnet|glass bead/i.test(p.name)

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                        alreadySelected
                          ? "border-primary/40 bg-primary/5 shadow-xs"
                          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className="min-w-0 pr-3 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-foreground">
                            {p.name}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {p.sku}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span>
                            Stok:{" "}
                            <strong
                              className={cn(
                                p.stock <= p.minStock
                                  ? "text-destructive"
                                  : "text-foreground"
                              )}
                            >
                              {p.stock} unit
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="font-bold text-primary">
                            {formatRupiah(p.price)}
                          </span>
                          {isBulk && (
                            <span className="rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-medium">
                              Bahan Operasional
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {alreadySelected ? (
                          <div className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 p-1">
                            <button
                              type="button"
                              onClick={() => updatePartQtyInForm(p.id, -1)}
                              className="flex size-7 items-center justify-center rounded bg-card text-foreground font-bold hover:bg-muted text-xs shadow-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold text-xs text-primary">
                              {alreadySelected.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePartQtyInForm(p.id, 1)}
                              className="flex size-7 items-center justify-center rounded bg-card text-foreground font-bold hover:bg-muted text-xs shadow-xs cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addPartToForm(p, 1)}
                            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                          >
                            <Plus className="size-3.5" /> Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : parts.length === 0 ? (
                <div className="py-14 text-center px-4 space-y-3">
                  <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Package className="size-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Inventaris Suku Cadang Masih Kosong</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Belum ada data barang di inventaris gudang. Anda dapat menambah suku cadang terlebih dahulu di menu <strong>Stok Suku Cadang</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-14 text-center px-4 space-y-3">
                  <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                    <Search className="size-6 stroke-[1.5]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Suku Cadang Tidak Ditemukan</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Tidak ada suku cadang yang cocok dengan kata kunci &ldquo;{pickerSearch}&rdquo;.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/20 shrink-0 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {form.usedParts?.length || 0} suku cadang dipilih
              </span>
              <button
                type="button"
                onClick={() => setPartPickerOpen(false)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                Selesai Memilih
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})
