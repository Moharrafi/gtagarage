"use client"

import { useState, useMemo } from "react"
import { ChevronDown, User, Clock, Wrench, Package, Plus, Pencil, Trash2, Eye, Search, X, Zap, CheckCircle2 } from "lucide-react"
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
import { formatRupiah, workOrderTotal, technicians, type WorkStatus, type ServiceType, type WorkOrder } from "@/lib/data"
import { useWorkshop, type WorkOrderInput } from "@/lib/store"

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
  technician: technicians[0].name,
  laborCost: 0,
  status: "Antrian",
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
  "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"

export function WorkOrdersScreen() {
  const { workOrders, parts, serviceRates, addWorkOrder, updateWorkOrder, deleteWorkOrder, canEdit } = useWorkshop()
  const [filter, setFilter] = useState<JobFilter>("Aktif")
  const [query, setQuery] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<WorkOrderInput>(emptyForm)
  const [waOpen, setWaOpen] = useState(false)
  const [waWoId, setWaWoId] = useState<string | undefined>(undefined)
  const [assignTargetWo, setAssignTargetWo] = useState<WorkOrder | null>(null)

  const activeJobsByTech = useMemo(() => {
    const counts: Record<string, number> = {}
    workOrders.forEach((order) => {
      if (order.status !== "Selesai") {
        counts[order.technician] = (counts[order.technician] || 0) + 1
      }
    })
    return counts
  }, [workOrders])

  function handleAssignAndStart(techName: string) {
    if (!assignTargetWo) return
    const isFromAntrian = assignTargetWo.status === "Antrian"
    const newStatus: WorkStatus = isFromAntrian ? "Dikerjakan" : assignTargetWo.status

    const updatedInput: WorkOrderInput = {
      ...fromWorkOrder(assignTargetWo),
      technician: techName,
      status: newStatus,
    }

    updateWorkOrder(assignTargetWo.id, updatedInput)
    if (isFromAntrian) {
      toast.success(
        "Pekerjaan Dimulai!",
        `${assignTargetWo.vehicle.brand} (${assignTargetWo.vehicle.plate}) resmi dikerjakan oleh ${techName}.`
      )
    } else {
      toast.success(
        "Mekanik Diperbarui",
        `${assignTargetWo.vehicle.plate} dialihkan ke teknisi ${techName}.`
      )
    }
    setAssignTargetWo(null)
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
    const updatedInput: WorkOrderInput = {
      ...fromWorkOrder(w),
      status: "Selesai",
    }
    updateWorkOrder(w.id, updatedInput)
    toast.success(
      "Pekerjaan Selesai (100%)",
      `Unit ${w.vehicle.brand} (${w.vehicle.plate}) telah diserahkan dan dipindahkan ke arsip Pekerjaan Selesai.`
    )
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return workOrders.filter((w) => {
      const matchFilter = filter === "Aktif" ? w.status !== "Selesai" : w.status === filter
      if (!matchFilter) return false
      if (!q) return true

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
    })
  }, [workOrders, filter, query])

  function openAdd() {
    setEditId(null)
    setForm(emptyForm)
    setSheetOpen(true)
  }

  function openEdit(w: WorkOrder) {
    setEditId(w.id)
    setForm(fromWorkOrder(w))
    setSheetOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customerName.trim() || !form.brand.trim() || !form.plate.trim()) {
      toast.error("Gagal Menyimpan", "Mohon isi nama pelanggan, merk kendaraan, dan plat nomor.")
      return
    }
    if (editId) {
      updateWorkOrder(editId, form)
      toast.success("Pekerjaan Diperbarui", `Data pekerjaan ${form.brand} ${form.model} (${form.plate}) berhasil disimpan.`)
    } else {
      addWorkOrder(form)
      toast.success("Pekerjaan Ditambahkan", `Kendaraan ${form.brand} ${form.model} (${form.plate}) berhasil didaftarkan.`)
    }
    setSheetOpen(false)
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nopol, pelanggan, motor, atau WO..."
          className="pl-9 pr-9 h-10 rounded-2xl bg-card border-border dark:border-slate-700/80 shadow-2xs text-xs md:text-sm"
          aria-label="Cari data pekerjaan servis"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className="absolute top-1/2 right-2.5 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

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
        {list.map((w) => {
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
                      onClick={(e) => {
                        e.stopPropagation()
                        if (canEdit) setAssignTargetWo(w)
                      }}
                      role={canEdit ? "button" : undefined}
                      tabIndex={canEdit ? 0 : undefined}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                        w.technician
                          ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                      )}
                      title={canEdit ? "Klik untuk ganti / pilih teknisi" : undefined}
                    >
                      <Wrench className="size-2.5" />
                      <span className="truncate max-w-[120px]">{w.technician || "Pilih Teknisi"}</span>
                      {canEdit && <Pencil className="size-2 opacity-60 ml-0.5" />}
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
                      setAssignTargetWo(w)
                    }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Zap className="size-3.5 fill-current" />
                    Mulai Kerjakan (Tugaskan Mekanik)
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
                        <Clock className="size-3.5" /> Masuk {w.createdAt}
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
                      {w.status === "Antrian" && canEdit && (
                        <button
                          type="button"
                          onClick={() => setAssignTargetWo(w)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Zap className="size-3.5 fill-current" /> Mulai Kerjakan
                        </button>
                      )}
                      {w.status === "Dikerjakan" && canEdit && (
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(w)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <CheckCircle2 className="size-3.5" /> Selesaikan Pengerjaan
                        </button>
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(w)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-accent dark:border-slate-700 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Pencil className="size-3.5" /> Edit
                        </button>
                      )}
                      {w.status === "Siap Diambil" && canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleFinalComplete(w)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer"
                          >
                            <CheckCircle2 className="size-3.5" /> Selesai &amp; Serahkan
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setWaWoId(w.id)
                              setWaOpen(true)
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
                          >
                            <WhatsAppIcon className="size-3.5 text-[#25D366]" /> WA Siap Diambil
                          </button>
                        </>
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
        })}

        {list.length === 0 && (
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

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editId ? "Edit Pekerjaan" : "Kendaraan Masuk"}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="wo-name">Nama Pelanggan</label>
              <Input id="wo-name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="cth. Budi Santoso" required />
            </div>
            <div>
              <label className={labelCls} htmlFor="wo-phone">No. WhatsApp</label>
              <Input id="wo-phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} placeholder="0812-xxxx-xxxx" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} htmlFor="wo-brand">Merek</label>
              <Input id="wo-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Honda" required />
            </div>
            <div>
              <label className={labelCls} htmlFor="wo-model">Model</label>
              <Input id="wo-model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="CBR250RR" />
            </div>
            <div>
              <label className={labelCls} htmlFor="wo-plate">Plat</label>
              <Input id="wo-plate" value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} placeholder="B 1234 XY" required />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="wo-service">Jenis Layanan</label>
            <select id="wo-service" className={selectCls} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value as ServiceType })}>
              {serviceTypes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="wo-complaint">Keluhan / Permintaan</label>
            <textarea
              id="wo-complaint"
              value={form.complaint}
              onChange={(e) => setForm({ ...form, complaint: e.target.value })}
              placeholder="cth. Servis rutin + vapor blasting blok mesin"
              rows={2}
              className={cn(selectCls, "resize-none")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="wo-tech">Teknisi</label>
              <select id="wo-tech" className={selectCls} value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })}>
                {technicians.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({activeJobsByTech[t.name] || 0} unit aktif)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="wo-status">Status</label>
              <select id="wo-status" className={selectCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as WorkStatus })}>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s} ({statusProgressMap[s]}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
            <label className={labelCls}>Suku Cadang Terpakai (Spareparts)</label>
            
            {form.usedParts && form.usedParts.length > 0 && (
              <div className="space-y-2">
                {form.usedParts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-card p-2 text-xs ring-1 ring-black/[0.04] shadow-sm">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground">{p.qty}x @ {formatRupiah(p.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newParts = [...(form.usedParts || [])]
                        newParts.splice(idx, 1)
                        setForm({ ...form, usedParts: newParts })
                      }}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <select id="wo-add-part" className={cn(selectCls, "flex-1")} defaultValue="">
                <option value="" disabled>Pilih part...</option>
                {parts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {formatRupiah(p.price)}</option>
                ))}
              </select>
              <Input id="wo-add-qty" type="number" min={1} defaultValue={1} className="w-16 px-2 text-center" />
              <button
                type="button"
                onClick={() => {
                  const select = document.getElementById("wo-add-part") as HTMLSelectElement
                  const qtyInput = document.getElementById("wo-add-qty") as HTMLInputElement
                  if (!select.value || !qtyInput.value) return
                  const part = parts.find(p => p.id === select.value)
                  if (!part) return
                  const qty = Number(qtyInput.value)
                  const newParts = [...(form.usedParts || [])]
                  const existing = newParts.find(p => p.partId === part.id)
                  if (existing) {
                    existing.qty += qty
                  } else {
                    newParts.push({ partId: part.id, name: part.name, price: part.price, qty })
                  }
                  setForm({ ...form, usedParts: newParts })
                  select.value = ""
                  qtyInput.value = "1"
                }}
                className="flex items-center justify-center rounded-lg bg-primary/10 px-3 text-primary transition-colors hover:bg-primary/20"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={labelCls} htmlFor="wo-labor">Estimasi Biaya Jasa (Rp)</label>
              <span className="text-[0.68rem] text-muted-foreground">Pilih tarif atau ketik manual</span>
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
                <option value="" disabled>⚡ Pilih tarif standar (Vapor / Servis / Blasting)...</option>
                {serviceRates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {formatRupiah(r.price)}
                  </option>
                ))}
              </select>
            )}
            <Input
              id="wo-labor"
              type="number"
              min={0}
              value={form.laborCost || ""}
              onChange={(e) => setForm({ ...form, laborCost: Number(e.target.value) })}
              placeholder="150000"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-[0.99]"
          >
            {editId ? "Simpan Perubahan" : "Simpan Pekerjaan"}
          </button>
        </form>
      </BottomSheet>

      {canEdit && <WhatsAppModal open={waOpen} onClose={() => setWaOpen(false)} initialWorkOrderId={waWoId} />}

      {/* QUICK ASSIGN MECHANIC & START WORK MODAL */}
      <BottomSheet
        open={Boolean(assignTargetWo)}
        onClose={() => setAssignTargetWo(null)}
        title="Tugaskan Mekanik & Mulai Pengerjaan"
        className="max-w-[440px] md:max-w-lg"
      >
        {assignTargetWo && (
          <div className="space-y-4 p-4 md:p-5">
            {/* Target Work Order Summary */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex items-center gap-3">
              <ServiceIcon service={assignTargetWo.service} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {assignTargetWo.vehicle.brand} {assignTargetWo.vehicle.model}
                  </h4>
                  <span className="font-mono text-xs font-semibold text-primary">
                    {assignTargetWo.code}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {assignTargetWo.vehicle.plate} • {assignTargetWo.customer.name}
                </p>
                <p className="text-[11px] text-muted-foreground/90 italic truncate mt-1">
                  &ldquo;{assignTargetWo.complaint || "Perawatan berkala"}&rdquo;
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-1">
                Pilih Mekanik Penanggung Jawab:
              </p>
              <p className="text-[11px] text-muted-foreground mb-3">
                Status pengerjaan akan otomatis diubah ke <strong>Dikerjakan</strong> dan dihitung dalam evaluasi efisiensi bulanan.
              </p>

              <div className="space-y-2.5">
                {technicians.map((t) => {
                  const activeCount = activeJobsByTech[t.name] || 0
                  const isCurrent = assignTargetWo.technician === t.name

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleAssignAndStart(t.name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer",
                        isCurrent
                          ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                          : "border-border bg-card hover:border-primary/50 hover:bg-accent/40"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-10 border border-border shadow-xs">
                          <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
                            {t.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                            {isCurrent && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary">
                                Ditugaskan
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {t.completedThisMonth} order selesai • Rata-rata {t.avgHours} jam
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold",
                            activeCount === 0
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : activeCount > 3
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          )}
                        >
                          {activeCount} motor aktif
                        </span>
                        <p className="text-[10px] font-semibold text-emerald-600 mt-1">
                          {t.efficiency}% Efisiensi
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setAssignTargetWo(null)}
                className="rounded-xl px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
