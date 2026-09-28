import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { query } from '@/lib/db'
import type { Invoice } from '@/lib/data'

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
  }
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM invoices ORDER BY created_at DESC')
    const data = res.rows.map(formatInvoice)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to get invoices:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const inv: Invoice = await req.json()
    const id = inv.id || `inv-${Date.now()}`

    await query(
      `INSERT INTO invoices (
         id, number, work_order_code, customer, vehicle, service, items, status,
         method, date, paid_amount, discount_type, discount_code, discount_amount,
         admin_fee, payment_ref, paid_at, bank_name, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8,
         $9, $10, $11, $12, $13, $14,
         $15, $16, $17, $18, NOW(), NOW()
       )
       ON CONFLICT (id) DO UPDATE SET
         number = EXCLUDED.number,
         work_order_code = EXCLUDED.work_order_code,
         customer = EXCLUDED.customer,
         vehicle = EXCLUDED.vehicle,
         service = EXCLUDED.service,
         items = EXCLUDED.items,
         status = EXCLUDED.status,
         method = EXCLUDED.method,
         date = EXCLUDED.date,
         paid_amount = EXCLUDED.paid_amount,
         discount_type = EXCLUDED.discount_type,
         discount_code = EXCLUDED.discount_code,
         discount_amount = EXCLUDED.discount_amount,
         admin_fee = EXCLUDED.admin_fee,
         payment_ref = EXCLUDED.payment_ref,
         paid_at = EXCLUDED.paid_at,
         bank_name = EXCLUDED.bank_name,
         updated_at = NOW()`,
      [
        id,
        inv.number,
        inv.workOrderCode || '',
        JSON.stringify(inv.customer),
        JSON.stringify(inv.vehicle),
        inv.service,
        JSON.stringify(inv.items || []),
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

    return NextResponse.json({ success: true, id, message: 'Invoice saved to database.' })
  } catch (error: any) {
    console.error('Failed to save invoice:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const inv: Partial<Invoice> & { id: string } = await req.json()
    if (!inv.id) {
      return NextResponse.json({ success: false, message: 'Missing invoice id' }, { status: 400 })
    }

    const currentRes = await query('SELECT * FROM invoices WHERE id = $1', [inv.id])
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Invoice not found' }, { status: 404 })
    }

    const cur = currentRes.rows[0]
    const updatedStatus = inv.status ?? cur.status
    const updatedPaidAmount = inv.paidAmount !== undefined ? inv.paidAmount : cur.paid_amount
    const updatedMethod = inv.method !== undefined ? inv.method : cur.method
    const updatedAdminFee = inv.adminFee !== undefined ? inv.adminFee : cur.admin_fee
    const updatedPaymentRef = inv.paymentRef !== undefined ? inv.paymentRef : cur.payment_ref
    const updatedPaidAt = inv.paidAt !== undefined ? inv.paidAt : cur.paid_at
    const updatedBankName = inv.bankName !== undefined ? inv.bankName : cur.bank_name
    const updatedDiscountType = inv.discountType !== undefined ? inv.discountType : cur.discount_type
    const updatedDiscountCode = inv.discountCode !== undefined ? inv.discountCode : cur.discount_code
    const updatedDiscountAmount = inv.discountAmount !== undefined ? inv.discountAmount : cur.discount_amount
    const updatedItems = inv.items ? JSON.stringify(inv.items) : cur.items

    await query(
      `UPDATE invoices SET
         status = $1,
         paid_amount = $2,
         method = $3,
         admin_fee = $4,
         payment_ref = $5,
         paid_at = $6,
         bank_name = $7,
         discount_type = $8,
         discount_code = $9,
         discount_amount = $10,
         items = $11,
         updated_at = NOW()
       WHERE id = $12`,
      [
        updatedStatus,
        updatedPaidAmount,
        updatedMethod,
        updatedAdminFee,
        updatedPaymentRef,
        updatedPaidAt,
        updatedBankName,
        updatedDiscountType,
        updatedDiscountCode,
        updatedDiscountAmount,
        updatedItems,
        inv.id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Invoice updated successfully.' })
  } catch (error: any) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })
    }

    await query('DELETE FROM invoices WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'Invoice deleted.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
