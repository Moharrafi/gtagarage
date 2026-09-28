"use client"

import { useState, useMemo } from "react"
import {
  Bell,
  Check,
  Clock,
  AlertCircle,
  Package,
  CheckCircle2,
  Receipt,
  Trash2,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Volume2,
} from "lucide-react"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { WhatsAppIcon } from "@/components/workshop/whatsapp-icon"
import { cn } from "@/lib/utils"
import { type NotificationItem } from "@/lib/data"
import { useWorkshop } from "@/lib/store"
import { confirmModal } from "@/components/workshop/confirm-dialog"
import { toast } from "@/components/workshop/toast"
import { playCashInSound } from "@/lib/sound"

const statusMeta: Record<NotificationItem["status"], { label: string; cls: string; icon: typeof Check }> = {
  terkirim: { label: "Terkirim", cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Check },
  menunggu: { label: "Menunggu", cls: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20", icon: Clock },
  gagal: { label: "Gagal", cls: "text-destructive bg-destructive/10 border-destructive/20", icon: AlertCircle },
}

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
  onNavigate?: (tab: "beranda" | "pekerjaan" | "stok" | "invoice" | "analitik") => void
}

export function NotificationsPanel({ open, onClose, onNavigate }: NotificationsPanelProps) {
  const {
    notifications,
    unreadNotifCount,
    markAllNotifAsRead,
    markNotifAsRead,
    clearNotifications,
    deleteNotification,
  } = useWorkshop()

  const [filterType, setFilterType] = useState<"all" | "whatsapp" | "push">("all")

  const waCount = useMemo(() => notifications.filter((n) => n.type === "whatsapp").length, [notifications])
  const pushCount = useMemo(() => notifications.filter((n) => n.type === "push").length, [notifications])

  const filteredList = useMemo(() => {
    if (filterType === "whatsapp") return notifications.filter((n) => n.type === "whatsapp")
    if (filterType === "push") return notifications.filter((n) => n.type === "push")
    return notifications
  }, [notifications, filterType])

  const handleClearAll = async () => {
    const ok = await confirmModal({
      title: "Bersihkan Semua Notifikasi?",
      description: "Seluruh riwayat notifikasi WhatsApp dan sistem akan dihapus dari perangkat ini.",
      confirmText: "Bersihkan",
      variant: "destructive",
      icon: "trash",
    })
    if (ok) {
      clearNotifications()
      toast.info("Notifikasi Dibersihkan", "Semua riwayat notifikasi telah dihapus.")
    }
  }

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) {
      markNotifAsRead(n.id)
    }
    if (n.linkTab && onNavigate) {
      onNavigate(n.linkTab)
      onClose()
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Notifikasi Operasional" className="max-h-[85vh] overflow-y-auto">
      {/* Filter Tabs & Top Actions */}
      <div className="space-y-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          {/* Segmented Filter Pills */}
          <div className="flex gap-1 rounded-xl bg-muted/60 p-1 border border-border">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                filterType === "all"
                  ? "bg-background text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("whatsapp")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                filterType === "whatsapp"
                  ? "bg-background text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <WhatsAppIcon className="size-3 fill-current" />
              <span>WA ({waCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("push")}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                filterType === "push"
                  ? "bg-background text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Bell className="size-3" />
              <span>Sistem ({pushCount})</span>
            </button>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={playCashInSound}
              title="Tes Bunyi Cash-In"
              className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Volume2 className="size-3.5" />
            </button>

            {unreadNotifCount > 0 && (
              <button
                type="button"
                onClick={markAllNotifAsRead}
                title="Tandai semua sudah dibaca"
                className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <CheckCheck className="size-3 text-primary" />
                <span className="hidden sm:inline">Tandai Dibaca</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                title="Bersihkan riwayat notifikasi"
                className="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Bell className="size-6 opacity-60" />
          </div>
          <p className="text-sm font-semibold text-foreground">Tidak Ada Notifikasi</p>
          <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
            {filterType === "whatsapp"
              ? "Belum ada riwayat pesan WhatsApp yang dikirim dari sistem bengkel."
              : filterType === "push"
              ? "Tidak ada peringatan sistem, stok suku cadang, atau unit siap diambil saat ini."
              : "Semua operasional bengkel berjalan normal. Notifikasi real-time akan muncul di sini."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5 pb-2">
          {filteredList.map((n) => {
            const isWa = n.type === "whatsapp"
            const S = statusMeta[n.status] || statusMeta.terkirim

            // Determine specialized icon based on title/category
            const isStock = n.title.toLowerCase().includes("stok")
            const isReady = n.title.toLowerCase().includes("siap diambil")
            const isPayment = n.title.toLowerCase().includes("bayar") || n.title.toLowerCase().includes("tagihan")

            return (
              <li
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={cn(
                  "group relative flex gap-3 rounded-2xl border p-3 transition-all cursor-pointer select-none",
                  !n.read
                    ? "border-primary/40 bg-primary/[0.03] dark:bg-primary/[0.06] shadow-sm"
                    : "border-border bg-card hover:bg-muted/40",
                )}
              >
                {/* Unread dot indicator */}
                {!n.read && (
                  <span className="absolute top-3 right-3 size-2 rounded-full bg-primary ring-2 ring-background" />
                )}

                {/* Left Icon Badge */}
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl",
                    isWa
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : isStock
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : isReady
                      ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                      : isPayment
                      ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                      : "bg-primary/15 text-primary",
                  )}
                >
                  {isWa ? (
                    <WhatsAppIcon className="size-5 fill-current" />
                  ) : isStock ? (
                    <Package className="size-5" />
                  ) : isReady ? (
                    <CheckCircle2 className="size-5" />
                  ) : isPayment ? (
                    <Receipt className="size-5" />
                  ) : (
                    <Bell className="size-5" />
                  )}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-xs leading-snug truncate", !n.read ? "font-bold text-foreground" : "font-medium text-foreground/90")}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                  </div>

                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                    {n.body}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium truncate max-w-[150px]">
                        {n.channel}
                      </span>
                      {n.linkTab && (
                        <span className="flex items-center text-primary font-semibold group-hover:underline">
                          Lihat {n.linkTab} <ChevronRight className="size-3 ml-0.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn("flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium border", S.cls)}>
                        <S.icon className="size-2.5" /> {S.label}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(n.id)
                        }}
                        title="Hapus notifikasi ini"
                        className="rounded p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </BottomSheet>
  )
}

