'use client'

export const PUBLIC_VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BLRWIJ369M5fB6AL04Zunmtx9Vv34pgX69az5mY8alA3jfuYsW0FVU6T7rTeDifHLR555rna-Rs0hLZ2WVq79g0'

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission
}

export async function registerPushSubscription(): Promise<{ success: boolean; message: string }> {
  if (!isPushSupported()) {
    return { success: false, message: 'Browser ini tidak mendukung Web Push Notification.' }
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Izin notifikasi ditolak. Mohon aktifkan izin notifikasi di setelan situs browser.',
      }
    }

    const reg = await navigator.serviceWorker.ready
    let subscription = await reg.pushManager.getSubscription()

    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })
    }

    const res = await fetch('/api/web-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        subscription,
      }),
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Gagal mendaftarkan langganan ke server.')
    }

    return { success: true, message: 'Perangkat berhasil terdaftar untuk notifikasi push!' }
  } catch (err: any) {
    console.error('Failed to register push subscription:', err)
    return { success: false, message: err?.message || 'Terjadi kesalahan sistem.' }
  }
}
