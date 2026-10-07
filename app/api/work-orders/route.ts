import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
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
    completedAt: row.completed_at
      ? new Date(row.completed_at).toISOString()
      : (row.status === 'Selesai' || row.status === 'Siap Diambil'
          ? (row.updated_at ? new Date(row.updated_at).toISOString() : undefined)
          : undefined),
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
    const code = body.code || `WO-${Date.now().toString().slice(-4)}`
    const isCompleted = body.status === 'Selesai' || body.status === 'Siap Diambil'

    await query(
      `INSERT INTO work_orders (
         id, code, customer, vehicle, service, complaint, status, technician,
         progress, labor_cost, used_parts, estimated_done, completed_at, created_at, updated_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
         CASE WHEN $13 THEN NOW() ELSE NULL END,
         NOW(), NOW()
       )
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
         completed_at = CASE WHEN EXCLUDED.status IN ('Selesai', 'Siap Diambil') AND work_orders.completed_at IS NULL THEN NOW() ELSE work_orders.completed_at END,
         updated_at = NOW()`,
      [
        id,
        code,
        JSON.stringify(body.customer || {}),
        JSON.stringify(body.vehicle || {}),
        body.service || 'Servis',
        body.complaint || '',
        body.status || 'Antrian',
        body.technician || '',
        Number(body.progress) || 0,
        Number(body.laborCost) || 0,
        JSON.stringify(body.usedParts || []),
        body.estimatedDone || '',
        isCompleted,
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
    const updatedCustomer = updates.customer !== undefined
      ? JSON.stringify(updates.customer)
      : (typeof current.customer === 'string' ? current.customer : JSON.stringify(current.customer || {}))
    const updatedVehicle = updates.vehicle !== undefined
      ? JSON.stringify(updates.vehicle)
      : (typeof current.vehicle === 'string' ? current.vehicle : JSON.stringify(current.vehicle || {}))
    const updatedService = updates.service ?? current.service
    const updatedComplaint = updates.complaint ?? current.complaint
    const updatedStatus = updates.status ?? current.status
    const updatedTechnician = updates.technician ?? current.technician
    const updatedProgress = updates.progress !== undefined ? Number(updates.progress) : current.progress
    const updatedLaborCost = updates.laborCost !== undefined ? Number(updates.laborCost) : current.labor_cost
    const updatedUsedParts = updates.usedParts !== undefined
      ? JSON.stringify(updates.usedParts)
      : (typeof current.used_parts === 'string' ? current.used_parts : JSON.stringify(current.used_parts || []))
    const updatedEstimatedDone = updates.estimatedDone ?? current.estimated_done
    const isCompleted = updatedStatus === 'Selesai' || updatedStatus === 'Siap Diambil'

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
         completed_at = CASE WHEN $11 AND completed_at IS NULL THEN NOW() ELSE completed_at END,
         updated_at = NOW()
       WHERE id = $12`,
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
        isCompleted,
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
