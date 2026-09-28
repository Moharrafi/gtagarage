"use client"

import { useState, useEffect } from "react"
import { Bell, BellRing, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/workshop/toast"
import { playCashInSound } from "@/lib/sound"

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

export function NotificationPermissionPrompt() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Verify browser support for Notification & Service Worker
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window
    setIsSupported(supported)
    if (!supported) return

    // If permission is already granted, auto-sync subscription silently in background
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (!sub) {
            reg.pushManager
              .subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
              })
              .then((newSub) => {
                fetch("/api/web-push", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "subscribe", subscription: newSub }),
                }).catch(console.error)
              })
              .catch(console.error)
          } else {
            // Re-sync existing subscription to ensure current lambda has it
            fetch("/api/web-push", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "subscribe", subscription: sub }),
            }).catch(console.error)
          }
        })
      })
      return
    }

    // If permission is 'default' (not yet asked):
    // Check if dismissed in this browser session
    const dismissed = sessionStorage.getItem("notif_prompt_dismissed")
    if (!dismissed && Notification.permission !== "denied") {
      // Delay slightly for smooth page render transition after login
      const timer = setTimeout(() => {
        setOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleRequestPermission = async () => {
    setLoading(true)
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        toast.error("Tidak Didukung", "Browser ini tidak mendukung notifikasi Web Push.")
        setOpen(false)
        return
      }

      // Request browser permission
      const permission = await Notification.requestPermission()

      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready
        let subscription = await reg.pushManager.getSubscription()

        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
          })
        }

        // Register to server
        await fetch("/api/web-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "subscribe",
            subscription,
          }),
        })

        // Give immediate sound & visual confirmation
        playCashInSound()
        toast.success(
          "Notifikasi Aktif! 🔔",
          "Anda akan menerima pemberitahuan otomatis saat ada pembayaran masuk atau unit selesai."
        )
        setOpen(false)
      } else if (permission === "denied") {
        toast.error(
          "Izin Ditolak",
          "Anda memblokir notifikasi. Untuk mengaktifkan kembali, buka setelan situs di browser Anda."
        )
        sessionStorage.setItem("notif_prompt_dismissed", "true")
        setOpen(false)
      } else {
        setOpen(false)
      }
    } catch (err: any) {
      console.error("Permission error:", err)
      toast.error("Gagal Mengaktifkan", err.message || "Terjadi kesalahan saat meminta izin notifikasi.")
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem("notif_prompt_dismissed", "true")
    setOpen(false)
  }

  if (!open || !isSupported) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl text-card-foreground animate-in zoom-in-95 duration-200">
        {/* Icon Header (Static, No Animation) */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 ring-8 ring-blue-500/10">
            <BellRing className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              Aktifkan Notifikasi Kasir & Servis
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Dapatkan pemberitahuan otomatis di HP/komputer Anda bahkan saat aplikasi sedang ditutup.
            </p>
          </div>
        </div>

        {/* Value Points */}
        <div className="mt-5 space-y-2.5 rounded-xl bg-muted/50 p-3.5 border border-border/60 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Bunyi Uang Masuk Otomatis</p>
              <p className="text-[11px] text-muted-foreground">Suara ringtone kasir berbunyi seketika invoice dibayar via QRIS/Midtrans.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 mt-0.5">
              <Check className="h-3 w-3 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Update Status Pekerjaan</p>
              <p className="text-[11px] text-muted-foreground">Pemberitahuan saat pengerjaan unit servis selesai oleh mekanik.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={handleRequestPermission}
            disabled={loading}
            className="w-full h-11 text-sm font-semibold shadow-md bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Mengaktifkan...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Izinkan Notifikasi Sekarang
              </>
            )}
          </Button>

          <Button
            onClick={handleDismiss}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            Nanti Saja
          </Button>
        </div>
      </div>
    </div>
  )
}
