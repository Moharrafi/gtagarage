"use client"

import { MessageCircle, Bell, Check, Clock, AlertCircle } from "lucide-react"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { cn } from "@/lib/utils"
import { notifications, type NotificationItem } from "@/lib/data"

const statusMeta: Record<NotificationItem["status"], { label: string; cls: string; icon: typeof Check }> = {
  terkirim: { label: "Terkirim", cls: "text-success", icon: Check },
  menunggu: { label: "Menunggu", cls: "text-warning", icon: Clock },
  gagal: { label: "Gagal", cls: "text-destructive", icon: AlertCircle },
}

export function NotificationsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Notifikasi" className="max-h-[80vh] overflow-y-auto">
      <div className="mb-3 flex gap-2 text-xs">
        <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 font-medium text-success">
          <MessageCircle className="size-3.5" /> WhatsApp Otomatis
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 font-medium text-primary">
          <Bell className="size-3.5" /> Push
        </span>
      </div>
      <ul className="space-y-2.5">
        {notifications.map((n) => {
          const isWa = n.type === "whatsapp"
          const S = statusMeta[n.status]
          return (
            <li key={n.id} className="flex gap-3 rounded-xl border border-border p-3">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  isWa ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
                )}
              >
                {isWa ? <MessageCircle className="size-4.5" /> : <Bell className="size-4.5" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{n.title}</p>
                  <span className="shrink-0 text-[0.7rem] text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{n.body}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[0.7rem] text-muted-foreground">{n.channel}</span>
                  <span className={cn("flex items-center gap-1 text-[0.7rem] font-medium", S.cls)}>
                    <S.icon className="size-3" /> {S.label}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </BottomSheet>
  )
}
