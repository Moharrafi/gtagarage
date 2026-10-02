"use client"

import * as React from "react"
import { Drawer } from "vaul"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomSheet({
  open,
  onClose,
  title,
  header,
  children,
  className,
  bodyClassName,
  full,
}: {
  open: boolean
  onClose: () => void
  title?: string
  header?: React.ReactNode
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  full?: boolean
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
      shouldScaleBackground={false}
      repositionInputs={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 transition-opacity" />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full flex-col bg-card shadow-2xl outline-none",
            "max-w-[440px] md:max-w-[640px] lg:max-w-[720px]",
            full
              ? "h-full max-h-dvh md:max-h-[92dvh] rounded-none md:rounded-t-3xl border-0 md:border-t md:border-x md:border-border"
              : "max-h-[92dvh] md:max-h-[88dvh] rounded-t-3xl border-t md:border-x border-border",
            className
          )}
        >
          {/* Native gesture pill handle */}
          {!full && (
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30 md:hidden" />
          )}

          {header !== undefined ? (
            header
          ) : title ? (
            <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-3.5">
              <Drawer.Title className="text-base font-bold tracking-tight text-foreground">
                {title}
              </Drawer.Title>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="size-4.5" />
              </button>
            </div>
          ) : (
            <Drawer.Title className="sr-only">Panel Dialog</Drawer.Title>
          )}

          <div
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] no-scrollbar",
              bodyClassName
            )}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
