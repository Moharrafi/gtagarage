import { NextResponse } from 'next/server'
import webpush from 'web-push'

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

// In-memory cache of subscriptions (for single-instance or warm lambdas)
let subscriptions: any[] = []

export async function POST(req: Request) {
  ensureVapidDetails()

  try {
    const { action, subscription, payload } = await req.json()

    if (action === 'subscribe') {
      if (subscription && subscription.endpoint) {
        const exists = subscriptions.find((sub) => sub.endpoint === subscription.endpoint)
        if (!exists) {
          subscriptions.push(subscription)
        }
        return NextResponse.json({ success: true, message: 'Berhasil mendaftarkan perangkat.' })
      }
      return NextResponse.json({ success: false, message: 'Objek subscription tidak valid.' }, { status: 400 })
    }

    if (action === 'send') {
      // Build list of target subscriptions (include the one sent in the request if provided)
      const targets = [...subscriptions]
      if (subscription && subscription.endpoint) {
        if (!targets.some((s) => s.endpoint === subscription.endpoint)) {
          targets.push(subscription)
          subscriptions.push(subscription)
        }
      }

      if (targets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Belum ada perangkat yang mengaktifkan notifikasi. Silakan klik "Aktifkan Notifikasi" terlebih dahulu.',
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

      // Prune dead subscriptions (404/410)
      results.forEach((res, idx) => {
        if (res.status === 'rejected') {
          const err = res.reason
          if (err && (err.statusCode === 404 || err.statusCode === 410)) {
            const deadSub = targets[idx]
            subscriptions = subscriptions.filter((s) => s.endpoint !== deadSub.endpoint)
          }
          console.error('Push error for subscriber:', res.reason)
        }
      })

      const hasSuccess = results.some((r) => r.status === 'fulfilled')
      if (!hasSuccess) {
        const firstError = results.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
        const errorMsg = firstError?.reason?.message || firstError?.reason?.body || 'Push service rejected notification'
        return NextResponse.json(
          { success: false, message: `Gagal mengirim push: ${errorMsg}` },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, message: 'Notifikasi berhasil dikirim.' })
    }

    return NextResponse.json({ success: false, message: 'Aksi tidak valid.' }, { status: 400 })
  } catch (error: any) {
    console.error('Web Push Error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 })
  }
}
