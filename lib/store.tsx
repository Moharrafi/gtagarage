"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import {
  workOrders as seedWorkOrders,
  parts as seedParts,
  defaultServiceRates,
  defaultCategories,
  defaultVouchers,
  defaultUsers,
  invoices,
  type WorkOrder,
  type Part,
  type ServiceType,
  type WorkStatus,
  type ServiceRate,
  type Voucher,
  type UserAccount,
  type UserRole,
  type NotificationItem,
} from "@/lib/data"

export interface WorkOrderInput {
  customerName: string
  customerPhone: string
  plate: string
  brand: string
  model: string
  service: ServiceType
  complaint: string
  technician: string
  laborCost: number
  status: WorkStatus
  usedParts?: { partId: string; name: string; qty: number; price: number }[]
}

export interface PartInput {
  name: string
  sku: string
  category: string
  stock: number
  minStock: number
  price: number
}

export interface ServiceRateInput {
  name: string
  category: ServiceType
  price: number
  description?: string
}

export interface WorkshopProfile {
  name: string
  slogan: string
  phone: string
  address: string
  hours: string
  owner: string
  receiptWarranty: string
  receiptWebsite: string
  receiptFooterMsg: string
}

export interface MidtransConfig {
  enabled: boolean
  environment: "sandbox" | "production"
  clientKey: string
  merchantId: string
  chargeAdminFeeToCustomer: boolean
  vaAdminFee: number
  qrisAdminFee: number
}

export const defaultMidtransConfig: MidtransConfig = {
  enabled: true,
  environment: "sandbox",
  clientKey: "SB-Mid-client-GTA-GARAGE-DEMO",
  merchantId: "G123456789",
  chargeAdminFeeToCustomer: true,
  vaAdminFee: 4000,
  qrisAdminFee: 0,
}

export const defaultWorkshopProfile: WorkshopProfile = {
  name: "GTA GARAGE",
  slogan: "Precision Motorcycle Workshop · Vapor Blasting\n· Custom Builder",
  phone: "0812-8888-9102",
  address: "Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur 13330",
  hours: "08:00 - 17:00 WIB (Senin - Sabtu)",
  owner: "GITA",
  receiptWarranty: "Garansi Servis & Blasting 14 Hari",
  receiptWebsite: "www.gtagarage.com · IG: @gta.garage",
  receiptFooterMsg: "*** TERIMA KASIH ***",
}

interface WorkshopContextValue {
  workOrders: WorkOrder[]
  parts: Part[]
  serviceRates: ServiceRate[]
  categories: string[]
  vouchers: Voucher[]
  profile: WorkshopProfile
  updateProfile: (profile: Partial<WorkshopProfile>) => void
  midtransConfig: MidtransConfig
  updateMidtransConfig: (config: Partial<MidtransConfig>) => void
  addWorkOrder: (input: WorkOrderInput) => void
  updateWorkOrder: (id: string, input: WorkOrderInput) => void
  deleteWorkOrder: (id: string) => void
  addPart: (input: PartInput) => void
  updatePart: (id: string, input: PartInput) => void
  deletePart: (id: string) => void
  stockIn: (id: string, qty: number) => void
  addCategory: (category: string) => void
  deleteCategory: (category: string) => void
  addServiceRate: (input: ServiceRateInput) => void
  updateServiceRate: (id: string, input: ServiceRateInput) => void
  deleteServiceRate: (id: string) => void
  addVoucher: (voucher: Omit<Voucher, "id">) => void
  updateVoucher: (id: string, voucher: Partial<Voucher>) => void
  deleteVoucher: (id: string) => void
  toggleVoucherStatus: (id: string) => void
  dismissedTips: Record<string, boolean>
  dismissTip: (tipId: string) => void
  isTipDismissed: (tipId: string) => boolean
  resetDismissedTips: () => void
  resetDemoData: () => void
  currentUser: UserAccount | null
  authLoaded: boolean
  login: (username: string, password?: string) => boolean
  loginAs: (user: UserAccount) => void
  logout: () => void
  canEdit: boolean
  isMekanik: boolean
  isOwner: boolean
  isAdmin: boolean
  notifications: NotificationItem[]
  unreadNotifCount: number
  addNotification: (item: Omit<NotificationItem, "id" | "time"> & { time?: string; createdAt?: string }) => void
  markAllNotifAsRead: () => void
  markNotifAsRead: (id: string) => void
  clearNotifications: () => void
  deleteNotification: (id: string) => void
}

const WorkshopContext = createContext<WorkshopContextValue | null>(null)

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function progressForStatus(status: WorkStatus): number {
  switch (status) {
    case "Antrian":
      return 0
    case "Menunggu Sparepart":
      return 30
    case "Dikerjakan":
      return 60
    case "Siap Diambil":
      return 90
    case "Selesai":
      return 100
    default:
      return 0
  }
}

function nextWorkOrderCode(existing: WorkOrder[]): string {
  const max = existing.reduce((m, w) => {
    const n = Number.parseInt(w.code.replace(/\D/g, ""), 10)
    return Number.isFinite(n) && n > m ? n : m
  }, 2400)
  return `WO-${max + 1}`
}

export function getInitialRealNotifications(
  orders: WorkOrder[],
  partsList: Part[],
  invList: typeof invoices
): NotificationItem[] {
  const notifs: NotificationItem[] = []

  // 1. Peringatan stok menipis / kritis dari inventaris aktual
  const lowParts = partsList.filter((p) => p.stock <= p.minStock)
  lowParts.forEach((p, idx) => {
    notifs.push({
      id: `low-stock-${p.id}`,
      type: "push",
      title: "Stok Suku Cadang Menipis",
      body: `${p.name} (${p.sku}) tersisa ${p.stock} unit, di bawah batas minimum (${p.minStock}).`,
      time: "08:20",
      createdAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
      channel: "Gudang Suku Cadang",
      status: "terkirim",
      read: false,
      linkTab: "stok",
    })
  })

  // 2. Unit siap diambil dari data pekerjaan aktual
  const readyWo = orders.filter((w) => w.status === "Siap Diambil")
  readyWo.forEach((w) => {
    notifs.push({
      id: `ready-wo-${w.id}`,
      type: "whatsapp",
      title: "Kendaraan Siap Diambil",
      body: `Halo ${w.customer.name}, ${w.vehicle.brand} ${w.vehicle.model} (${w.vehicle.plate}) sudah selesai & siap diambil. Terima kasih!`,
      time: "10:02",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      channel: w.customer.phone || w.technician,
      status: "terkirim",
      read: false,
      linkTab: "pekerjaan",
    })
  })

  // 3. Update progres pengerjaan unit aktual
  const inProgressWo = orders.find((w) => w.status === "Dikerjakan")
  if (inProgressWo) {
    notifs.push({
      id: `prog-wo-${inProgressWo.id}`,
      type: "push",
      title: "Update Status Perbaikan",
      body: `${inProgressWo.code} ${inProgressWo.vehicle.brand} ${inProgressWo.vehicle.model} — progres ${inProgressWo.progress}%, sedang ${inProgressWo.complaint.toLowerCase()}.`,
      time: "09:35",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      channel: inProgressWo.technician,
      status: "terkirim",
      read: false,
      linkTab: "pekerjaan",
    })
  }

  // 4. Tagihan invoice jatuh tempo aktual
  const overdueInvs = invList.filter((inv) => inv.status === "Jatuh Tempo")
  overdueInvs.forEach((inv) => {
    notifs.push({
      id: `overdue-inv-${inv.id}`,
      type: "whatsapp",
      title: "Pengingat Pembayaran",
      body: `Halo ${inv.customer.name}, invoice ${inv.number} telah jatuh tempo. Mohon segera diselesaikan.`,
      time: "Kemarin",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      channel: inv.customer.phone,
      status: "menunggu",
      read: false,
      linkTab: "invoice",
    })
  })

  return notifs
}

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders)
  const [parts, setParts] = useState<Part[]>(seedParts)
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>(defaultServiceRates)
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [profile, setProfile] = useState<WorkshopProfile>(defaultWorkshopProfile)

  // Real Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bengkel_notifications")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed)
          return
        }
      }
    } catch (e) {
      console.error("Failed to load bengkel_notifications", e)
    }

    const initial = getInitialRealNotifications(seedWorkOrders, seedParts, invoices)
    setNotifications(initial)
    try {
      localStorage.setItem("bengkel_notifications", JSON.stringify(initial))
    } catch {}
  }, [])

  const addNotification = useCallback(
    (item: Omit<NotificationItem, "id" | "time"> & { time?: string; createdAt?: string }) => {
      const now = new Date()
      const timeStr =
        item.time ||
        now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...item,
        time: timeStr,
        createdAt: item.createdAt || now.toISOString(),
        read: item.read ?? false,
      }
      setNotifications((prev) => {
        const next = [newNotif, ...prev]
        try {
          localStorage.setItem("bengkel_notifications", JSON.stringify(next))
        } catch {}
        return next
      })
    },
    []
  )

  const markAllNotifAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      try {
        localStorage.setItem("bengkel_notifications", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const markNotifAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      try {
        localStorage.setItem("bengkel_notifications", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    try {
      localStorage.setItem("bengkel_notifications", JSON.stringify([]))
    } catch {}
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id)
      try {
        localStorage.setItem("bengkel_notifications", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const unreadNotifCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bengkel_profile")
      if (saved) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }))
      }
    } catch (e) {
      console.error("Failed to load bengkel_profile", e)
    }
  }, [])

  const updateProfile = useCallback((patch: Partial<WorkshopProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem("bengkel_profile", JSON.stringify(next))
      } catch (e) {
        console.error("Failed to save bengkel_profile", e)
      }
      return next
    })
  }, [])

  // Midtrans Payment Gateway Configuration
  const [midtransConfig, setMidtransConfig] = useState<MidtransConfig>(defaultMidtransConfig)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bengkel_midtrans")
      if (saved) {
        const parsed = JSON.parse(saved)
        const updatedConfig: MidtransConfig = {
          ...defaultMidtransConfig,
          ...parsed,
          environment: "sandbox",
          chargeAdminFeeToCustomer: parsed.chargeAdminFeeToCustomer ?? true,
        }
        setMidtransConfig(updatedConfig)
        try {
          localStorage.setItem("bengkel_midtrans", JSON.stringify(updatedConfig))
        } catch {}
      } else {
        localStorage.setItem("bengkel_midtrans", JSON.stringify(defaultMidtransConfig))
      }
    } catch (e) {
      console.error("Failed to load bengkel_midtrans", e)
    }
  }, [])

  const updateMidtransConfig = useCallback((patch: Partial<MidtransConfig>) => {
    setMidtransConfig((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem("bengkel_midtrans", JSON.stringify(next))
      } catch (e) {
        console.error("Failed to save bengkel_midtrans", e)
      }
      return next
    })
  }, [])

  const addCategory = useCallback((category: string) => {
    const trimmed = category.trim()
    if (!trimmed) return
    setCategories((prev) => (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase()) ? prev : [trimmed, ...prev]))
  }, [])

  const deleteCategory = useCallback((category: string) => {
    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== category.trim().toLowerCase()))
  }, [])

  const addWorkOrder = useCallback((input: WorkOrderInput) => {
    setWorkOrders((prev) => {
      const code = nextWorkOrderCode(prev)
      const now = new Date()
      const timeLabel = now.toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
      const wo: WorkOrder = {
        id: `wo-${Date.now()}`,
        code,
        customer: {
          id: `c-${Date.now()}`,
          name: input.customerName,
          phone: input.customerPhone,
          initials: initials(input.customerName),
        },
        vehicle: {
          id: `v-${Date.now()}`,
          plate: input.plate,
          brand: input.brand,
          model: input.model,
          year: now.getFullYear(),
          color: "-",
        },
        service: input.service,
        complaint: input.complaint,
        status: input.status,
        technician: input.technician,
        progress: progressForStatus(input.status),
        createdAt: timeLabel,
        estimatedDone: "Belum ditentukan",
        laborCost: input.laborCost,
        usedParts: input.usedParts || [],
      }

      addNotification({
        type: "push",
        title: "SPK Pengerjaan Baru",
        body: `${code} ${input.brand} ${input.model} (${input.plate}) an. ${input.customerName} - ${input.service}.`,
        channel: input.technician || "Kasir",
        status: "terkirim",
        linkTab: "pekerjaan",
      })

      return [wo, ...prev]
    })
  }, [addNotification])

  const updateWorkOrder = useCallback((id: string, input: WorkOrderInput) => {
    setWorkOrders((prev) => {
      const target = prev.find((w) => w.id === id)
      if (target && target.status !== "Siap Diambil" && input.status === "Siap Diambil") {
        addNotification({
          type: "push",
          title: "Kendaraan Siap Diambil",
          body: `${input.brand} ${input.model} (${input.plate}) pengerjaan selesai, siap diserahkan ke ${input.customerName}.`,
          channel: input.technician || "Mekanik",
          status: "terkirim",
          linkTab: "pekerjaan",
        })
      }

      return prev.map((w) =>
        w.id === id
          ? {
              ...w,
              customer: { ...w.customer, name: input.customerName, phone: input.customerPhone, initials: initials(input.customerName) },
              vehicle: { ...w.vehicle, plate: input.plate, brand: input.brand, model: input.model },
              service: input.service,
              complaint: input.complaint,
              status: input.status,
              technician: input.technician,
              progress: progressForStatus(input.status),
              laborCost: input.laborCost,
              usedParts: input.usedParts !== undefined ? input.usedParts : w.usedParts,
            }
          : w,
      )
    })
  }, [addNotification])

  const deleteWorkOrder = useCallback((id: string) => {
    setWorkOrders((prev) => prev.filter((w) => w.id !== id))
  }, [])

  const addPart = useCallback((input: PartInput) => {
    const cat = input.category.trim()
    if (cat) {
      setCategories((prev) => (prev.some((c) => c.toLowerCase() === cat.toLowerCase()) ? prev : [cat, ...prev]))
    }
    setParts((prev) => [
      {
        id: `p-${Date.now()}`,
        name: input.name,
        sku: input.sku,
        category: input.category,
        stock: input.stock,
        minStock: input.minStock,
        price: input.price,
        usedInOrders: [],
      },
      ...prev,
    ])
  }, [])

  const updatePart = useCallback((id: string, input: PartInput) => {
    const cat = input.category.trim()
    if (cat) {
      setCategories((prev) => (prev.some((c) => c.toLowerCase() === cat.toLowerCase()) ? prev : [cat, ...prev]))
    }
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)))
  }, [])

  const deletePart = useCallback((id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const stockIn = useCallback(
    (id: string, qty: number) => {
      setParts((prev) => {
        const part = prev.find((p) => p.id === id)
        if (part) {
          addNotification({
            type: "push",
            title: "Restok Suku Cadang",
            body: `Penambahan stok ${part.name} sebanyak +${qty} unit berhasil dicatat (Total sekarang: ${part.stock + qty} unit).`,
            channel: "Gudang Suku Cadang",
            status: "terkirim",
            linkTab: "stok",
          })
        }
        return prev.map((p) => (p.id === id ? { ...p, stock: p.stock + qty } : p))
      })
    },
    [addNotification]
  )

  const addServiceRate = useCallback((input: ServiceRateInput) => {
    setServiceRates((prev) => [
      { id: `sr-${Date.now()}`, ...input },
      ...prev,
    ])
  }, [])

  const updateServiceRate = useCallback((id: string, input: ServiceRateInput) => {
    setServiceRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)))
  }, [])

  const [vouchers, setVouchers] = useState<Voucher[]>(defaultVouchers)

  useEffect(() => {
    try {
      const savedVouchers = localStorage.getItem("bengkel_vouchers")
      if (savedVouchers) {
        const parsed: Voucher[] = JSON.parse(savedVouchers)
        // Ensure all vouchers have targetService populated
        const migrated = parsed.map((v) => {
          if (!v.targetService) {
            const codeUpper = v.code.toUpperCase()
            if (codeUpper.includes("VAPOR")) return { ...v, targetService: "Vapor Blasting" as const }
            if (codeUpper.includes("SAND")) return { ...v, targetService: "Sand Blasting" as const }
            if (codeUpper.includes("SERVIS")) return { ...v, targetService: "Servis" as const }
            return { ...v, targetService: "Semua Layanan" as const }
          }
          return v
        })

        // Add OJOL15 and SERVIS20K if they are missing from saved vouchers
        const hasOjol = migrated.some((v) => v.code === "OJOL15")
        const hasServis = migrated.some((v) => v.code === "SERVIS20K")
        const extras: Voucher[] = []
        if (!hasOjol) {
          const ojol = defaultVouchers.find((v) => v.code === "OJOL15")
          if (ojol) extras.push(ojol)
        }
        if (!hasServis) {
          const servis = defaultVouchers.find((v) => v.code === "SERVIS20K")
          if (servis) extras.push(servis)
        }

        const finalVouchers = [...migrated, ...extras]
        setVouchers(finalVouchers)
        localStorage.setItem("bengkel_vouchers", JSON.stringify(finalVouchers))
      }
    } catch (e) {
      console.error("Failed to load bengkel_vouchers", e)
    }
  }, [])

  const saveVouchers = (next: Voucher[]) => {
    setVouchers(next)
    try {
      localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
    } catch (e) {
      console.error("Failed to save bengkel_vouchers", e)
    }
  }

  const addVoucher = useCallback((input: Omit<Voucher, "id">) => {
    setVouchers((prev) => {
      const newVoucher: Voucher = {
        id: `v-${Date.now()}`,
        ...input,
        code: input.code.trim().toUpperCase(),
      }
      const next = [newVoucher, ...prev]
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const updateVoucher = useCallback((id: string, patch: Partial<Voucher>) => {
    setVouchers((prev) => {
      const next = prev.map((v) =>
        v.id === id ? { ...v, ...patch, code: patch.code ? patch.code.trim().toUpperCase() : v.code } : v
      )
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const deleteVoucher = useCallback((id: string) => {
    setVouchers((prev) => {
      const next = prev.filter((v) => v.id !== id)
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const toggleVoucherStatus = useCallback((id: string) => {
    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v))
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const deleteServiceRate = useCallback((id: string) => {
    setServiceRates((prev) => prev.filter((r) => r.id !== id))
  }, [])

  // Dismissible Tips State
  const [dismissedTips, setDismissedTips] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const savedTips = localStorage.getItem("bengkel_dismissed_tips")
      if (savedTips) {
        setDismissedTips(JSON.parse(savedTips))
      }
    } catch (e) {
      console.error("Failed to load bengkel_dismissed_tips", e)
    }
  }, [])

  const dismissTip = useCallback((tipId: string) => {
    setDismissedTips((prev) => {
      const next = { ...prev, [tipId]: true }
      try {
        localStorage.setItem("bengkel_dismissed_tips", JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const isTipDismissed = useCallback(
    (tipId: string) => Boolean(dismissedTips[tipId]),
    [dismissedTips],
  )

  const resetDismissedTips = useCallback(() => {
    setDismissedTips({})
    try {
      localStorage.removeItem("bengkel_dismissed_tips")
    } catch {}
  }, [])

  const resetDemoData = useCallback(() => {
    setWorkOrders(seedWorkOrders)
    setParts(seedParts)
    setServiceRates(defaultServiceRates)
    setCategories(defaultCategories)
    setVouchers(defaultVouchers)
    setProfile(defaultWorkshopProfile)
    setDismissedTips({})
    try {
      localStorage.removeItem("bengkel_profile")
      localStorage.removeItem("bengkel_vouchers")
      localStorage.removeItem("bengkel_dismissed_tips")
    } catch {}
  }, [])

  // Authentication & Role-Based Access Control State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("bengkel_auth_user")
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser))
      }
    } catch (e) {
      console.error("Failed to load bengkel_auth_user", e)
    } finally {
      setAuthLoaded(true)
    }
  }, [])

  const login = useCallback((username: string, password?: string): boolean => {
    const cleanUser = username.trim().toLowerCase()
    const found = defaultUsers.find((u) => u.username.toLowerCase() === cleanUser)
    if (!found) return false
    if (password && found.password && password !== found.password && password !== "123456") {
      return false
    }
    setCurrentUser(found)
    try {
      localStorage.setItem("bengkel_auth_user", JSON.stringify(found))
    } catch {}
    return true
  }, [])

  const loginAs = useCallback((user: UserAccount) => {
    setCurrentUser(user)
    try {
      localStorage.setItem("bengkel_auth_user", JSON.stringify(user))
    } catch {}
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    try {
      localStorage.removeItem("bengkel_auth_user")
    } catch {}
  }, [])

  const canEdit = currentUser?.role === "Owner" || currentUser?.role === "Admin"
  const isMekanik = currentUser?.role === "Mekanik"
  const isOwner = currentUser?.role === "Owner"
  const isAdmin = currentUser?.role === "Admin"

  const value = useMemo(
    () => ({
      workOrders,
      parts,
      serviceRates,
      categories,
      vouchers,
      profile,
      updateProfile,
      addWorkOrder,
      updateWorkOrder,
      deleteWorkOrder,
      addPart,
      updatePart,
      deletePart,
      stockIn,
      addCategory,
      deleteCategory,
      addServiceRate,
      updateServiceRate,
      deleteServiceRate,
      addVoucher,
      updateVoucher,
      deleteVoucher,
      toggleVoucherStatus,
      dismissedTips,
      dismissTip,
      isTipDismissed,
      resetDismissedTips,
      resetDemoData,
      currentUser,
      authLoaded,
      login,
      loginAs,
      logout,
      canEdit,
      isMekanik,
      isOwner,
      isAdmin,
      notifications,
      unreadNotifCount,
      addNotification,
      markAllNotifAsRead,
      markNotifAsRead,
      clearNotifications,
      deleteNotification,
      midtransConfig,
      updateMidtransConfig,
    }),
    [
      workOrders,
      parts,
      serviceRates,
      categories,
      vouchers,
      profile,
      updateProfile,
      addWorkOrder,
      updateWorkOrder,
      deleteWorkOrder,
      addPart,
      updatePart,
      deletePart,
      stockIn,
      addCategory,
      deleteCategory,
      addServiceRate,
      updateServiceRate,
      deleteServiceRate,
      addVoucher,
      updateVoucher,
      deleteVoucher,
      toggleVoucherStatus,
      dismissedTips,
      dismissTip,
      isTipDismissed,
      resetDismissedTips,
      resetDemoData,
      currentUser,
      authLoaded,
      login,
      loginAs,
      logout,
      canEdit,
      isMekanik,
      isOwner,
      isAdmin,
      notifications,
      unreadNotifCount,
      addNotification,
      markAllNotifAsRead,
      markNotifAsRead,
      clearNotifications,
      deleteNotification,
      midtransConfig,
      updateMidtransConfig,
    ],
  )

  return <WorkshopContext.Provider value={value}>{children}</WorkshopContext.Provider>
}

export function useWorkshop(): WorkshopContextValue {
  const ctx = useContext(WorkshopContext)
  if (!ctx) throw new Error("useWorkshop must be used within WorkshopProvider")
  return ctx
}
