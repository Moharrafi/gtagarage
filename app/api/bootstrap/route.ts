import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { getClient } from '@/lib/db'
import type { WorkOrder, Invoice, Part, StockInLog, StockOutLog, ServiceRate, Technician, Voucher, NotificationItem } from '@/lib/data'
import type { WorkshopProfile, MidtransConfig } from '@/lib/store'

function formatWorkOrder(row: any): WorkOrder {
  return {
    id: row.id,
    code: row.code,
    customer: typeof row.customer === 'string' ? JSON.parse(row.customer) : row.customer,
    vehicle: typeof row.vehicle === 'string' ? JSON.parse(row.vehicle) : row.vehicle,
    service: row.service,
    complaint: row.complaint || '',
    status: row.status,
    technician: row.technician || '',
    progress: Number(row.progress) || 0,
    laborCost: Number(row.labor_cost) || 0,
    usedParts: typeof row.used_parts === 'string' ? JSON.parse(row.used_parts) : (row.used_parts || []),
    estimatedDone: row.estimated_done || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : (row.status === 'Selesai' || row.status === 'Siap Diambil'
          ? (row.updated_at ? new Date(row.updated_at).toISOString() : undefined)
          : undefined),
  }
}

function formatInvoice(row: any): Invoice {
  return {
    id: row.id,
    number: row.number,
    workOrderCode: row.work_order_code,
    customer: typeof row.customer === 'string' ? JSON.parse(row.customer) : row.customer,
    vehicle: typeof row.vehicle === 'string' ? JSON.parse(row.vehicle) : row.vehicle,
    service: row.service,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    status: row.status,
    method: row.method || undefined,
    date: row.date,
    paidAmount: Number(row.paid_amount) || 0,
    discountType: row.discount_type || undefined,
    discountCode: row.discount_code || undefined,
    discountAmount: Number(row.discount_amount) || 0,
    adminFee: row.admin_fee ? Number(row.admin_fee) : undefined,
    paymentRef: row.payment_ref || undefined,
    paidAt: row.paid_at || undefined,
    bankName: row.bank_name || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  }
}

function formatPart(row: any): Part {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    stock: Number(row.stock) || 0,
    minStock: Number(row.min_stock) || 0,
    price: Number(row.price) || 0,
    buyPrice: Number(row.buy_price) || 0,
    usedInOrders: typeof row.used_in_orders === 'string' ? JSON.parse(row.used_in_orders) : (row.used_in_orders || []),
  }
}

function formatRate(row: any): ServiceRate {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price) || 0,
    description: row.description || undefined,
  }
}

function formatTech(row: any): Technician {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials || '',
    activeJobs: Number(row.active_jobs) || 0,
    completedThisMonth: Number(row.completed_this_month) || 0,
    avgHours: Number(row.avg_hours) || 0,
    efficiency: Number(row.efficiency) || 0,
    phone: row.phone || undefined,
    specialty: row.specialty || undefined,
    status: row.status || 'Aktif',
  }
}

function formatVoucher(row: any): Voucher {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    type: row.type,
    value: Number(row.value) || 0,
    maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
    minPurchase: Number(row.min_purchase) || 0,
    validUntil: row.valid_until || '',
    isActive: row.is_active ?? true,
    targetService: row.target_service || 'Semua Layanan',
    description: row.description || undefined,
  }
}

function formatNotif(row: any): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body || '',
    time: row.time || '',
    channel: row.channel || '',
    status: row.status || 'terkirim',
    read: row.read ?? false,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    linkTab: row.link_tab || undefined,
  }
}

export async function GET() {
  let client;
  try {
    client = await getClient();

    const [
      woRes,
      invRes,
      partsRes,
      stockInRes,
      stockOutRes,
      svcRes,
      techRes,
      vouchRes,
      profileRes,
      midtransRes,
      catRes,
      notifRes,
    ] = await Promise.all([
      client.query('SELECT * FROM work_orders ORDER BY created_at DESC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM invoices ORDER BY created_at DESC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM parts ORDER BY name ASC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM stock_in_logs ORDER BY created_at DESC LIMIT 500').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM stock_out_logs ORDER BY created_at DESC LIMIT 500').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM service_rates ORDER BY name ASC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM technicians ORDER BY name ASC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM vouchers ORDER BY created_at DESC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM workshop_profile WHERE id = $1', ['default']).catch(() => ({ rows: [] })),
      client.query('SELECT * FROM midtrans_config WHERE id = $1', ['default']).catch(() => ({ rows: [] })),
      client.query('SELECT name FROM categories ORDER BY name ASC').catch(() => ({ rows: [] })),
      client.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').catch(() => ({ rows: [] })),
    ]);

    let profile: WorkshopProfile | null = null;
    if (profileRes.rows.length > 0) {
      const r = profileRes.rows[0];
      profile = {
        name: r.name,
        slogan: r.slogan || '',
        phone: r.phone || '',
        address: r.address || '',
        hours: r.hours || '',
        owner: r.owner || '',
        receiptWarranty: r.receipt_warranty || '',
        receiptWebsite: r.receipt_website || '',
        receiptFooterMsg: r.receipt_footer_msg || '',
      };
    }

    let midtransConfig: MidtransConfig | null = null;
    if (midtransRes.rows.length > 0) {
      const r = midtransRes.rows[0];
      midtransConfig = {
        enabled: r.enabled ?? true,
        environment: r.environment || 'sandbox',
        clientKey: r.client_key || '',
        serverKey: r.server_key || '',
        merchantId: r.merchant_id || '',
        chargeAdminFeeToCustomer: r.charge_admin_fee_to_customer ?? true,
        vaAdminFee: Number(r.va_admin_fee) || 4000,
        qrisAdminFee: Number(r.qris_admin_fee) || 0,
      };
    }

    const categories = catRes.rows.map((row: any) => row.name);

    return NextResponse.json({
      success: true,
      data: {
        workOrders: woRes.rows.map(formatWorkOrder),
        invoices: invRes.rows.map(formatInvoice),
        inventory: {
          parts: partsRes.rows.map(formatPart),
          stockInLogs: stockInRes.rows.map((row: any) => ({
            id: row.id,
            partId: row.part_id,
            partName: row.part_name,
            category: row.category || '',
            qty: Number(row.qty) || 0,
            unitCost: Number(row.unit_cost) || 0,
            totalCost: Number(row.total_cost) || 0,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          })),
          stockOutLogs: stockOutRes.rows.map((row: any) => ({
            id: row.id,
            partId: row.part_id,
            partName: row.part_name,
            category: row.category || '',
            qty: Number(row.qty) || 0,
            reason: row.reason || '',
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          })),
        },
        serviceRates: svcRes.rows.map(formatRate),
        technicians: techRes.rows.map(formatTech),
        vouchers: vouchRes.rows.map(formatVoucher),
        settings: {
          profile,
          midtransConfig,
          categories,
        },
        notifications: notifRes.rows.map(formatNotif),
      },
    });
  } catch (error: any) {
    console.error('Failed to get bootstrap data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
