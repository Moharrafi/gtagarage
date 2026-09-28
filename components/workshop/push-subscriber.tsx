'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

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

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      // Check current subscription status
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true)
          }
        })
      })
    }
  }, [])

  const subscribeUser = async () => {
    if (!publicVapidKey) {
      alert('VAPID public key is missing from environment variables!')
      return
    }

    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      })

      // Send to backend
      await fetch('/api/web-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          subscription,
        }),
      })

      setIsSubscribed(true)
      alert('Berhasil mengaktifkan notifikasi!')
    } catch (err: any) {
      console.error('Failed to subscribe:', err)
      if (Notification.permission === 'denied') {
        alert('Anda memblokir izin notifikasi. Silakan ubah pengaturan browser Anda.')
      } else {
        alert('Gagal berlangganan notifikasi: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const sendTestNotification = async () => {
    setLoading(true)
    try {
      await fetch('/api/web-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          payload: {
            title: 'Pembayaran Lunas! ✅',
            body: 'Invoice INV-123 (Rp 248.000) telah dibayar oleh Customer.',
            url: '/?tab=invoices',
          },
        }),
      })
    } catch (error) {
      console.error(error)
      alert('Gagal mengirim notifikasi tes')
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) return null

  return (
    <div className="flex items-center gap-2">
      {!isSubscribed ? (
        <Button onClick={subscribeUser} disabled={loading} variant="outline" size="sm" className="h-9">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
          Aktifkan Notifikasi
        </Button>
      ) : (
        <Button onClick={sendTestNotification} disabled={loading} variant="default" size="sm" className="h-9">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
          Tes Notifikasi
        </Button>
      )}
    </div>
  )
}
