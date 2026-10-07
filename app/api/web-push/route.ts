import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic';
import webpush from 'web-push'
import { query } from '@/lib/db'

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BLRWIJ369M5fB6AL04Zunmtx9Vv34pgX69az5mY8alA3jfuYsW0FVU6T7rTeDifHLR555rna-Rs0hLZ2WVq79g0'

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'vka_Fq0hZeoyUn7CP3Fxfy8oPoAnq01xziYcJAl26Vs'

let isVapidSet = false
function ensureVapidDetails() {
  if (!isVapidSet) {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          'mailto:admin@gtagarage.com',
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        )
        isVapidSet = true
      } catch (err) {
        console.error('Failed to set VAPID details:', err)
      }
    } else {
      console.warn('VAPID keys are missing. Web Push will not work.')
    }
  }
}

export async function POST(req: Request) {
  ensureVapidDetails()

  try {
    const { action, subscription, payload } = await req.json()

    if (action === 'subscribe') {
      if (subscription && subscription.endpoint && subscription.keys) {
        const userAgent = req.headers.get('user-agent') || ''
        await query(
          `INSERT INTO push_subscriptions (endpoint, keys, user_agent, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (endpoint) DO UPDATE SET
             keys = EXCLUDED.keys,
             user_agent = EXCLUDED.user_agent,
             updated_at = NOW()`,
          [subscription.endpoint, JSON.stringify(subscription.keys), userAgent]
        )
        return NextResponse.json({ success: true, message: 'Berhasil mendaftarkan perangkat ke database.' })
      }
      return NextResponse.json({ success: false, message: 'Objek subscription tidak valid.' }, { status: 400 })
    }

    if (action === 'send') {
      // 1. Fetch all registered subscriptions from PostgreSQL
      const dbSubsRes = await query('SELECT endpoint, keys FROM push_subscriptions')
      let targets: webpush.PushSubscription[] = dbSubsRes.rows.map((row) => ({
        endpoint: row.endpoint,
        keys: typeof row.keys === 'string' ? JSON.parse(row.keys) : row.keys,
      }))

      // If the incoming request carries a subscription not yet in DB, include and persist it
      if (subscription && subscription.endpoint && subscription.keys) {
        if (!targets.some((s) => s.endpoint === subscription.endpoint)) {
          targets.push(subscription)
          await query(
            `INSERT INTO push_subscriptions (endpoint, keys, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (endpoint) DO UPDATE SET keys = EXCLUDED.keys, updated_at = NOW()`,
            [subscription.endpoint, JSON.stringify(subscription.keys)]
          ).catch((e) => console.error('Failed to persist incoming subscription:', e))
        }
      }

      if (targets.length === 0) {
        return NextResponse.json(
          {
            success: true,
            deliveredCount: 0,
            message: 'Tidak ada perangkat terdaftar untuk dikirim notifikasi.',
          },
          { status: 200 }
        )
      }

      const notifPayload = JSON.stringify(
        payload || {
          title: 'Pembayaran Diterima! 💰',
          body: 'Pembayaran baru telah berhasil diverifikasi.',
          url: '/?tab=invoices',
          sound: '/media/cash-in.mp3',
        }
      )

      const results = await Promise.allSettled(
        targets.map((sub) =>
          webpush.sendNotification(sub, notifPayload, {
            TTL: 60,
          })
        )
      )

      // Prune dead/revoked subscriptions from PostgreSQL (HTTP 404 Not Found or 410 Gone)
      const deadEndpoints: string[] = []
      let successCount = 0

      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          successCount++
        } else {
          const err = res.reason
          const statusCode = err?.statusCode
          if (statusCode === 404 || statusCode === 410) {
            // Expected web push lifecycle: browser session closed/uninstalled/revoked
            deadEndpoints.push(targets[idx].endpoint)
          } else {
            console.warn('[WebPush] Unexpected subscriber error:', err?.message || err)
          }
        }
      })

      if (deadEndpoints.length > 0) {
        console.log(`[WebPush] Automatically pruned ${deadEndpoints.length} expired/revoked subscription(s) from database.`)
        await query(
          'DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[])',
          [deadEndpoints]
        ).catch((e) => console.error('Failed to prune dead subscriptions:', e))
      }

      return NextResponse.json({
        success: true,
        message: `Notifikasi berhasil diproses: ${successCount} perangkat terkirim${deadEndpoints.length > 0 ? `, ${deadEndpoints.length} perangkat kedaluwarsa dibersihkan` : ''}.`,
        deliveredCount: successCount,
        prunedCount: deadEndpoints.length,
      })
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 })
  } catch (error: any) {
    console.error('Web Push Error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const res = await query('SELECT count(*) FROM push_subscriptions')
    return NextResponse.json({
      success: true,
      subscriberCount: Number(res.rows[0].count),
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
