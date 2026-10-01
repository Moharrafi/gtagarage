import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { query } from '@/lib/db'
import type { Part, StockInLog } from '@/lib/data'

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

export async function GET() {
  try {
    const res = await query('SELECT * FROM parts ORDER BY name ASC')
    const data = res.rows.map(formatPart)

    let stockInLogs: StockInLog[] = []
    try {
      const logsRes = await query('SELECT * FROM stock_in_logs ORDER BY created_at DESC LIMIT 500')
      stockInLogs = logsRes.rows.map((row: any) => ({
        id: row.id,
        partId: row.part_id,
        partName: row.part_name,
        category: row.category || '',
        qty: Number(row.qty) || 0,
        unitCost: Number(row.unit_cost) || 0,
        totalCost: Number(row.total_cost) || 0,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }))
    } catch (e) {
      console.warn('Failed to query stock_in_logs:', e)
    }

    return NextResponse.json({ success: true, data, stockInLogs })
  } catch (error: any) {
    console.error('Failed to get inventory:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Handle stock-in action (recording Restock / Belanja Masuk)
    if (body.action === 'stock-in') {
      const { id, qty, unitCost } = body
      if (!id || !qty) {
        return NextResponse.json({ success: false, message: 'Missing id or qty' }, { status: 400 })
      }

      const partRes = await query('SELECT * FROM parts WHERE id = $1', [id])
      const part = partRes.rows[0]
      const actualUnitCost = unitCost !== undefined ? Number(unitCost) : (Number(part?.buy_price) || 0)
      const totalCost = Number(qty) * actualUnitCost

      await query('UPDATE parts SET stock = stock + $1, updated_at = NOW() WHERE id = $2', [qty, id])

      // Record stock inflow log in PostgreSQL
      if (part) {
        const logId = `inflow-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        try {
          await query(
            `INSERT INTO stock_in_logs (id, part_id, part_name, category, qty, unit_cost, total_cost, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [logId, id, part.name, part.category, qty, actualUnitCost, totalCost]
          )
        } catch (err) {
          console.warn('Could not insert stock_in_logs:', err)
        }
      }

      return NextResponse.json({ success: true, message: 'Stok berhasil ditambahkan dan dicatat ke beban belanja.' })
    }

    const id = body.id || `p-${Date.now()}`
    await query(
      `INSERT INTO parts (id, name, sku, category, stock, min_stock, price, buy_price, used_in_orders, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         sku = EXCLUDED.sku,
         category = EXCLUDED.category,
         stock = EXCLUDED.stock,
         min_stock = EXCLUDED.min_stock,
         price = EXCLUDED.price,
         buy_price = EXCLUDED.buy_price,
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
        body.buyPrice || 0,
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
         buy_price = COALESCE($7, buy_price),
         updated_at = NOW()
       WHERE id = $8`,
      [
        updates.name,
        updates.sku,
        updates.category,
        updates.stock,
        updates.minStock,
        updates.price,
        updates.buyPrice !== undefined ? updates.buyPrice : null,
        id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Part updated.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
