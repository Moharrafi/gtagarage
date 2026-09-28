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
            success: false,
            message: 'Belum ada perangkat yang terdaftar di database. Silakan klik "Aktifkan Notifikasi" terlebih dahulu.',
          },
          { status: 400 }
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
        targets.map((sub) => webpush.sendNotification(sub, notifPayload))
      )

      // Prune dead subscriptions from PostgreSQL (HTTP 404 or 410)
      const deadEndpoints: string[] = []
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          const err = res.reason
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            deadEndpoints.push(targets[idx].endpoint)
          }
          console.error('Push error for subscriber:', res.reason)
        }
      })

      if (deadEndpoints.length > 0) {
        await query(
          'DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[])',
          [deadEndpoints]
        ).catch((e) => console.error('Failed to prune dead subscriptions:', e))
      }

      const hasSuccess = results.some((r) => r.status === 'fulfilled')
      if (!hasSuccess) {
        const firstError = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
        const errorMsg = firstError?.reason?.message || firstError?.reason?.body || 'Push service rejected notification'
        return NextResponse.json(
          { success: false, message: `Gagal mengirim push: ${errorMsg}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: `Notifikasi berhasil dikirim ke ${results.filter((r) => r.status === 'fulfilled').length} perangkat.`,
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
