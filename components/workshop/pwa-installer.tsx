"use client"

import { useEffect, useState } from "react"
import { Download, Smartphone, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // 1. Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(isStandaloneMode)

    // 2. Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(iosDevice)

    // 3. Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates
          reg.addEventListener("updatefound", () => {
            const installing = reg.installing
            if (installing) {
              installing.addEventListener("statechange", () => {
                if (installing.state === "installed" && navigator.serviceWorker.controller) {
                  // New update available
                  console.log("[PWA] Update baru tersedia")
                }
              })
            }
          })
        })
        .catch((err) => {
          console.warn("[PWA] Service worker registration error:", err)
        })
    }

    // 4. Capture BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Check if user dismissed banner recently
      try {
        const dismissed = localStorage.getItem("pwa_install_dismissed")
        if (!dismissed) {
          setShowBanner(true)
        }
      } catch {
        setShowBanner(true)
      }
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
      console.log("[PWA] Aplikasi berhasil dipasang!")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowBanner(false)
        setDeferredPrompt(null)
      }
    } else if (isIos) {
      setShowIosGuide(true)
    }
  }

  const handleDismissBanner = () => {
    setShowBanner(false)
    try {
      localStorage.setItem("pwa_install_dismissed", "true")
    } catch {}
  }

  if (isStandalone || isInstalled) {
    return null
  }

  return (
    <>
      {/* Floating Prompt Banner (Bottom or Top) */}
      {showBanner && deferredPrompt && (
        <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md shadow-primary/25 border border-primary/30">
              <img src="/icons/icon-192.png" alt="GTA Garage" className="size-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">Pasang GTA Garage di Homescreen</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Akses cepat seperti aplikasi Android/iPad tanpa address bar browser.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                onClick={handleInstallClick}
                className="gap-1.5 text-xs font-semibold px-3 py-1.5 h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Download className="size-3.5" />
                <span>Pasang</span>
              </Button>
              <button
                type="button"
                onClick={handleDismissBanner}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Tutup"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl text-foreground space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="size-5 text-primary" />
                <h3 className="text-sm font-bold">Pasang di iPhone / iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Di browser Safari iOS, ikuti 2 langkah mudah ini:
            </p>
            <ol className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                  1
                </span>
                <span>
                  Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak panah ke atas di bagian bawah Safari).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
                  2
                </span>
                <span>
                  Gulir ke bawah lalu pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                </span>
              </li>
            </ol>
            <Button
              type="button"
              className="w-full"
              size="sm"
              onClick={() => setShowIosGuide(false)}
            >
              Mengerti
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
