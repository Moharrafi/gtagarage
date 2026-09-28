import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { query } from '@/lib/db'
import type { Technician } from '@/lib/data'

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

export async function GET() {
  try {
    const res = await query('SELECT * FROM technicians ORDER BY name ASC')
    const data = res.rows.map(formatTech)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.id || `tech-${Date.now()}`
    const initials = body.name ? body.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'TK'

    await query(
      `INSERT INTO technicians (id, name, initials, active_jobs, completed_this_month, avg_hours, efficiency, phone, specialty, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         specialty = EXCLUDED.specialty,
         status = EXCLUDED.status`,
      [
        id,
        body.name,
        initials,
        body.activeJobs || 0,
        body.completedThisMonth || 0,
        body.avgHours || 0,
        body.efficiency || 90,
        body.phone || '',
        body.specialty || '',
        body.status || 'Aktif',
      ]
    )

    return NextResponse.json({ success: true, id, message: 'Technician saved.' })
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
      `UPDATE technicians SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         specialty = COALESCE($3, specialty),
         status = COALESCE($4, status)
       WHERE id = $5`,
      [updates.name, updates.phone, updates.specialty, updates.status, id]
    )

    return NextResponse.json({ success: true, message: 'Technician updated.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 })

    await query('DELETE FROM technicians WHERE id = $1', [id])
    return NextResponse.json({ success: true, message: 'Technician deleted.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
