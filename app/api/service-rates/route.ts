import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { ServiceRate } from '@/lib/data'

function formatRate(row: any): ServiceRate {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price) || 0,
    description: row.description || undefined,
  }
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM service_rates ORDER BY name ASC')
    const data = res.rows.map(formatRate)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.id || `sr-${Date.now()}`

    await query(
      `INSERT INTO service_rates (id, name, category, price, description, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         category = EXCLUDED.category,
         price = EXCLUDED.price,
         description = EXCLUDED.description`,
      [id, body.name, body.category, body.price || 0, body.description || '']
    )

    return NextResponse.json({ success: true, id, message: 'Tarif jasa disimpan.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })

    await query(
      `UPDATE service_rates SET
         name = COALESCE($1, name),
         category = COALESCE($2, category),
         price = COALESCE($3, price),
         description = COALESCE($4, description)
       WHERE id = $5`,
      [updates.name, updates.category, updates.price, updates.description, id]
    )

    return NextResponse.json({ success: true, message: 'Tarif jasa diupdate.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })

    await query('DELETE FROM service_rates WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'Tarif jasa dihapus.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
