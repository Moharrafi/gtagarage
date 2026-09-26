import { Wrench, SprayCan, Wind, Paintbrush } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ServiceType } from "@/lib/data"

const map: Record<ServiceType, { icon: typeof Wrench; tint: string }> = {
  Servis: { icon: Wrench, tint: "bg-chart-3/15 text-chart-3" },
  "Vapor Blasting": { icon: Wind, tint: "bg-chart-2/15 text-chart-2" },
  "Sand Blasting": { icon: SprayCan, tint: "bg-chart-5/15 text-chart-5" },
  Kustomisasi: { icon: Paintbrush, tint: "bg-primary/15 text-primary" },
}

export function ServiceIcon({
  service,
  className,
  size = "md",
}: {
  service: ServiceType
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const { icon: Icon, tint } = map[service]
  const box = size === "sm" ? "size-8" : size === "lg" ? "size-12" : "size-10"
  const iconSize = size === "sm" ? "size-4" : size === "lg" ? "size-6" : "size-5"
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-xl", box, tint, className)}>
      <Icon className={iconSize} strokeWidth={2} />
    </div>
  )
}
