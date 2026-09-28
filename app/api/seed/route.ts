import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import {
  workOrders,
  parts,
  technicians,
  defaultServiceRates,
  defaultCategories,
  defaultVouchers,
  defaultUsers,
  invoices,
} from '@/lib/data'
import { defaultWorkshopProfile, defaultMidtransConfig } from '@/lib/store'

export async function POST() {
  try {
    // 1. Seed Categories if empty
    const catRes = await query('SELECT COUNT(*) FROM categories')
    if (Number(catRes.rows[0].count) === 0) {
      for (const cat of defaultCategories) {
        await query(
          'INSERT INTO categories (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [`cat-${cat.toLowerCase().replace(/\s+/g, '-')}`, cat]
        )
      }
    }

    // 2. Seed Workshop Profile
    await query(
      `INSERT INTO workshop_profile (id, name, slogan, phone, address, hours, owner, receipt_warranty, receipt_website, receipt_footer_msg)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         slogan = EXCLUDED.slogan,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         hours = EXCLUDED.hours,
         owner = EXCLUDED.owner,
         receipt_warranty = EXCLUDED.receipt_warranty,
         receipt_website = EXCLUDED.receipt_website,
         receipt_footer_msg = EXCLUDED.receipt_footer_msg`,
      [
        defaultWorkshopProfile.name,
        defaultWorkshopProfile.slogan,
        defaultWorkshopProfile.phone,
        defaultWorkshopProfile.address,
        defaultWorkshopProfile.hours,
        defaultWorkshopProfile.owner,
        defaultWorkshopProfile.receiptWarranty,
        defaultWorkshopProfile.receiptWebsite,
        defaultWorkshopProfile.receiptFooterMsg,
      ]
    )

    // 3. Seed Midtrans Config
    await query(
      `INSERT INTO midtrans_config (id, enabled, environment, client_key, server_key, merchant_id, charge_admin_fee_to_customer, va_admin_fee, qris_admin_fee)
       VALUES ('default', $1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         environment = EXCLUDED.environment,
         client_key = EXCLUDED.client_key,
         server_key = EXCLUDED.server_key,
         merchant_id = EXCLUDED.merchant_id,
         charge_admin_fee_to_customer = EXCLUDED.charge_admin_fee_to_customer,
         va_admin_fee = EXCLUDED.va_admin_fee,
         qris_admin_fee = EXCLUDED.qris_admin_fee`,
      [
        defaultMidtransConfig.enabled,
        defaultMidtransConfig.environment,
        defaultMidtransConfig.clientKey,
        defaultMidtransConfig.serverKey || '',
        defaultMidtransConfig.merchantId,
        defaultMidtransConfig.chargeAdminFeeToCustomer,
        defaultMidtransConfig.vaAdminFee,
        defaultMidtransConfig.qrisAdminFee,
      ]
    )

    // 4. Seed Technicians if empty
    const techRes = await query('SELECT COUNT(*) FROM technicians')
    if (Number(techRes.rows[0].count) === 0) {
      for (const t of technicians) {
        await query(
          `INSERT INTO technicians (id, name, initials, active_jobs, completed_this_month, avg_hours, efficiency, phone, specialty, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [
            t.id,
            t.name,
            t.initials,
            t.activeJobs || 0,
            t.completedThisMonth || 0,
            t.avgHours || 0,
            t.efficiency || 0,
            t.phone || '',
            t.specialty || '',
            t.status || 'Aktif',
          ]
        )
      }
    }

    // 5. Seed Service Rates if empty
    const srRes = await query('SELECT COUNT(*) FROM service_rates')
    if (Number(srRes.rows[0].count) === 0) {
      for (const sr of defaultServiceRates) {
        await query(
          `INSERT INTO service_rates (id, name, category, price, description)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO NOTHING`,
          [sr.id, sr.name, sr.category, sr.price, sr.description || '']
        )
      }
    }

    // 6. Seed Vouchers if empty
    const vRes = await query('SELECT COUNT(*) FROM vouchers')
    if (Number(vRes.rows[0].count) === 0) {
      for (const v of defaultVouchers) {
        await query(
          `INSERT INTO vouchers (id, code, title, type, value, max_discount, min_purchase, valid_until, is_active, target_service, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            v.id,
            v.code,
            v.title,
            v.type,
            v.value,
            v.maxDiscount || null,
            v.minPurchase || 0,
            v.validUntil,
            v.isActive ?? true,
            v.targetService || 'Semua Layanan',
            v.description || '',
          ]
        )
      }
    }

    // 7. Seed Parts (Inventory) if empty
    const pRes = await query('SELECT COUNT(*) FROM parts')
    if (Number(pRes.rows[0].count) === 0) {
      for (const p of parts) {
        await query(
          `INSERT INTO parts (id, name, sku, category, stock, min_stock, price, used_in_orders)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [
            p.id,
            p.name,
            p.sku,
            p.category,
            p.stock,
            p.minStock,
            p.price,
            JSON.stringify(p.usedInOrders || []),
          ]
        )
      }
    }

    // 8. Seed Work Orders if empty
    const woRes = await query('SELECT COUNT(*) FROM work_orders')
    if (Number(woRes.rows[0].count) === 0) {
      for (const wo of workOrders) {
        await query(
          `INSERT INTO work_orders (id, code, customer, vehicle, service, complaint, status, technician, progress, labor_cost, used_parts, estimated_done)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO NOTHING`,
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
            wo.laborCost,
            JSON.stringify(wo.usedParts || []),
            wo.estimatedDone,
          ]
        )
      }
    }

    // 9. Seed Invoices if empty
    const invRes = await query('SELECT COUNT(*) FROM invoices')
    if (Number(invRes.rows[0].count) === 0) {
      for (const inv of invoices) {
        await query(
          `INSERT INTO invoices (id, number, work_order_code, customer, vehicle, service, items, status, method, date, paid_amount, discount_type, discount_code, discount_amount, admin_fee, payment_ref, paid_at, bank_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
           ON CONFLICT (id) DO NOTHING`,
          [
            inv.id,
            inv.number,
            inv.workOrderCode,
            JSON.stringify(inv.customer),
            JSON.stringify(inv.vehicle),
            inv.service,
            JSON.stringify(inv.items),
            inv.status,
            inv.method || null,
            inv.date,
            inv.paidAmount || 0,
            inv.discountType || null,
            inv.discountCode || null,
            inv.discountAmount || 0,
            inv.adminFee || 0,
            inv.paymentRef || null,
            inv.paidAt || null,
            inv.bankName || null,
          ]
        )
      }
    }

    // 10. Seed Users if empty
    const uRes = await query('SELECT COUNT(*) FROM users')
    if (Number(uRes.rows[0].count) === 0) {
      for (const u of defaultUsers) {
        await query(
          `INSERT INTO users (id, username, password, name, role, phone)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO NOTHING`,
          [u.id, u.username, u.password || '123456', u.name, u.role, u.phone || '']
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PostgreSQL database gtagarage seeded successfully!',
    })
  } catch (error: any) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
