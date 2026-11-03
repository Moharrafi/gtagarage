"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import { X, Plus, Trash2, Search, Package, ArrowLeft, Zap, ChevronDown, Check, Banknote, Calendar, Receipt } from "lucide-react"
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

const serviceTypes: ServiceType[] = ["Servis", "Vapor Blasting", "Sand Blasting", "Kustomisasi", "Powder Coating"]

function toLocalDateInputValue(dateOrIso?: string | Date): string {
  if (!dateOrIso) return ""
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso
  if (isNaN(d.getTime())) return ""
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function updateDateInIso(isoString: string | undefined, newDateYMD: string): string {
  if (!newDateYMD) return new Date().toISOString()
  const [yearStr, monthStr, dayStr] = newDateYMD.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10) - 1
  const day = parseInt(dayStr, 10)

  let baseDate = isoString ? new Date(isoString) : new Date()
  if (isNaN(baseDate.getTime())) baseDate = new Date()

  const newDate = new Date(
    year,
    month,
    day,
    baseDate.getHours(),
    baseDate.getMinutes(),
    baseDate.getSeconds()
  )
  return newDate.toISOString()
}

const emptyForm: WorkOrderInput = {
  customerName: "",
  customerPhone: "",
  brand: "",
  model: "",
  plate: "",
  service: "Servis",
  complaint: "",
  technician: "Owner",
  laborCost: 0,
  status: "Antrian",
  usedParts: [],
  createdAt: "",
  hasDp: false,
  dpAmount: 0,
  dpMethod: "Tunai",
}

function getCategoryBadgeCls(cat: ServiceType) {
  switch (cat) {
    case "Vapor Blasting":
      return "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25"
    case "Sand Blasting":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25"
    case "Kustomisasi":
      return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25"
    case "Powder Coating":
    case "Powdercoating":
      return "bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/25"
    case "Servis":
    default:
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25"
  }
}

function fromWorkOrder(w: WorkOrder): WorkOrderInput {
  const dpAmount = w.dpAmount || 0
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
    createdAt: w.createdAt,
    hasDp: Boolean(w.hasDp || dpAmount > 0),
    dpAmount: dpAmount,
    dpMethod: w.dpMethod || "Tunai",
  }
}

const labelCls = "mb-1 block text-xs font-medium text-muted-foreground"
const selectCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-slate-400 placeholder:font-normal dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"

interface WorkOrderFormModalProps {
  open: boolean
  onClose: () => void
  editItem: WorkOrder | null
  technicians?: Technician[]
  serviceRates?: ServiceRate[]
  parts?: Part[]
  activeJobsByTech?: Record<string, number>
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

  // Full-Screen / Mobile Unified Catalog Picker State
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false)
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
          createdAt: new Date().toISOString(),
          technician: "Owner",
          status: "Antrian",
          laborCost: 0,
        })
      }
      setCatalogPickerOpen(false)
      setPickerSearch("")
      setPickerCategory("all")
    }
  }, [open, editItem])

  const selectedRate = useMemo(() => {
    if (!serviceRates || serviceRates.length === 0) return null
    return (
      serviceRates.find(
        (r) => r.price === form.laborCost && r.category === form.service
      ) ||
      serviceRates.find((r) => r.price === form.laborCost) ||
      null
    )
  }, [serviceRates, form.laborCost, form.service])

  const partsTotal = useMemo(() => {
    return form.usedParts?.reduce((s, p) => s + p.qty * p.price, 0) || 0
  }, [form.usedParts])

  const totalItemsCount = useMemo(() => {
    return (form.laborCost > 0 ? 1 : 0) + (form.usedParts?.length || 0)
  }, [form.laborCost, form.usedParts])

  const filteredPickerRates = useMemo(() => {
    if (!serviceRates || serviceRates.length === 0) return []
    if (pickerCategory === "part") return []

    const q = pickerSearch.trim().toLowerCase()
    return serviceRates.filter((r) => {
      const matchQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q)

      let matchCat = true
      if (pickerCategory === "bengkel") {
        matchCat = r.category === "Servis"
      } else if (pickerCategory === "vapor") {
        matchCat = r.category === "Vapor Blasting"
      } else if (pickerCategory === "sand") {
        matchCat = r.category === "Sand Blasting"
      } else if (pickerCategory === "kustom") {
        matchCat = r.category === "Kustomisasi" || r.category === "Powder Coating" || r.category === "Powdercoating"
      }

      return matchQ && matchCat
    })
  }, [serviceRates, pickerSearch, pickerCategory])

  const filteredPickerParts = useMemo(() => {
    if (!parts || parts.length === 0) return []
    if (pickerCategory === "service") return []

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
    const finalForm: WorkOrderInput = {
      ...form,
      hasDp: Boolean(form.hasDp && (form.dpAmount || 0) > 0),
      dpAmount: form.hasDp ? (Number(form.dpAmount) || 0) : 0,
      dpMethod: form.hasDp && (form.dpAmount || 0) > 0 ? (form.dpMethod || "Tunai") : undefined,
    }
    onSave(finalForm, editItem ? editItem.id : undefined)
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        if (catalogPickerOpen) {
          setCatalogPickerOpen(false)
        } else {
          onClose()
        }
      }}
      full={catalogPickerOpen}
      bodyClassName={cn(catalogPickerOpen && "p-0 flex flex-col overflow-hidden")}
      header={
        catalogPickerOpen ? (
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/20">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCatalogPickerOpen(false)}
                className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                title="Kembali ke form pekerjaan"
              >
                <ArrowLeft className="size-4.5" />
              </button>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">Katalog Jasa & Suku Cadang</h3>
                <p className="text-[10px] text-muted-foreground">Pilih tarif pengerjaan dan suku cadang bengkel</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCatalogPickerOpen(false)}
              aria-label="Tutup"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-4.5" />
            </button>
          </div>
        ) : undefined
      }
      title={catalogPickerOpen ? "Katalog Jasa & Suku Cadang" : editItem ? "Edit Pekerjaan" : "Kendaraan Masuk"}
    >
      {catalogPickerOpen ? (
        /* ================= UNIFIED CATALOG PICKER VIEW (DRAWER) ================= */
        <div className="flex-1 flex flex-col h-full bg-card relative">
          {/* Sticky Search & Category Filter */}
          <div className="px-5 pt-4 pb-2 space-y-2.5 shrink-0 bg-card z-10 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                placeholder="Cari tarif jasa atau nama sparepart / SKU..."
                enterKeyHint="search"
                inputMode="search"
                className="w-full rounded-xl border border-input bg-muted/40 pl-9 pr-9 py-2.5 text-base sm:text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-[11px]">
              {[
                { id: "all", label: "Semua" },
                { id: "service", label: "⚡ Tarif Jasa" },
                { id: "part", label: "📦 Suku Cadang" },
                { id: "bengkel", label: "🔧 Servis" },
                { id: "vapor", label: "💧 Vapor" },
                { id: "sand", label: "🏖️ Sandblast" },
                { id: "kustom", label: "⚙️ Kustom" },
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

          {/* Catalog Items List */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4 pt-3">
            {/* 1. SECTION: TARIF JASA */}
            {filteredPickerRates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="flex size-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Zap className="size-3" />
                    </span>
                    <span>Tarif Jasa Pengerjaan</span>
                    <span className="rounded-full bg-muted px-2 py-0.2 text-[10px] text-muted-foreground font-mono font-semibold">
                      {filteredPickerRates.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Pilih tarif standar</span>
                </div>

                <div className="space-y-2">
                  {filteredPickerRates.map((r) => {
                    const isSelected =
                      form.laborCost === r.price &&
                      (form.service === r.category || !form.service)

                    return (
                      <div
                        key={`rate-${r.id}`}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all",
                          isSelected
                            ? "border-amber-500/50 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                            : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
                        )}
                      >
                        <div className="min-w-0 pr-3 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-foreground">
                              {r.name}
                            </span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[9px] font-semibold leading-none",
                                getCategoryBadgeCls(r.category)
                              )}
                            >
                              {r.category}
                            </span>
                            {isSelected && (
                              <span className="rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-bold inline-flex items-center gap-1">
                                <Check className="size-3" strokeWidth={3} /> Terpilih
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {r.description}
                            </p>
                          )}
                          <div className="mt-1">
                            <span className="font-bold text-xs text-primary font-mono">
                              {formatRupiah(r.price)}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({ ...prev, laborCost: 0 }))
                                toast.info("Tarif Jasa Dilepas", "Biaya jasa direset ke Rp 0.")
                              }}
                              className="flex items-center gap-1 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 px-3 py-2 text-xs font-semibold hover:bg-destructive/20 transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  laborCost: r.price,
                                  service: r.category,
                                }))
                                toast.success(
                                  "Tarif Jasa Dipilih",
                                  `${r.name} — ${formatRupiah(r.price)}`
                                )
                              }}
                              className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-transform active:scale-95 cursor-pointer"
                            >
                              <Plus className="size-3.5" /> Pilih Jasa
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 2. SECTION: SUKU CADANG */}
            {filteredPickerParts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className="flex size-5 items-center justify-center rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      <Package className="size-3" />
                    </span>
                    <span>Inventaris Suku Cadang</span>
                    <span className="rounded-full bg-muted px-2 py-0.2 text-[10px] text-muted-foreground font-mono font-semibold">
                      {filteredPickerParts.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Bisa pilih beberapa item</span>
                </div>

                <div className="space-y-2">
                  {filteredPickerParts.map((p) => {
                    const alreadySelected = form.usedParts?.find(
                      (x) => x.partId === p.id
                    )
                    const isBulk =
                      p.price === 0 ||
                      /pasir|silika|garnet|glass bead/i.test(p.name)

                    return (
                      <div
                        key={`part-${p.id}`}
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
                  })}
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {filteredPickerRates.length === 0 && filteredPickerParts.length === 0 && (
              <div className="py-12 text-center px-4 space-y-3">
                <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
                  <Search className="size-6 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Item Tidak Ditemukan
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    {pickerSearch ? (
                      <>Tidak ada jasa atau suku cadang yang cocok dengan &ldquo;{pickerSearch}&rdquo;.</>
                    ) : (
                      <>Tidak ada item dalam kategori yang dipilih.</>
                    )}
                  </p>
                </div>
                {(pickerSearch || pickerCategory !== "all") && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerSearch("")
                        setPickerCategory("all")
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-accent px-3 py-1.5 text-xs font-medium text-foreground transition-colors cursor-pointer"
                    >
                      Reset Filter & Pencarian
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Summary Bar */}
          <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm p-4 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-10">
            <div className="text-xs min-w-0">
              <div className="flex items-center gap-2 text-muted-foreground text-[11px] truncate">
                <span>⚡ Jasa: <strong className="text-foreground font-mono">{formatRupiah(form.laborCost)}</strong></span>
                <span>•</span>
                <span>📦 {form.usedParts?.length || 0} Part: <strong className="text-foreground font-mono">{formatRupiah(partsTotal)}</strong></span>
              </div>
              <p className="font-bold text-sm text-foreground mt-0.5 truncate">
                Total: <span className="text-primary font-mono">{formatRupiah(form.laborCost + partsTotal)}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCatalogPickerOpen(false)}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-[0.99] cursor-pointer"
            >
              Selesai Memilih
            </button>
          </div>
        </div>
      ) : (
        /* ================= STANDARD FORM VIEW ================= */
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

          {/* Tanggal Masuk Kendaraan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls} htmlFor="modal-wo-date">
                Tanggal Masuk
              </label>
              <button
                type="button"
                onClick={() => setForm({ ...form, createdAt: new Date().toISOString() })}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Hari ini
              </button>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="modal-wo-date"
                type="date"
                value={toLocalDateInputValue(form.createdAt)}
                onChange={(e) => {
                  const val = e.target.value
                  if (val) {
                    setForm({
                      ...form,
                      createdAt: updateDateInIso(form.createdAt, val),
                    })
                  }
                }}
                className="pl-9 cursor-pointer"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Jenis Layanan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {serviceTypes.map((s, idx) => {
                const isSelected = form.service === s || (s === "Powder Coating" && form.service === "Powdercoating")
                const icons: Record<ServiceType, string> = {
                  "Servis": "🔧",
                  "Vapor Blasting": "💧",
                  "Sand Blasting": "🏖️",
                  "Kustomisasi": "⚡",
                  "Powder Coating": "🎨",
                  "Powdercoating": "🎨",
                }
                const isLastOdd = idx === 4
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, service: s })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2.5 text-xs font-semibold transition-all cursor-pointer active:scale-95 text-center",
                      isLastOdd && "col-span-2 sm:col-span-1 lg:col-span-1",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/25 ring-1 ring-primary"
                        : "border-border/80 bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:border-border"
                    )}
                  >
                    <span>{icons[s]}</span>
                    <span className="truncate">{s}</span>
                  </button>
                )
              })}
            </div>
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

          {/* ================= INPUT BIAYA MANUAL & SUKU CADANG ================= */}
          <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5" htmlFor="modal-wo-labor">
                  <span className="flex size-5 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Banknote className="size-3" />
                  </span>
                  <span>Biaya / Tarif Jasa (Rp)</span>
                </label>
                {form.laborCost > 0 && (
                  <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-bold font-mono">
                    {formatRupiah(form.laborCost)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Masukkan tarif pekerjaan langsung secara manual oleh Owner
              </p>
            </div>

            {/* Input Nominal Manual */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground select-none">
                Rp
              </span>
              <Input
                id="modal-wo-labor"
                type="number"
                min={0}
                step={5000}
                value={form.laborCost === 0 ? "" : form.laborCost}
                onChange={(e) => {
                  const val = e.target.value === "" ? 0 : Math.max(0, Number(e.target.value))
                  setForm({ ...form, laborCost: val })
                }}
                className="pl-11 pr-20 text-sm font-semibold h-11 rounded-xl bg-card border-input focus:ring-primary placeholder:text-muted-foreground"
                placeholder="0 (masukkan harga manual)"
              />
              {form.laborCost > 0 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, laborCost: 0 })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground hover:text-destructive px-2 py-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Tombol Cepat Nominal */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground font-medium mr-0.5">Preset:</span>
              {[50000, 100000, 150000, 200000, 250000, 350000, 500000].map((amt) => {
                const isSelected = form.laborCost === amt
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setForm({ ...form, laborCost: amt })}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer active:scale-95",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-xs ring-1 ring-primary"
                        : "bg-card border border-border/70 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {formatRupiah(amt).replace("Rp\u00a0", "").replace(",00", "")}
                  </button>
                )
              })}
            </div>

            {/* Optional Catalog / Spareparts Button & Selected List */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Suku Cadang & Bahan (Opsional)
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    ;(e.currentTarget as HTMLElement)?.blur()
                    setPickerSearch("")
                    setPickerCategory("all")
                    setCatalogPickerOpen(true)
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  <Plus className="size-3" />
                  {form.usedParts && form.usedParts.length > 0
                    ? `Kelola Suku Cadang (${form.usedParts.length})`
                    : "Pilih dari Katalog / Suku Cadang"}
                </button>
              </div>

              {/* Selected Spareparts list if any */}
              {form.usedParts && form.usedParts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {form.usedParts.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-card p-2.5 text-xs ring-1 ring-border shadow-xs border-l-4 border-l-blue-500"
                    >
                      <div className="min-w-0 pr-2 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            <Package className="size-3" />
                          </span>
                          <p className="font-semibold text-foreground truncate">{p.name}</p>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5 pl-6.5">
                          {p.qty}x @ {formatRupiah(p.price)} ={" "}
                          <strong className="text-foreground font-mono">
                            {formatRupiah(p.qty * p.price)}
                          </strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
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
            </div>

            {/* Total Ringkasan Biaya SPK */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Biaya Jasa:</span>
                <span className="font-semibold text-foreground font-mono">{formatRupiah(form.laborCost)}</span>
              </div>
              {partsTotal > 0 && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Suku Cadang ({form.usedParts?.length || 0} item):</span>
                  <span className="font-semibold text-foreground font-mono">{formatRupiah(partsTotal)}</span>
                </div>
              )}
              <div className="border-t border-primary/15 pt-1.5 flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">Total Estimasi:</span>
                <span className="text-base font-extrabold text-primary font-mono">{formatRupiah(form.laborCost + partsTotal)}</span>
              </div>
            </div>
          </div>

          {/* ================= UANG MUKA / DOWN PAYMENT (DP) ================= */}
          <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/20 p-4">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Receipt className="size-3" />
                  </span>
                  <span>Uang Muka / DP Pelanggan</span>
                </label>
                {form.hasDp && (form.dpAmount || 0) > 0 && (
                  <span className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold font-mono">
                    DP: {formatRupiah(form.dpAmount || 0)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Apakah pelanggan memberikan pembayaran uang muka saat unit masuk?
              </p>
            </div>

            {/* Selector: Tanpa DP vs Ada DP */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, hasDp: false, dpAmount: 0 })}
                className={cn(
                  "rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer text-center active:scale-95",
                  !form.hasDp
                    ? "border-primary bg-primary text-primary-foreground shadow-xs shadow-primary/25"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                Tanpa DP (Belum Bayar)
              </button>
              <button
                type="button"
                onClick={() => {
                  const totalEst = form.laborCost + partsTotal
                  const defaultDp = form.dpAmount && form.dpAmount > 0 ? form.dpAmount : (totalEst > 0 ? Math.round(totalEst * 0.5) : 0)
                  setForm({ ...form, hasDp: true, dpAmount: defaultDp, dpMethod: form.dpMethod || "Tunai" })
                }}
                className={cn(
                  "rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all cursor-pointer text-center active:scale-95",
                  form.hasDp
                    ? "border-amber-500 bg-amber-500 text-white shadow-xs shadow-amber-500/25 ring-1 ring-amber-500"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                Ada DP (Uang Muka)
              </button>
            </div>

            {/* If DP is active */}
            {form.hasDp && (
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls} htmlFor="modal-wo-dp-amount">
                      Nominal DP (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                        Rp
                      </span>
                      <Input
                        id="modal-wo-dp-amount"
                        type="number"
                        min={0}
                        value={form.dpAmount || ""}
                        onChange={(e) => setForm({ ...form, dpAmount: Math.max(0, Number(e.target.value)) })}
                        placeholder="0"
                        className="pl-9 font-mono font-semibold"
                        required={form.hasDp}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>
                      Metode Pembayaran DP
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["Tunai", "Transfer", "QRIS"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setForm({ ...form, dpMethod: m })}
                          className={cn(
                            "rounded-xl border py-2 text-xs font-semibold transition-all cursor-pointer text-center active:scale-95",
                            form.dpMethod === m
                              ? "border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 ring-1 ring-amber-600/50"
                              : "border-border bg-card text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {m === "Tunai" ? "💵 Tunai" : m === "Transfer" ? "🏦 Transfer" : "📱 QRIS"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Presets for DP */}
                {(form.laborCost + partsTotal) > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">Pilihan Cepat:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const totalEst = form.laborCost + partsTotal
                        setForm({ ...form, dpAmount: Math.round(totalEst * 0.2) })
                      }}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent cursor-pointer active:scale-95 transition-all"
                    >
                      20% ({formatRupiah(Math.round((form.laborCost + partsTotal) * 0.2))})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const totalEst = form.laborCost + partsTotal
                        setForm({ ...form, dpAmount: Math.round(totalEst * 0.5) })
                      }}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent cursor-pointer active:scale-95 transition-all"
                    >
                      50% ({formatRupiah(Math.round((form.laborCost + partsTotal) * 0.5))})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const totalEst = form.laborCost + partsTotal
                        setForm({ ...form, dpAmount: totalEst })
                      }}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-accent cursor-pointer active:scale-95 transition-all"
                    >
                      100% (Lunas di Awal)
                    </button>
                  </div>
                )}

                {/* Ringkasan Kalkulasi DP & Sisa Pelunasan */}
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                    <span>Uang Muka Diterima ({form.dpMethod || "Tunai"}):</span>
                    <span className="font-bold font-mono">{formatRupiah(form.dpAmount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950 dark:text-amber-100 pt-1 border-t border-amber-500/20">
                    <span>Sisa Tagihan Pelunasan:</span>
                    <span className="font-mono text-sm">
                      {formatRupiah(Math.max(0, (form.laborCost + partsTotal) - (form.dpAmount || 0)))}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-amber-800/80 dark:text-amber-300/80 pt-0.5">
                    💡 Tagihan di menu invoice otomatis tercatat berstatus <strong className="underline">{(form.laborCost + partsTotal > 0 && (form.dpAmount || 0) >= (form.laborCost + partsTotal)) ? "Lunas" : "Sebagian (DP)"}</strong>. Sisa tagihan akan dilunasi saat penyerahan unit.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-[0.99] cursor-pointer"
          >
            {editItem ? "Simpan Perubahan" : "Simpan Kendaraan Masuk"}
          </button>
        </form>
      )}
    </BottomSheet>
  )
})
