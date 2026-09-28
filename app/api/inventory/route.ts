import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { query } from '@/lib/db'
import type { Part } from '@/lib/data'

function formatPart(row: any): Part {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    stock: Number(row.stock) || 0,
    minStock: Number(row.min_stock) || 0,
    price: Number(row.price) || 0,
    usedInOrders: typeof row.used_in_orders === 'string' ? JSON.parse(row.used_in_orders) : (row.used_in_orders || []),
  }
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM parts ORDER BY name ASC')
    const data = res.rows.map(formatPart)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to get inventory:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Handle stock-in action
    if (body.action === 'stock-in') {
      const { id, qty } = body
      if (!id || !qty) {
        return NextResponse.json({ success: false, message: 'Missing id or qty' }, { status: 400 })
      }
      await query('UPDATE parts SET stock = stock + $1, updated_at = NOW() WHERE id = $2', [qty, id])
      return NextResponse.json({ success: true, message: 'Stok berhasil ditambahkan.' })
    }

    const id = body.id || `p-${Date.now()}`
    await query(
      `INSERT INTO parts (id, name, sku, category, stock, min_stock, price, used_in_orders, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         sku = EXCLUDED.sku,
         category = EXCLUDED.category,
         stock = EXCLUDED.stock,
         min_stock = EXCLUDED.min_stock,
         price = EXCLUDED.price,
         used_in_orders = EXCLUDED.used_in_orders,
         updated_at = NOW()`,
      [
        id,
        body.name,
        body.sku,
        body.category,
        body.stock || 0,
        body.minStock || 0,
        body.price || 0,
        JSON.stringify(body.usedInOrders || []),
      ]
    )

    return NextResponse.json({ success: true, id, message: 'Part saved to database.' })
  } catch (error: any) {
    console.error('Failed to save part:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing part id' }, { status: 400 })
    }

    await query(
      `UPDATE parts SET
         name = COALESCE($1, name),
         sku = COALESCE($2, sku),
         category = COALESCE($3, category),
         stock = COALESCE($4, stock),
         min_stock = COALESCE($5, min_stock),
         price = COALESCE($6, price),
         updated_at = NOW()
       WHERE id = $7`,
      [
        updates.name,
        updates.sku,
        updates.category,
        updates.stock,
        updates.minStock,
        updates.price,
        id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Part updated.' })
  } catch (error: any) {
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

    await query('DELETE FROM parts WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'Part deleted.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
