import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { WorkOrder } from '@/lib/data'

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
  }
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM work_orders ORDER BY created_at DESC')
    const data = res.rows.map(formatWorkOrder)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Failed to get work orders:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.id || `wo-${Date.now()}`
    const code = body.code

    await query(
      `INSERT INTO work_orders (id, code, customer, vehicle, service, complaint, status, technician, progress, labor_cost, used_parts, estimated_done, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code,
         customer = EXCLUDED.customer,
         vehicle = EXCLUDED.vehicle,
         service = EXCLUDED.service,
         complaint = EXCLUDED.complaint,
         status = EXCLUDED.status,
         technician = EXCLUDED.technician,
         progress = EXCLUDED.progress,
         labor_cost = EXCLUDED.labor_cost,
         used_parts = EXCLUDED.used_parts,
         estimated_done = EXCLUDED.estimated_done,
         updated_at = NOW()`,
      [
        id,
        code,
        JSON.stringify(body.customer),
        JSON.stringify(body.vehicle),
        body.service,
        body.complaint || '',
        body.status || 'Antrian',
        body.technician || '',
        body.progress || 0,
        body.laborCost || 0,
        JSON.stringify(body.usedParts || []),
        body.estimatedDone || '',
      ]
    )

    return NextResponse.json({ success: true, id, message: 'Work order saved to database.' })
  } catch (error: any) {
    console.error('Failed to save work order:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })
    }

    const currentRes = await query('SELECT * FROM work_orders WHERE id = $1', [id])
    if (currentRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Work order not found' }, { status: 404 })
    }

    const current = currentRes.rows[0]
    const updatedCustomer = updates.customer ? JSON.stringify(updates.customer) : current.customer
    const updatedVehicle = updates.vehicle ? JSON.stringify(updates.vehicle) : current.vehicle
    const updatedService = updates.service ?? current.service
    const updatedComplaint = updates.complaint ?? current.complaint
    const updatedStatus = updates.status ?? current.status
    const updatedTechnician = updates.technician ?? current.technician
    const updatedProgress = updates.progress ?? current.progress
    const updatedLaborCost = updates.laborCost ?? current.labor_cost
    const updatedUsedParts = updates.usedParts ? JSON.stringify(updates.usedParts) : current.used_parts
    const updatedEstimatedDone = updates.estimatedDone ?? current.estimated_done

    await query(
      `UPDATE work_orders SET
         customer = $1,
         vehicle = $2,
         service = $3,
         complaint = $4,
         status = $5,
         technician = $6,
         progress = $7,
         labor_cost = $8,
         used_parts = $9,
         estimated_done = $10,
         updated_at = NOW()
       WHERE id = $11`,
      [
        updatedCustomer,
        updatedVehicle,
        updatedService,
        updatedComplaint,
        updatedStatus,
        updatedTechnician,
        updatedProgress,
        updatedLaborCost,
        updatedUsedParts,
        updatedEstimatedDone,
        id,
      ]
    )

    return NextResponse.json({ success: true, message: 'Work order updated successfully.' })
  } catch (error: any) {
    console.error('Failed to update work order:', error)
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

    await query('DELETE FROM work_orders WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'Work order deleted.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
