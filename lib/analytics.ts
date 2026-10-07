import { invoiceTotal, type Invoice, type WorkOrder, type Part, type Technician, type StockInLog } from "./data"

const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

const idMonths: Record<string, number> = {
  'jan': 0, 'januari': 0,
  'feb': 1, 'februari': 1,
  'mar': 2, 'maret': 2,
  'apr': 3, 'april': 3,
  'mei': 4, 'may': 4,
  'jun': 5, 'juni': 5,
  'jul': 6, 'juli': 6,
  'agu': 7, 'ags': 7, 'agustus': 7,
  'sep': 8, 'september': 8,
  'okt': 9, 'oktober': 9, 'oct': 9,
  'nov': 10, 'november': 10,
  'des': 11, 'desember': 11, 'dec': 11,
}

// Robust date parser: handles ISO strings, Indonesian locale strings like "1 Okt, 11.04", and timestamps
export function parseDateFlexible(dateVal?: any): Date | null {
  if (!dateVal) return null
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal

  const str = String(dateVal).trim()
  if (!str) return null

  // 1. Direct standard parse (ISO 8601, RFC2822, YYYY-MM-DD)
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d

  // 2. Match day, monthName, optional year, optional time
  // Examples: "1 Okt, 11.04", "1 Okt 2026", "01 Oktober 2026, 11:04", "Kam, 1 Okt 2026"
  const cleanStr = str.toLowerCase()
  const m = cleanStr.match(/(\d{1,2})\s+([a-z]{3,9})(?:\s+(\d{4}))?(?:,?\s*(\d{1,2})[.:](\d{2}))?/)
  if (m) {
    const day = parseInt(m[1], 10)
    const monthKey = m[2]
    const year = m[3] ? parseInt(m[3], 10) : new Date().getFullYear()
    const hour = m[4] ? parseInt(m[4], 10) : 0
    const minute = m[5] ? parseInt(m[5], 10) : 0

    const month = idMonths[monthKey] ?? idMonths[monthKey.slice(0, 3)]
    if (month !== undefined) {
      return new Date(year, month, day, hour, minute)
    }
  }

  return null
}

export function parseInvoiceDate(inv: Invoice): Date {
  if (inv.createdAt) {
    const d = parseDateFlexible(inv.createdAt)
    if (d) return d
  }
  if (inv.date) {
    const d = parseDateFlexible(inv.date)
    if (d) return d
  }
  return new Date()
}

export function parseWorkOrderDate(wo: WorkOrder): Date {
  if (wo.createdAt) {
    const d = parseDateFlexible(wo.createdAt)
    if (d) return d
  }
  return new Date()
}

export function getDashboardStats(invoices: Invoice[], workOrders: WorkOrder[], parts: Part[]) {
  const today = new Date()
  
  let todayRevenue = 0
  let yesterdayRevenue = 0
  let monthRevenue = 0
  let lastMonthRevenue = 0
  
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  
  const lastMonth = new Date(today)
  lastMonth.setMonth(today.getMonth() - 1)

  invoices.forEach(inv => {
    if (inv.status === "Lunas") {
      const invDate = parseInvoiceDate(inv)
      if (isNaN(invDate.getTime())) return // skip invalid dates
      
      if (invDate.getDate() === today.getDate() && invDate.getMonth() === today.getMonth() && invDate.getFullYear() === today.getFullYear()) {
        todayRevenue += inv.paidAmount
      }
      if (invDate.getDate() === yesterday.getDate() && invDate.getMonth() === yesterday.getMonth() && invDate.getFullYear() === yesterday.getFullYear()) {
        yesterdayRevenue += inv.paidAmount
      }
      if (invDate.getMonth() === today.getMonth() && invDate.getFullYear() === today.getFullYear()) {
        monthRevenue += inv.paidAmount
      }
      if (invDate.getMonth() === lastMonth.getMonth() && invDate.getFullYear() === lastMonth.getFullYear()) {
        lastMonthRevenue += inv.paidAmount
      }
    }
  })

  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%"
    const diff = current - previous
    const perc = (diff / previous) * 100
    return `${perc > 0 ? "+" : ""}${perc.toFixed(1).replace(".", ",")}%`
  }

  const todayRevenueDelta = calculateDelta(todayRevenue, yesterdayRevenue)
  const monthRevenueDelta = calculateDelta(monthRevenue, lastMonthRevenue)

  const queuedJobs = workOrders.filter((w) => w.status === "Antrian")
  const activeJobs = workOrders.filter((w) => w.status === "Dikerjakan" || w.status === "Antrian" || w.status === "Menunggu Sparepart")
  const readyJobs = workOrders.filter((w) => w.status === "Siap Diambil")
  const lowStock = parts.filter((p) => p.stock <= p.minStock)

  // generate last 6 months trend
  const revenueTrend = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const month = monthNames[d.getMonth()]
    let total = 0
    let visits = 0
    invoices.forEach(inv => {
      const invDate = parseInvoiceDate(inv)
      if (isNaN(invDate.getTime())) return
      if (invDate.getMonth() === d.getMonth() && invDate.getFullYear() === d.getFullYear()) {
        if (inv.status === "Lunas") total += inv.paidAmount
        visits += 1
      }
    })
    revenueTrend.push({ month, pendapatan: total, kunjungan: visits })
  }

  return { todayRevenue, todayRevenueDelta, monthRevenue, monthRevenueDelta, queuedJobs, activeJobs, readyJobs, lowStock, revenueTrend }
}

export function getAnalyticsData(
  invoices: Invoice[],
  workOrders: WorkOrder[],
  filter: "Mingguan" | "Bulanan" | "Tahunan",
  stockInLogs: StockInLog[] = []
) {
  const now = new Date()
  
  // Calculate period boundaries based on filter
  let startDate = new Date(now)
  let endDate = new Date(now)
  let prevStartDate = new Date(startDate)
  let prevEndDate = new Date(startDate)

  if (filter === "Mingguan") {
    startDate.setDate(now.getDate() - 7)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)
    prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - 7)
    prevEndDate = new Date(startDate)
    prevEndDate.setMilliseconds(prevEndDate.getMilliseconds() - 1)
  } else if (filter === "Bulanan") {
    // Current calendar month: from 1st of month 00:00:00 to last day of month 23:59:59.999
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    // Previous calendar month: from 1st of last month to last day of last month
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  } else {
    // Current calendar year: from Jan 1 00:00:00 to Dec 31 23:59:59.999
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0)
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
  }

  // Filter data within the period (inclusive of full day/month boundaries)
  const validInvoices = invoices.filter(inv => {
    const d = parseInvoiceDate(inv)
    return !isNaN(d.getTime()) && d >= startDate && d <= endDate
  })
  
  const validWorkOrders = workOrders.filter(wo => {
    const d = parseWorkOrderDate(wo)
    return !isNaN(d.getTime()) && d >= startDate && d <= endDate
  })

  const prevInvoices = invoices.filter(inv => {
    const d = parseInvoiceDate(inv)
    return !isNaN(d.getTime()) && d >= prevStartDate && d <= prevEndDate
  })

  // 1. Overview KPIs
  let totalPendapatan = 0
  let totalKunjungan = validInvoices.length
  
  let prevPendapatan = 0
  let prevKunjungan = prevInvoices.length

  prevInvoices.forEach(inv => {
    prevPendapatan += (inv.paidAmount || 0)
  })
  
  validInvoices.forEach(inv => {
    totalPendapatan += (inv.paidAmount || 0)
  })
  
  // Calculate real average service time from work orders
  let totalServiceMinutes = 0
  let completedJobCount = 0
  validWorkOrders.forEach(wo => {
    if (wo.status === "Selesai" || wo.status === "Siap Diambil") {
      const created = parseWorkOrderDate(wo)
      const completed = wo.completedAt ? (parseDateFlexible(wo.completedAt) || now) : now
      if (!isNaN(created.getTime()) && !isNaN(completed.getTime())) {
        const diffMs = completed.getTime() - created.getTime()
        const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)))
        // Count if reasonable (1 min to 30 days)
        if (diffMinutes >= 1 && diffMinutes < 43200) {
          totalServiceMinutes += diffMinutes
          completedJobCount++
        }
      }
    }
  })
  
  const avgMinutes = completedJobCount > 0 ? totalServiceMinutes / completedJobCount : 0
  const rataServisHours = Math.round((avgMinutes / 60) * 10) / 10
  const rataServisFormatted = completedJobCount === 0
    ? "0 jam"
    : avgMinutes < 60
    ? `${Math.max(1, Math.round(avgMinutes))} mnt`
    : `${rataServisHours} jam`
  
  // Previous period rata servis
  const prevCompletedWOs = workOrders.filter(wo => {
    const d = parseWorkOrderDate(wo)
    return d >= prevStartDate && d < startDate && (wo.status === "Selesai" || wo.status === "Siap Diambil")
  })
  let prevServiceMinutes = 0
  let prevCompletedCount = 0
  prevCompletedWOs.forEach(wo => {
    const created = parseWorkOrderDate(wo)
    const completed = wo.completedAt ? (parseDateFlexible(wo.completedAt) || new Date(created.getTime() + 3600000)) : new Date(created.getTime() + 3600000)
    const diffMs = completed.getTime() - created.getTime()
    const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)))
    if (diffMinutes >= 1 && diffMinutes < 43200) {
      prevServiceMinutes += diffMinutes
      prevCompletedCount++
    }
  })
  const prevAvgMinutes = prevCompletedCount > 0 ? prevServiceMinutes / prevCompletedCount : 0
  const prevRataServisHours = Math.round((prevAvgMinutes / 60) * 10) / 10

  const calcDelta = (current: number, prev: number, isTime = false) => {
    if (prev === 0) return current > 0 ? (isTime ? "+1,0" : "+100%") : "0%"
    const diff = current - prev
    if (isTime) {
      return `${diff > 0 ? "+" : ""}${diff.toFixed(1).replace(".", ",")}`
    }
    const perc = (diff / prev) * 100
    return `${perc > 0 ? "+" : ""}${perc.toFixed(1).replace(".", ",")}%`
  }

  const deltaPendapatan = calcDelta(totalPendapatan, prevPendapatan)
  const deltaKunjungan = calcDelta(totalKunjungan, prevKunjungan)
  const deltaRataServis = calcDelta(rataServisHours, prevRataServisHours, true) + (avgMinutes < 60 && completedJobCount > 0 ? " mnt" : " jam")

  // 2. Revenue Trend
  const revenueTrend = []
  if (filter === "Mingguan") {
    // 7 days
    const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const dayName = days[d.getDay()]
      let total = 0
      let visits = 0
      validInvoices.forEach(inv => {
        const invDate = parseInvoiceDate(inv)
        if (invDate.getDate() === d.getDate() && invDate.getMonth() === d.getMonth()) {
          total += (inv.paidAmount || 0)
          visits += 1
        }
      })
      revenueTrend.push({ month: dayName, pendapatan: total, kunjungan: visits })
    }
  } else if (filter === "Bulanan") {
    // Divide current month into 4 calendar weeks:
    // Mg 1: Tanggal 1 - 7
    // Mg 2: Tanggal 8 - 14
    // Mg 3: Tanggal 15 - 21
    // Mg 4: Tanggal 22 - akhir bulan
    const bucketTotals = [0, 0, 0, 0]
    const bucketVisits = [0, 0, 0, 0]
    
    validInvoices.forEach(inv => {
      const invDate = parseInvoiceDate(inv)
      const day = invDate.getDate()
      let bucket = 0
      if (day <= 7) bucket = 0
      else if (day <= 14) bucket = 1
      else if (day <= 21) bucket = 2
      else bucket = 3
      
      bucketTotals[bucket] += (inv.paidAmount || 0)
      bucketVisits[bucket] += 1
    })

    for (let i = 0; i < 4; i++) {
      revenueTrend.push({ month: `Mg ${i + 1}`, pendapatan: bucketTotals[i], kunjungan: bucketVisits[i] })
    }
  } else {
    // 12 months (Jan - Des) of current year
    for (let i = 0; i < 12; i++) {
      const month = monthNames[i]
      let total = 0
      let visits = 0
      validInvoices.forEach(inv => {
        const invDate = parseInvoiceDate(inv)
        if (invDate.getFullYear() === now.getFullYear() && invDate.getMonth() === i) {
          total += (inv.paidAmount || 0)
          visits += 1
        }
      })
      revenueTrend.push({ month, pendapatan: total, kunjungan: visits })
    }
  }

  // 3. Daily Visits for the week
  const days = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]
  const dailyVisits = Array(7).fill(0).map((_, i) => ({ day: days[(i + 1) % 7], masuk: 0, selesai: 0 }))
  
  validWorkOrders.forEach(wo => {
    const d = parseWorkOrderDate(wo)
    const dayName = days[d.getDay()]
    const idx = dailyVisits.findIndex(v => v.day === dayName)
    if (idx !== -1) {
      dailyVisits[idx].masuk += 1
      if (wo.status === "Selesai" || wo.status === "Siap Diambil") {
        dailyVisits[idx].selesai += 1
      }
    }
  })

  // 4. Service Breakdown
  const serviceBreakdown = [
    { name: "Servis", value: 0, jobs: 0 },
    { name: "Vapor Blasting", value: 0, jobs: 0 },
    { name: "Sand Blasting", value: 0, jobs: 0 },
    { name: "Kustomisasi", value: 0, jobs: 0 },
  ]
  validInvoices.forEach(inv => {
    const svc = serviceBreakdown.find(s => s.name === inv.service) || serviceBreakdown[0]
    svc.value += (inv.paidAmount || 0)
    svc.jobs += 1
  })

  // 5. Stock & Consumables Expenses (Barang Masuk / Pembelian Pasir, Cat & Sparepart)
  const partExpensesMap: Record<string, { name: string; qty: number; totalCost: number }> = {}
  let totalBebanStok = 0

  const validStockLogs = stockInLogs.filter(log => {
    const d = parseDateFlexible(log.createdAt)
    if (!d) return true
    return d >= startDate && d <= now
  })

  if (validStockLogs.length > 0) {
    validStockLogs.forEach(log => {
      const cost = Number(log.totalCost) || (Number(log.qty) * Number(log.unitCost)) || 0
      totalBebanStok += cost
      const key = log.partName || "Bahan & Suku Cadang"
      if (!partExpensesMap[key]) {
        partExpensesMap[key] = { name: key, qty: 0, totalCost: 0 }
      }
      partExpensesMap[key].qty += Number(log.qty) || 0
      partExpensesMap[key].totalCost += cost
    })
  } else {
    // Fallback: if no stock_in_logs recorded yet in this period, check work order used parts
    validWorkOrders.forEach(wo => {
      if (wo.status === "Selesai" || wo.status === "Siap Diambil") {
        (wo.usedParts || []).forEach(p => {
          const cost = (p.qty || 1) * (p.price || 0)
          totalBebanStok += cost
          const key = p.name || "Suku Cadang"
          if (!partExpensesMap[key]) {
            partExpensesMap[key] = { name: key, qty: 0, totalCost: 0 }
          }
          partExpensesMap[key].qty += p.qty || 1
          partExpensesMap[key].totalCost += cost
        })
      }
    })
  }

  const stockExpenseBreakdown = Object.values(partExpensesMap).map(p => ({
    name: p.name,
    qty: p.qty,
    amount: p.totalCost,
    pct: totalBebanStok > 0 ? ((p.totalCost / totalBebanStok) * 100).toFixed(1) : "0.0",
  }))

  const pengeluaran = totalBebanStok
  let piutang = 0
  invoices.forEach(inv => {
    if (inv.status !== "Lunas") {
      const total = invoiceTotal(inv)
      piutang += Math.max(0, total - (inv.paidAmount || 0))
    }
  })

  const monthlyReport = {
    period: filter === "Mingguan"
      ? "7 Hari Terakhir"
      : filter === "Bulanan"
      ? `Bulan ${monthNames[now.getMonth()]} ${now.getFullYear()}`
      : `Tahun ${now.getFullYear()}`,
    pendapatan: totalPendapatan,
    pengeluaran: pengeluaran,
    laba: totalPendapatan - pengeluaran,
    labaMargin: totalPendapatan > 0 ? Math.round(((totalPendapatan - pengeluaran) / totalPendapatan) * 100) : 0,
    totalTransaksi: totalKunjungan,
    rataTransaksi: totalKunjungan > 0 ? Math.round(totalPendapatan / totalKunjungan) : 0,
    piutang: piutang,
  }

  return { 
    totalPendapatan, deltaPendapatan,
    totalKunjungan, deltaKunjungan,
    rataServis: rataServisFormatted, deltaRataServis,
    revenueTrend, dailyVisits, serviceBreakdown, monthlyReport,
    stockExpenseBreakdown
  }
}

// Calculate real technician stats from work orders
export function getTechnicianStats(technicians: Technician[], workOrders: WorkOrder[]): Technician[] {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  return technicians.map(tech => {
    // Find all work orders assigned to this technician
    const techWOs = workOrders.filter(wo => wo.technician === tech.name)
    
    // Completed this month
    const completedThisMonth = techWOs.filter(wo => {
      if (wo.status !== "Selesai" && wo.status !== "Siap Diambil") return false
      const d = parseWorkOrderDate(wo)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length

    // Active jobs
    const activeJobs = techWOs.filter(wo => 
      wo.status === "Dikerjakan" || wo.status === "Antrian" || wo.status === "Menunggu Sparepart"
    ).length

    // Calculate real average minutes and hours per job
    let totalMinutes = 0
    let countedJobs = 0
    techWOs.forEach(wo => {
      if (wo.status === "Selesai" || wo.status === "Siap Diambil") {
        const created = parseWorkOrderDate(wo)
        const completed = wo.completedAt ? (parseDateFlexible(wo.completedAt) || now) : now
        if (!isNaN(created.getTime()) && !isNaN(completed.getTime())) {
          const diffMs = completed.getTime() - created.getTime()
          const diffMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)))
          if (diffMinutes >= 1 && diffMinutes < 43200) { // between 1 min and 30 days
            totalMinutes += diffMinutes
            countedJobs++
          }
        }
      }
    })

    const avgMinutes = countedJobs > 0 ? totalMinutes / countedJobs : 0
    const avgHours = Math.round((avgMinutes / 60) * 10) / 10
    const avgTimeFormatted = countedJobs === 0
      ? "0 jam"
      : avgMinutes < 60
      ? `${Math.max(1, Math.round(avgMinutes))} mnt`
      : `${avgHours} jam`

    // Efficiency: completed / total assigned * 100
    const totalAssigned = techWOs.filter(wo => {
      const d = parseWorkOrderDate(wo)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).length
    const efficiency = totalAssigned > 0 ? Math.round((completedThisMonth / totalAssigned) * 100) : 0

    return {
      ...tech,
      completedThisMonth,
      activeJobs,
      avgHours,
      avgTimeFormatted,
      efficiency,
    }
  })
}
