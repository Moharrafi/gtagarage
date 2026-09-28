'use client'

import { useEffect, useState } from 'react'
import { Bell, BellRing, Loader2, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PUBLIC_VAPID_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BLRWIJ369M5fB6AL04Zunmtx9Vv34pgX69az5mY8alA3jfuYsW0FVU6T7rTeDifHLR555rna-Rs0hLZ2WVq79g0'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushSubscriber() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      // Check current subscription status
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true)
            // Re-sync with backend so serverless instances know this subscription
            fetch('/api/web-push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'subscribe',
                subscription: sub,
              }),
            }).catch(console.error)
          }
        })
      })
    }
  }, [])

  const subscribeUser = async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Browser ini tidak mendukung Web Push Notification.')
        return
      }

      // Check notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Izin notifikasi ditolak. Mohon aktifkan izin notifikasi di setelan situs browser Anda.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      let subscription = await reg.pushManager.getSubscription()

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
        })
      }

      // Send to backend
      const res = await fetch('/api/web-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          subscription,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mendaftar di server')
      }

      setIsSubscribed(true)
      setStatusMessage('Notifikasi berhasil diaktifkan!')
      alert('Berhasil mengaktifkan notifikasi!')
    } catch (err: any) {
      console.error('Failed to subscribe:', err)
      alert('Gagal berlangganan notifikasi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    setLoading(true)
    setStatusMessage(null)
    try {
      let sub = null
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        sub = await reg.pushManager.getSubscription()
      }

      const res = await fetch('/api/web-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          subscription: sub,
          payload: {
            title: 'Pembayaran Lunas! ✅',
            body: 'Invoice INV-123 (Rp 248.000) telah dibayar oleh Customer.',
            url: '/?tab=invoices',
            sound: '/media/cash-in.mp3',
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        alert('Gagal mengirim: ' + (data.message || data.error || 'Server error'))
      } else {
        setStatusMessage('Notifikasi tes berhasil dikirim! Periksa panel notifikasi HP Anda.')
      }
    } catch (error: any) {
      console.error(error)
      alert('Gagal mengirim notifikasi tes: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const testDirectSound = () => {
    try {
      const audio = new Audio('/media/cash-in.mp3')
      audio.play().then(() => {
        setStatusMessage('Suara cash-in berhasil diputar!')
      }).catch((e) => {
        alert('Gagal memutar audio: ' + e.message)
      })
    } catch (e: any) {
      alert('Error audio: ' + e.message)
    }
  }

  if (!isSupported) {
    return (
      <p className="text-[11px] text-amber-600 dark:text-amber-400">
        Perangkat/browser ini tidak mendukung Web Push Notification.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!isSubscribed ? (
          <Button onClick={subscribeUser} disabled={loading} variant="default" size="sm" className="h-9">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
            Aktifkan Notifikasi
          </Button>
        ) : (
          <Button onClick={sendTestNotification} disabled={loading} variant="default" size="sm" className="h-9">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BellRing className="w-4 h-4 mr-2" />}
            Tes Notifikasi Push
          </Button>
        )}

        <Button onClick={testDirectSound} variant="outline" size="sm" className="h-9">
          <Volume2 className="w-4 h-4 mr-2" />
          Tes Suara Cash-In
        </Button>
      </div>

      {statusMessage && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
          {statusMessage}
        </p>
      )}
    </div>
  )
}
