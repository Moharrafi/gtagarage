import pg from 'pg'
const { Pool } = pg

const rawConn = process.env.DATABASE_URL
const connectionString = rawConn ? rawConn.replace(/[?&]sslmode=[^&]+/g, '') : undefined
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

const technicians = [
  {
    id: 'tech-bonyah',
    name: 'Bonyah',
    initials: 'BY',
    active_jobs: 2,
    completed_this_month: 28,
    avg_hours: 2.5,
    efficiency: 95,
    phone: '0812-3344-5501',
    specialty: 'Spesialis Mesin 4-Tak & Vapor Blasting',
    status: 'Aktif'
  },
  {
    id: 'tech-agus',
    name: 'Agus Riyadi',
    initials: 'AR',
    active_jobs: 1,
    completed_this_month: 22,
    avg_hours: 3.2,
    efficiency: 91,
    phone: '0813-4455-6602',
    specialty: 'Sand Blasting & Restorasi Rangka',
    status: 'Aktif'
  },
  {
    id: 'tech-bayu',
    name: 'Bayu Saputra',
    initials: 'BS',
    active_jobs: 3,
    completed_this_month: 34,
    avg_hours: 1.8,
    efficiency: 96,
    phone: '0857-5566-7703',
    specialty: 'CVT Matic & Servis Injeksi',
    status: 'Aktif'
  },
  {
    id: 'tech-dedi',
    name: 'Dedi Kurniawan',
    initials: 'DK',
    active_jobs: 1,
    completed_this_month: 18,
    avg_hours: 4.0,
    efficiency: 88,
    phone: '0819-6677-8804',
    specialty: 'Kustomisasi & Fabrikasi Knalpot',
    status: 'Aktif'
  },
  {
    id: 'tech-fajar',
    name: 'Fajar Maulana',
    initials: 'FM',
    active_jobs: 0,
    completed_this_month: 19,
    avg_hours: 2.1,
    efficiency: 92,
    phone: '0877-7788-9905',
    specialty: 'Kelistrikan & Detailing Pro',
    status: 'Istirahat'
  }
]

const serviceRates = [
  {
    id: 'sr-1',
    name: 'Servis Ringan / Tune Up Injeksi',
    category: 'Servis',
    price: 75000,
    description: 'Pembersihan throttle body, cek busi, filter udara, resetting ECU'
  },
  {
    id: 'sr-2',
    name: 'Servis CVT Lengkap & Pembersihan',
    category: 'Servis',
    price: 65000,
    description: 'Bongkar pulley CVT, amplas mangkok kopling, cek roller & v-belt, pelumasan grease high-temp'
  },
  {
    id: 'sr-3',
    name: 'Servis Besar / Turun Mesin Sebagian',
    category: 'Servis',
    price: 350000,
    description: 'Skir klep, ganti ring piston/seher, bersihkan ruang bakar kerak karbon'
  },
  {
    id: 'sr-4',
    name: 'Ganti Oli Mesin & Gardan',
    category: 'Servis',
    price: 25000,
    description: 'Jasa kuras dan isi oli baru, cek kebocoran baut pembuangan'
  },
  {
    id: 'sr-5',
    name: 'Vapor Blasting Crankcase Motor Bebek/Matic',
    category: 'Vapor Blasting',
    price: 250000,
    description: 'Pembersihan basah media glass bead untuk crankcase kiri-kanan, hasil satin cerah pabrikan'
  },
  {
    id: 'sr-6',
    name: 'Vapor Blasting Head & Blok Silinder 150cc',
    category: 'Vapor Blasting',
    price: 300000,
    description: 'Vapor blasting sirip pendingin head silinder bebas kerak tanpa merusak clearance'
  },
  {
    id: 'sr-7',
    name: 'Vapor Blasting Full Engine 250cc Twin',
    category: 'Vapor Blasting',
    price: 850000,
    description: 'Paket lengkap seluruh komponen mesin 250cc luar dalam hingga kinclong total'
  },
  {
    id: 'sr-8',
    name: 'Sand Blasting Rangka Motor Bebek/Matic',
    category: 'Sand Blasting',
    price: 450000,
    description: 'Rontokkan cat lama & karat hingga pori-pori besi bersih untuk siap cat dasar/epoxy'
  },
  {
    id: 'sr-9',
    name: 'Sand Blasting Velg Sepasang Ring 14-17',
    category: 'Sand Blasting',
    price: 250000,
    description: 'Kupas tuntas cat velg depan belakang sebelum repaint atau powder coating'
  },
  {
    id: 'sr-10',
    name: 'Sand Blasting Knalpot & Coating Anti Karat',
    category: 'Sand Blasting',
    price: 200000,
    description: 'Bersihkan leher & tabung knalpot dari gosong/karat'
  },
  {
    id: 'sr-11',
    name: 'Kustom Bracket & Potong Rangka Scrambler',
    category: 'Kustomisasi',
    price: 350000,
    description: 'Pemotongan subframe belakang, bending pipa U, las argon kuat rapi'
  },
  {
    id: 'sr-12',
    name: 'Custom Header Pipe Stainless 304',
    category: 'Kustomisasi',
    price: 650000,
    description: 'Bikin leher knalpot stainless steel bending presisi sesuai konfigurasi mesin'
  }
]

const vouchers = [
  {
    id: 'v-1',
    code: 'GTAWELCOME',
    title: 'Diskon Selamat Datang GTA',
    type: 'fixed',
    value: 25000,
    max_discount: null,
    min_purchase: 100000,
    valid_until: '2026-12-31',
    is_active: true,
    target_service: 'Semua Layanan',
    description: 'Potongan Rp 25.000 untuk transaksi minimal Rp 100.000'
  },
  {
    id: 'v-2',
    code: 'VAPOR10',
    title: 'Promo Spesial Vapor Blasting 10%',
    type: 'percent',
    value: 10,
    max_discount: 50000,
    min_purchase: 200000,
    valid_until: '2026-11-30',
    is_active: true,
    target_service: 'Vapor Blasting',
    description: 'Diskon 10% khusus pengerjaan Vapor Blasting (maksimal Rp 50.000)'
  },
  {
    id: 'v-3',
    code: 'SAND15',
    title: 'Restorasi Rangka Sand Blasting 15%',
    type: 'percent',
    value: 15,
    max_discount: 60000,
    min_purchase: 250000,
    valid_until: '2026-11-30',
    is_active: true,
    target_service: 'Sand Blasting',
    description: 'Diskon 15% untuk layanan sand blasting rangka & velg'
  },
  {
    id: 'v-4',
    code: 'SERVIS20K',
    title: 'Potongan Servis Berkala',
    type: 'fixed',
    value: 20000,
    max_discount: null,
    min_purchase: 120000,
    valid_until: '2026-10-31',
    is_active: true,
    target_service: 'Servis',
    description: 'Potongan langsung Rp 20.000 untuk paket servis & ganti oli'
  },
  {
    id: 'v-5',
    code: 'OJOL15',
    title: 'Diskon Spesial Ojek Online',
    type: 'percent',
    value: 15,
    max_discount: 30000,
    min_purchase: 50000,
    valid_until: '2026-12-31',
    is_active: true,
    target_service: 'Servis',
    description: 'Diskon apresiasi mitra Gojek & Grab untuk servis harian'
  },
  {
    id: 'v-6',
    code: 'MODIF50K',
    title: 'Cashback Modifikasi & Kustom',
    type: 'fixed',
    value: 50000,
    max_discount: null,
    min_purchase: 500000,
    valid_until: '2026-12-31',
    is_active: true,
    target_service: 'Kustomisasi',
    description: 'Potongan Rp 50.000 khusus project custom builder'
  },
  {
    id: 'v-7',
    code: 'MEMBERVIP',
    title: 'Voucher Member Eksklusif',
    type: 'percent',
    value: 10,
    max_discount: 100000,
    min_purchase: 300000,
    valid_until: '2026-10-01',
    is_active: false,
    target_service: 'Semua Layanan',
    description: 'Voucher member expired / dinonaktifkan untuk pengujian filter'
  }
]

const parts = [
  // Vapor Blasting
  {
    id: 'p-1',
    name: 'Media Glass Bead Mesh #100-#170 (25Kg)',
    sku: 'VBM-GLS-100',
    category: 'Media Glass Bead',
    stock: 12,
    min_stock: 5,
    buy_price: 450000,
    price: 650000,
    used_in_orders: ['WO-2402', 'WO-2406']
  },
  {
    id: 'p-2',
    name: 'Cairan Degreaser Engine Cleaner (5L)',
    sku: 'VBM-DEG-05L',
    category: 'Cairan Degreaser & Pembersih',
    stock: 3,
    min_stock: 5, // LOW STOCK
    buy_price: 120000,
    price: 175000,
    used_in_orders: ['WO-2402']
  },
  {
    id: 'p-3',
    name: 'Cairan Anti Karat Metal Sealant 250ml',
    sku: 'VBM-SEA-250',
    category: 'Anti Karat & Sealant',
    stock: 2,
    min_stock: 4, // LOW STOCK
    buy_price: 75000,
    price: 125000,
    used_in_orders: ['WO-2402', 'WO-2406']
  },
  {
    id: 'p-4',
    name: 'Ultrasonic Cleaner Solution 1L',
    sku: 'VBM-ULT-01L',
    category: 'Part Ultrasonic Clean',
    stock: 8,
    min_stock: 3,
    buy_price: 65000,
    price: 110000,
    used_in_orders: []
  },
  // Sand Blasting
  {
    id: 'p-5',
    name: 'Pasir Garnet Mesh 80 (25Kg)',
    sku: 'SBM-GAR-80',
    category: 'Pasir Garnet',
    stock: 15,
    min_stock: 5,
    buy_price: 180000,
    price: 260000,
    used_in_orders: ['WO-2403']
  },
  {
    id: 'p-6',
    name: 'Pasir Silika Bangka Mesh 60 (25Kg)',
    sku: 'SBM-SIL-60',
    category: 'Pasir Silika',
    stock: 22,
    min_stock: 8,
    buy_price: 85000,
    price: 135000,
    used_in_orders: ['WO-2408']
  },
  {
    id: 'p-7',
    name: 'Nozzle Sandblaster Boron Carbide 6mm',
    sku: 'SBM-NOZ-006',
    category: 'Nozzle Blaster & Sparepart',
    stock: 4,
    min_stock: 2,
    buy_price: 150000,
    price: 230000,
    used_in_orders: []
  },
  // Bengkel & Servis
  {
    id: 'p-8',
    name: 'Oli Motul 5100 4T 10W-40 Technosynthese (1L)',
    sku: 'OIL-MTL-5100',
    category: 'Pelumas & Oli',
    stock: 28,
    min_stock: 10,
    buy_price: 115000,
    price: 155000,
    used_in_orders: ['WO-2405']
  },
  {
    id: 'p-9',
    name: 'Oli Yamalube Super Matic 10W-40 (1L)',
    sku: 'OIL-YML-MAT',
    category: 'Pelumas & Oli',
    stock: 34,
    min_stock: 12,
    buy_price: 52000,
    price: 72000,
    used_in_orders: []
  },
  {
    id: 'p-10',
    name: 'Kampas Rem Depan Honda Vario / Beat',
    sku: 'BRK-HON-VAR',
    category: 'Sistem Rem',
    stock: 16,
    min_stock: 6,
    buy_price: 35000,
    price: 55000,
    used_in_orders: ['WO-2401']
  },
  {
    id: 'p-11',
    name: 'Busi NGK Iridium CPR9EAIX-9',
    sku: 'SPK-NGK-CPR9',
    category: 'Pengapian & Busi',
    stock: 14,
    min_stock: 5,
    buy_price: 85000,
    price: 125000,
    used_in_orders: ['WO-2407']
  },
  {
    id: 'p-12',
    name: 'V-Belt & Roller Set Yamaha NMAX 155',
    sku: 'TRN-YMH-NMX',
    category: 'Transmisi & Rantai',
    stock: 6,
    min_stock: 4,
    buy_price: 165000,
    price: 235000,
    used_in_orders: ['WO-2405']
  },
  {
    id: 'p-13',
    name: 'Filter Udara Honda PCX 160',
    sku: 'AIR-HON-PCX',
    category: 'Filter Udara & Oli',
    stock: 10,
    min_stock: 4,
    buy_price: 55000,
    price: 85000,
    used_in_orders: ['WO-2407']
  },
  {
    id: 'p-14',
    name: 'Aki Kering GS Astra GTZ6V 12V 5Ah',
    sku: 'BAT-GSA-GTZ6',
    category: 'Kelistrikan & Aki',
    stock: 1,
    min_stock: 3, // LOW STOCK
    buy_price: 230000,
    price: 310000,
    used_in_orders: []
  },
  // Kustom & Modifikasi
  {
    id: 'p-15',
    name: 'Serbuk Powder Coating Glossy Black 5Kg',
    sku: 'PWD-BLK-GLS',
    category: 'Powder Coating',
    stock: 7,
    min_stock: 3,
    buy_price: 210000,
    price: 320000,
    used_in_orders: ['WO-2408']
  },
  {
    id: 'p-16',
    name: 'Baut Probolt Stainless Hex Flange M6 Set (10 Pcs)',
    sku: 'BLT-PRB-M6',
    category: 'Baut Probolt & Detailing',
    stock: 12,
    min_stock: 5,
    buy_price: 45000,
    price: 75000,
    used_in_orders: ['WO-2404']
  }
]

const stockInLogs = [
  {
    id: 'sil-1',
    part_id: 'p-8',
    part_name: 'Oli Motul 5100 4T 10W-40 Technosynthese (1L)',
    category: 'Pelumas & Oli',
    qty: 24,
    unit_cost: 115000,
    total_cost: 2760000,
    created_at: new Date('2026-10-01T08:00:00.000Z')
  },
  {
    id: 'sil-2',
    part_id: 'p-1',
    part_name: 'Media Glass Bead Mesh #100-#170 (25Kg)',
    category: 'Media Glass Bead',
    qty: 10,
    unit_cost: 450000,
    total_cost: 4500000,
    created_at: new Date('2026-10-02T10:30:00.000Z')
  },
  {
    id: 'sil-3',
    part_id: 'p-10',
    part_name: 'Kampas Rem Depan Honda Vario / Beat',
    category: 'Sistem Rem',
    qty: 20,
    unit_cost: 35000,
    total_cost: 700000,
    created_at: new Date('2026-10-04T09:15:00.000Z')
  }
]

const stockOutLogs = [
  {
    id: 'sol-1',
    part_id: 'p-2',
    part_name: 'Cairan Degreaser Engine Cleaner (5L)',
    category: 'Cairan Degreaser & Pembersih',
    qty: 2,
    reason: 'Dituang ke Bak Cuci Mesin Vapor Blasting',
    created_at: new Date('2026-10-05T14:00:00.000Z')
  },
  {
    id: 'sol-2',
    part_id: 'p-1',
    part_name: 'Media Glass Bead Mesh #100-#170 (25Kg)',
    category: 'Media Glass Bead',
    qty: 1,
    reason: 'Refill Tangki Mesin Vapor Blasting Kamar 1',
    created_at: new Date('2026-10-06T11:00:00.000Z')
  }
]

const workOrders = [
  {
    id: 'wo-1',
    code: 'WO-2401',
    customer: {
      id: 'c-1',
      name: 'Hendra Gunawan',
      phone: '0812-3456-7890',
      initials: 'HG'
    },
    vehicle: {
      id: 'v-1',
      plate: 'B 4521 SKA',
      brand: 'Honda',
      model: 'Vario 160',
      year: 2023,
      color: 'Matte Black'
    },
    service: 'Servis',
    complaint: 'Tarikan gas gredek di tanjakan, rem depan bunyi decit',
    status: 'Antrian',
    technician: 'Bayu Saputra',
    progress: 0,
    labor_cost: 65000,
    used_parts: [
      {
        partId: 'p-10',
        name: 'Kampas Rem Depan Honda Vario / Beat',
        qty: 1,
        price: 55000
      }
    ],
    estimated_done: 'Sore ini 16:30',
    created_at: new Date('2026-10-07T08:15:00.000Z'),
    updated_at: new Date('2026-10-07T08:15:00.000Z'),
    completed_at: null
  },
  {
    id: 'wo-2',
    code: 'WO-2402',
    customer: {
      id: 'c-2',
      name: 'Dimas Aditya',
      phone: '0857-1234-5678',
      initials: 'DA'
    },
    vehicle: {
      id: 'v-2',
      plate: 'B 6789 TZX',
      brand: 'Yamaha',
      model: 'RX-King 135',
      year: 2004,
      color: 'Hitam Emas'
    },
    service: 'Vapor Blasting',
    complaint: 'Blasting full head silinder & crankcase blok kopling agar tampilan mulus pabrik',
    status: 'Dikerjakan',
    technician: 'Bonyah',
    progress: 60,
    labor_cost: 550000,
    used_parts: [
      {
        partId: 'p-3',
        name: 'Cairan Anti Karat Metal Sealant 250ml',
        qty: 1,
        price: 125000
      }
    ],
    estimated_done: 'Besok 12:00',
    created_at: new Date('2026-10-06T10:00:00.000Z'),
    updated_at: new Date('2026-10-07T09:00:00.000Z'),
    completed_at: null
  },
  {
    id: 'wo-3',
    code: 'WO-2403',
    customer: {
      id: 'c-3',
      name: 'Kevin Sanjaya',
      phone: '0819-8765-4321',
      initials: 'KS'
    },
    vehicle: {
      id: 'v-3',
      plate: 'D 3312 ABC',
      brand: 'Vespa',
      model: 'Sprint 150 i-Get',
      year: 2022,
      color: 'Kuning'
    },
    service: 'Sand Blasting',
    complaint: 'Kupas cat velg depan belakang & cover CVT siap cat baru',
    status: 'Dikerjakan',
    technician: 'Agus Riyadi',
    progress: 60,
    labor_cost: 250000,
    used_parts: [],
    estimated_done: 'Sore ini 17:00',
    created_at: new Date('2026-10-06T14:30:00.000Z'),
    updated_at: new Date('2026-10-07T08:30:00.000Z'),
    completed_at: null
  },
  {
    id: 'wo-4',
    code: 'WO-2404',
    customer: {
      id: 'c-4',
      name: 'Randy Pratama',
      phone: '0813-9988-7766',
      initials: 'RP'
    },
    vehicle: {
      id: 'v-4',
      plate: 'B 3120 PQR',
      brand: 'Honda',
      model: 'CBR 250RR',
      year: 2021,
      color: 'Merah HRC'
    },
    service: 'Kustomisasi',
    complaint: 'Custom pipa knalpot stainless steel & pasang baut probolt',
    status: 'Menunggu Sparepart',
    technician: 'Dedi Kurniawan',
    progress: 30,
    labor_cost: 650000,
    used_parts: [
      {
        partId: 'p-16',
        name: 'Baut Probolt Stainless Hex Flange M6 Set (10 Pcs)',
        qty: 2,
        price: 75000
      }
    ],
    estimated_done: 'Jumat 15:00',
    created_at: new Date('2026-10-05T11:20:00.000Z'),
    updated_at: new Date('2026-10-06T13:00:00.000Z'),
    completed_at: null
  },
  {
    id: 'wo-5',
    code: 'WO-2405',
    customer: {
      id: 'c-5',
      name: 'Ibu Sri Wahyuni',
      phone: '0818-4455-6677',
      initials: 'SW'
    },
    vehicle: {
      id: 'v-5',
      plate: 'B 5543 WLN',
      brand: 'Yamaha',
      model: 'NMAX 155 Old',
      year: 2019,
      color: 'Abu-Abu Doff'
    },
    service: 'Servis',
    complaint: 'Ganti v-belt CVT & oli mesin Motul 5100',
    status: 'Siap Diambil',
    technician: 'Bayu Saputra',
    progress: 90,
    labor_cost: 90000,
    used_parts: [
      {
        partId: 'p-8',
        name: 'Oli Motul 5100 4T 10W-40 Technosynthese (1L)',
        qty: 1,
        price: 155000
      },
      {
        partId: 'p-12',
        name: 'V-Belt & Roller Set Yamaha NMAX 155',
        qty: 1,
        price: 235000
      }
    ],
    estimated_done: 'Selesai',
    created_at: new Date('2026-10-07T07:45:00.000Z'),
    updated_at: new Date('2026-10-07T09:30:00.000Z'),
    completed_at: new Date('2026-10-07T09:30:00.000Z')
  },
  {
    id: 'wo-6',
    code: 'WO-2406',
    customer: {
      id: 'c-6',
      name: 'Angga Wijaya',
      phone: '0877-2233-4411',
      initials: 'AW'
    },
    vehicle: {
      id: 'v-6',
      plate: 'B 6214 KPM',
      brand: 'Kawasaki',
      model: 'Ninja 150 RR',
      year: 2015,
      color: 'Hijau Lime'
    },
    service: 'Vapor Blasting',
    complaint: 'Vapor blasting blok silinder Super KIPS & karburator Keihin PWK',
    status: 'Siap Diambil',
    technician: 'Bonyah',
    progress: 90,
    labor_cost: 300000,
    used_parts: [
      {
        partId: 'p-3',
        name: 'Cairan Anti Karat Metal Sealant 250ml',
        qty: 1,
        price: 125000
      }
    ],
    estimated_done: 'Selesai',
    created_at: new Date('2026-10-06T09:00:00.000Z'),
    updated_at: new Date('2026-10-06T16:00:00.000Z'),
    completed_at: new Date('2026-10-06T16:00:00.000Z')
  },
  {
    id: 'wo-7',
    code: 'WO-2407',
    customer: {
      id: 'c-7',
      name: 'Rahmat Hidayat',
      phone: '0852-3344-5566',
      initials: 'RH'
    },
    vehicle: {
      id: 'v-7',
      plate: 'B 4098 UTT',
      brand: 'Honda',
      model: 'PCX 160',
      year: 2022,
      color: 'Putih Mutiara'
    },
    service: 'Servis',
    complaint: 'Tune up injeksi, ganti filter udara dan busi iridium',
    status: 'Selesai',
    technician: 'Bayu Saputra',
    progress: 100,
    labor_cost: 75000,
    used_parts: [
      {
        partId: 'p-13',
        name: 'Filter Udara Honda PCX 160',
        qty: 1,
        price: 85000
      },
      {
        partId: 'p-11',
        name: 'Busi NGK Iridium CPR9EAIX-9',
        qty: 1,
        price: 125000
      }
    ],
    estimated_done: 'Selesai',
    created_at: new Date('2026-10-07T07:00:00.000Z'),
    updated_at: new Date('2026-10-07T08:30:00.000Z'),
    completed_at: new Date('2026-10-07T08:30:00.000Z')
  },
  {
    id: 'wo-8',
    code: 'WO-2408',
    customer: {
      id: 'c-8',
      name: 'Ronald Sinaga',
      phone: '0811-9876-5432',
      initials: 'RS'
    },
    vehicle: {
      id: 'v-8',
      plate: 'B 1980 CLS',
      brand: 'Yamaha',
      model: 'Scorpio 225 Scrambler',
      year: 2010,
      color: 'Silver Brushed'
    },
    service: 'Sand Blasting',
    complaint: 'Sand blasting rangka utuh & velg sebelum dicat',
    status: 'Selesai',
    technician: 'Agus Riyadi',
    progress: 100,
    labor_cost: 700000,
    used_parts: [
      {
        partId: 'p-15',
        name: 'Serbuk Powder Coating Glossy Black 5Kg',
        qty: 1,
        price: 320000
      }
    ],
    estimated_done: 'Selesai',
    created_at: new Date('2026-10-04T08:30:00.000Z'),
    updated_at: new Date('2026-10-05T15:00:00.000Z'),
    completed_at: new Date('2026-10-05T15:00:00.000Z')
  }
]

const invoices = [
  {
    id: 'inv-1',
    number: 'INV/2026/10/001',
    work_order_code: 'WO-2407',
    customer: {
      id: 'c-7',
      name: 'Rahmat Hidayat',
      phone: '0852-3344-5566',
      initials: 'RH'
    },
    vehicle: {
      id: 'v-7',
      plate: 'B 4098 UTT',
      brand: 'Honda',
      model: 'PCX 160',
      year: 2022,
      color: 'Putih Mutiara'
    },
    service: 'Servis',
    items: [
      { label: 'Jasa Tune Up Injeksi', qty: 1, price: 75000 },
      { label: 'Filter Udara Honda PCX 160', qty: 1, price: 85000 },
      { label: 'Busi NGK Iridium CPR9EAIX-9', qty: 1, price: 125000 }
    ],
    status: 'Lunas',
    method: 'QRIS',
    date: '7 Okt 2026',
    paid_amount: 285000,
    discount_type: null,
    discount_code: null,
    discount_amount: 0,
    admin_fee: 0,
    payment_ref: 'MID-QRIS-992144',
    paid_at: '08:45 WIB',
    bank_name: 'GoPay / QRIS',
    created_at: new Date('2026-10-07T08:45:00.000Z')
  },
  {
    id: 'inv-2',
    number: 'INV/2026/10/002',
    work_order_code: 'WO-2408',
    customer: {
      id: 'c-8',
      name: 'Ronald Sinaga',
      phone: '0811-9876-5432',
      initials: 'RS'
    },
    vehicle: {
      id: 'v-8',
      plate: 'B 1980 CLS',
      brand: 'Yamaha',
      model: 'Scorpio 225 Scrambler',
      year: 2010,
      color: 'Silver Brushed'
    },
    service: 'Sand Blasting',
    items: [
      { label: 'Jasa Sand Blasting Rangka & Velg', qty: 1, price: 700000 },
      { label: 'Serbuk Powder Coating Glossy Black 5Kg', qty: 1, price: 320000 }
    ],
    status: 'Lunas',
    method: 'Tunai',
    date: '5 Okt 2026',
    paid_amount: 995000,
    discount_type: 'voucher',
    discount_code: 'GTAWELCOME',
    discount_amount: 25000,
    admin_fee: 0,
    payment_ref: null,
    paid_at: '15:20 WIB',
    bank_name: null,
    created_at: new Date('2026-10-05T15:20:00.000Z')
  },
  {
    id: 'inv-3',
    number: 'INV/2026/10/003',
    work_order_code: 'WO-2405',
    customer: {
      id: 'c-5',
      name: 'Ibu Sri Wahyuni',
      phone: '0818-4455-6677',
      initials: 'SW'
    },
    vehicle: {
      id: 'v-5',
      plate: 'B 5543 WLN',
      brand: 'Yamaha',
      model: 'NMAX 155 Old',
      year: 2019,
      color: 'Abu-Abu Doff'
    },
    service: 'Servis',
    items: [
      { label: 'Jasa Servis CVT & Ganti Oli', qty: 1, price: 90000 },
      { label: 'Oli Motul 5100 4T 10W-40 Technosynthese (1L)', qty: 1, price: 155000 },
      { label: 'V-Belt & Roller Set Yamaha NMAX 155', qty: 1, price: 235000 }
    ],
    status: 'Belum Bayar',
    method: null,
    date: '7 Okt 2026',
    paid_amount: 0,
    discount_type: null,
    discount_code: null,
    discount_amount: 0,
    admin_fee: 0,
    payment_ref: null,
    paid_at: null,
    bank_name: null,
    created_at: new Date('2026-10-07T09:35:00.000Z')
  },
  {
    id: 'inv-4',
    number: 'INV/2026/10/004',
    work_order_code: 'WO-2406',
    customer: {
      id: 'c-6',
      name: 'Angga Wijaya',
      phone: '0877-2233-4411',
      initials: 'AW'
    },
    vehicle: {
      id: 'v-6',
      plate: 'B 6214 KPM',
      brand: 'Kawasaki',
      model: 'Ninja 150 RR',
      year: 2015,
      color: 'Hijau Lime'
    },
    service: 'Vapor Blasting',
    items: [
      { label: 'Jasa Vapor Blasting Blok & Karburator', qty: 1, price: 300000 },
      { label: 'Cairan Anti Karat Metal Sealant 250ml', qty: 1, price: 125000 }
    ],
    status: 'Belum Bayar',
    method: null,
    date: '6 Okt 2026',
    paid_amount: 0,
    discount_type: 'voucher',
    discount_code: 'VAPOR10',
    discount_amount: 42500,
    admin_fee: 0,
    payment_ref: null,
    paid_at: null,
    bank_name: null,
    created_at: new Date('2026-10-06T16:05:00.000Z')
  },
  {
    id: 'inv-5',
    number: 'INV/2026/09/088',
    work_order_code: '',
    customer: {
      id: 'c-corp',
      name: 'PT Antar Kilat Express',
      phone: '0812-9988-1122',
      initials: 'AK'
    },
    vehicle: {
      id: 'v-corp',
      plate: 'B 6543 TKG',
      brand: 'Honda',
      model: 'Beat FI Fleet',
      year: 2023,
      color: 'Hitam'
    },
    service: 'Servis',
    items: [
      { label: 'Paket Servis Rutin 3 Unit Motor Fleet Kurir', qty: 3, price: 140000 }
    ],
    status: 'Jatuh Tempo',
    method: null,
    date: '28 Sep 2026',
    paid_amount: 0,
    discount_type: null,
    discount_code: null,
    discount_amount: 0,
    admin_fee: 0,
    payment_ref: null,
    paid_at: null,
    bank_name: null,
    created_at: new Date('2026-09-28T10:00:00.000Z')
  },
  {
    id: 'inv-6',
    number: 'INV/2026/10/005',
    work_order_code: 'WO-2404',
    customer: {
      id: 'c-4',
      name: 'Randy Pratama',
      phone: '0813-9988-7766',
      initials: 'RP'
    },
    vehicle: {
      id: 'v-4',
      plate: 'B 3120 PQR',
      brand: 'Honda',
      model: 'CBR 250RR',
      year: 2021,
      color: 'Merah HRC'
    },
    service: 'Kustomisasi',
    items: [
      { label: 'Jasa Pembuatan Custom Header Pipe Stainless', qty: 1, price: 650000 },
      { label: 'Baut Probolt Stainless Hex Flange M6 Set (10 Pcs)', qty: 2, price: 75000 }
    ],
    status: 'Sebagian',
    method: 'Transfer',
    date: '5 Okt 2026',
    paid_amount: 400000,
    discount_type: null,
    discount_code: null,
    discount_amount: 0,
    admin_fee: 4000,
    payment_ref: 'MID-VA-BCA-88772',
    paid_at: '11:40 WIB',
    bank_name: 'BCA Virtual Account',
    created_at: new Date('2026-10-05T11:40:00.000Z')
  }
]

const notifications = [
  {
    id: 'notif-1',
    type: 'push',
    title: 'Stok Suku Cadang Kritis',
    body: 'Aki Kering GS Astra GTZ6V (BAT-GSA-GTZ6) tersisa 1 unit, di bawah batas minimum (3 unit).',
    time: '08:10',
    channel: 'Gudang Suku Cadang',
    status: 'terkirim',
    read: false,
    link_tab: 'stok',
    created_at: new Date('2026-10-07T08:10:00.000Z')
  },
  {
    id: 'notif-2',
    type: 'push',
    title: 'Stok Suku Cadang Menipis',
    body: 'Cairan Degreaser Engine Cleaner 5L (VBM-DEG-05L) tersisa 3 drigen, di bawah batas minimum (5).',
    time: '08:12',
    channel: 'Gudang Suku Cadang',
    status: 'terkirim',
    read: false,
    link_tab: 'stok',
    created_at: new Date('2026-10-07T08:12:00.000Z')
  },
  {
    id: 'notif-3',
    type: 'whatsapp',
    title: 'Kendaraan Siap Diambil',
    body: 'Halo Ibu Sri Wahyuni, Yamaha NMAX 155 (B 5543 WLN) sudah selesai diservis & siap diambil di GTA GARAGE.',
    time: '09:32',
    channel: '0818-4455-6677',
    status: 'terkirim',
    read: false,
    link_tab: 'pekerjaan',
    created_at: new Date('2026-10-07T09:32:00.000Z')
  },
  {
    id: 'notif-4',
    type: 'whatsapp',
    title: 'Kendaraan Siap Diambil',
    body: 'Halo Mas Angga Wijaya, Kawasaki Ninja 150 RR (B 6214 KPM) hasil vapor blasting blok silinder sudah selesai & siap diambil.',
    time: 'Kemarin',
    channel: '0877-2233-4411',
    status: 'terkirim',
    read: true,
    link_tab: 'pekerjaan',
    created_at: new Date('2026-10-06T16:02:00.000Z')
  },
  {
    id: 'notif-5',
    type: 'push',
    title: 'SPK Pengerjaan Baru',
    body: 'WO-2401 Honda Vario 160 (B 4521 SKA) an. Hendra Gunawan telah masuk antrian servis.',
    time: '08:15',
    channel: 'Bayu Saputra',
    status: 'terkirim',
    read: true,
    link_tab: 'pekerjaan',
    created_at: new Date('2026-10-07T08:15:00.000Z')
  },
  {
    id: 'notif-6',
    type: 'whatsapp',
    title: 'Pengingat Pembayaran Jatuh Tempo',
    body: 'Halo PT Antar Kilat Express, tagihan invoice INV/2026/09/088 sebesar Rp 420.000 telah jatuh tempo. Mohon segera diselesaikan.',
    time: '29 Sep',
    channel: '0812-9988-1122',
    status: 'terkirim',
    read: false,
    link_tab: 'invoice',
    created_at: new Date('2026-09-29T09:00:00.000Z')
  }
]

async function populate() {
  const client = await pool.connect()
  console.log('🚀 Populating test data into PostgreSQL database: gtagarage...')

  try {
    await client.query('BEGIN')

    // Clean current data
    console.log('Clearing old tables...')
    await client.query('DELETE FROM notifications')
    await client.query('DELETE FROM stock_in_logs')
    await client.query('DELETE FROM stock_out_logs')
    await client.query('DELETE FROM invoices')
    await client.query('DELETE FROM work_orders')
    await client.query('DELETE FROM parts')
    await client.query('DELETE FROM service_rates')
    await client.query('DELETE FROM technicians')
    await client.query('DELETE FROM vouchers')

    // 1. Technicians
    console.log(`Inserting ${technicians.length} technicians...`)
    for (const t of technicians) {
      await client.query(
        `INSERT INTO technicians (id, name, initials, active_jobs, completed_this_month, avg_hours, efficiency, phone, specialty, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [t.id, t.name, t.initials, t.active_jobs, t.completed_this_month, t.avg_hours, t.efficiency, t.phone, t.specialty, t.status]
      )
    }

    // 2. Service Rates
    console.log(`Inserting ${serviceRates.length} service rates...`)
    for (const sr of serviceRates) {
      await client.query(
        `INSERT INTO service_rates (id, name, category, price, description, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [sr.id, sr.name, sr.category, sr.price, sr.description]
      )
    }

    // 3. Vouchers
    console.log(`Inserting ${vouchers.length} vouchers...`)
    for (const v of vouchers) {
      await client.query(
        `INSERT INTO vouchers (id, code, title, type, value, max_discount, min_purchase, valid_until, is_active, target_service, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [v.id, v.code, v.title, v.type, v.value, v.max_discount, v.min_purchase, v.valid_until, v.is_active, v.target_service, v.description]
      )
    }

    // 4. Parts (Inventory)
    console.log(`Inserting ${parts.length} parts...`)
    for (const p of parts) {
      await client.query(
        `INSERT INTO parts (id, name, sku, category, stock, min_stock, price, buy_price, used_in_orders, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [p.id, p.name, p.sku, p.category, p.stock, p.min_stock, p.price, p.buy_price, JSON.stringify(p.used_in_orders)]
      )
    }

    // 5. Stock In Logs
    console.log(`Inserting ${stockInLogs.length} stock in logs...`)
    for (const sil of stockInLogs) {
      await client.query(
        `INSERT INTO stock_in_logs (id, part_id, part_name, category, qty, unit_cost, total_cost, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sil.id, sil.part_id, sil.part_name, sil.category, sil.qty, sil.unit_cost, sil.total_cost, sil.created_at]
      )
    }

    // 6. Stock Out Logs
    console.log(`Inserting ${stockOutLogs.length} stock out logs...`)
    for (const sol of stockOutLogs) {
      await client.query(
        `INSERT INTO stock_out_logs (id, part_id, part_name, category, qty, reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sol.id, sol.part_id, sol.part_name, sol.category, sol.qty, sol.reason, sol.created_at]
      )
    }

    // 7. Work Orders
    console.log(`Inserting ${workOrders.length} work orders...`)
    for (const wo of workOrders) {
      await client.query(
        `INSERT INTO work_orders (id, code, customer, vehicle, service, complaint, status, technician, progress, labor_cost, used_parts, estimated_done, created_at, updated_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          wo.id,
          wo.code,
          JSON.stringify(wo.customer),
          JSON.stringify(wo.vehicle),
          wo.service,
          wo.complaint,
          wo.status,
          wo.technician,
          wo.progress,
          wo.labor_cost,
          JSON.stringify(wo.used_parts),
          wo.estimated_done,
          wo.created_at,
          wo.updated_at,
          wo.completed_at
        ]
      )
    }

    // 8. Invoices
    console.log(`Inserting ${invoices.length} invoices...`)
    for (const inv of invoices) {
      await client.query(
        `INSERT INTO invoices (id, number, work_order_code, customer, vehicle, service, items, status, method, date, paid_amount, discount_type, discount_code, discount_amount, admin_fee, payment_ref, paid_at, bank_name, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())`,
        [
          inv.id,
          inv.number,
          inv.work_order_code,
          JSON.stringify(inv.customer),
          JSON.stringify(inv.vehicle),
          inv.service,
          JSON.stringify(inv.items),
          inv.status,
          inv.method,
          inv.date,
          inv.paid_amount,
          inv.discount_type,
          inv.discount_code,
          inv.discount_amount,
          inv.admin_fee,
          inv.payment_ref,
          inv.paid_at,
          inv.bank_name,
          inv.created_at
        ]
      )
    }

    // 9. Notifications
    console.log(`Inserting ${notifications.length} notifications...`)
    for (const notif of notifications) {
      await client.query(
        `INSERT INTO notifications (id, type, title, body, time, channel, status, read, link_tab, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          notif.id,
          notif.type,
          notif.title,
          notif.body,
          notif.time,
          notif.channel,
          notif.status,
          notif.read,
          notif.link_tab,
          notif.created_at
        ]
      )
    }

    // 10. Workshop Profile & Midtrans Config
    console.log('Updating workshop_profile & midtrans_config...')
    await client.query(`
      INSERT INTO workshop_profile (id, name, slogan, phone, address, hours, owner, receipt_warranty, receipt_website, receipt_footer_msg, updated_at)
      VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slogan = EXCLUDED.slogan,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        hours = EXCLUDED.hours,
        owner = EXCLUDED.owner,
        receipt_warranty = EXCLUDED.receipt_warranty,
        receipt_website = EXCLUDED.receipt_website,
        receipt_footer_msg = EXCLUDED.receipt_footer_msg,
        updated_at = NOW();
    `, [
      'GTA GARAGE',
      'Precision Motorcycle Workshop · Vapor Blasting · Custom Builder',
      '0812-8888-9102',
      'Jl. Otista Raya No. 128, Jatinegara, Jakarta Timur 13330',
      '08:00 - 17:00 WIB (Senin - Sabtu)',
      'GITA',
      'Garansi Servis & Blasting 14 Hari',
      'www.gtagarage.com · IG: @gta.garage',
      '*** TERIMA KASIH ATAS KUNJUNGAN ANDA ***'
    ])

    await client.query(`
      INSERT INTO midtrans_config (id, enabled, environment, client_key, server_key, merchant_id, charge_admin_fee_to_customer, va_admin_fee, qris_admin_fee, updated_at)
      VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        environment = EXCLUDED.environment,
        client_key = EXCLUDED.client_key,
        server_key = EXCLUDED.server_key,
        merchant_id = EXCLUDED.merchant_id,
        charge_admin_fee_to_customer = EXCLUDED.charge_admin_fee_to_customer,
        va_admin_fee = EXCLUDED.va_admin_fee,
        qris_admin_fee = EXCLUDED.qris_admin_fee,
        updated_at = NOW();
    `, [
      true,
      'sandbox',
      'SB-Mid-client-GTA-GARAGE-DEMO',
      'SB-Mid-server-DEMO-GTA',
      'G123456789',
      true,
      4000,
      0
    ])

    await client.query('COMMIT')
    console.log('✅ Successfully populated all test data and configs into PostgreSQL!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error during population:', err)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

populate().catch(console.error)
