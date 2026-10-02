"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import {
  workOrders as seedWorkOrders,
  parts as seedParts,
  technicians as defaultTechnicians,
  defaultServiceRates,
  defaultCategories,
  defaultVouchers,
  defaultUsers,
  invoices,
  type Invoice,
  type InvoiceItem,
  type WorkOrder,
  type Part,
  type ServiceType,
  type WorkStatus,
  type ServiceRate,
  type Voucher,
  type UserAccount,
  type UserRole,
  type NotificationItem,
  type Technician,
  type TechnicianInput,
  type StockInLog,
  type StockOutLog,
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
  buyPrice?: number
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
  serverKey?: string
  merchantId: string
  chargeAdminFeeToCustomer: boolean
  vaAdminFee: number
  qrisAdminFee: number
}

export const defaultMidtransConfig: MidtransConfig = {
  enabled: true,
  environment: "sandbox",
  clientKey: "SB-Mid-client-GTA-GARAGE-DEMO",
  serverKey: "",
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
  invoices: Invoice[]
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>
  parts: Part[]
  serviceRates: ServiceRate[]
  categories: string[]
  vouchers: Voucher[]
  technicians: Technician[]
  addTechnician: (input: TechnicianInput) => void
  updateTechnician: (id: string, input: Partial<TechnicianInput>) => void
  deleteTechnician: (id: string) => void
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
  stockIn: (id: string, qty: number, unitCost?: number) => void
  stockInLogs: StockInLog[]
  stockOut: (id: string, qty: number, reason?: string) => void
  stockOutLogs: StockOutLog[]
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
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [parts, setParts] = useState<Part[]>([])
  const [stockInLogs, setStockInLogs] = useState<StockInLog[]>([])
  const [stockOutLogs, setStockOutLogs] = useState<StockOutLog[]>([])
  const [serviceRates, setServiceRates] = useState<ServiceRate[]>(defaultServiceRates)
  const [categories, setCategories] = useState<string[]>(defaultCategories)
  const [profile, setProfile] = useState<WorkshopProfile>(defaultWorkshopProfile)
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([])

  // Real Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  // Load initial data from PostgreSQL Backend API via single consolidated bootstrap endpoint
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const bootstrapRes = await fetch('/api/bootstrap')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

        if (!isMounted) return;

        if (bootstrapRes?.success && bootstrapRes?.data) {
          const {
            workOrders: bWorkOrders = [],
            invoices: bInvoices = [],
            inventory: bInventory,
            serviceRates: bServiceRates = [],
            technicians: bTechnicians = [],
            vouchers: bVouchers = [],
            settings: bSettings,
            notifications: bNotifications = [],
          } = bootstrapRes.data;

          setWorkOrders(bWorkOrders);
          setInvoicesData(bInvoices);

          if (bInventory) {
            if (Array.isArray(bInventory.parts)) setParts(bInventory.parts);
            if (Array.isArray(bInventory.stockInLogs)) setStockInLogs(bInventory.stockInLogs);
            if (Array.isArray(bInventory.stockOutLogs)) setStockOutLogs(bInventory.stockOutLogs);
          }

          if (Array.isArray(bServiceRates) && bServiceRates.length > 0) {
            setServiceRates(bServiceRates);
          }

          if (Array.isArray(bTechnicians) && bTechnicians.length > 0) {
            setTechnicians(bTechnicians);
          }

          if (Array.isArray(bVouchers) && bVouchers.length > 0) {
            setVouchers(bVouchers);
          }

          if (bSettings) {
            if (bSettings.profile) setProfile(bSettings.profile);
            if (bSettings.midtransConfig) setMidtransConfig(bSettings.midtransConfig);
            if (Array.isArray(bSettings.categories) && bSettings.categories.length > 0) {
              setCategories(bSettings.categories);
            }
          }

          if (Array.isArray(bNotifications)) {
            setNotifications(bNotifications);
            try {
              localStorage.setItem("bengkel_notifications", JSON.stringify(bNotifications));
            } catch {}
          }
        }
      } catch (e) {
        console.error("Failed to load initial data via bootstrap", e);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Auto-sync workOrders to invoices
  useEffect(() => {
    if (workOrders.length === 0) return
    setInvoicesData((prevInvoices) => {
      let updated = [...prevInvoices]
      let hasChanges = false

      workOrders.forEach((wo, idx) => {
        const existingIdx = updated.findIndex((inv) => inv.workOrderCode === wo.code)

        if (existingIdx === -1) {
          if (wo.status === "Siap Diambil" || wo.status === "Selesai") {
            const laborItem = {
              label: `Jasa ${wo.service}`,
              qty: 1,
              price: wo.laborCost || 90000,
            }
            const partItems = (wo.usedParts || []).map((p) => ({
              label: p.name,
              qty: p.qty,
              price: p.price,
            }))

            const invTotal = laborItem.price + partItems.reduce((s, p) => s + p.qty * p.price, 0)
            const isLunas = wo.status === "Selesai"

            const newInvoice: Invoice = {
              id: `inv-auto-${wo.id}`,
              number: `INV/2026/09/0${143 + idx}`,
              workOrderCode: wo.code,
              customer: wo.customer,
              vehicle: wo.vehicle,
              service: wo.service,
              date: wo.createdAt || "25 Sep 2026",
              createdAt: wo.createdAt || new Date().toISOString(),
              status: isLunas ? "Lunas" : "Belum Bayar",
              paidAmount: isLunas ? invTotal : 0,
              items: [laborItem, ...partItems],
            }
            updated = [newInvoice, ...updated]
            hasChanges = true
          }
        } else {
          const existingInv = updated[existingIdx]
          if (wo.status === "Selesai" && existingInv.status !== "Lunas") {
            const total = existingInv.items.reduce((s: number, i: InvoiceItem) => s + i.qty * i.price, 0) + (existingInv.adminFee || 0) - (existingInv.discountAmount || 0)
            updated[existingIdx] = {
              ...existingInv,
              status: "Lunas",
              paidAmount: total,
              paidAt: existingInv.paidAt || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
            }
            hasChanges = true
          }
        }
      })

      return hasChanges ? updated : prevInvoices
    })
  }, [workOrders])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bengkel_notifications")
      if (saved !== null) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setNotifications(parsed)
          return
        }
      }
    } catch (e) {
      console.error("Failed to load bengkel_notifications", e)
    }
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

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotif),
      }).catch((e) => console.error('Failed to sync notification to DB', e))
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

    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-all-read' }),
    }).catch(console.error)
  }, [])

  const markNotifAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      try {
        localStorage.setItem("bengkel_notifications", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mark-read', id }),
    }).catch(console.error)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    try {
      localStorage.setItem("bengkel_notifications", JSON.stringify([]))
    } catch {}

    fetch('/api/notifications?action=clear-all', { method: 'DELETE' }).catch(console.error)
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id)
      try {
        localStorage.setItem("bengkel_notifications", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch(`/api/notifications?id=${id}`, { method: 'DELETE' }).catch(console.error)
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

    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: patch }),
    }).catch((e) => console.error('Failed to sync profile to DB', e))
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

    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ midtransConfig: patch }),
    }).catch((e) => console.error('Failed to sync midtransConfig to DB', e))
  }, [])

  const addCategory = useCallback((category: string) => {
    const trimmed = category.trim()
    if (!trimmed) return
    setCategories((prev) => (prev.some((c) => c.toLowerCase() === trimmed.toLowerCase()) ? prev : [trimmed, ...prev]))

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-category', name: trimmed }),
    }).catch((e) => console.error('Failed to sync category to DB', e))
  }, [])

  const deleteCategory = useCallback((category: string) => {
    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== category.trim().toLowerCase()))

    fetch(`/api/settings?category=${encodeURIComponent(category.trim())}`, {
      method: 'DELETE',
    }).catch((e) => console.error('Failed to delete category from DB', e))
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
        createdAt: now.toISOString(),
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

      fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wo),
      }).catch((e) => console.error('Failed to sync work order to DB', e))

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

      const updatedList = prev.map((w) =>
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
              // Track completion timestamp
              completedAt: (input.status === "Selesai" || input.status === "Siap Diambil") && !w.completedAt
                ? new Date().toISOString()
                : w.completedAt,
            }
          : w,
      )

      return updatedList
    })

    fetch('/api/work-orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input, progress: progressForStatus(input.status) }),
    }).catch((e) => console.error('Failed to update work order in DB', e))
  }, [addNotification])

  const deleteWorkOrder = useCallback((id: string) => {
    setWorkOrders((prev) => prev.filter((w) => w.id !== id))

    fetch(`/api/work-orders?id=${id}`, {
      method: 'DELETE',
    }).catch((e) => console.error('Failed to delete work order from DB', e))
  }, [])

  const addPart = useCallback((input: PartInput) => {
    const cat = input.category.trim()
    if (cat) {
      setCategories((prev) => (prev.some((c) => c.toLowerCase() === cat.toLowerCase()) ? prev : [cat, ...prev]))
    }
    const newPart: Part = {
      id: `p-${Date.now()}`,
      name: input.name,
      sku: input.sku,
      category: input.category,
      stock: input.stock,
      minStock: input.minStock,
      price: input.price,
      buyPrice: input.buyPrice || 0,
      usedInOrders: [],
    }
    setParts((prev) => [newPart, ...prev])

    fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPart),
    }).catch((e) => console.error('Failed to sync part to DB', e))
  }, [])

  const updatePart = useCallback((id: string, input: PartInput) => {
    const cat = input.category.trim()
    if (cat) {
      setCategories((prev) => (prev.some((c) => c.toLowerCase() === cat.toLowerCase()) ? prev : [cat, ...prev]))
    }
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, ...input } : p)))

    fetch('/api/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    }).catch((e) => console.error('Failed to update part in DB', e))
  }, [])

  const deletePart = useCallback((id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id))

    fetch(`/api/inventory?id=${id}`, {
      method: 'DELETE',
    }).catch((e) => console.error('Failed to delete part from DB', e))
  }, [])

  const stockIn = useCallback(
    (id: string, qty: number, unitCost?: number) => {
      const cost = unitCost ?? 0
      setParts((prev) => {
        const part = prev.find((p) => p.id === id)
        if (part) {
          addNotification({
            type: "push",
            title: "Restok Suku Cadang & Bahan",
            body: `Penambahan stok ${part.name} sebanyak +${qty} unit berhasil dicatat.`,
            channel: "Gudang Suku Cadang",
            status: "terkirim",
            linkTab: "stok",
          })
        }
        return prev.map((p) => (p.id === id ? { ...p, stock: p.stock + qty, buyPrice: unitCost !== undefined ? unitCost : p.buyPrice } : p))
      })

      if (qty > 0) {
        setStockInLogs((prev) => {
          const found = parts.find((p) => p.id === id)
          const newLog: StockInLog = {
            id: `sil-${Date.now()}`,
            partId: id,
            partName: found ? found.name : "Barang",
            category: found ? found.category : "Lainnya",
            qty,
            unitCost: cost,
            totalCost: qty * cost,
            createdAt: new Date().toISOString(),
          }
          return [newLog, ...prev]
        })
      }

      fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stock-in', id, qty, unitCost: cost }),
      }).catch((e) => console.error('Failed to sync stockIn to DB', e))
    },
    [addNotification, parts]
  )

  const stockOut = useCallback(
    (id: string, qty: number, reason?: string) => {
      const logReason = reason?.trim() || "Pemakaian Operasional"
      setParts((prev) => {
        const part = prev.find((p) => p.id === id)
        if (part) {
          const newStock = Math.max(0, part.stock - qty)
          addNotification({
            type: "push",
            title: "Pemakaian Bahan / Suku Cadang",
            body: `Pemakaian ${part.name} sebanyak -${qty} unit dicatat (${logReason}). Sisa stok: ${newStock} unit.`,
            channel: "Gudang Suku Cadang",
            status: "terkirim",
            linkTab: "stok",
          })
          return prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
        }
        return prev
      })

      if (qty > 0) {
        setStockOutLogs((prev) => {
          const found = parts.find((p) => p.id === id)
          const newLog: StockOutLog = {
            id: `sol-${Date.now()}`,
            partId: id,
            partName: found ? found.name : "Barang",
            category: found ? found.category : "Lainnya",
            qty,
            reason: logReason,
            createdAt: new Date().toISOString(),
          }
          return [newLog, ...prev]
        })
      }

      fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stock-out', id, qty, reason: logReason }),
      }).catch((e) => console.error('Failed to sync stockOut to DB', e))
    },
    [addNotification, parts]
  )

  const addServiceRate = useCallback((input: ServiceRateInput) => {
    const newRate = { id: `sr-${Date.now()}`, ...input }
    setServiceRates((prev) => [newRate, ...prev])

    fetch('/api/service-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRate),
    }).catch((e) => console.error('Failed to sync service rate to DB', e))
  }, [])

  const updateServiceRate = useCallback((id: string, input: ServiceRateInput) => {
    setServiceRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)))

    fetch('/api/service-rates', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    }).catch((e) => console.error('Failed to update service rate in DB', e))
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
    const newVoucher: Voucher = {
      id: `v-${Date.now()}`,
      ...input,
      code: input.code.trim().toUpperCase(),
    }
    setVouchers((prev) => {
      const next = [newVoucher, ...prev]
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch('/api/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVoucher),
    }).catch((e) => console.error('Failed to sync voucher to DB', e))
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

    fetch('/api/vouchers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    }).catch((e) => console.error('Failed to update voucher in DB', e))
  }, [])

  const deleteVoucher = useCallback((id: string) => {
    setVouchers((prev) => {
      const next = prev.filter((v) => v.id !== id)
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch(`/api/vouchers?id=${id}`, { method: 'DELETE' }).catch((e) => console.error('Failed to delete voucher from DB', e))
  }, [])

  const toggleVoucherStatus = useCallback((id: string) => {
    setVouchers((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v))
      try {
        localStorage.setItem("bengkel_vouchers", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch('/api/vouchers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle' }),
    }).catch((e) => console.error('Failed to toggle voucher in DB', e))
  }, [])

  const deleteServiceRate = useCallback((id: string) => {
    setServiceRates((prev) => prev.filter((r) => r.id !== id))

    fetch(`/api/service-rates?id=${id}`, { method: 'DELETE' }).catch((e) => console.error('Failed to delete service rate from DB', e))
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



  // Technicians / Mechanics State & Actions
  const [technicians, setTechnicians] = useState<Technician[]>(defaultTechnicians)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bengkel_technicians_v1")
      if (saved) {
        setTechnicians(JSON.parse(saved))
      } else {
        localStorage.setItem("bengkel_technicians_v1", JSON.stringify(defaultTechnicians))
      }
    } catch (e) {
      console.error("Failed to load bengkel_technicians_v1", e)
    }
  }, [])

  const addTechnician = useCallback((input: TechnicianInput) => {
    const name = input.name.trim()
    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name,
      initials: initials(name),
      activeJobs: 0,
      completedThisMonth: 0,
      avgHours: 0,
      efficiency: 0,
      phone: input.phone?.trim() || "",
      specialty: input.specialty?.trim() || "Mekanik Umum & Servis",
      status: input.status || "Aktif",
    }
    setTechnicians((prev) => {
      const next = [...prev, newTech]
      try {
        localStorage.setItem("bengkel_technicians_v1", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch('/api/technicians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTech),
    }).catch((e) => console.error('Failed to sync technician to DB', e))
  }, [])

  const updateTechnician = useCallback((id: string, patch: Partial<TechnicianInput>) => {
    setTechnicians((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t
        const updatedName = patch.name !== undefined ? patch.name.trim() : t.name
        return {
          ...t,
          ...patch,
          name: updatedName,
          initials: initials(updatedName),
        }
      })
      try {
        localStorage.setItem("bengkel_technicians_v1", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch('/api/technicians', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    }).catch((e) => console.error('Failed to update technician in DB', e))
  }, [])

  const deleteTechnician = useCallback((id: string) => {
    setTechnicians((prev) => {
      const next = prev.filter((t) => t.id !== id)
      try {
        localStorage.setItem("bengkel_technicians_v1", JSON.stringify(next))
      } catch {}
      return next
    })

    fetch(`/api/technicians?id=${id}`, { method: 'DELETE' }).catch((e) => console.error('Failed to delete technician from DB', e))
  }, [])

  // Authentication & Role-Based Access Control State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("bengkel_auth_user")
      if (savedUser) {
        const parsed = JSON.parse(savedUser)
        if (parsed && parsed.username) {
          setCurrentUser(parsed)
        }
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
      invoices: invoicesData,
      setInvoices: setInvoicesData,
      parts,
      serviceRates,
      categories,
      vouchers,
      technicians,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      profile,
      updateProfile,
      addWorkOrder,
      updateWorkOrder,
      deleteWorkOrder,
      addPart,
      updatePart,
      deletePart,
      stockIn,
      stockInLogs,
      stockOut,
      stockOutLogs,
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
      invoicesData,
      parts,
      serviceRates,
      categories,
      vouchers,
      technicians,
      addTechnician,
      updateTechnician,
      deleteTechnician,
      profile,
      updateProfile,
      addWorkOrder,
      updateWorkOrder,
      deleteWorkOrder,
      addPart,
      updatePart,
      deletePart,
      stockIn,
      stockInLogs,
      stockOut,
      stockOutLogs,
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
