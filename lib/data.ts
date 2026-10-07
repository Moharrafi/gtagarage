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

export interface StockOutLog {
  id: string
  partId: string
  partName: string
  category: string
  qty: number
  reason?: string
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

export const defaultVouchers: Voucher[] = [
  {
    id: "v-1",
    code: "GTAWELCOME",
    title: "Diskon Selamat Datang GTA",
    type: "fixed",
    value: 25000,
    minPurchase: 100000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Semua Layanan",
    description: "Potongan Rp 25.000 untuk transaksi minimal Rp 100.000",
  },
  {
    id: "v-2",
    code: "VAPOR10",
    title: "Promo Spesial Vapor Blasting 10%",
    type: "percent",
    value: 10,
    maxDiscount: 50000,
    minPurchase: 200000,
    validUntil: "2026-11-30",
    isActive: true,
    targetService: "Vapor Blasting",
    description: "Diskon 10% khusus pengerjaan Vapor Blasting (maksimal Rp 50.000)",
  },
  {
    id: "v-3",
    code: "SAND15",
    title: "Restorasi Rangka Sand Blasting 15%",
    type: "percent",
    value: 15,
    maxDiscount: 60000,
    minPurchase: 250000,
    validUntil: "2026-11-30",
    isActive: true,
    targetService: "Sand Blasting",
    description: "Diskon 15% untuk layanan sand blasting rangka & velg",
  },
  {
    id: "v-4",
    code: "SERVIS20K",
    title: "Potongan Servis Berkala",
    type: "fixed",
    value: 20000,
    minPurchase: 120000,
    validUntil: "2026-10-31",
    isActive: true,
    targetService: "Servis",
    description: "Potongan langsung Rp 20.000 untuk paket servis & ganti oli",
  },
  {
    id: "v-5",
    code: "OJOL15",
    title: "Diskon Spesial Ojek Online",
    type: "percent",
    value: 15,
    maxDiscount: 30000,
    minPurchase: 50000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Servis",
    description: "Diskon apresiasi mitra Gojek & Grab untuk servis harian",
  },
  {
    id: "v-6",
    code: "MODIF50K",
    title: "Cashback Modifikasi & Kustom",
    type: "fixed",
    value: 50000,
    minPurchase: 500000,
    validUntil: "2026-12-31",
    isActive: true,
    targetService: "Kustomisasi",
    description: "Potongan Rp 50.000 khusus project custom builder",
  },
  {
    id: "v-7",
    code: "MEMBERVIP",
    title: "Voucher Member Eksklusif",
    type: "percent",
    value: 10,
    maxDiscount: 100000,
    minPurchase: 300000,
    validUntil: "2026-10-01",
    isActive: false,
    targetService: "Semua Layanan",
    description: "Voucher member expired / dinonaktifkan untuk pengujian filter",
  },
]

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

export const defaultServiceRates: ServiceRate[] = [
  {
    id: "sr-1",
    name: "Servis Ringan / Tune Up Injeksi",
    category: "Servis",
    price: 75000,
    description: "Pembersihan throttle body, cek busi, filter udara, resetting ECU",
  },
  {
    id: "sr-2",
    name: "Servis CVT Lengkap & Pembersihan",
    category: "Servis",
    price: 65000,
    description: "Bongkar pulley CVT, amplas mangkok kopling, cek roller & v-belt, pelumasan grease high-temp",
  },
  {
    id: "sr-3",
    name: "Servis Besar / Turun Mesin Sebagian",
    category: "Servis",
    price: 350000,
    description: "Skir klep, ganti ring piston/seher, bersihkan ruang bakar kerak karbon",
  },
  {
    id: "sr-4",
    name: "Ganti Oli Mesin & Gardan",
    category: "Servis",
    price: 25000,
    description: "Jasa kuras dan isi oli baru, cek kebocoran baut pembuangan",
  },
  {
    id: "sr-5",
    name: "Vapor Blasting Crankcase Motor Bebek/Matic",
    category: "Vapor Blasting",
    price: 250000,
    description: "Pembersihan basah media glass bead untuk crankcase kiri-kanan, hasil satin cerah pabrikan",
  },
  {
    id: "sr-6",
    name: "Vapor Blasting Head & Blok Silinder 150cc",
    category: "Vapor Blasting",
    price: 300000,
    description: "Vapor blasting sirip pendingin head silinder bebas kerak tanpa merusak clearance",
  },
  {
    id: "sr-7",
    name: "Vapor Blasting Full Engine 250cc Twin",
    category: "Vapor Blasting",
    price: 850000,
    description: "Paket lengkap seluruh komponen mesin 250cc luar dalam hingga kinclong total",
  },
  {
    id: "sr-8",
    name: "Sand Blasting Rangka Motor Bebek/Matic",
    category: "Sand Blasting",
    price: 450000,
    description: "Rontokkan cat lama & karat hingga pori-pori besi bersih untuk siap cat dasar/epoxy",
  },
  {
    id: "sr-9",
    name: "Sand Blasting Velg Sepasang Ring 14-17",
    category: "Sand Blasting",
    price: 250000,
    description: "Kupas tuntas cat velg depan belakang sebelum repaint atau powder coating",
  },
  {
    id: "sr-10",
    name: "Sand Blasting Knalpot & Coating Anti Karat",
    category: "Sand Blasting",
    price: 200000,
    description: "Bersihkan leher & tabung knalpot dari gosong/karat",
  },
  {
    id: "sr-11",
    name: "Kustom Bracket & Potong Rangka Scrambler",
    category: "Kustomisasi",
    price: 350000,
    description: "Pemotongan subframe belakang, bending pipa U, las argon kuat rapi",
  },
  {
    id: "sr-12",
    name: "Custom Header Pipe Stainless 304",
    category: "Kustomisasi",
    price: 650000,
    description: "Bikin leher knalpot stainless steel bending presisi sesuai konfigurasi mesin",
  },
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
  { id: "c-1", name: "Hendra Gunawan", phone: "0812-3456-7890", initials: "HG" },
  { id: "c-2", name: "Dimas Aditya", phone: "0857-1234-5678", initials: "DA" },
  { id: "c-3", name: "Kevin Sanjaya", phone: "0819-8765-4321", initials: "KS" },
  { id: "c-4", name: "Randy Pratama", phone: "0813-9988-7766", initials: "RP" },
  { id: "c-5", name: "Ibu Sri Wahyuni", phone: "0818-4455-6677", initials: "SW" },
  { id: "c-6", name: "Angga Wijaya", phone: "0877-2233-4411", initials: "AW" },
  { id: "c-7", name: "Rahmat Hidayat", phone: "0852-3344-5566", initials: "RH" },
  { id: "c-8", name: "Ronald Sinaga", phone: "0811-9876-5432", initials: "RS" },
]

export const vehicles: Vehicle[] = [
  { id: "v-1", plate: "B 4521 SKA", brand: "Honda", model: "Vario 160", year: 2023, color: "Matte Black" },
  { id: "v-2", plate: "B 6789 TZX", brand: "Yamaha", model: "RX-King 135", year: 2004, color: "Hitam Emas" },
  { id: "v-3", plate: "D 3312 ABC", brand: "Vespa", model: "Sprint 150 i-Get", year: 2022, color: "Kuning" },
  { id: "v-4", plate: "B 3120 PQR", brand: "Honda", model: "CBR 250RR", year: 2021, color: "Merah HRC" },
  { id: "v-5", plate: "B 5543 WLN", brand: "Yamaha", model: "NMAX 155 Old", year: 2019, color: "Abu-Abu Doff" },
  { id: "v-6", plate: "B 6214 KPM", brand: "Kawasaki", model: "Ninja 150 RR", year: 2015, color: "Hijau Lime" },
  { id: "v-7", plate: "B 4098 UTT", brand: "Honda", model: "PCX 160", year: 2022, color: "Putih Mutiara" },
  { id: "v-8", plate: "B 1980 CLS", brand: "Yamaha", model: "Scorpio 225 Scrambler", year: 2010, color: "Silver Brushed" },
]

export const technicians: Technician[] = [
  {
    id: "tech-bonyah",
    name: "Bonyah",
    initials: "BY",
    activeJobs: 2,
    completedThisMonth: 28,
    avgHours: 2.5,
    efficiency: 95,
    phone: "0812-3344-5501",
    specialty: "Spesialis Mesin 4-Tak & Vapor Blasting",
    status: "Aktif",
  },
  {
    id: "tech-agus",
    name: "Agus Riyadi",
    initials: "AR",
    activeJobs: 1,
    completedThisMonth: 22,
    avgHours: 3.2,
    efficiency: 91,
    phone: "0813-4455-6602",
    specialty: "Sand Blasting & Restorasi Rangka",
    status: "Aktif",
  },
  {
    id: "tech-bayu",
    name: "Bayu Saputra",
    initials: "BS",
    activeJobs: 3,
    completedThisMonth: 34,
    avgHours: 1.8,
    efficiency: 96,
    phone: "0857-5566-7703",
    specialty: "CVT Matic & Servis Injeksi",
    status: "Aktif",
  },
  {
    id: "tech-dedi",
    name: "Dedi Kurniawan",
    initials: "DK",
    activeJobs: 1,
    completedThisMonth: 18,
    avgHours: 4.0,
    efficiency: 88,
    phone: "0819-6677-8804",
    specialty: "Kustomisasi & Fabrikasi Knalpot",
    status: "Aktif",
  },
  {
    id: "tech-fajar",
    name: "Fajar Maulana",
    initials: "FM",
    activeJobs: 0,
    completedThisMonth: 19,
    avgHours: 2.1,
    efficiency: 92,
    phone: "0877-7788-9905",
    specialty: "Kelistrikan & Detailing Pro",
    status: "Istirahat",
  },
]

export const parts: Part[] = [
  {
    id: "p-1",
    name: "Media Glass Bead Mesh #100-#170 (25Kg)",
    sku: "VBM-GLS-100",
    category: "Media Glass Bead",
    stock: 12,
    minStock: 5,
    buyPrice: 450000,
    price: 650000,
    usedInOrders: ["WO-2402", "WO-2406"],
  },
  {
    id: "p-2",
    name: "Cairan Degreaser Engine Cleaner (5L)",
    sku: "VBM-DEG-05L",
    category: "Cairan Degreaser & Pembersih",
    stock: 3,
    minStock: 5,
    buyPrice: 120000,
    price: 175000,
    usedInOrders: ["WO-2402"],
  },
  {
    id: "p-3",
    name: "Cairan Anti Karat Metal Sealant 250ml",
    sku: "VBM-SEA-250",
    category: "Anti Karat & Sealant",
    stock: 2,
    minStock: 4,
    buyPrice: 75000,
    price: 125000,
    usedInOrders: ["WO-2402", "WO-2406"],
  },
  {
    id: "p-4",
    name: "Ultrasonic Cleaner Solution 1L",
    sku: "VBM-ULT-01L",
    category: "Part Ultrasonic Clean",
    stock: 8,
    minStock: 3,
    buyPrice: 65000,
    price: 110000,
    usedInOrders: [],
  },
  {
    id: "p-5",
    name: "Pasir Garnet Mesh 80 (25Kg)",
    sku: "SBM-GAR-80",
    category: "Pasir Garnet",
    stock: 15,
    minStock: 5,
    buyPrice: 180000,
    price: 260000,
    usedInOrders: ["WO-2403"],
  },
  {
    id: "p-6",
    name: "Pasir Silika Bangka Mesh 60 (25Kg)",
    sku: "SBM-SIL-60",
    category: "Pasir Silika",
    stock: 22,
    minStock: 8,
    buyPrice: 85000,
    price: 135000,
    usedInOrders: ["WO-2408"],
  },
  {
    id: "p-7",
    name: "Nozzle Sandblaster Boron Carbide 6mm",
    sku: "SBM-NOZ-006",
    category: "Nozzle Blaster & Sparepart",
    stock: 4,
    minStock: 2,
    buyPrice: 150000,
    price: 230000,
    usedInOrders: [],
  },
  {
    id: "p-8",
    name: "Oli Motul 5100 4T 10W-40 Technosynthese (1L)",
    sku: "OIL-MTL-5100",
    category: "Pelumas & Oli",
    stock: 28,
    minStock: 10,
    buyPrice: 115000,
    price: 155000,
    usedInOrders: ["WO-2405"],
  },
  {
    id: "p-9",
    name: "Oli Yamalube Super Matic 10W-40 (1L)",
    sku: "OIL-YML-MAT",
    category: "Pelumas & Oli",
    stock: 34,
    minStock: 12,
    buyPrice: 52000,
    price: 72000,
    usedInOrders: [],
  },
  {
    id: "p-10",
    name: "Kampas Rem Depan Honda Vario / Beat",
    sku: "BRK-HON-VAR",
    category: "Sistem Rem",
    stock: 16,
    minStock: 6,
    buyPrice: 35000,
    price: 55000,
    usedInOrders: ["WO-2401"],
  },
  {
    id: "p-11",
    name: "Busi NGK Iridium CPR9EAIX-9",
    sku: "SPK-NGK-CPR9",
    category: "Pengapian & Busi",
    stock: 14,
    minStock: 5,
    buyPrice: 85000,
    price: 125000,
    usedInOrders: ["WO-2407"],
  },
  {
    id: "p-12",
    name: "V-Belt & Roller Set Yamaha NMAX 155",
    sku: "TRN-YMH-NMX",
    category: "Transmisi & Rantai",
    stock: 6,
    minStock: 4,
    buyPrice: 165000,
    price: 235000,
    usedInOrders: ["WO-2405"],
  },
  {
    id: "p-13",
    name: "Filter Udara Honda PCX 160",
    sku: "AIR-HON-PCX",
    category: "Filter Udara & Oli",
    stock: 10,
    minStock: 4,
    buyPrice: 55000,
    price: 85000,
    usedInOrders: ["WO-2407"],
  },
  {
    id: "p-14",
    name: "Aki Kering GS Astra GTZ6V 12V 5Ah",
    sku: "BAT-GSA-GTZ6",
    category: "Kelistrikan & Aki",
    stock: 1,
    minStock: 3,
    buyPrice: 230000,
    price: 310000,
    usedInOrders: [],
  },
  {
    id: "p-15",
    name: "Serbuk Powder Coating Glossy Black 5Kg",
    sku: "PWD-BLK-GLS",
    category: "Powder Coating",
    stock: 7,
    minStock: 3,
    buyPrice: 210000,
    price: 320000,
    usedInOrders: ["WO-2408"],
  },
  {
    id: "p-16",
    name: "Baut Probolt Stainless Hex Flange M6 Set (10 Pcs)",
    sku: "BLT-PRB-M6",
    category: "Baut Probolt & Detailing",
    stock: 12,
    minStock: 5,
    buyPrice: 45000,
    price: 75000,
    usedInOrders: ["WO-2404"],
  },
]

export const workOrders: WorkOrder[] = [
  {
    id: "wo-1",
    code: "WO-2401",
    customer: { id: "c-1", name: "Hendra Gunawan", phone: "0812-3456-7890", initials: "HG" },
    vehicle: { id: "v-1", plate: "B 4521 SKA", brand: "Honda", model: "Vario 160", year: 2023, color: "Matte Black" },
    service: "Servis",
    complaint: "Tarikan gas gredek di tanjakan, rem depan bunyi decit",
    status: "Antrian",
    technician: "Bayu Saputra",
    progress: 0,
    laborCost: 65000,
    usedParts: [{ partId: "p-10", name: "Kampas Rem Depan Honda Vario / Beat", qty: 1, price: 55000 }],
    estimatedDone: "Sore ini 16:30",
    createdAt: "2026-10-07T08:15:00.000Z",
  },
  {
    id: "wo-2",
    code: "WO-2402",
    customer: { id: "c-2", name: "Dimas Aditya", phone: "0857-1234-5678", initials: "DA" },
    vehicle: { id: "v-2", plate: "B 6789 TZX", brand: "Yamaha", model: "RX-King 135", year: 2004, color: "Hitam Emas" },
    service: "Vapor Blasting",
    complaint: "Blasting full head silinder & crankcase blok kopling agar tampilan mulus pabrik",
    status: "Dikerjakan",
    technician: "Bonyah",
    progress: 60,
    laborCost: 550000,
    usedParts: [{ partId: "p-3", name: "Cairan Anti Karat Metal Sealant 250ml", qty: 1, price: 125000 }],
    estimatedDone: "Besok 12:00",
    createdAt: "2026-10-06T10:00:00.000Z",
  },
  {
    id: "wo-3",
    code: "WO-2403",
    customer: { id: "c-3", name: "Kevin Sanjaya", phone: "0819-8765-4321", initials: "KS" },
    vehicle: { id: "v-3", plate: "D 3312 ABC", brand: "Vespa", model: "Sprint 150 i-Get", year: 2022, color: "Kuning" },
    service: "Sand Blasting",
    complaint: "Kupas cat velg depan belakang & cover CVT siap cat baru",
    status: "Dikerjakan",
    technician: "Agus Riyadi",
    progress: 60,
    laborCost: 250000,
    usedParts: [],
    estimatedDone: "Sore ini 17:00",
    createdAt: "2026-10-06T14:30:00.000Z",
  },
  {
    id: "wo-4",
    code: "WO-2404",
    customer: { id: "c-4", name: "Randy Pratama", phone: "0813-9988-7766", initials: "RP" },
    vehicle: { id: "v-4", plate: "B 3120 PQR", brand: "Honda", model: "CBR 250RR", year: 2021, color: "Merah HRC" },
    service: "Kustomisasi",
    complaint: "Custom pipa knalpot stainless steel & pasang baut probolt",
    status: "Menunggu Sparepart",
    technician: "Dedi Kurniawan",
    progress: 30,
    laborCost: 650000,
    usedParts: [{ partId: "p-16", name: "Baut Probolt Stainless Hex Flange M6 Set (10 Pcs)", qty: 2, price: 75000 }],
    estimatedDone: "Jumat 15:00",
    createdAt: "2026-10-05T11:20:00.000Z",
  },
  {
    id: "wo-5",
    code: "WO-2405",
    customer: { id: "c-5", name: "Ibu Sri Wahyuni", phone: "0818-4455-6677", initials: "SW" },
    vehicle: { id: "v-5", plate: "B 5543 WLN", brand: "Yamaha", model: "NMAX 155 Old", year: 2019, color: "Abu-Abu Doff" },
    service: "Servis",
    complaint: "Ganti v-belt CVT & oli mesin Motul 5100",
    status: "Siap Diambil",
    technician: "Bayu Saputra",
    progress: 90,
    laborCost: 90000,
    usedParts: [
      { partId: "p-8", name: "Oli Motul 5100 4T 10W-40 Technosynthese (1L)", qty: 1, price: 155000 },
      { partId: "p-12", name: "V-Belt & Roller Set Yamaha NMAX 155", qty: 1, price: 235000 },
    ],
    estimatedDone: "Selesai",
    createdAt: "2026-10-07T07:45:00.000Z",
    completedAt: "2026-10-07T09:30:00.000Z",
  },
  {
    id: "wo-6",
    code: "WO-2406",
    customer: { id: "c-6", name: "Angga Wijaya", phone: "0877-2233-4411", initials: "AW" },
    vehicle: { id: "v-6", plate: "B 6214 KPM", brand: "Kawasaki", model: "Ninja 150 RR", year: 2015, color: "Hijau Lime" },
    service: "Vapor Blasting",
    complaint: "Vapor blasting blok silinder Super KIPS & karburator Keihin PWK",
    status: "Siap Diambil",
    technician: "Bonyah",
    progress: 90,
    laborCost: 300000,
    usedParts: [{ partId: "p-3", name: "Cairan Anti Karat Metal Sealant 250ml", qty: 1, price: 125000 }],
    estimatedDone: "Selesai",
    createdAt: "2026-10-06T09:00:00.000Z",
    completedAt: "2026-10-06T16:00:00.000Z",
  },
  {
    id: "wo-7",
    code: "WO-2407",
    customer: { id: "c-7", name: "Rahmat Hidayat", phone: "0852-3344-5566", initials: "RH" },
    vehicle: { id: "v-7", plate: "B 4098 UTT", brand: "Honda", model: "PCX 160", year: 2022, color: "Putih Mutiara" },
    service: "Servis",
    complaint: "Tune up injeksi, ganti filter udara dan busi iridium",
    status: "Selesai",
    technician: "Bayu Saputra",
    progress: 100,
    laborCost: 75000,
    usedParts: [
      { partId: "p-13", name: "Filter Udara Honda PCX 160", qty: 1, price: 85000 },
      { partId: "p-11", name: "Busi NGK Iridium CPR9EAIX-9", qty: 1, price: 125000 },
    ],
    estimatedDone: "Selesai",
    createdAt: "2026-10-07T07:00:00.000Z",
    completedAt: "2026-10-07T08:30:00.000Z",
  },
  {
    id: "wo-8",
    code: "WO-2408",
    customer: { id: "c-8", name: "Ronald Sinaga", phone: "0811-9876-5432", initials: "RS" },
    vehicle: { id: "v-8", plate: "B 1980 CLS", brand: "Yamaha", model: "Scorpio 225 Scrambler", year: 2010, color: "Silver Brushed" },
    service: "Sand Blasting",
    complaint: "Sand blasting rangka utuh & velg sebelum dicat",
    status: "Selesai",
    technician: "Agus Riyadi",
    progress: 100,
    laborCost: 700000,
    usedParts: [{ partId: "p-15", name: "Serbuk Powder Coating Glossy Black 5Kg", qty: 1, price: 320000 }],
    estimatedDone: "Selesai",
    createdAt: "2026-10-04T08:30:00.000Z",
    completedAt: "2026-10-05T15:00:00.000Z",
  },
]

export const invoices: Invoice[] = [
  {
    id: "inv-1",
    number: "INV/2026/10/001",
    workOrderCode: "WO-2407",
    customer: { id: "c-7", name: "Rahmat Hidayat", phone: "0852-3344-5566", initials: "RH" },
    vehicle: { id: "v-7", plate: "B 4098 UTT", brand: "Honda", model: "PCX 160", year: 2022, color: "Putih Mutiara" },
    service: "Servis",
    items: [
      { label: "Jasa Tune Up Injeksi", qty: 1, price: 75000 },
      { label: "Filter Udara Honda PCX 160", qty: 1, price: 85000 },
      { label: "Busi NGK Iridium CPR9EAIX-9", qty: 1, price: 125000 },
    ],
    status: "Lunas",
    method: "QRIS",
    date: "7 Okt 2026",
    paidAmount: 285000,
    discountAmount: 0,
    paymentRef: "MID-QRIS-992144",
    paidAt: "08:45 WIB",
    bankName: "GoPay / QRIS",
    createdAt: "2026-10-07T08:45:00.000Z",
  },
  {
    id: "inv-2",
    number: "INV/2026/10/002",
    workOrderCode: "WO-2408",
    customer: { id: "c-8", name: "Ronald Sinaga", phone: "0811-9876-5432", initials: "RS" },
    vehicle: { id: "v-8", plate: "B 1980 CLS", brand: "Yamaha", model: "Scorpio 225 Scrambler", year: 2010, color: "Silver Brushed" },
    service: "Sand Blasting",
    items: [
      { label: "Jasa Sand Blasting Rangka & Velg", qty: 1, price: 700000 },
      { label: "Serbuk Powder Coating Glossy Black 5Kg", qty: 1, price: 320000 },
    ],
    status: "Lunas",
    method: "Tunai",
    date: "5 Okt 2026",
    paidAmount: 995000,
    discountType: "voucher",
    discountCode: "GTAWELCOME",
    discountAmount: 25000,
    paidAt: "15:20 WIB",
    createdAt: "2026-10-05T15:20:00.000Z",
  },
  {
    id: "inv-3",
    number: "INV/2026/10/003",
    workOrderCode: "WO-2405",
    customer: { id: "c-5", name: "Ibu Sri Wahyuni", phone: "0818-4455-6677", initials: "SW" },
    vehicle: { id: "v-5", plate: "B 5543 WLN", brand: "Yamaha", model: "NMAX 155 Old", year: 2019, color: "Abu-Abu Doff" },
    service: "Servis",
    items: [
      { label: "Jasa Servis CVT & Ganti Oli", qty: 1, price: 90000 },
      { label: "Oli Motul 5100 4T 10W-40 Technosynthese (1L)", qty: 1, price: 155000 },
      { label: "V-Belt & Roller Set Yamaha NMAX 155", qty: 1, price: 235000 },
    ],
    status: "Belum Bayar",
    date: "7 Okt 2026",
    paidAmount: 0,
    discountAmount: 0,
    createdAt: "2026-10-07T09:35:00.000Z",
  },
  {
    id: "inv-4",
    number: "INV/2026/10/004",
    workOrderCode: "WO-2406",
    customer: { id: "c-6", name: "Angga Wijaya", phone: "0877-2233-4411", initials: "AW" },
    vehicle: { id: "v-6", plate: "B 6214 KPM", brand: "Kawasaki", model: "Ninja 150 RR", year: 2015, color: "Hijau Lime" },
    service: "Vapor Blasting",
    items: [
      { label: "Jasa Vapor Blasting Blok & Karburator", qty: 1, price: 300000 },
      { label: "Cairan Anti Karat Metal Sealant 250ml", qty: 1, price: 125000 },
    ],
    status: "Belum Bayar",
    discountType: "voucher",
    discountCode: "VAPOR10",
    discountAmount: 42500,
    date: "6 Okt 2026",
    paidAmount: 0,
    createdAt: "2026-10-06T16:05:00.000Z",
  },
  {
    id: "inv-5",
    number: "INV/2026/09/088",
    workOrderCode: "",
    customer: { id: "c-corp", name: "PT Antar Kilat Express", phone: "0812-9988-1122", initials: "AK" },
    vehicle: { id: "v-corp", plate: "B 6543 TKG", brand: "Honda", model: "Beat FI Fleet", year: 2023, color: "Hitam" },
    service: "Servis",
    items: [{ label: "Paket Servis Rutin 3 Unit Motor Fleet Kurir", qty: 3, price: 140000 }],
    status: "Jatuh Tempo",
    date: "28 Sep 2026",
    paidAmount: 0,
    discountAmount: 0,
    createdAt: "2026-09-28T10:00:00.000Z",
  },
  {
    id: "inv-6",
    number: "INV/2026/10/005",
    workOrderCode: "WO-2404",
    customer: { id: "c-4", name: "Randy Pratama", phone: "0813-9988-7766", initials: "RP" },
    vehicle: { id: "v-4", plate: "B 3120 PQR", brand: "Honda", model: "CBR 250RR", year: 2021, color: "Merah HRC" },
    service: "Kustomisasi",
    items: [
      { label: "Jasa Pembuatan Custom Header Pipe Stainless", qty: 1, price: 650000 },
      { label: "Baut Probolt Stainless Hex Flange M6 Set (10 Pcs)", qty: 2, price: 75000 },
    ],
    status: "Sebagian",
    method: "Transfer",
    date: "5 Okt 2026",
    paidAmount: 400000,
    discountAmount: 0,
    adminFee: 4000,
    paymentRef: "MID-VA-BCA-88772",
    paidAt: "11:40 WIB",
    bankName: "BCA Virtual Account",
    createdAt: "2026-10-05T11:40:00.000Z",
  },
]

export const notifications: NotificationItem[] = [
  {
    id: "notif-1",
    type: "push",
    title: "Stok Suku Cadang Kritis",
    body: "Aki Kering GS Astra GTZ6V (BAT-GSA-GTZ6) tersisa 1 unit, di bawah batas minimum (3 unit).",
    time: "08:10",
    channel: "Gudang Suku Cadang",
    status: "terkirim",
    read: false,
    linkTab: "stok",
    createdAt: "2026-10-07T08:10:00.000Z",
  },
  {
    id: "notif-2",
    type: "push",
    title: "Stok Suku Cadang Menipis",
    body: "Cairan Degreaser Engine Cleaner 5L (VBM-DEG-05L) tersisa 3 drigen, di bawah batas minimum (5).",
    time: "08:12",
    channel: "Gudang Suku Cadang",
    status: "terkirim",
    read: false,
    linkTab: "stok",
    createdAt: "2026-10-07T08:12:00.000Z",
  },
  {
    id: "notif-3",
    type: "whatsapp",
    title: "Kendaraan Siap Diambil",
    body: "Halo Ibu Sri Wahyuni, Yamaha NMAX 155 (B 5543 WLN) sudah selesai diservis & siap diambil di GTA GARAGE.",
    time: "09:32",
    channel: "0818-4455-6677",
    status: "terkirim",
    read: false,
    linkTab: "pekerjaan",
    createdAt: "2026-10-07T09:32:00.000Z",
  },
  {
    id: "notif-4",
    type: "whatsapp",
    title: "Kendaraan Siap Diambil",
    body: "Halo Mas Angga Wijaya, Kawasaki Ninja 150 RR (B 6214 KPM) hasil vapor blasting blok silinder sudah selesai & siap diambil.",
    time: "Kemarin",
    channel: "0877-2233-4411",
    status: "terkirim",
    read: true,
    linkTab: "pekerjaan",
    createdAt: "2026-10-06T16:02:00.000Z",
  },
  {
    id: "notif-5",
    type: "push",
    title: "SPK Pengerjaan Baru",
    body: "WO-2401 Honda Vario 160 (B 4521 SKA) an. Hendra Gunawan telah masuk antrian servis.",
    time: "08:15",
    channel: "Bayu Saputra",
    status: "terkirim",
    read: true,
    linkTab: "pekerjaan",
    createdAt: "2026-10-07T08:15:00.000Z",
  },
  {
    id: "notif-6",
    type: "whatsapp",
    title: "Pengingat Pembayaran Jatuh Tempo",
    body: "Halo PT Antar Kilat Express, tagihan invoice INV/2026/09/088 sebesar Rp 420.000 telah jatuh tempo. Mohon segera diselesaikan.",
    time: "29 Sep",
    channel: "0812-9988-1122",
    status: "terkirim",
    read: false,
    linkTab: "invoice",
    createdAt: "2026-09-29T09:00:00.000Z",
  },
]

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
    name: "Owner",
    username: "owner",
    role: "Owner",
    avatarInitials: "OW",
    phone: "0812-8888-9102",
    password: "owner",
    description: "Pemilik Bengkel · Akses Penuh ke Finansial, Tarif, Pengaturan, & Operasional",
  },
  {
    id: "usr-admin",
    name: "Admin",
    username: "admin",
    role: "Admin",
    avatarInitials: "AD",
    phone: "0813-2233-4455",
    password: "admin",
    description: "Admin & Kasir · Akses Penuh ke Kasir, Order, Stok, Voucher, & WhatsApp",
  },
  {
    id: "usr-mekanik",
    name: "Mekanik",
    username: "mekanik",
    role: "Mekanik",
    avatarInitials: "MK",
    phone: "0857-1122-3344",
    password: "mekanik",
    description: "Mekanik Lapangan · Akses Lihat Saja (Read-Only: Status Order & Stok)",
  },
]
