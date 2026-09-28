import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { NotificationItem } from '@/lib/data'

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
  try {
    const res = await query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100')
    const data = res.rows.map(formatNotif)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body: Partial<NotificationItem> = await req.json()
    const id = body.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date()
    const timeStr = body.time || now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

    await query(
      `INSERT INTO notifications (id, type, title, body, time, channel, status, read, created_at, link_tab)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
       ON CONFLICT (id) DO NOTHING`,
      [
        id,
        body.type || 'push',
        body.title || 'Notifikasi Baru',
        body.body || '',
        timeStr,
        body.channel || 'Sistem',
        body.status || 'terkirim',
        body.read ?? false,
        body.linkTab || null,
      ]
    )

    return NextResponse.json({ success: true, id, message: 'Notification saved.' })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { action, id } = await req.json()

    if (action === 'mark-all-read') {
      await query('UPDATE notifications SET read = TRUE')
      return NextResponse.json({ success: true, message: 'Semua notifikasi ditandai sudah dibaca.' })
    }

    if (action === 'mark-read' && id) {
      await query('UPDATE notifications SET read = TRUE WHERE id = $1', [id])
      return NextResponse.json({ success: true, message: 'Notifikasi ditandai sudah dibaca.' })
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    if (action === 'clear-all') {
      await query('DELETE FROM notifications')
      return NextResponse.json({ success: true, message: 'Semua notifikasi dihapus.' })
    }

    if (id) {
      await query('DELETE FROM notifications WHERE id = $1', [id])
      return NextResponse.json({ success: true, message: 'Notifikasi dihapus.' })
    }

    return NextResponse.json({ success: false, message: 'Missing parameter' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
