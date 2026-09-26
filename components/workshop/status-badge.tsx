import { cn } from "@/lib/utils"
import type { WorkStatus, PaymentStatus } from "@/lib/data"

const workStyles: Record<WorkStatus, string> = {
  Antrian: "bg-slate-500/15 text-slate-700 font-semibold border border-slate-500/25 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/80",
  Dikerjakan: "bg-blue-500/15 text-blue-700 font-semibold border border-blue-500/30 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800/80",
  "Menunggu Sparepart": "bg-amber-500/15 text-amber-800 font-semibold border border-amber-500/30 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800/80",
  Selesai: "bg-purple-500/15 text-purple-700 font-semibold border border-purple-500/30 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800/80",
  "Siap Diambil": "bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80",
}

const paymentStyles: Record<PaymentStatus, string> = {
  Lunas: "bg-emerald-500/15 text-emerald-800 font-bold border border-emerald-500/30 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800/80",
  "Belum Bayar": "bg-slate-500/15 text-slate-700 font-semibold border border-slate-500/25 dark:bg-slate-800/70 dark:text-slate-300",
  Sebagian: "bg-amber-500/15 text-amber-800 font-semibold border border-amber-500/30 dark:bg-amber-950/70 dark:text-amber-300",
  "Jatuh Tempo": "bg-destructive/15 text-destructive font-bold border border-destructive/30 dark:bg-destructive/20 dark:text-red-400",
}

export function WorkStatusBadge({ status, className }: { status: WorkStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        workStyles[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  )
}

export function PaymentStatusBadge({ status, className }: { status: PaymentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        paymentStyles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
