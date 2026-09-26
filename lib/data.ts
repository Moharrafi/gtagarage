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
  price: number
  usedInOrders: string[] // work order codes that consumed this part
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
  paidAmount: number
  discountType?: "none" | "voucher" | "manual"
  discountCode?: string
  discountAmount?: number
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

export const defaultVouchers: Voucher[] = [
  {
    id: "v-1",
    code: "VAPOR25K",
    title: "Promo Spesial Vapor Blasting",
    type: "fixed",
    value: 25000,
    minPurchase: 150000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Vapor Blasting",
    description: "Potongan Rp 25.000 khusus pengerjaan mesin & restorasi vapor blasting",
  },
  {
    id: "v-2",
    code: "MEMBER10",
    title: "Diskon Member & Komunitas Motor",
    type: "percent",
    value: 10,
    maxDiscount: 50000,
    minPurchase: 100000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Semua Layanan",
    description: "Diskon 10% (maksimal Rp 50.000) umum untuk seluruh layanan bengkel",
  },
  {
    id: "v-3",
    code: "OJOL15",
    title: "Diskon Khusus Mitra Ojol (Grab/Gojek)",
    type: "percent",
    value: 15,
    maxDiscount: 35000,
    minPurchase: 50000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Semua Layanan",
    description: "Diskon 15% (maks Rp 35.000) umum untuk driver ojek online & delivery",
  },
  {
    id: "v-4",
    code: "SERVIS20K",
    title: "Promo Servis Rutin & Tune Up",
    type: "fixed",
    value: 20000,
    minPurchase: 100000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Servis",
    description: "Potongan Rp 20.000 khusus pengerjaan servis berkala, oli & tune up motor",
  },
  {
    id: "v-5",
    code: "SANDBLAST50",
    title: "Voucher Paket Sand Blasting Sasis",
    type: "fixed",
    value: 50000,
    minPurchase: 300000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Sand Blasting",
    description: "Potongan Rp 50.000 khusus pengerjaan sasis dan kaki-kaki sandblasting",
  },
]

export interface Technician {
  id: string
  name: string
  initials: string
  activeJobs: number
  completedThisMonth: number
  avgHours: number // average hours per job
  efficiency: number // 0-100
}

export interface NotificationItem {
  id: string
  type: "whatsapp" | "push"
  title: string
  body: string
  time: string
  channel: string
  status: "terkirim" | "menunggu" | "gagal"
}

export interface ServiceRate {
  id: string
  name: string
  category: ServiceType
  price: number
  description?: string
}

export const defaultServiceRates: ServiceRate[] = [
  { id: "sr-1", name: "Vapor Blasting Blok Mesin Bebek/Matic", category: "Vapor Blasting", price: 250000, description: "Pembersihan kerak kusam blok & kop silinder" },
  { id: "sr-2", name: "Vapor Blasting Blok Mesin Sport 250cc", category: "Vapor Blasting", price: 450000, description: "Crankcase, blok silinder & kop 2 silinder" },
  { id: "sr-3", name: "Vapor Blasting Cover CVT / Bak Mesin", category: "Vapor Blasting", price: 150000, description: "Cover CVT kiri / bak kopling kanan" },
  { id: "sr-4", name: "Vapor Blasting Tromol & Kaliper Rem", category: "Vapor Blasting", price: 90000, description: "Sepasang tromol roda atau kaliper rem" },
  { id: "sr-5", name: "Vapor Blasting Karburator / Throttle Body", category: "Vapor Blasting", price: 120000, description: "Pembersihan kerak ruang bakar luar dalam" },
  { id: "sr-6", name: "Sand Blasting Rangka Motor Full", category: "Sand Blasting", price: 400000, description: "Kupas cat lama & karat sasis utama" },
  { id: "sr-7", name: "Sand Blasting Swing Arm & Kaki-kaki", category: "Sand Blasting", price: 150000, description: "Lengan ayun & segitiga shock depan" },
  { id: "sr-8", name: "Servis Berkala & Tune Up Ringan", category: "Servis", price: 75000, description: "Pembersihan injeksi/karbu, filter & busi" },
  { id: "sr-9", name: "Servis Besar / Turun Mesin (Overhaul)", category: "Servis", price: 350000, description: "Bongkar total mesin, skir klep, ring piston" },
  { id: "sr-10", name: "Powder Coating Velg (Sepasang)", category: "Kustomisasi", price: 400000, description: "Cat oven velg depan & belakang" },
  { id: "sr-11", name: "Repaint Tangki Powder Coating", category: "Kustomisasi", price: 350000, description: "Cat oven tangki motor kustom/sport" },
]

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

export const customers: Customer[] = [
  { id: "c1", name: "Budi Santoso", phone: "0812-3456-7890", initials: "BS" },
  { id: "c2", name: "Andi Wijaya", phone: "0813-9988-7766", initials: "AW" },
  { id: "c3", name: "Rina Kartika", phone: "0857-1122-3344", initials: "RK" },
  { id: "c4", name: "Dedi Kurniawan", phone: "0821-5566-7788", initials: "DK" },
  { id: "c5", name: "Sari Melati", phone: "0819-4433-2211", initials: "SM" },
  { id: "c6", name: "Hendra Gunawan", phone: "0838-7654-3210", initials: "HG" },
]

export const vehicles: Vehicle[] = [
  { id: "v1", plate: "B 3421 KXA", brand: "Honda", model: "CBR250RR", year: 2021, color: "Merah" },
  { id: "v2", plate: "D 7788 ZZL", brand: "Yamaha", model: "XSR 155", year: 2022, color: "Hijau" },
  { id: "v3", plate: "B 1122 TYU", brand: "Kawasaki", model: "W175", year: 2020, color: "Hitam" },
  { id: "v4", plate: "F 9090 QWE", brand: "Vespa", model: "Sprint 150", year: 2019, color: "Biru" },
  { id: "v5", plate: "B 5566 POI", brand: "Honda", model: "CB150 Verza", year: 2023, color: "Silver" },
  { id: "v6", plate: "AB 2345 CD", brand: "Royal Enfield", model: "Classic 350", year: 2022, color: "Hitam Doff" },
]

export const technicians: Technician[] = [
  { id: "t1", name: "Agus Pratama", initials: "AP", activeJobs: 3, completedThisMonth: 42, avgHours: 3.2, efficiency: 94 },
  { id: "t2", name: "Bayu Saputra", initials: "BS", activeJobs: 2, completedThisMonth: 38, avgHours: 3.8, efficiency: 88 },
  { id: "t3", name: "Candra Wibowo", initials: "CW", activeJobs: 4, completedThisMonth: 31, avgHours: 4.5, efficiency: 79 },
  { id: "t4", name: "Doni Firmansyah", initials: "DF", activeJobs: 1, completedThisMonth: 27, avgHours: 4.1, efficiency: 83 },
]

export const parts: Part[] = [
  { id: "p1", name: "Oli Mesin Motul 5100 10W-40", sku: "OIL-MTL-5100", category: "Pelumas", stock: 34, minStock: 15, price: 92000, usedInOrders: ["WO-2411", "WO-2409", "WO-2404"] },
  { id: "p2", name: "Kampas Rem Depan CBR", sku: "BRK-CBR-FR", category: "Rem", stock: 6, minStock: 10, price: 145000, usedInOrders: ["WO-2411", "WO-2408"] },
  { id: "p3", name: "Busi Iridium NGK", sku: "SPK-NGK-IR", category: "Pengapian", stock: 48, minStock: 20, price: 78000, usedInOrders: ["WO-2410", "WO-2405"] },
  { id: "p4", name: "Filter Udara Racing", sku: "AIR-RCG-01", category: "Filter", stock: 3, minStock: 8, price: 210000, usedInOrders: ["WO-2407"] },
  { id: "p5", name: "Rantai & Gir Set SSS", sku: "CHN-SSS-428", category: "Transmisi", stock: 11, minStock: 6, price: 520000, usedInOrders: ["WO-2406"] },
  { id: "p6", name: "Ban Belakang Battlax 140/70", sku: "TYR-BTX-140", category: "Ban", stock: 9, minStock: 5, price: 685000, usedInOrders: ["WO-2409"] },
  { id: "p7", name: "Media Vapor Blasting (Glass Bead)", sku: "VBM-GLS-25", category: "Blasting", stock: 2, minStock: 6, price: 340000, usedInOrders: ["WO-2410", "WO-2403"] },
  { id: "p8", name: "Cat Powder Coating Hitam Doff", sku: "PWD-BLK-DOFF", category: "Finishing", stock: 18, minStock: 8, price: 165000, usedInOrders: ["WO-2408", "WO-2402"] },
  { id: "p9", name: "Aki Kering GTZ6V", sku: "BAT-GTZ6V", category: "Kelistrikan", stock: 14, minStock: 6, price: 285000, usedInOrders: ["WO-2405"] },
  { id: "p10", name: "Kampas Kopling Racing", sku: "CLT-RCG-155", category: "Transmisi", stock: 7, minStock: 5, price: 425000, usedInOrders: ["WO-2406"] },
]

export const workOrders: WorkOrder[] = [
  {
    id: "wo1",
    code: "WO-2411",
    customer: customers[0],
    vehicle: vehicles[0],
    service: "Servis",
    complaint: "Servis rutin 10.000 km + ganti kampas rem depan",
    status: "Dikerjakan",
    technician: "Agus Pratama",
    progress: 60,
    createdAt: "25 Sep, 08:15",
    estimatedDone: "25 Sep, 12:00",
    laborCost: 150000,
    usedParts: [
      { partId: "p1", name: "Oli Mesin Motul 5100", qty: 1, price: 92000 },
      { partId: "p2", name: "Kampas Rem Depan CBR", qty: 1, price: 145000 },
    ],
  },
  {
    id: "wo2",
    code: "WO-2410",
    customer: customers[1],
    vehicle: vehicles[1],
    service: "Vapor Blasting",
    complaint: "Vapor blasting blok mesin + cover CVT",
    status: "Menunggu Sparepart",
    technician: "Candra Wibowo",
    progress: 35,
    createdAt: "25 Sep, 09:40",
    estimatedDone: "26 Sep, 15:00",
    laborCost: 450000,
    usedParts: [
      { partId: "p7", name: "Media Vapor Blasting", qty: 1, price: 340000 },
      { partId: "p3", name: "Busi Iridium NGK", qty: 2, price: 78000 },
    ],
  },
  {
    id: "wo3",
    code: "WO-2409",
    customer: customers[2],
    vehicle: vehicles[2],
    service: "Servis",
    complaint: "Ganti ban belakang + tune up mesin",
    status: "Siap Diambil",
    technician: "Bayu Saputra",
    progress: 100,
    createdAt: "24 Sep, 14:20",
    estimatedDone: "25 Sep, 10:00",
    laborCost: 120000,
    usedParts: [
      { partId: "p6", name: "Ban Belakang Battlax", qty: 1, price: 685000 },
      { partId: "p1", name: "Oli Mesin Motul 5100", qty: 1, price: 92000 },
    ],
  },
  {
    id: "wo4",
    code: "WO-2408",
    customer: customers[3],
    vehicle: vehicles[5],
    service: "Kustomisasi",
    complaint: "Repaint tangki powder coating hitam doff + custom jok",
    status: "Dikerjakan",
    technician: "Agus Pratama",
    progress: 45,
    createdAt: "23 Sep, 11:00",
    estimatedDone: "28 Sep, 16:00",
    laborCost: 1250000,
    usedParts: [
      { partId: "p8", name: "Cat Powder Coating Hitam Doff", qty: 2, price: 165000 },
      { partId: "p2", name: "Kampas Rem Depan CBR", qty: 1, price: 145000 },
    ],
  },
  {
    id: "wo5",
    code: "WO-2407",
    customer: customers[4],
    vehicle: vehicles[4],
    service: "Servis",
    complaint: "Motor brebet, ganti filter udara + setel karburator",
    status: "Antrian",
    technician: "Doni Firmansyah",
    progress: 0,
    createdAt: "25 Sep, 10:05",
    estimatedDone: "25 Sep, 14:00",
    laborCost: 90000,
    usedParts: [{ partId: "p4", name: "Filter Udara Racing", qty: 1, price: 210000 }],
  },
  {
    id: "wo6",
    code: "WO-2406",
    customer: customers[5],
    vehicle: vehicles[3],
    service: "Sand Blasting",
    complaint: "Sand blasting rangka + ganti rantai gir set",
    status: "Selesai",
    technician: "Candra Wibowo",
    progress: 100,
    createdAt: "22 Sep, 09:00",
    estimatedDone: "24 Sep, 12:00",
    laborCost: 600000,
    usedParts: [
      { partId: "p5", name: "Rantai & Gir Set SSS", qty: 1, price: 520000 },
      { partId: "p10", name: "Kampas Kopling Racing", qty: 1, price: 425000 },
    ],
  },
]

export const invoices: Invoice[] = [
  {
    id: "inv1",
    number: "INV/2026/09/0142",
    workOrderCode: "WO-2409",
    customer: customers[2],
    vehicle: vehicles[2],
    service: "Servis",
    date: "25 Sep 2026",
    status: "Belum Bayar",
    paidAmount: 0,
    items: [
      { label: "Jasa servis + tune up", qty: 1, price: 120000 },
      { label: "Ban Belakang Battlax 140/70", qty: 1, price: 685000 },
      { label: "Oli Mesin Motul 5100", qty: 1, price: 92000 },
    ],
  },
  {
    id: "inv2",
    number: "INV/2026/09/0141",
    workOrderCode: "WO-2406",
    customer: customers[5],
    vehicle: vehicles[3],
    service: "Sand Blasting",
    date: "24 Sep 2026",
    status: "Lunas",
    method: "QRIS",
    paidAmount: 1545000,
    items: [
      { label: "Jasa sand blasting rangka", qty: 1, price: 600000 },
      { label: "Rantai & Gir Set SSS", qty: 1, price: 520000 },
      { label: "Kampas Kopling Racing", qty: 1, price: 425000 },
    ],
  },
  {
    id: "inv3",
    number: "INV/2026/09/0140",
    workOrderCode: "WO-2405",
    customer: customers[0],
    vehicle: vehicles[0],
    service: "Servis",
    date: "23 Sep 2026",
    status: "Lunas",
    method: "Transfer",
    paidAmount: 248000,
    items: [
      { label: "Jasa servis ringan", qty: 1, price: 85000 },
      { label: "Busi Iridium NGK", qty: 1, price: 78000 },
      { label: "Aki Kering GTZ6V", qty: 1, price: 85000 },
    ],
  },
  {
    id: "inv4",
    number: "INV/2026/09/0138",
    workOrderCode: "WO-2404",
    customer: customers[1],
    vehicle: vehicles[1],
    service: "Vapor Blasting",
    date: "21 Sep 2026",
    status: "Sebagian",
    method: "Transfer",
    paidAmount: 500000,
    items: [
      { label: "Jasa vapor blasting mesin", qty: 1, price: 800000 },
      { label: "Media Vapor Blasting", qty: 1, price: 340000 },
    ],
  },
  {
    id: "inv5",
    number: "INV/2026/09/0135",
    workOrderCode: "WO-2402",
    customer: customers[3],
    vehicle: vehicles[5],
    service: "Kustomisasi",
    date: "18 Sep 2026",
    status: "Jatuh Tempo",
    paidAmount: 0,
    items: [
      { label: "Jasa kustomisasi cafe racer", qty: 1, price: 2500000 },
      { label: "Cat Powder Coating Hitam Doff", qty: 3, price: 165000 },
    ],
  },
]

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    type: "whatsapp",
    title: "Kendaraan Siap Diambil",
    body: "Halo Rina, Kawasaki W175 (B 1122 TYU) sudah selesai & siap diambil. Terima kasih!",
    time: "10:02",
    channel: "0857-1122-3344",
    status: "terkirim",
  },
  {
    id: "n2",
    type: "push",
    title: "Update Status Perbaikan",
    body: "WO-2411 Honda CBR250RR — progres 60%, sedang penggantian kampas rem.",
    time: "09:35",
    channel: "Budi Santoso",
    status: "terkirim",
  },
  {
    id: "n3",
    type: "whatsapp",
    title: "Estimasi Biaya Disetujui",
    body: "Halo Dedi, estimasi biaya kustomisasi Rp3.995.000 menunggu konfirmasi Anda.",
    time: "08:50",
    channel: "0821-5566-7788",
    status: "menunggu",
  },
  {
    id: "n4",
    type: "push",
    title: "Stok Menipis",
    body: "Media Vapor Blasting (Glass Bead) tersisa 2, di bawah batas minimum.",
    time: "08:20",
    channel: "Admin Gudang",
    status: "terkirim",
  },
  {
    id: "n5",
    type: "whatsapp",
    title: "Pengingat Pembayaran",
    body: "Halo Dedi, invoice INV/2026/09/0135 telah jatuh tempo. Mohon segera diselesaikan.",
    time: "Kemarin",
    channel: "0821-5566-7788",
    status: "gagal",
  },
]

// Analytics — last 6 months + last 7 days
export const revenueTrend = [
  { month: "Apr", pendapatan: 48200000, kunjungan: 132 },
  { month: "Mei", pendapatan: 53500000, kunjungan: 148 },
  { month: "Jun", pendapatan: 61200000, kunjungan: 167 },
  { month: "Jul", pendapatan: 57800000, kunjungan: 159 },
  { month: "Agu", pendapatan: 69400000, kunjungan: 182 },
  { month: "Sep", pendapatan: 74100000, kunjungan: 196 },
]

export const dailyVisits = [
  { day: "Sen", masuk: 12, selesai: 10 },
  { day: "Sel", masuk: 15, selesai: 13 },
  { day: "Rab", masuk: 9, selesai: 11 },
  { day: "Kam", masuk: 18, selesai: 15 },
  { day: "Jum", masuk: 21, selesai: 17 },
  { day: "Sab", masuk: 27, selesai: 22 },
  { day: "Min", masuk: 8, selesai: 9 },
]

export const serviceBreakdown = [
  { name: "Servis", value: 38400000, jobs: 118 },
  { name: "Vapor Blasting", value: 15800000, jobs: 24 },
  { name: "Sand Blasting", value: 8900000, jobs: 19 },
  { name: "Kustomisasi", value: 11000000, jobs: 8 },
]

export const monthlyReport = {
  period: "September 2026",
  pendapatan: 74100000,
  pengeluaran: 41300000,
  laba: 32800000,
  labaMargin: 44,
  totalTransaksi: 196,
  rataTransaksi: 378061,
  piutang: 3495000,
}

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

