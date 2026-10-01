// Demo data & domain types for BengkelPro — workshop management app.
// All monetary values are in Indonesian Rupiah (IDR).

export type ServiceType =
  | "Servis"
  | "Vapor Blasting"
  | "Sand Blasting"
  | "Kustomisasi"

export type WorkStatus =
  | "Antrian"
  | "Dikerjakan"
  | "Menunggu Sparepart"
  | "Selesai"
  | "Siap Diambil"

export type PaymentStatus = "Lunas" | "Belum Bayar" | "Sebagian" | "Jatuh Tempo"

export interface Customer {
  id: string
  name: string
  phone: string
  initials: string
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
}

export interface UsedPart {
  partId: string
  name: string
  qty: number
  price: number
}

export interface WorkOrder {
  id: string
  code: string
  customer: Customer
  vehicle: Vehicle
  service: ServiceType
  complaint: string
  status: WorkStatus
  technician: string
  progress: number
  createdAt: string
  completedAt?: string
  estimatedDone: string
  laborCost: number
  usedParts: UsedPart[]
}

export interface Part {
  id: string
  name: string
  sku: string
  category: string
  stock: number
  minStock: number
  price: number // harga jual
  buyPrice?: number // harga beli / modal kulakan
  usedInOrders: string[] // work order codes that consumed this part
}

export interface StockInLog {
  id: string
  partId: string
  partName: string
  category: string
  qty: number
  unitCost: number
  totalCost: number
  createdAt: string
}

export interface InvoiceItem {
  label: string
  qty: number
  price: number
}

export interface Invoice {
  id: string
  number: string
  workOrderCode: string
  customer: Customer
  vehicle: Vehicle
  service: ServiceType
  items: InvoiceItem[]
  status: PaymentStatus
  method?: "QRIS" | "Transfer" | "Kartu" | "Tunai"
  date: string
  createdAt?: string
  paidAmount: number
  discountType?: "none" | "voucher" | "manual"
  discountCode?: string
  discountAmount?: number
  adminFee?: number
  paymentRef?: string
  paidAt?: string
  bankName?: string
}

export type VoucherTargetService = "Semua Layanan" | ServiceType

export interface Voucher {
  id: string
  code: string
  title: string
  type: "fixed" | "percent"
  value: number // nominal Rp (misal 25000) atau persen (misal 10)
  maxDiscount?: number // batas maksimal diskon Rp jika tipe percent
  minPurchase: number // minimal total transaksi Rp agar bisa dipakai (0 jika tanpa min)
  validUntil: string // format YYYY-MM-DD
  isActive: boolean
  targetService: VoucherTargetService // "Semua Layanan" atau khusus: "Vapor Blasting" | "Sand Blasting" | "Servis" | "Kustomisasi"
  description?: string
}

export const defaultVouchers: Voucher[] = []

export interface Technician {
  id: string
  name: string
  initials: string
  activeJobs: number
  completedThisMonth: number
  avgHours: number // average hours per job
  avgTimeFormatted?: string
  efficiency: number // 0-100
  phone?: string
  specialty?: string
  status?: "Aktif" | "Istirahat" | "Cuti"
}

export interface TechnicianInput {
  name: string
  phone?: string
  specialty?: string
  status?: "Aktif" | "Istirahat" | "Cuti"
}

export interface NotificationItem {
  id: string
  type: "whatsapp" | "push"
  title: string
  body: string
  time: string
  channel: string
  status: "terkirim" | "menunggu" | "gagal"
  read?: boolean
  createdAt?: string
  linkTab?: "beranda" | "pekerjaan" | "stok" | "invoice" | "analitik"
}


export interface ServiceRate {
  id: string
  name: string
  category: ServiceType
  price: number
  description?: string
}

export const defaultServiceRates: ServiceRate[] = []

// ---------- Workshop Category Pillars & Presets ----------

export interface WorkshopCategoryPillar {
  id: string
  name: string
  shortLabel: string
  badgeColor: string
  description: string
  categories: string[]
}

export const workshopCategoryPillars: WorkshopCategoryPillar[] = [
  {
    id: "vapor",
    name: "Vapor Blasting",
    shortLabel: "Vapor Blasting",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-400",
    description: "Media & bahan pembersihan part mesin sistem basah (vapor blasting)",
    categories: [
      "Vapor Blasting",
      "Media Glass Bead",
      "Cairan Degreaser & Pembersih",
      "Anti Karat & Sealant",
      "Soda Blasting",
      "Part Ultrasonic Clean",
    ],
  },
  {
    id: "sand",
    name: "Sand Blasting",
    shortLabel: "Sand Blasting",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400",
    description: "Media pasir & abrasif pembersih karat/cat sistem kering",
    categories: [
      "Sand Blasting",
      "Pasir Silika",
      "Pasir Garnet",
      "Aluminium Oxide",
      "Steel Grit / Shot Blasting",
      "Masking Rubber & Panas",
      "Nozzle Blaster & Sparepart",
    ],
  },
  {
    id: "bengkel",
    name: "Bengkel & Servis",
    shortLabel: "Bengkel & Servis",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400",
    description: "Suku cadang fast-moving & servis perawatan motor",
    categories: [
      "Pelumas & Oli",
      "Sistem Rem",
      "Pengapian & Busi",
      "Filter Udara & Oli",
      "Transmisi & Rantai",
      "Kopling & CVT",
      "Kelistrikan & Aki",
      "Ban & Roda",
      "Suspensi & Shock",
      "Gasket & Packing Mesin",
      "Baut & Fastener",
    ],
  },
  {
    id: "kustom",
    name: "Kustom & Modifikasi",
    shortLabel: "Kustom / Modif",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-400",
    description: "Bahan modifikasi, painting powder coating, bracket & finishing",
    categories: [
      "Kustom & Modifikasi",
      "Powder Coating",
      "Cat & Epoxy Primer",
      "Plat & Bracket Kustom",
      "Knalpot & Header Kustom",
      "Baut Probolt & Detailing",
      "Finishing & Poles",
      "Aksesoris Kustom",
    ],
  },
]

export const defaultCategories: string[] = Array.from(
  new Set(workshopCategoryPillars.flatMap((p) => p.categories))
)

// ---------- helpers ----------

export function generatePartSKU(
  name: string = "",
  category: string = "",
  existingParts: Part[] = []
): string {
  const cleanName = name.trim().toUpperCase()
  const cleanCat = category.trim().toUpperCase()

  // 1. Determine 3-character prefix based on category or product name keywords
  let prefix = "PRT"
  const combined = `${cleanCat} ${cleanName}`

  if (/VAPOR|VAPOUR|GLASS BEAD|DEGREASER|ULTRASONIC/.test(combined)) {
    prefix = "VBM"
  } else if (/SAND\s*BLAST|PASIR|GARNET|SILIKA|OXIDE|STEEL GRIT/.test(combined)) {
    prefix = "SBM"
  } else if (/POWDER|COATING/.test(combined)) {
    prefix = "PWD"
  } else if (/KUSTOM|CUSTOM|MODIF|BRACKET/.test(combined)) {
    prefix = "CST"
  } else if (/CAT|PAINT|EPOXY|FINISHING|POLES/.test(combined)) {
    prefix = "PNT"
  } else if (/BLASTING|ABRASIVE/.test(combined)) {
    prefix = "BLS"
  } else if (/OLI|PELUMAS|LUBRICANT|OIL|MINYAK/.test(combined)) {
    prefix = "OIL"
  } else if (/REM|BRAKE|KAMPAS REM|PIRINGAN|DISC/.test(combined)) {
    prefix = "BRK"
  } else if (/BUSI|SPARK|PENGAPIAN|IGNITION/.test(combined)) {
    prefix = "SPK"
  } else if (/FILTER|SARINGAN|AIR FILTER/.test(combined)) {
    prefix = "AIR"
  } else if (/RANTAI|CHAIN|GIR|GEAR|SPROCKET/.test(combined)) {
    prefix = "CHN"
  } else if (/KOPLING|CLUTCH/.test(combined)) {
    prefix = "CLT"
  } else if (/TRANSMISI|TRANSMISSION|CVT|ROLLER|V-BELT|BELT/.test(combined)) {
    prefix = "TRN"
  } else if (/BAN|TYRE|TIRE|TUBELLES|VELG|WHEEL/.test(combined)) {
    prefix = "TYR"
  } else if (/AKI|ACCU|BATERAI|BATTERY|KELISTRIKAN|LAMPU/.test(combined)) {
    prefix = "BAT"
  } else if (/SHOCK|SUSPENSI|FORK|PER/.test(combined)) {
    prefix = "SHK"
  } else if (/RADIATOR|COOLANT|PENDINGIN/.test(combined)) {
    prefix = "RAD"
  } else if (/KNALPOT|EXHAUST|MUFFLER|HEADER/.test(combined)) {
    prefix = "EXH"
  } else if (/BAUT|MUR|FASTENER|BOLT|NUT|PROBOLT/.test(combined)) {
    prefix = "BLT"
  } else if (cleanCat.length >= 3) {
    const catWords = cleanCat.split(/\s+/).filter(Boolean)
    if (catWords.length >= 3) {
      prefix = catWords.slice(0, 3).map((w) => w[0]).join("")
    } else {
      const consonants = cleanCat.replace(/[^B-DF-HJ-NP-TV-Z]/g, "")
      prefix = (consonants.length >= 3 ? consonants.slice(0, 3) : cleanCat.slice(0, 3)).padEnd(3, "X")
    }
  }

  // 2. Determine middle & suffix from Name
  let middle = ""
  let suffix = ""

  if (!cleanName) {
    // If no name is provided yet, produce a sequential preview like PRT-011
    const count = (existingParts.length + 1).toString().padStart(3, "0")
    middle = count
  } else {
    // Tokenize name, ignoring noise words
    const tokens = cleanName
      .replace(/[^\w\s-]/g, "")
      .split(/[\s-]+/)
      .filter((t) => t && !/^(OLI|MESIN|DAN|UNTUK|SET|ISI|MOTOR|DEPAN|BELAKANG|ORIGINAL|ASLI)$/i.test(t))

    // Look for numeric/model token like 5100, 155, 140, 428, 25, 01, GTZ6V, CBR
    const numericToken = tokens.find((t) => /\d/.test(t))
    const wordTokens = tokens.filter((t) => !/\d/.test(t))

    if (wordTokens.length > 0) {
      const brand = wordTokens[0]
      const consonants = brand.replace(/[^B-DF-HJ-NP-TV-Z]/g, "")
      middle = (consonants.length >= 3 ? consonants.slice(0, 3) : brand.slice(0, 3)).toUpperCase()
    }

    if (numericToken) {
      suffix = numericToken.slice(0, 6)
    } else if (wordTokens.length > 1) {
      const secondWord = wordTokens[1]
      const consonants = secondWord.replace(/[^B-DF-HJ-NP-TV-Z]/g, "")
      suffix = (consonants.length >= 2 ? consonants.slice(0, 3) : secondWord.slice(0, 3)).toUpperCase()
    } else {
      suffix = "01"
    }

    if (!middle) middle = "PRT"
  }

  let candidate = suffix ? `${prefix}-${middle}-${suffix}` : `${prefix}-${middle}`
  candidate = candidate.replace(/-+/g, "-").toUpperCase()

  // 3. Ensure uniqueness
  const existingSet = new Set(existingParts.map((p) => p.sku.toUpperCase()))
  if (!existingSet.has(candidate)) {
    return candidate
  }

  let counter = 1
  let uniqueCandidate = `${candidate}-${counter.toString().padStart(2, "0")}`
  while (existingSet.has(uniqueCandidate)) {
    counter++
    uniqueCandidate = `${candidate}-${counter.toString().padStart(2, "0")}`
  }

  return uniqueCandidate
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function invoiceSubtotal(inv: Invoice): number {
  return inv.items.reduce((sum, it) => sum + it.qty * it.price, 0)
}

export function invoiceTotal(inv: Invoice): number {
  const sub = invoiceSubtotal(inv)
  const disc = inv.discountAmount || 0
  return Math.max(0, sub - disc)
}

export function workOrderTotal(wo: WorkOrder): number {
  const parts = wo.usedParts.reduce((s, p) => s + p.qty * p.price, 0)
  return wo.laborCost + parts
}

export const serviceColors: Record<ServiceType, string> = {
  Servis: "var(--chart-3)",
  "Vapor Blasting": "var(--chart-2)",
  "Sand Blasting": "var(--chart-5)",
  Kustomisasi: "var(--chart-1)",
}

// ---------- demo data ----------

export const customers: Customer[] = []

export const vehicles: Vehicle[] = []

export const technicians: Technician[] = []

export const parts: Part[] = []

export const workOrders: WorkOrder[] = []

export const invoices: Invoice[] = []

export const notifications: NotificationItem[] = []

// User Accounts & Role-Based Access Control
export type UserRole = "Owner" | "Admin" | "Mekanik"

export interface UserAccount {
  id: string
  name: string
  username: string
  role: UserRole
  avatarInitials: string
  phone?: string
  password?: string
  description: string
}

export const defaultUsers: UserAccount[] = [
  {
    id: "usr-owner",
    name: "GITA",
    username: "owner",
    role: "Owner",
    avatarInitials: "GI",
    phone: "0812-8888-9102",
    password: "owner",
    description: "Pemilik Bengkel · Akses Penuh ke Finansial, Tarif, Pengaturan, & Operasional",
  },
  {
    id: "usr-admin",
    name: "Rian Pratama",
    username: "admin",
    role: "Admin",
    avatarInitials: "RP",
    phone: "0813-2233-4455",
    password: "admin",
    description: "Admin & Kasir · Akses Penuh ke Kasir, Order, Stok, Voucher, & WhatsApp",
  },
  {
    id: "usr-mekanik",
    name: "Bayu Saputra",
    username: "mekanik",
    role: "Mekanik",
    avatarInitials: "BS",
    phone: "0857-1122-3344",
    password: "mekanik",
    description: "Mekanik Lapangan · Akses Lihat Saja (Read-Only: Status Order & Stok)",
  },
]
