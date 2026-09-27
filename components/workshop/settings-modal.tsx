"use client"

import { useState, useEffect, useMemo } from "react"
import {
  X,
  Settings,
  DollarSign,
  Sun,
  Moon,
  Laptop,
  Store,
  Layers,
  Plus,
  Pencil,
  Trash2,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  Package,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Ticket,
  Tag,
  Calendar,
  Percent,
  Power,
  Eye,
  EyeOff,
  CreditCard,
  ExternalLink,
  Lock,
  Users,
  Phone,
} from "lucide-react"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { useWorkshop, initials, type PartInput, type ServiceRateInput, type WorkshopProfile, type MidtransConfig } from "@/lib/store"
import { formatRupiah, generatePartSKU, type ServiceType, type Part, type ServiceRate, type Voucher, type VoucherTargetService, type Technician, type TechnicianInput } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "@/components/workshop/toast"
import { confirmModal } from "@/components/workshop/confirm-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

type SettingsTab = "harga" | "mekanik" | "voucher" | "midtrans" | "profil" | "tema" | "sistem"
type CatalogSubTab = "layanan" | "sparepart"

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const {
    profile,
    currentUser,
    canEdit,
    isMekanik,
    logout,
    updateProfile,
    parts,
    categories,
    serviceRates,
    vouchers,
    addPart,
    updatePart,
    deletePart,
    addServiceRate,
    updateServiceRate,
    deleteServiceRate,
    addVoucher,
    updateVoucher,
    deleteVoucher,
    toggleVoucherStatus,
    technicians,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    dismissTip,
    isTipDismissed,
    resetDismissedTips,
    resetDemoData,
    midtransConfig,
    updateMidtransConfig,
  } = useWorkshop()

  const [activeTab, setActiveTab] = useState<SettingsTab>("harga")
  const [localMidtrans, setLocalMidtrans] = useState<MidtransConfig>(midtransConfig)
  const [showMidtransKey, setShowMidtransKey] = useState(false)
  const [showMidtransServerKey, setShowMidtransServerKey] = useState(false)

  useEffect(() => {
    setLocalMidtrans(midtransConfig)
  }, [midtransConfig])
  const [catalogSubTab, setCatalogSubTab] = useState<CatalogSubTab>("layanan")

  // Dark mode state - default to "system" so initial view matches device setting
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  const applyTheme = (t: "light" | "dark" | "system") => {
    const isDark =
      t === "dark" ||
      (t === "system" &&
        (typeof window !== "undefined"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
          : false))
    document.documentElement.classList.toggle("dark", isDark)
  }

  useEffect(() => {
    const saved = localStorage.getItem("bengkel_theme") as "light" | "dark" | "system" | null
    if (saved === "light" || saved === "dark" || saved === "system") {
      setTheme(saved)
      applyTheme(saved)
    } else {
      setTheme("system")
      applyTheme("system")
    }

    const mql = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = () => {
      const current = localStorage.getItem("bengkel_theme")
      if (!current || current === "system") {
        applyTheme("system")
      }
    }
    mql.addEventListener("change", handleSystemChange)
    return () => mql.removeEventListener("change", handleSystemChange)
  }, [])

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("bengkel_theme", newTheme)
    applyTheme(newTheme)
  }

  // Catalog search & filter
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua")

  // Form state for adding/editing service rate
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [serviceForm, setServiceForm] = useState<ServiceRateInput>({
    name: "",
    category: "Vapor Blasting",
    price: 0,
    description: "",
  })

  // Form state for adding/editing part/material
  const [partFormOpen, setPartFormOpen] = useState(false)
  const [editingPartId, setEditingPartId] = useState<string | null>(null)
  const [partForm, setPartForm] = useState<PartInput>({
    name: "",
    sku: "",
    category: "Pelumas",
    stock: 10,
    minStock: 5,
    price: 0,
  })

  // Profile Bengkel state
  const [workshopProfile, setWorkshopProfile] = useState<WorkshopProfile>(profile)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    setWorkshopProfile(profile)
  }, [profile])

  // Filtered Services
  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return serviceRates.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      const matchCat = selectedCategory === "Semua" || s.category === selectedCategory
      return matchQ && matchCat
    })
  }, [serviceRates, searchQuery, selectedCategory])

  // Filtered Parts
  const filteredParts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return parts.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      const matchCat = selectedCategory === "Semua" || p.category === selectedCategory
      return matchQ && matchCat
    })
  }, [parts, searchQuery, selectedCategory])

  // Open add service rate form
  const handleOpenAddService = () => {
    setEditingServiceId(null)
    setServiceForm({
      name: "",
      category: "Vapor Blasting",
      price: 0,
      description: "",
    })
    setServiceFormOpen(true)
  }

  // Open edit service rate form
  const handleOpenEditService = (s: ServiceRate) => {
    setEditingServiceId(s.id)
    setServiceForm({
      name: s.name,
      category: s.category,
      price: s.price,
      description: s.description || "",
    })
    setServiceFormOpen(true)
  }

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceForm.name.trim() || serviceForm.price <= 0) {
      toast.error("Validasi Gagal", "Silakan isi nama layanan dan harga tarif dengan benar.")
      return
    }
    if (editingServiceId) {
      updateServiceRate(editingServiceId, serviceForm)
      toast.success("Tarif Diperbarui", `Tarif layanan "${serviceForm.name}" berhasil disimpan.`)
    } else {
      addServiceRate(serviceForm)
      toast.success("Tarif Ditambahkan", `Tarif layanan "${serviceForm.name}" berhasil dibuat.`)
    }
    setServiceFormOpen(false)
  }

  // Open add part form
  const handleOpenAddPart = () => {
    setEditingPartId(null)
    setPartForm({
      name: "",
      sku: generatePartSKU("", "Pelumas", parts),
      category: "Pelumas",
      stock: 10,
      minStock: 5,
      price: 0,
    })
    setPartFormOpen(true)
  }

  // Open edit part form
  const handleOpenEditPart = (p: Part) => {
    setEditingPartId(p.id)
    setPartForm({
      name: p.name,
      sku: p.sku,
      category: p.category,
      stock: p.stock,
      minStock: p.minStock,
      price: p.price,
    })
    setPartFormOpen(true)
  }

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault()
    if (!partForm.name.trim() || partForm.price <= 0) {
      toast.error("Validasi Gagal", "Silakan isi nama barang dan harga dengan benar.")
      return
    }
    const finalSku = partForm.sku || generatePartSKU(partForm.name, partForm.category, parts)
    const finalPartForm = { ...partForm, sku: finalSku }
    if (editingPartId) {
      updatePart(editingPartId, finalPartForm)
      toast.success("Sparepart Diperbarui", `Item "${finalPartForm.name}" (${finalPartForm.sku}) berhasil disimpan.`)
    } else {
      addPart(finalPartForm)
      toast.success("Sparepart Ditambahkan", `Item "${finalPartForm.name}" (${finalPartForm.sku}) berhasil ditambahkan.`)
    }
    setPartFormOpen(false)
  }

  // Voucher search & state
  const [voucherSearch, setVoucherSearch] = useState("")
  const [voucherFormOpen, setVoucherFormOpen] = useState(false)
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null)
  const [voucherForm, setVoucherForm] = useState<{
    code: string
    title: string
    type: "fixed" | "percent"
    value: number
    maxDiscount: number
    minPurchase: number
    validUntil: string
    isActive: boolean
    targetService: VoucherTargetService
    description: string
  }>({
    code: "",
    title: "",
    type: "fixed",
    value: 25000,
    maxDiscount: 50000,
    minPurchase: 100000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Semua Layanan",
    description: "",
  })

  const filteredVouchers = useMemo(() => {
    const q = voucherSearch.toLowerCase().trim()
    return vouchers.filter((v) => {
      if (!q) return true
      return v.code.toLowerCase().includes(q) || v.title.toLowerCase().includes(q)
    })
  }, [vouchers, voucherSearch])

  const handleOpenAddVoucher = () => {
    setEditingVoucherId(null)
    setVoucherForm({
      code: "",
      title: "",
      type: "fixed",
      value: 25000,
      maxDiscount: 50000,
      minPurchase: 100000,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
      targetService: "Semua Layanan",
      description: "",
    })
    setVoucherFormOpen(true)
  }

  const handleOpenEditVoucher = (v: Voucher) => {
    setEditingVoucherId(v.id)
    setVoucherForm({
      code: v.code,
      title: v.title,
      type: v.type,
      value: v.value,
      maxDiscount: v.maxDiscount || 0,
      minPurchase: v.minPurchase || 0,
      validUntil: v.validUntil,
      isActive: v.isActive,
      targetService: v.targetService || "Semua Layanan",
      description: v.description || "",
    })
    setVoucherFormOpen(true)
  }

  const handleSaveVoucher = (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherForm.code.trim()) {
      toast.error("Validasi Gagal", "Kode voucher tidak boleh kosong.")
      return
    }
    if (!voucherForm.title.trim()) {
      toast.error("Validasi Gagal", "Judul voucher tidak boleh kosong.")
      return
    }
    if (voucherForm.value <= 0) {
      toast.error("Validasi Gagal", "Nilai potongan diskon harus lebih dari 0.")
      return
    }

    if (editingVoucherId) {
      updateVoucher(editingVoucherId, {
        code: voucherForm.code,
        title: voucherForm.title,
        type: voucherForm.type,
        value: Number(voucherForm.value),
        maxDiscount: voucherForm.type === "percent" ? Number(voucherForm.maxDiscount) : undefined,
        minPurchase: Number(voucherForm.minPurchase) || 0,
        validUntil: voucherForm.validUntil,
        isActive: voucherForm.isActive,
        targetService: voucherForm.targetService,
        description: voucherForm.description,
      })
      toast.success("Voucher Diperbarui", `Voucher ${voucherForm.code.toUpperCase()} berhasil diperbarui.`)
    } else {
      addVoucher({
        code: voucherForm.code,
        title: voucherForm.title,
        type: voucherForm.type,
        value: Number(voucherForm.value),
        maxDiscount: voucherForm.type === "percent" ? Number(voucherForm.maxDiscount) : undefined,
        minPurchase: Number(voucherForm.minPurchase) || 0,
        validUntil: voucherForm.validUntil,
        isActive: voucherForm.isActive,
        targetService: voucherForm.targetService,
        description: voucherForm.description,
      })
      toast.success("Voucher Dibuat", `Kode promo ${voucherForm.code.toUpperCase()} aktif dan siap digunakan.`)
    }
    setVoucherFormOpen(false)
  }

  // Technicians / Mechanics Management State & Handlers
  const [techFormOpen, setTechFormOpen] = useState(false)
  const [editingTechId, setEditingTechId] = useState<string | null>(null)
  const [techSearch, setTechSearch] = useState("")
  const [techForm, setTechForm] = useState<TechnicianInput>({
    name: "",
    phone: "",
    specialty: "Spesialis Mesin 4-Tak & Vapor Blasting",
    status: "Aktif",
  })

  const filteredTechnicians = useMemo(() => {
    const q = techSearch.toLowerCase().trim()
    if (!q) return technicians
    return technicians.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.specialty && t.specialty.toLowerCase().includes(q)) ||
        (t.phone && t.phone.includes(q)) ||
        (t.status && t.status.toLowerCase().includes(q))
    )
  }, [technicians, techSearch])

  const handleOpenAddTech = () => {
    setEditingTechId(null)
    setTechForm({
      name: "",
      phone: "",
      specialty: "Spesialis Mesin 4-Tak & Vapor Blasting",
      status: "Aktif",
    })
    setTechFormOpen(true)
  }

  const handleOpenEditTech = (t: Technician) => {
    setEditingTechId(t.id)
    setTechForm({
      name: t.name,
      phone: t.phone || "",
      specialty: t.specialty || "Mekanik Umum & Servis",
      status: t.status || "Aktif",
    })
    setTechFormOpen(true)
  }

  const handleSaveTech = (e: React.FormEvent) => {
    e.preventDefault()
    if (!techForm.name.trim()) {
      toast.error("Validasi Gagal", "Nama lengkap teknisi/mekanik tidak boleh kosong.")
      return
    }

    if (editingTechId) {
      updateTechnician(editingTechId, {
        name: techForm.name.trim(),
        phone: techForm.phone?.trim() || "",
        specialty: techForm.specialty?.trim() || "Mekanik Umum & Servis",
        status: techForm.status || "Aktif",
      })
      toast.success("Data Mekanik Diperbarui", `Data teknisi ${techForm.name} berhasil disimpan.`)
    } else {
      addTechnician({
        name: techForm.name.trim(),
        phone: techForm.phone?.trim() || "",
        specialty: techForm.specialty?.trim() || "Mekanik Umum & Servis",
        status: techForm.status || "Aktif",
      })
      toast.success("Mekanik Baru Ditambahkan", `Teknisi ${techForm.name} kini terdaftar dan siap menerima order.`)
    }
    setTechFormOpen(false)
  }

  const handleDeleteTech = async (t: Technician) => {
    const ok = await confirmModal({
      title: `Hapus Mekanik ${t.name}?`,
      description: `Apakah Anda yakin ingin menghapus data teknisi ini? Riwayat pekerjaan terdahulu tetap tersimpan aman.`,
      confirmText: "Ya, Hapus Mekanik",
      cancelText: "Batal",
      variant: "destructive",
      icon: "trash",
    })
    if (ok) {
      deleteTechnician(t.id)
      toast.info("Mekanik Dihapus", `Teknisi ${t.name} telah dihapus dari sistem bengkel.`)
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile(workshopProfile)
    setProfileSaved(true)
    toast.success("Profil & Struk Disimpan", "Informasi bengkel dan format struk berhasil diperbarui.")
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const handleResetDemo = async () => {
    const ok = await confirmModal({
      title: "Reset Seluruh Data Demo?",
      description: "Seluruh data order pekerjaan, stok sparepart, dan tarif akan dikembalikan ke kondisi awal demo.",
      confirmText: "Reset Data",
      cancelText: "Batal",
      variant: "destructive",
      icon: "reset",
    })
    if (ok) {
      resetDemoData()
      toast.info("Data Direset", "Seluruh data bengkel telah dikembalikan ke kondisi awal demo.")
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      full={true}
      header={
        <div className="shrink-0 bg-primary text-white dark:bg-slate-900 border-b border-primary/20 dark:border-slate-800 px-4 pt-3.5 pb-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex size-8.5 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 shadow-xs backdrop-blur-xs">
                <Settings className="size-4.5" strokeWidth={2.4} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-bold text-white tracking-tight leading-none">
                    Pengaturan Bengkel
                  </h2>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white tracking-wide uppercase border border-white/30">
                    POS &amp; Katalog
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/90 dark:text-slate-300 truncate mt-0.5">
                  Tarif Layanan, Sparepart, Diskon Voucher &amp; Profil
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all"
            >
              <X className="size-4.5" />
            </button>
          </div>

          {/* User Account Card inside the Blue Hero */}
          <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 border border-white/20 backdrop-blur-xs">
            <Avatar className="size-9.5 ring-2 ring-white/40 shrink-0">
              <AvatarFallback className="bg-white text-primary text-xs font-bold dark:bg-slate-800 dark:text-white">
                {currentUser?.avatarInitials || initials(workshopProfile.owner || "GI")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="truncate text-xs font-bold text-white leading-tight">
                  {currentUser?.name || workshopProfile.owner}
                </p>
                <span className="rounded-md bg-white/25 px-1.5 py-0.5 text-[9px] font-bold text-white border border-white/30 leading-none">
                  {currentUser?.role || "Owner"}
                </span>
              </div>
              <p className="truncate text-[10px] text-blue-100/90 dark:text-slate-300 mt-0.5">
                {workshopProfile.name}
              </p>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={async () => {
                const ok = await confirmModal({
                  title: "Konfirmasi Logout",
                  description: `Apakah Anda yakin ingin keluar dari akun ${currentUser?.name || "pengguna"} (${currentUser?.role})? Anda dapat login kembali kapan saja.`,
                  confirmText: "Ya, Logout",
                  cancelText: "Batal",
                  variant: "destructive",
                  icon: "power",
                })
                if (ok) {
                  onClose()
                  logout()
                  toast.info("Berhasil Logout", `Sampai jumpa kembali, ${currentUser?.name || "Pengguna"}`)
                }
              }}
              title="Keluar dari akun (Logout)"
              aria-label="Logout"
              className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 hover:bg-rose-500 hover:border-rose-400 border border-white/25 text-white active:scale-95 transition-all shadow-xs"
            >
              <Power className="size-3.5" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      }
      bodyClassName="p-0 overflow-hidden flex flex-col min-h-0 bg-background"
    >
      {/* Sticky Tab Navigation & Controls Bar */}
      <div className="shrink-0 bg-background px-4 pt-3 pb-2.5 border-b border-border/70 space-y-2.5 shadow-xs">
        {/* Tab Navigation (Smooth Horizontal Scrollable Pills - Never Truncated) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-2xl bg-muted/70 p-1.5 border border-border dark:bg-slate-900/90 dark:border-slate-700/80">
          <button
            type="button"
            onClick={(e) => {
              setActiveTab("harga")
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
            }}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
              activeTab === "harga"
                ? "bg-card text-foreground shadow-xs border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            )}
          >
            <DollarSign className={cn("size-3.5 shrink-0 transition-colors", activeTab === "harga" ? "text-primary dark:text-blue-400" : "text-muted-foreground dark:text-slate-400")} />
            <span>Tarif</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              setActiveTab("mekanik")
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
            }}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
              activeTab === "mekanik"
                ? "bg-card text-foreground shadow-xs border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            )}
          >
            <Users className={cn("size-3.5 shrink-0 transition-colors", activeTab === "mekanik" ? "text-primary dark:text-blue-400" : "text-muted-foreground dark:text-slate-400")} />
            <span>Mekanik</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              setActiveTab("voucher")
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
            }}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
              activeTab === "voucher"
                ? "bg-card text-foreground shadow-xs border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            )}
          >
            <Ticket className={cn("size-3.5 shrink-0 transition-colors", activeTab === "voucher" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground dark:text-slate-400")} />
            <span>Voucher</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              setActiveTab("midtrans")
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
            }}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
              activeTab === "midtrans"
                ? "bg-card text-foreground shadow-xs border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            )}
          >
            <CreditCard className={cn("size-3.5 shrink-0 transition-colors", activeTab === "midtrans" ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground dark:text-slate-400")} />
            <span>Midtrans</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              setActiveTab("profil")
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
            }}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
              activeTab === "profil"
                ? "bg-card text-foreground shadow-xs border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            )}
          >
            <Store className={cn("size-3.5 shrink-0 transition-colors", activeTab === "profil" ? "text-primary dark:text-blue-400" : "text-muted-foreground dark:text-slate-400")} />
            <span>Profil</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              setActiveTab("tema")
              e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
            }}
            className={cn(
              "flex shrink-0 items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-semibold transition-all whitespace-nowrap active:scale-95 cursor-pointer",
              activeTab === "tema"
                ? "bg-card text-foreground shadow-xs border border-border/80 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:shadow-md ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
            )}
          >
            <Moon className={cn("size-3.5 shrink-0 transition-colors", activeTab === "tema" ? "text-primary dark:text-blue-400" : "text-muted-foreground dark:text-slate-400")} />
            <span>Tema</span>
          </button>
        </div>

        {/* Sub-tabs & Search Bar (Sticky for 'harga') */}
        {activeTab === "harga" && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCatalogSubTab("layanan")
                  setSelectedCategory("Semua")
                }}
                className={cn(
                  "group relative flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-semibold transition-all shadow-xs min-w-0 overflow-hidden",
                  catalogSubTab === "layanan"
                    ? "border-primary bg-primary/10 text-primary dark:bg-primary/25 dark:border-primary dark:text-blue-300 font-bold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground dark:border-slate-700/80 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <Sparkles className={cn("size-3.5 shrink-0 transition-colors", catalogSubTab === "layanan" ? "text-primary dark:text-blue-300" : "text-muted-foreground dark:text-slate-400")} />
                <span className="truncate tracking-tight font-medium">Jasa &amp; Vapor</span>
                <span
                  className={cn(
                    "ml-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-bold transition-colors",
                    catalogSubTab === "layanan"
                      ? "bg-primary text-primary-foreground dark:bg-primary dark:text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700"
                  )}
                >
                  {serviceRates.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCatalogSubTab("sparepart")
                  setSelectedCategory("Semua")
                }}
                className={cn(
                  "group relative flex items-center justify-center gap-1.5 rounded-xl border py-2 px-2 text-xs font-semibold transition-all shadow-xs min-w-0 overflow-hidden",
                  catalogSubTab === "sparepart"
                    ? "border-primary bg-primary/10 text-primary dark:bg-primary/25 dark:border-primary dark:text-blue-300 font-bold"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground dark:border-slate-700/80 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                )}
              >
                <Package className={cn("size-3.5 shrink-0 transition-colors", catalogSubTab === "sparepart" ? "text-primary dark:text-blue-300" : "text-muted-foreground dark:text-slate-400")} />
                <span className="truncate tracking-tight font-medium">Sparepart &amp; Bahan</span>
                <span
                  className={cn(
                    "ml-0.5 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-bold transition-colors",
                    catalogSubTab === "sparepart"
                      ? "bg-primary text-primary-foreground dark:bg-primary dark:text-white"
                      : "bg-muted text-muted-foreground group-hover:bg-muted/80 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-slate-700"
                  )}
                >
                  {parts.length}
                </span>
              </button>
            </div>

            {/* Search & Add Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={catalogSubTab === "layanan" ? "Cari tarif vapor / jasa..." : "Cari suku cadang / bahan..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              {canEdit ? (
                catalogSubTab === "layanan" ? (
                  <button
                    type="button"
                    onClick={handleOpenAddService}
                    className="flex items-center gap-1 shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <Plus className="size-3.5" />
                    <span>Tambah</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenAddPart}
                    className="flex items-center gap-1 shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
                  >
                    <Plus className="size-3.5" />
                    <span>Tambah</span>
                  </button>
                )
              ) : (
                <div className="flex items-center gap-1 shrink-0 rounded-xl bg-muted px-2.5 py-2 text-[11px] font-semibold text-muted-foreground border border-border dark:bg-slate-800">
                  <Eye className="size-3" />
                  <span>Baca Saja</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Add Mekanik (Sticky for 'mekanik') */}
        {activeTab === "mekanik" && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama teknisi, spesialisasi, atau status..."
                value={techSearch}
                onChange={(e) => setTechSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs font-medium focus:border-primary focus:outline-none"
              />
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAddTech}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <Plus className="size-3.5" />
                <span>Tambah Mekanik</span>
              </button>
            )}
          </div>
        )}

        {/* Search & Add Voucher (Sticky for 'voucher') */}
        {activeTab === "voucher" && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari kode atau nama promo..."
                value={voucherSearch}
                onChange={(e) => setVoucherSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs font-medium focus:border-primary focus:outline-none"
              />
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAddVoucher}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                <Plus className="size-3.5" />
                <span>Buat Voucher</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content Container (Only the list & forms scroll!) */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 bg-slate-50/60 dark:bg-slate-950/40 p-4 space-y-3.5 no-scrollbar">
        {/* ================= TAB 1: KATALOG & HARGA ================= */}
        {activeTab === "harga" && (
          <div className="space-y-3">
            {/* SUB-SECTION 1: LAYANAN JASA & VAPOR */}
            {catalogSubTab === "layanan" && (
              <div className="space-y-2">
                <p className="text-[0.7rem] text-muted-foreground font-medium">
                  Daftar tarif standar pengerjaan (Vapor Blasting, Sand Blasting, Servis, &amp; Cat) untuk estimasi jasa servis.
                </p>

                <div className="space-y-2.5">
                  {filteredServices.map((s) => (
                    <div
                      key={s.id}
                      className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-card p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-primary/60 transition-all dark:border-slate-700/90 dark:bg-slate-900 dark:hover:border-primary/60 dark:shadow-none ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="truncate text-xs font-bold text-foreground">{s.name}</p>
                          <span
                            className={cn(
                              "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                              s.category === "Vapor Blasting"
                                ? "bg-sky-500/10 text-sky-700 border-sky-500/25 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30"
                                : s.category === "Sand Blasting"
                                ? "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                                : s.category === "Servis"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                                : "bg-purple-500/10 text-purple-700 border-purple-500/25 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                            )}
                          >
                            {s.category}
                          </span>
                        </div>
                        {s.description && (
                          <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                            {s.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-bold text-primary dark:text-blue-400">
                            {formatRupiah(s.price)}
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditService(s)}
                            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-background text-muted-foreground hover:bg-accent hover:text-foreground dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-all shadow-2xs active:scale-95"
                            title="Edit Tarif"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirmModal({
                                title: "Hapus Tarif Layanan?",
                                description: `Apakah Anda yakin ingin menghapus tarif layanan "${s.name}" (${formatRupiah(s.price)})?`,
                                confirmText: "Hapus Tarif",
                                cancelText: "Batal",
                                variant: "destructive",
                                icon: "trash",
                              })
                              if (ok) {
                                deleteServiceRate(s.id)
                                toast.success("Tarif Dihapus", `Tarif "${s.name}" telah dihapus.`)
                              }
                            }}
                            className="flex size-8 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:border-destructive/30 dark:bg-destructive/20 transition-all shadow-2xs active:scale-95"
                            title="Hapus Tarif"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredServices.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border bg-card/60 py-8 text-center text-xs text-muted-foreground dark:border-slate-700">
                      Tidak ada tarif layanan yang cocok.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: SUKU CADANG & BAHAN */}
            {catalogSubTab === "sparepart" && (
              <div className="space-y-2">
                <p className="text-[0.7rem] text-muted-foreground font-medium">
                  Daftar suku cadang &amp; bahan yang langsung terhubung ke dropdown pemilihan part di pendaftaran pekerjaan.
                </p>

                <div className="space-y-2.5">
                  {filteredParts.map((p) => (
                    <div
                      key={p.id}
                      className="group flex items-center justify-between rounded-2xl border border-slate-200/90 bg-card p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-primary/60 transition-all dark:border-slate-700/90 dark:bg-slate-900 dark:hover:border-primary/60 dark:shadow-none ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="truncate text-xs font-bold text-foreground">{p.name}</p>
                          <span className="shrink-0 rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                            {p.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                          <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded border border-border/60">{p.sku}</span>
                          <span>·</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold border",
                              p.stock <= p.minStock
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400"
                                : "bg-muted/40 text-muted-foreground border-border/40"
                            )}
                          >
                            Stok: {p.stock} (min {p.minStock})
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-bold text-primary dark:text-blue-400">
                            {formatRupiah(p.price)}
                          </span>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPart(p)}
                            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-background text-muted-foreground hover:bg-accent hover:text-foreground dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-all shadow-2xs active:scale-95"
                            title="Edit Part"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirmModal({
                                title: "Hapus Item Katalog?",
                                description: `Apakah Anda yakin ingin menghapus item "${p.name}" (${p.sku}) dari katalog?`,
                                confirmText: "Hapus Item",
                                cancelText: "Batal",
                                variant: "destructive",
                                icon: "trash",
                              })
                              if (ok) {
                                deletePart(p.id)
                                toast.success("Item Dihapus", `Item "${p.name}" telah dihapus dari katalog.`)
                              }
                            }}
                            className="flex size-8 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:border-destructive/30 dark:bg-destructive/20 transition-all shadow-2xs active:scale-95"
                            title="Hapus Part"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredParts.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border bg-card/60 py-8 text-center text-xs text-muted-foreground">
                      Tidak ada suku cadang/bahan yang cocok.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: TIM MEKANIK ================= */}
        {activeTab === "mekanik" && (
          <div className="space-y-3.5">
            {/* Header Info Banner */}
            {!isTipDismissed("settings_mechanic_info") && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 flex items-start justify-between gap-2 animate-in fade-in duration-200 shadow-xs">
                <div className="flex items-start gap-2.5 flex-1">
                  <Users className="size-4 shrink-0 mt-0.5 text-primary dark:text-blue-400" />
                  <div className="space-y-1">
                    <p className="font-bold text-blue-900 dark:text-blue-200">
                      Manajemen Tim &amp; Teknisi Bengkel
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Teknisi yang ditambahkan di sini akan langsung terhubung ke <strong>penugasan order pengerjaan</strong>, dropdown pembuatan order baru, dan perhitungan efisiensi bulanan.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dismissTip("settings_mechanic_info")
                    toast.info("Info Ditutup", "Tips info mekanik tidak akan ditampilkan lagi.")
                  }}
                  className="shrink-0 rounded-lg p-1 text-blue-700/60 hover:bg-blue-500/20 hover:text-blue-950 dark:text-blue-300/60 dark:hover:bg-blue-900/40 dark:hover:text-blue-100 transition-colors"
                  title="Tutup & jangan tampilkan lagi"
                  aria-label="Tutup info"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-200/80 bg-card p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Tim</p>
                <p className="text-base font-bold text-foreground mt-0.5">{technicians.length} <span className="text-[11px] font-normal text-muted-foreground">Orang</span></p>
              </div>
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3 shadow-xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <p className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Status Aktif</p>
                <p className="text-base font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {technicians.filter((t) => t.status === "Aktif" || !t.status).length} <span className="text-[11px] font-normal opacity-80">Mekanik</span>
                </p>
              </div>
              <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-3 shadow-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                <p className="text-[10px] font-medium text-primary dark:text-blue-400 uppercase tracking-wider">Efisiensi Rata</p>
                <p className="text-base font-bold text-primary dark:text-blue-300 mt-0.5">
                  {Math.round(technicians.reduce((s, t) => s + (t.efficiency || 85), 0) / (technicians.length || 1))}%
                </p>
              </div>
            </div>

            {/* Technicians List */}
            <div className="space-y-2.5">
              {filteredTechnicians.map((t) => {
                const status = t.status || "Aktif"
                return (
                  <div
                    key={t.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-primary/50 transition-all dark:border-slate-800 dark:bg-slate-900 ring-1 ring-black/[0.03] dark:ring-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-11 border-2 border-primary/20 shadow-xs">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {t.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-foreground truncate">{t.name}</h4>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-semibold border",
                                status === "Aktif"
                                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-300"
                                  : status === "Istirahat"
                                  ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:bg-rose-950 dark:text-rose-300"
                              )}
                            >
                              {status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                            <Wrench className="size-3 text-primary shrink-0" />
                            <span>{t.specialty || "Mekanik Umum & Servis"}</span>
                          </p>
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTech(t)}
                            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 bg-background text-muted-foreground hover:bg-accent hover:text-foreground dark:border-slate-700 dark:bg-slate-800 transition-colors shadow-2xs active:scale-95"
                            title="Edit Data Mekanik"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTech(t)}
                            className="flex size-8 items-center justify-center rounded-xl border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:border-destructive/30 dark:bg-destructive/20 transition-colors shadow-2xs active:scale-95"
                            title="Hapus Mekanik"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer strip: Phone & Stats */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/70 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {t.phone ? (
                          <a
                            href={`https://wa.me/${t.phone.replace(/[^0-9]/g, "").replace(/^0/, "62")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="size-3" />
                            <span>{t.phone}</span>
                          </a>
                        ) : (
                          <span className="italic opacity-60">Tanpa Kontak</span>
                        )}
                        <span>•</span>
                        <span>{t.completedThisMonth || 0} order bulan ini</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">Efisiensi:</span>
                        <span className="font-bold text-primary dark:text-blue-400">{t.efficiency || 85}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredTechnicians.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 py-10 text-center space-y-2">
                  <Users className="size-8 mx-auto text-muted-foreground/50" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Tidak ada teknisi/mekanik yang cocok dengan pencarian.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: VOUCHER & PROMO ================= */}
        {activeTab === "voucher" && (
          <div className="space-y-3.5">
            {/* Header Promo Banner */}
            {!isTipDismissed("settings_voucher_info") && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 flex items-start justify-between gap-2 animate-in fade-in duration-200 shadow-xs">
                <div className="flex items-start gap-2.5 flex-1">
                  <Ticket className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      Manajemen Kode Voucher &amp; Promo Diskon
                    </p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Voucher yang dibuat di sini dapat langsung diterapkan di <strong>menu Invoice / Kasir</strong> saat pelanggan melakukan pembayaran. Anda dapat mengatur potongan harga (Rp / %), masa berlaku (expired), dan minimal belanja.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dismissTip("settings_voucher_info")
                    toast.info("Info Ditutup", "Tips voucher ini tidak akan ditampilkan lagi.")
                  }}
                  className="shrink-0 rounded-lg p-1 text-emerald-700/60 hover:bg-emerald-500/20 hover:text-emerald-950 dark:text-emerald-300/60 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-100 transition-colors"
                  title="Tutup & jangan tampilkan lagi"
                  aria-label="Tutup info"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Voucher List */}
            <div className="space-y-2.5">
              {filteredVouchers.map((v) => {
                const today = new Date().toISOString().split("T")[0]
                const isExpired = v.validUntil < today
                return (
                  <div
                    key={v.id}
                    className={cn(
                      "flex flex-col gap-2.5 rounded-2xl border p-4 transition-all bg-card dark:bg-slate-900 ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
                      isExpired
                        ? "border-destructive/40 bg-destructive/5 opacity-80"
                        : v.isActive
                        ? "border-emerald-500/40 shadow-[0_2px_8px_rgba(16,185,129,0.08)] hover:border-emerald-500/70 hover:shadow-md dark:border-emerald-500/40"
                        : "border-slate-200/90 opacity-60 bg-muted/20 dark:border-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30">
                          {v.code}
                        </span>
                        {v.targetService && v.targetService !== "Semua Layanan" ? (
                          <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            Khusus: {v.targetService}
                          </span>
                        ) : (
                          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Semua Layanan (Umum)
                          </span>
                        )}
                        {isExpired ? (
                          <span className="rounded-md bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive border border-destructive/25">
                            Kadaluarsa
                          </span>
                        ) : v.isActive ? (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                            Aktif
                          </span>
                        ) : (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border">
                            Nonaktif
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      {canEdit && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggleVoucherStatus(v.id)}
                            className={cn(
                              "rounded-lg px-2.5 py-1 text-[10px] font-semibold border transition-all",
                              v.isActive
                                ? "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                                : "border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {v.isActive ? "Aktif" : "Mati"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditVoucher(v)}
                            className="flex size-7.5 items-center justify-center rounded-lg border border-slate-200 bg-background text-muted-foreground hover:bg-accent hover:text-foreground dark:border-slate-700 dark:bg-slate-800 transition-colors"
                            title="Edit Voucher"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await confirmModal({
                                title: "Hapus Voucher Promo?",
                                description: `Apakah Anda yakin ingin menghapus voucher promo ${v.code} (${v.title})? Kode ini tidak dapat digunakan lagi.`,
                                confirmText: "Hapus Voucher",
                                cancelText: "Batal",
                                variant: "destructive",
                                icon: "trash",
                              })
                              if (ok) {
                                deleteVoucher(v.id)
                                toast.info("Voucher Dihapus", `Kode ${v.code} telah dihapus.`)
                              }
                            }}
                            className="flex size-7.5 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20 dark:border-destructive/30 dark:bg-destructive/20 transition-colors"
                            title="Hapus Voucher"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">{v.title}</p>
                      {v.description && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{v.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/70 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                        <Tag className="size-3.5" />
                        <span>
                          {v.type === "fixed"
                            ? `Potongan ${formatRupiah(v.value)}`
                            : `Diskon ${v.value}%${v.maxDiscount ? ` (Maks. ${formatRupiah(v.maxDiscount)})` : ""}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Min. Belanja:</span>
                        <span className="font-medium text-foreground">
                          {v.minPurchase > 0 ? formatRupiah(v.minPurchase) : "Tanpa Minimal"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        <span>Berlaku s/d:</span>
                        <span className="font-medium text-foreground">{v.validUntil}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredVouchers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border bg-card/60 py-8 text-center text-xs text-muted-foreground">
                  Tidak ada voucher promo yang ditemukan.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: INTEGRASI MIDTRANS GATEWAY ================= */}
        {activeTab === "midtrans" && (
          <div className="space-y-4">
            {/* Status & Banner */}
            <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-4 space-y-2 dark:border-blue-500/30 dark:bg-blue-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                    M
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Midtrans Payment Gateway</h3>
                    <p className="text-[10px] text-muted-foreground">GoTo Financial • QRIS Dinamis, Virtual Account, &amp; Kartu</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                    localMidtrans.enabled
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  {localMidtrans.enabled ? (localMidtrans.environment === "production" ? "● Mode Live" : "● Mode Sandbox") : "Nonaktif"}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Sistem pembayaran resmi Indonesia untuk kasir bengkel &amp; link invoice WhatsApp. Mendukung QRIS (GoPay, OVO, Dana, BCA, dll) dan Virtual Account (BCA, Mandiri, BRI, BNI, Permata).
              </p>
            </div>

            {/* Pengaturan Kredensial */}
            <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="text-xs font-bold text-foreground">Kredensial Gateway</span>
                <a
                  href={localMidtrans.environment === "production" ? "https://dashboard.midtrans.com" : "https://dashboard.sandbox.midtrans.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <span>Buka Dashboard Midtrans</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>

              {/* Environment selector */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Lingkungan Sistem (Environment)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalMidtrans({ ...localMidtrans, environment: "sandbox" })}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all",
                      localMidtrans.environment === "sandbox"
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold shadow-xs dark:text-blue-400"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs">Sandbox (Testing)</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-normal">Mode uji coba simulasi bayar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalMidtrans({ ...localMidtrans, environment: "production" })}
                    className={cn(
                      "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all",
                      localMidtrans.environment === "production"
                        ? "border-emerald-600 bg-emerald-500/10 text-emerald-600 font-bold shadow-xs dark:text-emerald-400"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className="text-xs">Production (Live)</span>
                    <span className="text-[10px] opacity-75 font-normal">Transaksi uang nyata</span>
                  </button>
                </div>
                {localMidtrans.environment === "sandbox" && (
                  <div className="mt-2 rounded-xl border border-blue-500/25 bg-blue-500/10 p-2.5 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                    <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-semibold text-blue-800 dark:text-blue-300">Mode Sandbox Aktif (Aman untuk Uji Coba)</p>
                      <p className="opacity-90 leading-tight">
                        Semua transaksi QRIS &amp; Virtual Account berjalan di simulator Midtrans tanpa memotong saldo nyata. Anda dapat menguji bayar langsung di kasir atau membuka{" "}
                        <a
                          href="https://simulator.sandbox.midtrans.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline text-blue-700 dark:text-blue-300 hover:text-blue-900 inline-flex items-center gap-0.5"
                        >
                          <span>Midtrans Simulator</span>
                          <ExternalLink className="size-2.5 inline" />
                        </a>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Client Key */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Midtrans Client Key <span className="text-[10px] text-muted-foreground">(Untuk Popup Snap &amp; QRIS)</span>
                </label>
                <div className="relative">
                  <input
                    type={showMidtransKey ? "text" : "password"}
                    value={localMidtrans.clientKey}
                    onChange={(e) => setLocalMidtrans({ ...localMidtrans, clientKey: e.target.value })}
                    placeholder="mis. SB-Mid-client-xxxx atau Mid-client-xxxx"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none dark:border-slate-700 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMidtransKey(!showMidtransKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showMidtransKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Didapatkan dari menu <em>Settings &gt; Access Keys &gt; Client Key</em> di Dashboard Midtrans Anda.
                </p>
              </div>

              {/* Server Key */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Midtrans Server Key <span className="text-[10px] text-muted-foreground">(Untuk API QRIS Otomatis &amp; Simulator)</span>
                </label>
                <div className="relative">
                  <input
                    type={showMidtransServerKey ? "text" : "password"}
                    value={localMidtrans.serverKey || ""}
                    onChange={(e) => setLocalMidtrans({ ...localMidtrans, serverKey: e.target.value })}
                    placeholder="mis. SB-Mid-server-xxxx atau Mid-server-xxxx"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none dark:border-slate-700 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMidtransServerKey(!showMidtransServerKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showMidtransServerKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Didapatkan dari menu <em>Settings &gt; Access Keys &gt; Server Key</em> di Dashboard Midtrans Anda.
                </p>
              </div>

              {/* Merchant ID */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Merchant ID (Opsional)</label>
                <input
                  type="text"
                  value={localMidtrans.merchantId || ""}
                  onChange={(e) => setLocalMidtrans({ ...localMidtrans, merchantId: e.target.value })}
                  placeholder="mis. G123456789"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>
            </div>

            {/* Pengaturan Biaya Admin (Surcharge) */}
            <div className="rounded-2xl border border-border bg-card p-3.5 space-y-3 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <div>
                  <span className="text-xs font-bold text-foreground">Bebankan Biaya Admin ke Pelanggan</span>
                  <p className="text-[10px] text-muted-foreground">Menambahkan biaya penanganan otomatis pada nota invoice</p>
                </div>
                <input
                  type="checkbox"
                  checked={localMidtrans.chargeAdminFeeToCustomer}
                  onChange={(e) => setLocalMidtrans({ ...localMidtrans, chargeAdminFeeToCustomer: e.target.checked })}
                  className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {localMidtrans.chargeAdminFeeToCustomer && (
                <div className="space-y-3 animate-in fade-in duration-150 pt-1">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Biaya Admin Virtual Account (Bank Transfer)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">Rp</span>
                      <input
                        type="number"
                        value={localMidtrans.vaAdminFee}
                        onChange={(e) => setLocalMidtrans({ ...localMidtrans, vaAdminFee: Number(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-semibold focus:border-primary focus:outline-none dark:border-slate-700"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Standar Midtrans adalah flat Rp 4.000 / transaksi VA. Uang ini ditagihkan ke pelanggan agar bengkel terima utuh.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Biaya Layanan QRIS (Nominal Flat / Default Otomatis 0,7%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">Rp</span>
                      <input
                        type="number"
                        value={localMidtrans.qrisAdminFee}
                        onChange={(e) => setLocalMidtrans({ ...localMidtrans, qrisAdminFee: Number(e.target.value) || 0 })}
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs font-semibold focus:border-primary focus:outline-none dark:border-slate-700"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Jika diisi 0 (default), sistem otomatis menambahkan MDR standar Midtrans 0,7% ke total bayar pelanggan. Atau isi angka nominal flat (misal Rp 1.500) jika ingin biaya tetap.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Simpan Button */}
            {canEdit && (
              <Button
                type="button"
                onClick={() => {
                  updateMidtransConfig(localMidtrans)
                  toast.success("Pengaturan Midtrans Tersimpan", "Konfigurasi payment gateway berhasil diperbarui.")
                }}
                className="w-full gap-2 rounded-xl py-2.5 text-xs font-semibold shadow-sm"
              >
                <Check className="size-4" />
                <span>Simpan Pengaturan Midtrans</span>
              </Button>
            )}
          </div>
        )}

        {/* ================= TAB 3: TEMA & TAMPILAN ================= */}
        {activeTab === "tema" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-2">
                Pilih Mode Tema Aplikasi
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-all",
                    theme === "light"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs dark:bg-primary/25 dark:border-primary dark:text-blue-300"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40 dark:border-slate-700/80 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <Sun className="size-4.5" />
                  </div>
                  <span className="text-xs">Terang</span>
                  {theme === "light" && <Check className="size-3 text-primary dark:text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-all",
                    theme === "dark"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs dark:bg-primary/25 dark:border-primary dark:text-blue-300"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40 dark:border-slate-700/80 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-slate-800 text-blue-400 dark:bg-blue-950/80 dark:text-blue-300 border border-slate-700">
                    <Moon className="size-4.5" />
                  </div>
                  <span className="text-xs">Gelap</span>
                  {theme === "dark" && <Check className="size-3 text-primary dark:text-blue-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleThemeChange("system")}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-center transition-all",
                    theme === "system"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs dark:bg-primary/25 dark:border-primary dark:text-blue-300"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40 dark:border-slate-700/80 dark:bg-slate-900/50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  )}
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground dark:bg-slate-800 dark:text-slate-300 border border-border dark:border-slate-700">
                    <Laptop className="size-4.5" />
                  </div>
                  <span className="text-xs">Sistem</span>
                  {theme === "system" && <Check className="size-3 text-primary dark:text-blue-400" />}
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  Status tema saat ini:{" "}
                  <strong className="text-foreground">
                    {theme === "system"
                      ? "Otomatis Mengikuti Sistem Perangkat"
                      : theme === "dark"
                      ? "Mode Gelap (Dark)"
                      : "Mode Terang (Light)"}
                  </strong>
                </p>
                <p className="mt-0.5 text-[11px] opacity-80">
                  {theme === "system"
                    ? "Tampilan otomatis menyesuaikan mode terang / gelap pada pengaturan HP, tablet, atau laptop Anda."
                    : "Pilihan tema ini disimpan secara permanen di perangkat ini."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROFIL BENGKEL ================= */}
        {activeTab === "profil" && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {!isTipDismissed("settings_profile_info") && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 flex items-start justify-between gap-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2 flex-1">
                  <Store className="size-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <p className="leading-relaxed">
                    Informasi di bawah ini otomatis menjadi <strong>kop utama dan catatan kaki pada struk cetak kasir thermal</strong> serta identitas resmi bengkel Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    dismissTip("settings_profile_info")
                    toast.info("Info Ditutup", "Tips kop struk ini tidak akan ditampilkan lagi.")
                  }}
                  className="shrink-0 rounded-lg p-1 text-blue-700/60 hover:bg-blue-500/20 hover:text-blue-950 dark:text-blue-300/60 dark:hover:bg-blue-900/40 dark:hover:text-blue-100 transition-colors"
                  title="Tutup & jangan tampilkan lagi"
                  aria-label="Tutup info"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Bagian 1: Kop Header Struk & Identitas */}
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-1.5 border-b border-border/70 pb-2 text-xs font-semibold text-foreground dark:border-slate-800">
                <Store className="size-3.5 text-primary" />
                <span>Kop Header Struk &amp; Identitas Bengkel</span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nama Bengkel <span className="text-[10px] text-primary font-bold">(Header Utama Struk)</span>
                </label>
                <input
                  type="text"
                  value={workshopProfile.name}
                  onChange={(e) => setWorkshopProfile({ ...workshopProfile, name: e.target.value })}
                  placeholder="Contoh: MOTOCRAFT STUDIO & GARAGE"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wide focus:border-primary focus:outline-none dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Slogan / Keterangan Layanan <span className="text-[10px] text-muted-foreground">(Baris 2 Struk)</span>
                </label>
                <textarea
                  rows={2}
                  value={workshopProfile.slogan}
                  onChange={(e) => setWorkshopProfile({ ...workshopProfile, slogan: e.target.value })}
                  placeholder="Precision Motorcycle Workshop · Vapor Blasting · Custom Builder"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    No. Telp / WhatsApp Struk
                  </label>
                  <input
                    type="text"
                    value={workshopProfile.phone}
                    onChange={(e) => setWorkshopProfile({ ...workshopProfile, phone: e.target.value })}
                    placeholder="0812-8888-9102"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Penanggung Jawab (Owner)
                  </label>
                  <input
                    type="text"
                    value={workshopProfile.owner}
                    onChange={(e) => setWorkshopProfile({ ...workshopProfile, owner: e.target.value })}
                    placeholder="Rian Maulana (RM)"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Alamat Bengkel <span className="text-[10px] text-muted-foreground">(Tercetak di Struk)</span>
                </label>
                <input
                  type="text"
                  value={workshopProfile.address}
                  onChange={(e) => setWorkshopProfile({ ...workshopProfile, address: e.target.value })}
                  placeholder="Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Jam Operasional</label>
                <input
                  type="text"
                  value={workshopProfile.hours}
                  onChange={(e) => setWorkshopProfile({ ...workshopProfile, hours: e.target.value })}
                  placeholder="08:00 - 17:00 WIB (Senin - Sabtu)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>
            </div>

            {/* Bagian 2: Catatan Kaki Struk Thermal */}
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="flex items-center gap-1.5 border-b border-border/70 pb-2 text-xs font-semibold text-foreground dark:border-slate-800">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Catatan Kaki &amp; Footer Struk Thermal</span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Klausul Garansi / Ketentuan Layanan
                </label>
                <input
                  type="text"
                  value={workshopProfile.receiptWarranty || ""}
                  onChange={(e) => setWorkshopProfile({ ...workshopProfile, receiptWarranty: e.target.value })}
                  placeholder="Garansi Servis & Blasting 14 Hari"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Laman Online
                  </label>
                  <input
                    type="text"
                    value={workshopProfile.receiptWebsite || ""}
                    onChange={(e) => setWorkshopProfile({ ...workshopProfile, receiptWebsite: e.target.value })}
                    placeholder="Contoh: gtagarage.com atau IG: @gtagarage"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Pesan Penutup Struk
                  </label>
                  <input
                    type="text"
                    value={workshopProfile.receiptFooterMsg || ""}
                    onChange={(e) => setWorkshopProfile({ ...workshopProfile, receiptFooterMsg: e.target.value })}
                    placeholder="*** TERIMA KASIH ***"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none dark:border-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Bagian 3: Pratinjau Mini Struk (Live Thermal Preview) */}
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-3.5 space-y-2 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Pratinjau Live Struk Kasir
                </span>
                <span className="text-[10px] text-primary font-medium">Kertas 58/80mm</span>
              </div>
              <div className="rounded-xl border border-border/80 bg-white p-3 font-mono text-[10.5px] text-slate-800 shadow-xs dark:bg-slate-950 dark:text-slate-200 dark:border-slate-800">
                <div className="text-center space-y-0.5">
                  <p className="font-bold text-xs uppercase tracking-wide text-slate-900 dark:text-white">
                    {workshopProfile.name || "NAMA BENGKEL"}
                  </p>
                  <p className="text-[9.5px] text-slate-600 dark:text-slate-400 whitespace-pre-line leading-tight">
                    {workshopProfile.slogan || "Slogan Layanan Bengkel"}
                  </p>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400">
                    {workshopProfile.address || "Alamat Bengkel"}
                  </p>
                  <p className="text-[9px] text-slate-600 dark:text-slate-400">
                    Telp: {workshopProfile.phone || "-"}
                  </p>
                </div>
                <div className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700" />
                <div className="flex justify-between text-[9.5px] text-slate-500">
                  <span>No: INV/2026/09/0142</span>
                  <span>19.06</span>
                </div>
                <div className="my-2 border-b border-dashed border-slate-300 dark:border-slate-700" />
                <div className="text-center text-[9px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  <p>{workshopProfile.receiptWarranty || "Garansi Servis & Blasting 14 Hari"}</p>
                  {workshopProfile.receiptWebsite && <p>{workshopProfile.receiptWebsite}</p>}
                  <p className="font-bold pt-1 text-slate-900 dark:text-white">
                    {workshopProfile.receiptFooterMsg || "*** TERIMA KASIH ***"}
                  </p>
                </div>
              </div>
            </div>

            {canEdit ? (
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-3 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-98"
              >
                {profileSaved ? (
                  <>
                    <Check className="size-4" />
                    <span>Profil &amp; Format Struk Berhasil Disimpan!</span>
                  </>
                ) : (
                  <span>Simpan Informasi Bengkel &amp; Format Struk</span>
                )}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20">
                <Eye className="size-4 shrink-0" />
                <span>Mode Mekanik: Hanya dapat melihat data profil bengkel (Akses Baca Saja)</span>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Sticky Bottom Footer */}
      <div className="shrink-0 bg-card border-t border-border px-4 py-2.5 flex items-center justify-between text-[0.7rem] text-muted-foreground flex-wrap gap-2 shadow-xs">
        <span className="font-semibold text-foreground/80">GTA GARAGE POS v2.4 (PWA Ready)</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              resetDismissedTips()
              toast.success("Tips Bantuan Dipulihkan", "Kotak panduan info kini kembali ditampilkan.")
            }}
            className="text-muted-foreground hover:text-foreground hover:underline"
            title="Tampilkan kembali semua kotak info & tips bantuan yang pernah ditutup"
          >
            Pulihkan Tips Info
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleResetDemo}
              className="flex items-center gap-1 text-destructive/80 hover:text-destructive hover:underline"
            >
              <RotateCcw className="size-3" />
              <span>Reset Data Demo</span>
            </button>
          )}
        </div>
      </div>

        {/* ================= MODAL SUB-FORM: TAMBAH/EDIT LAYANAN VAPOR/JASA ================= */}
        {serviceFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 dark:border-slate-700/80 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  {editingServiceId ? "Edit Tarif Layanan" : "Tambah Tarif Layanan Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setServiceFormOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Layanan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Vapor Blasting Blok Ninja 250"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Kategori</label>
                    <select
                      value={serviceForm.category}
                      onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as ServiceType })}
                      className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    >
                      <option value="Vapor Blasting">Vapor Blasting</option>
                      <option value="Sand Blasting">Sand Blasting</option>
                      <option value="Servis">Servis</option>
                      <option value="Kustomisasi">Kustomisasi</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Tarif Biaya (Rp)</label>
                    <input
                      type="number"
                      placeholder="250000"
                      min={0}
                      step={5000}
                      value={serviceForm.price || ""}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Keterangan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Termasuk pembersihan kerak luar dalam"
                    value={serviceForm.description || ""}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setServiceFormOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL SUB-FORM: TAMBAH/EDIT SUKU CADANG / BAHAN ================= */}
        {partFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 dark:border-slate-700/80 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">
                  {editingPartId ? "Edit Part / Bahan" : "Tambah Part / Bahan Baru"}
                </h3>
                <button
                  type="button"
                  onClick={() => setPartFormOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSavePart} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Barang / Bahan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Media Pasir Silika 25kg"
                    value={partForm.name}
                    onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Kategori</label>
                    <input
                      type="text"
                      list="settings-part-category-suggestions"
                      placeholder="Blasting / Pelumas / Rem"
                      value={partForm.category}
                      onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      required
                    />
                    <datalist id="settings-part-category-suggestions">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      placeholder="150000"
                      min={0}
                      value={partForm.price || ""}
                      onChange={(e) => setPartForm({ ...partForm, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Stok Awal</label>
                    <input
                      type="number"
                      min={0}
                      value={partForm.stock}
                      onChange={(e) => setPartForm({ ...partForm, stock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Batas Minimum</label>
                    <input
                      type="number"
                      min={1}
                      value={partForm.minStock}
                      onChange={(e) => setPartForm({ ...partForm, minStock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPartFormOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    Simpan ke List
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL SUB-FORM: TAMBAH/EDIT VOUCHER ================= */}
        {voucherFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 dark:border-slate-700/80 dark:bg-slate-900 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="size-4 text-emerald-600" />
                  <h3 className="text-sm font-bold">
                    {editingVoucherId ? "Edit Voucher Promo" : "Buat Voucher Promo Baru"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVoucherFormOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-accent"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveVoucher} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Kode Voucher <span className="text-[10px] text-primary font-bold">(Otomatis Huruf Besar)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: VAPOR25K atau MERDEKA10"
                    value={voucherForm.code}
                    onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nama / Judul Promo
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Promo Spesial Vapor Blasting Mesin"
                    value={voucherForm.title}
                    onChange={(e) => setVoucherForm({ ...voucherForm, title: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipe Diskon</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVoucherForm({ ...voucherForm, type: "fixed" })}
                      className={cn(
                        "rounded-xl border py-2 text-xs font-semibold transition-all",
                        voucherForm.type === "fixed"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Nominal Tetap (Rp)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherForm({ ...voucherForm, type: "percent" })}
                      className={cn(
                        "rounded-xl border py-2 text-xs font-semibold transition-all",
                        voucherForm.type === "percent"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      Persentase (%)
                    </button>
                  </div>
                </div>

                {/* Target Layanan Pengerjaan */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Target Layanan Pengerjaan
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {(["Semua Layanan", "Servis", "Vapor Blasting", "Sand Blasting", "Kustomisasi"] as VoucherTargetService[]).map((srv) => (
                      <button
                        key={srv}
                        type="button"
                        onClick={() => setVoucherForm({ ...voucherForm, targetService: srv })}
                        className={cn(
                          "rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-all text-left truncate",
                          voucherForm.targetService === srv
                            ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-600/50"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {srv === "Semua Layanan" ? "🌐 Semua Layanan (Umum)" : `🎯 ${srv}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {voucherForm.targetService === "Semua Layanan"
                      ? "Voucher umum: dapat digunakan untuk seluruh invoice layanan (misal: promo ojol, member, atau hari raya)."
                      : `Voucher khusus: HANYA akan muncul dan berlaku pada invoice dengan layanan ${voucherForm.targetService}.`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {voucherForm.type === "fixed" ? "Potongan Harga (Rp)" : "Diskon (%)"}
                    </label>
                    <input
                      type="number"
                      placeholder={voucherForm.type === "fixed" ? "25000" : "10"}
                      min={1}
                      value={voucherForm.value || ""}
                      onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      required
                    />
                  </div>

                  {voucherForm.type === "percent" ? (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Maks. Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        placeholder="50000"
                        min={0}
                        value={voucherForm.maxDiscount || ""}
                        onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Min. Transaksi (Rp)
                      </label>
                      <input
                        type="number"
                        placeholder="0 (Tanpa Min)"
                        min={0}
                        value={voucherForm.minPurchase || ""}
                        onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {voucherForm.type === "percent" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Min. Transaksi (Rp)
                    </label>
                    <input
                      type="number"
                      placeholder="0 (Tanpa Min)"
                      min={0}
                      value={voucherForm.minPurchase || ""}
                      onChange={(e) => setVoucherForm({ ...voucherForm, minPurchase: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Berlaku Sampai Tanggal
                  </label>
                  <input
                    type="date"
                    value={voucherForm.validUntil}
                    onChange={(e) => setVoucherForm({ ...voucherForm, validUntil: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Keterangan Singkat (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Khusus pengerjaan vapor blasting & restorasi"
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm({ ...voucherForm, description: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setVoucherFormOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                  >
                    Simpan Voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= MODAL: FORM TAMBAH / EDIT MEKANIK ================= */}
        {techFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {editingTechId ? "Edit Data Mekanik" : "Tambah Mekanik Baru"}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Tim operasional &amp; servis GTA Garage</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTechFormOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTech} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nama Lengkap Mekanik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rian Hidayat"
                    value={techForm.name}
                    onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Spesialisasi / Keahlian
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Spesialis Vapor Blasting & Karburator"
                    value={techForm.specialty || ""}
                    onChange={(e) => setTechForm({ ...techForm, specialty: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    No. WhatsApp / Telepon (Opsional)
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 0812-3456-7890"
                    value={techForm.phone || ""}
                    onChange={(e) => setTechForm({ ...techForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Status Kerja Mekanik
                  </label>
                  <select
                    value={techForm.status || "Aktif"}
                    onChange={(e) => setTechForm({ ...techForm, status: e.target.value as "Aktif" | "Istirahat" | "Cuti" })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none"
                  >
                    <option value="Aktif">Aktif (Siap Menerima Order)</option>
                    <option value="Istirahat">Istirahat / Shift Sore</option>
                    <option value="Cuti">Cuti / Libur</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTechFormOpen(false)}
                    className="flex-1 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                  >
                    {editingTechId ? "Simpan Perubahan" : "Tambah Mekanik"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

    </BottomSheet>
  )
}
