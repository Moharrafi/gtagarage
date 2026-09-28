import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import { query } from '@/lib/db'

export async function GET() {
  const envCheck = {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPgHost: Boolean(process.env.PGHOST),
    hasVapidKey: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  }

  try {
    const res = await query('SELECT count(*) FROM work_orders')
    return NextResponse.json({
      status: 'connected',
      database: 'ok',
      workOrdersCount: Number(res.rows[0]?.count || 0),
      env: envCheck,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'disconnected',
        message: 'Database connection failed. Ensure DATABASE_URL is added to Vercel Environment Variables.',
        error: error.message,
        env: envCheck,
      },
      { status: 200 }
    )
  }
}
