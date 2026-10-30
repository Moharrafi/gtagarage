"use client"

import { useState, useMemo } from "react"
import { ChevronDown, User, Clock, Wrench, Package, Plus, Pencil, Trash2, Eye, Search, X, Zap, CheckCircle2, AlertTriangle, CreditCard, Banknote } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ServiceIcon } from "@/components/workshop/service-icon"
import { WorkStatusBadge } from "@/components/workshop/status-badge"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { WhatsAppModal } from "@/components/workshop/whatsapp-modal"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { toast } from "@/components/workshop/toast"
import { confirmModal } from "@/components/workshop/confirm-dialog"
import { WorkOrderFormModal } from "@/components/workshop/work-order-form-modal"
import { formatRupiah, workOrderTotal, invoiceTotal, type WorkStatus, type ServiceType, type WorkOrder, type Part, type Invoice } from "@/lib/data"
import { useWorkshop, type WorkOrderInput } from "@/lib/store"
import { SearchFilterBar, type SearchFilterOption } from "@/components/workshop/search-filter-bar"

export type JobFilter = "Aktif" | WorkStatus

export const statusProgressMap: Record<WorkStatus, number> = {
  "Antrian": 0,
  "Menunggu Sparepart": 30,
  "Dikerjakan": 60,
  "Siap Diambil": 90,
  "Selesai": 100,
}

const filters: JobFilter[] = [
  "Aktif",
  "Antrian",
  "Menunggu Sparepart",
  "Dikerjakan",
  "Siap Diambil",
  "Selesai",
]

const serviceTypes: ServiceType[] = ["Servis", "Vapor Blasting", "Sand Blasting", "Kustomisasi"]

const workOrderSearchOptions: SearchFilterOption[] = [
  { key: "all", label: "Semua Bidang", placeholder: "Cari nopol, pelanggan, motor, SPK..." },
  { key: "plate", label: "Plat Nomor", placeholder: "Cari plat nomor (mis. B 5543 WLN)..." },
  { key: "customer", label: "Pelanggan", placeholder: "Cari nama atau telepon pelanggan..." },
  { key: "vehicle", label: "Motor / Unit", placeholder: "Cari merk / tipe motor (mis. NMAX)..." },
  { key: "code", label: "Kode SPK / WO", placeholder: "Cari kode pekerjaan (mis. SPK-001)..." },
  { key: "technician", label: "Mekanik", placeholder: "Cari nama mekanik..." },
  { key: "service", label: "Tipe Layanan", placeholder: "Cari jenis servis (mis. Vapor Blasting)..." },
]
const statuses: WorkStatus[] = [
  "Antrian",
  "Menunggu Sparepart",
  "Dikerjakan",
  "Siap Diambil",
  "Selesai",
]

const emptyForm: WorkOrderInput = {
  customerName: "",
  customerPhone: "",
  plate: "",
  brand: "",
  model: "",
  service: "Servis",
  complaint: "",
  technician: "Owner",
  laborCost: 0,
  status: "Antrian",
}

function formatWorkOrderDate(dateStr?: string) {
  if (!dateStr) return "-"
  if (!dateStr.includes("T") && !dateStr.includes("-")) return dateStr
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(".", ":")
}

function fromWorkOrder(w: WorkOrder): WorkOrderInput {
  return {
    customerName: w.customer.name,
    customerPhone: w.customer.phone,
    plate: w.vehicle.plate,
    brand: w.vehicle.brand,
    model: w.vehicle.model,
    service: w.service,
    complaint: w.complaint,
    technician: w.technician,
    laborCost: w.laborCost,
    status: w.status,
    usedParts: w.usedParts,
  }
}

const labelCls = "mb-1 block text-xs font-medium text-muted-foreground"
const selectCls =
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-slate-400 placeholder:font-normal dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ring"

interface WorkOrdersScreenProps {
  onNavigate?: (tab: "beranda" | "pekerjaan" | "stok" | "invoice" | "analitik") => void
}

export function WorkOrdersScreen({ onNavigate }: WorkOrdersScreenProps = {}) {
  const { workOrders, parts, invoices, payInvoiceDirect, serviceRates, technicians, addWorkOrder, updateWorkOrder, deleteWorkOrder, canEdit, isLoading } = useWorkshop()
  const [filter, setFilter] = useState<JobFilter>("Aktif")
  const [query, setQuery] = useState("")
  const [searchField, setSearchField] = useState("all")
  const [openId, setOpenId] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editItem, setEditItem] = useState<WorkOrder | null>(null)
  const [waOpen, setWaOpen] = useState(false)
  const [waWoId, setWaWoId] = useState<string | undefined>(undefined)

  const [payValidation, setPayValidation] = useState<{ wo: WorkOrder; inv?: Invoice } | null>(null)
  const [isProcessingPay, setIsProcessingPay] = useState(false)

  function handleStartWork(w: WorkOrder) {
    const updatedInput: WorkOrderInput = {
      ...fromWorkOrder(w),
      technician: w.technician || "Owner",
      status: "Dikerjakan",
    }
    updateWorkOrder(w.id, updatedInput)
    toast.success(
      "Pekerjaan Dimulai!",
      `${w.vehicle.brand} ${w.vehicle.model} (${w.vehicle.plate}) status diubah ke Dikerjakan.`
    )
  }

  function handleQuickComplete(w: WorkOrder) {
    const updatedInput: WorkOrderInput = {
      ...fromWorkOrder(w),
      status: "Siap Diambil",
    }
    updateWorkOrder(w.id, updatedInput)
    toast.success(
      "Pengerjaan Selesai!",
      `${w.vehicle.brand} ${w.vehicle.model} (${w.vehicle.plate}) telah selesai dan siap diserahkan ke pelanggan.`
    )
  }

  function handleFinalComplete(w: WorkOrder) {
    const matchingInv = invoices.find((inv) => inv.workOrderCode === w.code)
    const isPaid = matchingInv && matchingInv.status === "Lunas"

    if (!isPaid) {
      setPayValidation({ wo: w, inv: matchingInv })
      return
    }

    const updatedInput: WorkOrderInput = {
      ...fromWorkOrder(w),
      status: "Selesai",
    }
    updateWorkOrder(w.id, updatedInput)
    toast.success(
      "Pekerjaan Selesai (100%)",
      `Unit ${w.vehicle.brand} (${w.vehicle.plate}) telah diserahkan (Pembayaran Lunas).`
    )
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return workOrders.filter((w) => {
      const matchFilter = filter === "Aktif" ? w.status !== "Selesai" : w.status === filter
      if (!matchFilter) return false
      if (!q) return true

      switch (searchField) {
        case "plate":
          return w.vehicle.plate.toLowerCase().includes(q)
        case "customer":
          return (
            w.customer.name.toLowerCase().includes(q) ||
            w.customer.phone.toLowerCase().includes(q)
          )
        case "vehicle":
          return (
            w.vehicle.brand.toLowerCase().includes(q) ||
            w.vehicle.model.toLowerCase().includes(q)
          )
        case "code":
          return w.code.toLowerCase().includes(q)
        case "technician":
          return w.technician.toLowerCase().includes(q)
        case "service":
          return w.service.toLowerCase().includes(q)
        case "all":
        default: {
          const searchStr = [
            w.code,
            w.vehicle.brand,
            w.vehicle.model,
            w.vehicle.plate,
            w.customer.name,
            w.customer.phone,
            w.service,
            w.complaint,
            w.technician,
          ]
            .join(" ")
            .toLowerCase()
          return searchStr.includes(q)
        }
      }
    })
  }, [workOrders, filter, query, searchField])

  function openAdd(e?: React.MouseEvent) {
    if (e?.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur()
    } else if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setEditItem(null)
    setSheetOpen(true)
  }

  function openEdit(w: WorkOrder, e?: React.MouseEvent) {
    if (e?.currentTarget instanceof HTMLElement) {
      e.currentTarget.blur()
    } else if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setEditItem(w)
    setSheetOpen(true)
  }

  function handleSaveOrder(input: WorkOrderInput, editId?: string) {
    if (editId) {
      if (input.status === "Selesai") {
        const matchingWo = workOrders.find((w) => w.id === editId)
        const matchingInv = invoices.find((inv) => inv.workOrderCode === matchingWo?.code)
        if (!matchingInv || matchingInv.status !== "Lunas") {
          toast.error(
            "Pembayaran Belum Lunas!",
            "Pekerjaan tidak dapat diubah ke status Selesai sebelum tagihan dilunasi di kasir. Silakan pilih status 'Siap Diambil'."
          )
          return
        }
      }
      updateWorkOrder(editId, input)
      toast.success("Pekerjaan Diperbarui", `Data pekerjaan ${input.brand} ${input.model} (${input.plate}) berhasil disimpan.`)
    } else {
      addWorkOrder(input)
      toast.success("Pekerjaan Ditambahkan", `Kendaraan ${input.brand} ${input.model} (${input.plate}) berhasil didaftarkan.`)
    }
  }

  return (
    <div className="space-y-3.5">
      {/* Filter Tabs */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0 md:flex-wrap">
        {filters.map((f) => {
          const count =
            f === "Aktif"
              ? workOrders.filter((w) => w.status !== "Selesai").length
              : workOrders.filter((w) => w.status === f).length
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
                  filter === f ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Bar with Filter Criterion Button */}
      <SearchFilterBar
        query={query}
        onQueryChange={setQuery}
        selectedField={searchField}
        onFieldChange={setSearchField}
        options={workOrderSearchOptions}
        ariaLabel="Cari data pekerjaan servis"
      />

      {canEdit ? (
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-[0.99]"
        >
          <Plus className="size-4" strokeWidth={2.6} />
          Tambah Kendaraan Masuk
        </button>
      ) : (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300">
          <Eye className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>Mode Mekanik: Akses baca saja (melihat daftar &amp; progres pekerjaan).</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="gap-0 overflow-hidden p-3.5 animate-pulse border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-muted/80 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/5 rounded bg-muted/80" />
                  <div className="h-3 w-2/5 rounded bg-muted/60" />
                </div>
              </div>
              <div className="mt-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-20 rounded bg-muted/60" />
                  <div className="h-3 w-8 rounded bg-muted/60" />
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/50" />
              </div>
            </Card>
          ))
        ) : (
          list.map((w) => {
            const open = openId === w.id
            const partsTotal = w.usedParts.reduce((s, p) => s + p.qty * p.price, 0)
            return (
              <Card key={w.id} className="gap-0 overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : w.id)}
                className="flex w-full items-center gap-3 p-3.5 text-left"
              >
                <ServiceIcon service={w.service} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {w.vehicle.brand} {w.vehicle.model}
                    </p>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">{w.code}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.vehicle.plate} · {w.service}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <WorkStatusBadge status={w.status} />
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                    >
                      <Wrench className="size-2.5" />
                      <span className="truncate max-w-[120px]">{w.technician || "Owner"}</span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "ml-auto size-4 text-muted-foreground transition-transform duration-300 ease-out",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </div>
              </button>

              <div className="px-3.5 pb-3.5 pt-0.5">
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-muted-foreground">Progres Pengerjaan</span>
                  <span
                    className={cn(
                      "text-xs font-bold tabular-nums",
                      w.progress >= 100
                        ? "text-success"
                        : w.progress === 0
                        ? "text-muted-foreground"
                        : "text-primary",
                    )}
                  >
                    {w.progress}%
                  </span>
                </div>
                <Progress
                  value={w.progress}
                  className="h-1.5 w-full"
                  indicatorClassName={w.progress >= 100 ? "bg-success" : undefined}
                />
              </div>

              {w.status === "Antrian" && canEdit && (
                <div className="px-3.5 pb-3 pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartWork(w)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Zap className="size-3.5 fill-current" />
                    Mulai Kerjakan
                  </button>
                </div>
              )}

              {w.status === "Dikerjakan" && canEdit && (
                <div className="px-3.5 pb-3 pt-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickComplete(w)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Selesaikan Pengerjaan
                  </button>
                </div>
              )}

              {w.status === "Siap Diambil" && canEdit && (
                <div className="px-3.5 pb-3 pt-0 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleFinalComplete(w)
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Selesai &amp; Serahkan Unit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setWaWoId(w.id)
                      setWaOpen(true)
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-[0.98] cursor-pointer"
                    title="Kirim pesan WhatsApp Siap Diambil"
                  >
                    <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                    Kirim WA
                  </button>
                </div>
              )}

              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                  open
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                )}
              >
                <div className="overflow-hidden">
                  <div className="space-y-3 border-t border-border p-3.5">
                    <p className="text-sm">{w.complaint}</p>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="size-3.5" /> {w.customer.name}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wrench className="size-3.5" /> {w.technician}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-3.5" /> Masuk {formatWorkOrderDate(w.createdAt)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-3.5" /> Estimasi {w.estimatedDone}
                      </div>
                    </div>

                    {w.usedParts.length > 0 && (
                      <div className="rounded-xl border border-border bg-muted/40 p-3 shadow-xs dark:bg-slate-900/70 dark:border-slate-700/80">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                          <Package className="size-3.5 text-primary dark:text-blue-400" /> Suku Cadang Terpakai
                        </div>
                        <ul className="space-y-1.5">
                          {w.usedParts.map((p) => (
                            <li key={p.partId} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {p.name} <span className="text-foreground/70 font-medium">×{p.qty}</span>
                              </span>
                              <span className="font-semibold text-foreground">{formatRupiah(p.qty * p.price)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2.5 flex items-center justify-between border-t border-border dark:border-slate-700/80 pt-2 text-xs">
                          <span className="text-muted-foreground">Jasa</span>
                          <span className="font-semibold text-foreground">{formatRupiah(w.laborCost)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Sparepart</span>
                          <span className="font-semibold text-foreground">{formatRupiah(partsTotal)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Avatar className="size-7">
                        <AvatarFallback className="bg-primary/15 text-[0.65rem] text-primary">
                          {w.customer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-right">
                        <p className="text-[0.7rem] text-muted-foreground">Total Estimasi</p>
                        <p className="text-base font-semibold">{formatRupiah(workOrderTotal(w))}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(w)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-accent dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="size-3.5" /> Edit
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirmModal({
                              title: "Hapus Order Pekerjaan?",
                              description: `Apakah Anda yakin ingin menghapus order pekerjaan untuk ${w.vehicle.brand} ${w.vehicle.model} (${w.vehicle.plate})? Data pengerjaan tidak dapat dikembalikan.`,
                              confirmText: "Hapus Order",
                              cancelText: "Batal",
                              variant: "destructive",
                              icon: "trash",
                            })
                            if (ok) {
                              deleteWorkOrder(w.id)
                              if (openId === w.id) setOpenId(null)
                              toast.success("Pekerjaan Dihapus", `Order ${w.code} (${w.vehicle.plate}) berhasil dihapus.`)
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive transition-all hover:-translate-y-0.5 hover:bg-destructive/15"
                        >
                          <Trash2 className="size-3.5" /> Hapus
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        }))}

        {!isLoading && list.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-muted-foreground shadow-2xs">
            <Wrench className="mx-auto size-9 stroke-[1.5] text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {query ? "Pekerjaan Tidak Ditemukan" : "Tidak Ada Pekerjaan"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              {query
                ? `Tidak ada data pekerjaan yang cocok dengan kata kunci "${query}".`
                : filter === "Selesai"
                ? "Belum ada riwayat pekerjaan yang selesai."
                : `Tidak ada pekerjaan dalam status "${filter}".`}
            </p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}
      </div>

      <WorkOrderFormModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        editItem={editItem}
        technicians={technicians}
        serviceRates={serviceRates}
        parts={parts}
        onSave={handleSaveOrder}
      />

      {canEdit && <WhatsAppModal open={waOpen} onClose={() => setWaOpen(false)} initialWorkOrderId={waWoId} />}

      {/* ================= MODAL VALIDASI PEMBAYARAN KASIR SEBELUM SELESAI ================= */}
      {payValidation && (
        <BottomSheet
          open={Boolean(payValidation)}
          onClose={() => {
            if (!isProcessingPay) setPayValidation(null)
          }}
          title="Validasi Pembayaran Kasir"
        >
          <div className="space-y-4">
            {/* Header Warning Banner */}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 dark:bg-amber-950/30">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Tagihan Belum Lunas!
                </h4>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700/90 dark:text-amber-400/90">
                  Unit tidak dapat diserahkan (status 100% Selesai) sebelum tagihan diselesaikan di kasir, agar pencatatan omzet hari ini di Beranda tetap akurat.
                </p>
              </div>
            </div>

            {/* Vehicle & Bill Summary Card */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {payValidation.wo.code}
                  </span>
                  <h3 className="text-sm font-bold text-foreground">
                    {payValidation.wo.vehicle.brand} {payValidation.wo.vehicle.model}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {payValidation.wo.vehicle.plate} • {payValidation.wo.customer.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Belum Bayar
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-border/70 pt-2.5 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Jasa {payValidation.wo.service}:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatRupiah(payValidation.wo.laborCost)}
                  </span>
                </div>
                {payValidation.wo.usedParts.length > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Suku Cadang ({payValidation.wo.usedParts.length} item):</span>
                    <span className="font-semibold text-foreground font-mono">
                      {formatRupiah(payValidation.wo.usedParts.reduce((s, p) => s + p.qty * p.price, 0))}
                    </span>
                  </div>
                )}
                <div className="border-t border-border/60 pt-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-foreground">Total Tagihan:</span>
                  <span className="text-base font-extrabold text-primary font-mono">
                    {formatRupiah(
                      payValidation.inv
                        ? invoiceTotal(payValidation.inv)
                        : workOrderTotal(payValidation.wo)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Quick Cash Payment */}
              <button
                type="button"
                disabled={isProcessingPay}
                onClick={async () => {
                  setIsProcessingPay(true)
                  const total = payValidation.inv
                    ? invoiceTotal(payValidation.inv)
                    : workOrderTotal(payValidation.wo)
                  const ok = await payInvoiceDirect(payValidation.inv?.id || payValidation.wo.code, "Tunai", total)
                  setIsProcessingPay(false)
                  if (ok) {
                    setPayValidation(null)
                    toast.success(
                      "Pembayaran Tunai Diterima! ✅",
                      `Invoice lunas ${formatRupiah(total)}. Omzet hari ini bertambah & status pekerjaan selesai 100%.`
                    )
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Banknote className="size-4" />
                <span>
                  {isProcessingPay ? "Memproses..." : "Lunasi Tunai di Tempat & Selesai (100%)"}
                </span>
              </button>

              {/* Option 2: Open Invoices / Cashier (for QRIS, Transfer, Card) */}
              <button
                type="button"
                disabled={isProcessingPay}
                onClick={() => {
                  const targetCode = payValidation.wo.code
                  setPayValidation(null)
                  if (onNavigate) {
                    onNavigate("invoice")
                  }
                  toast.info(
                    "Membuka Kasir Pembayaran",
                    `Silakan pilih metode bayar QRIS, Virtual Account, atau Kartu untuk tagihan ${targetCode}.`
                  )
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/10 py-2.5 px-4 text-xs font-semibold text-primary hover:bg-primary/15 active:scale-[0.98] transition-all cursor-pointer"
              >
                <CreditCard className="size-4" />
                <span>Buka Kasir Pembayaran (QRIS / Transfer / Kartu)</span>
              </button>

              {/* Option 3: Cancel */}
              <button
                type="button"
                disabled={isProcessingPay}
                onClick={() => setPayValidation(null)}
                className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Batal (Tetap Siap Diambil)
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  )
}
