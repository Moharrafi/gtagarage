import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Voucher } from '@/lib/data'

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

export async function GET() {
  try {
    const res = await query('SELECT * FROM vouchers ORDER BY created_at DESC')
    const data = res.rows.map(formatVoucher)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.id || `v-${Date.now()}`

    await query(
      `INSERT INTO vouchers (id, code, title, type, value, max_discount, min_purchase, valid_until, is_active, target_service, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code,
         title = EXCLUDED.title,
         type = EXCLUDED.type,
         value = EXCLUDED.value,
         max_discount = EXCLUDED.max_discount,
         min_purchase = EXCLUDED.min_purchase,
         valid_until = EXCLUDED.valid_until,
         is_active = EXCLUDED.is_active,
         target_service = EXCLUDED.target_service,
         description = EXCLUDED.description`,
      [
        id,
        body.code,
        body.title,
        body.type,
        body.value,
        body.maxDiscount || null,
        body.minPurchase || 0,
        body.validUntil,
        body.isActive ?? true,
        body.targetService || 'Semua Layanan',
        body.description || '',
      ]
    )

    return NextResponse.json({ success: true, id, message: 'Voucher saved.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })

    if (updates.action === 'toggle') {
      await query('UPDATE vouchers SET is_active = NOT is_active WHERE id = $1', [id])
      return NextResponse.json({ success: true, message: 'Voucher status toggled.' })
    }

    await query(
      `UPDATE vouchers SET
         code = COALESCE($1, code),
         title = COALESCE($2, title),
         type = COALESCE($3, type),
         value = COALESCE($4, value),
         max_discount = COALESCE($5, max_discount),
         min_purchase = COALESCE($6, min_purchase),
         valid_until = COALESCE($7, valid_until),
         is_active = COALESCE($8, is_active),
         target_service = COALESCE($9, target_service),
         description = COALESCE($10, description)
       WHERE id = $11`,
      [
        updates.code,
        updates.title,
        updates.type,
        updates.value,
        updates.maxDiscount,
        updates.minPurchase,
        updates.validUntil,
        updates.isActive,
        updates.targetService,
        updates.description,
        id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Voucher updated.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })

    await query('DELETE FROM vouchers WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'Voucher deleted.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
