"use client"

import { useMemo, useState } from "react"
import { Search, AlertTriangle, History, Boxes, TrendingDown, Plus, Pencil, Trash2, PackagePlus, ChevronDown, Sparkles, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { formatRupiah, generatePartSKU, workshopCategoryPillars, type Part } from "@/lib/data"
import { BottomSheet } from "@/components/workshop/bottom-sheet"
import { toast } from "@/components/workshop/toast"
import { useWorkshop, type PartInput } from "@/lib/store"

const emptyForm: PartInput = { name: "", sku: "", category: "Vapor Blasting", stock: 0, minStock: 0, price: 0 }

function fromPart(p: Part): PartInput {
  return { name: p.name, sku: p.sku, category: p.category, stock: p.stock, minStock: p.minStock, price: p.price }
}

function matchesPillar(p: Part, pillarId: string): boolean {
  if (pillarId === "all") return true
  const str = `${p.category} ${p.name}`.toLowerCase()
  if (pillarId === "vapor") {
    return /vapor|glass bead|degreaser|ultrasonic|soda blast/i.test(str)
  }
  if (pillarId === "sand") {
    return /sand|pasir|silika|garnet|oxide|steel grit|nozzle blaster/i.test(str)
  }
  if (pillarId === "bengkel") {
    return /pelumas|oli|rem|brake|busi|spark|pengapian|filter|rantai|gir|kopling|cvt|aki|bat|ban|tyre|suspensi|shock|gasket|packing|baut/i.test(str)
  }
  if (pillarId === "kustom") {
    return /kustom|custom|modif|powder|coating|cat|paint|epoxy|bracket|plat|knalpot|header|probolt|poles/i.test(str)
  }
  return true
}

const labelCls = "mb-1 block text-xs font-medium text-muted-foreground"

export function InventoryScreen() {
  const { parts, categories, addPart, updatePart, deletePart, stockIn } = useWorkshop()
  const [query, setQuery] = useState("")
  const [lowOnly, setLowOnly] = useState(false)
  const [selectedPillar, setSelectedPillar] = useState<string>("all")
  const [activePillarTab, setActivePillarTab] = useState<string>("vapor")
  const [openId, setOpenId] = useState<string | null>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [isAutoSku, setIsAutoSku] = useState(true)
  const [form, setForm] = useState<PartInput>(emptyForm)

  const [stockSheetId, setStockSheetId] = useState<string | null>(null)
  const [stockQty, setStockQty] = useState(1)

  const countVapor = useMemo(() => parts.filter((p) => matchesPillar(p, "vapor")).length, [parts])
  const countSand = useMemo(() => parts.filter((p) => matchesPillar(p, "sand")).length, [parts])
  const countBengkel = useMemo(() => parts.filter((p) => matchesPillar(p, "bengkel")).length, [parts])
  const countKustom = useMemo(() => parts.filter((p) => matchesPillar(p, "kustom")).length, [parts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return parts.filter((p) => {
      const matchPillar = matchesPillar(p, selectedPillar)
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      const matchLow = !lowOnly || p.stock <= p.minStock
      return matchPillar && matchQ && matchLow
    })
  }, [parts, query, lowOnly, selectedPillar])

  const totalValue = parts.reduce((s, p) => s + p.stock * p.price, 0)
  const lowCount = parts.filter((p) => p.stock <= p.minStock).length
  const stockTarget = stockSheetId ? parts.find((p) => p.id === stockSheetId) : null

  function openAdd() {
    setEditId(null)
    setIsAutoSku(true)
    const initialCategory = "Vapor Blasting"
    const initialSku = generatePartSKU("", initialCategory, parts)
    setForm({ ...emptyForm, category: initialCategory, sku: initialSku })
    setActivePillarTab("vapor")
    setSheetOpen(true)
  }

  function openEdit(p: Part) {
    setEditId(p.id)
    setIsAutoSku(false)
    setForm(fromPart(p))
    const str = `${p.category} ${p.name}`.toLowerCase()
    if (/sand|pasir|silika|garnet|oxide/i.test(str)) {
      setActivePillarTab("sand")
    } else if (/kustom|custom|powder|cat|plat/i.test(str)) {
      setActivePillarTab("kustom")
    } else if (/pelumas|oli|rem|busi|filter|rantai|kopling|ban/i.test(str)) {
      setActivePillarTab("bengkel")
    } else {
      setActivePillarTab("vapor")
    }
    setSheetOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Gagal Menyimpan", "Mohon isi nama suku cadang.")
      return
    }
    const finalCategory = form.category.trim() || "Bengkel"
    const finalSku = (form.sku.trim() || generatePartSKU(form.name, finalCategory, parts)).toUpperCase()
    const finalForm = { ...form, category: finalCategory, sku: finalSku }
    if (editId) {
      updatePart(editId, finalForm)
      toast.success("Suku Cadang Diperbarui", `Data "${finalForm.name}" (${finalForm.sku}) berhasil disimpan.`)
    } else {
      addPart(finalForm)
      toast.success("Suku Cadang Ditambahkan", `Item "${finalForm.name}" (${finalForm.sku}) berhasil ditambahkan ke inventaris.`)
    }
    setSheetOpen(false)
  }

  function handleStockIn(e: React.FormEvent) {
    e.preventDefault()
    if (stockSheetId && stockQty > 0) {
      stockIn(stockSheetId, stockQty)
      const targetName = stockTarget?.name || "suku cadang"
      toast.success("Stok Ditambahkan", `+${stockQty} unit berhasil masuk untuk "${targetName}".`)
    } else {
      toast.error("Gagal Menambah Stok", "Jumlah unit harus lebih dari 0.")
    }
    setStockSheetId(null)
    setStockQty(1)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-0 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Nilai Stok</span>
            <Boxes className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-lg font-semibold tracking-tight">{formatRupiah(totalValue)}</p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{parts.length} jenis item</p>
        </Card>
        <Card className="gap-0 p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Perlu Restock</span>
            <TrendingDown className="size-4 text-destructive" />
          </div>
          <p className="mt-2 text-lg font-semibold tracking-tight">{lowCount} item</p>
          <p className="mt-0.5 text-[0.7rem] text-muted-foreground">Di bawah minimum</p>
        </Card>
      </div>

      <button
        type="button"
        onClick={openAdd}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-[0.99]"
      >
        <Plus className="size-4" strokeWidth={2.6} />
        Tambah Suku Cadang
      </button>

      {/* 4 Focus Pillar Filter Bar */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar">
        {[
          { id: "all", label: "Semua", count: parts.length },
          { id: "vapor", label: "💧 Vapor Blasting", count: countVapor },
          { id: "sand", label: "🏖️ Sand Blasting", count: countSand },
          { id: "bengkel", label: "🔧 Bengkel", count: countBengkel },
          { id: "kustom", label: "⚡ Kustom", count: countKustom },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedPillar(item.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              selectedPillar === item.id
                ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                : "border-border bg-card text-muted-foreground hover:text-foreground dark:border-slate-700/80 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            )}
          >
            <span>{item.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 text-[0.65rem] font-medium transition-colors",
                selectedPillar === item.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari suku cadang / SKU"
            className="pl-9"
            aria-label="Cari suku cadang"
          />
        </div>
        <button
          type="button"
          onClick={() => setLowOnly((v) => !v)}
          aria-pressed={lowOnly}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
            lowOnly
              ? "border-destructive bg-destructive/15 text-destructive font-semibold dark:bg-destructive/25"
              : "border-border bg-card text-muted-foreground hover:text-foreground dark:border-slate-700/80 dark:hover:bg-slate-800 dark:hover:text-slate-100",
          )}
        >
          <AlertTriangle className="size-4" />
          Menipis
        </button>
      </div>

      <div className="space-y-2.5">
        {filtered.map((p) => {
          const low = p.stock <= p.minStock
          const maxStock = Math.max(p.minStock * 2, p.stock, 1)
          const calculatedRatio = Math.round((p.stock / maxStock) * 100)
          const ratio = p.stock === 0 ? 0 : Math.min(100, Math.max(6, calculatedRatio))
          const open = openId === p.id
          return (
            <Card key={p.id} className="gap-0 p-0">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                className="w-full p-3.5 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.sku} · {p.category}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className={cn("text-sm font-semibold", low ? "text-destructive" : "text-foreground")}>{p.stock}</p>
                      <p className="text-[0.7rem] text-muted-foreground">min {p.minStock}</p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform duration-300 ease-out",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        low
                          ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.35)]"
                          : "bg-primary shadow-[0_0_8px_rgba(37,99,235,0.25)]"
                      )}
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{formatRupiah(p.price)}</span>
                </div>
                {low && (
                  <p className="mt-2 flex items-center gap-1 text-[0.7rem] font-medium text-destructive">
                    <AlertTriangle className="size-3" /> Stok di bawah batas minimum
                  </p>
                )}
              </button>

              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                  open
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0 pointer-events-none"
                )}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-border bg-muted/40 p-3.5 dark:bg-slate-900/60 dark:border-slate-700/80">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                      <History className="size-3.5 text-primary dark:text-blue-400" /> Riwayat Pemakaian
                    </div>
                    {p.usedInOrders.length ? (
                      <ul className="flex flex-wrap gap-1.5">
                        {p.usedInOrders.map((code) => (
                          <li
                            key={code}
                            className="rounded-md bg-card px-2 py-1 text-[0.7rem] font-medium text-muted-foreground ring-1 ring-border dark:ring-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {code}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Belum pernah dipakai.</p>
                    )}
                    <p className="mt-2 text-[0.7rem] text-muted-foreground">
                      Terpakai pada {p.usedInOrders.length} perbaikan terakhir.
                    </p>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStockSheetId(p.id)
                          setStockQty(1)
                        }}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-brand-2-foreground shadow-sm transition-transform active:scale-98"
                        style={{ backgroundColor: "var(--brand-2)" }}
                      >
                        <PackagePlus className="size-3.5" /> Barang Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus "${p.name}" dari inventaris?`)) {
                            deletePart(p.id)
                            if (openId === p.id) setOpenId(null)
                            toast.success("Suku Cadang Dihapus", `Item "${p.name}" berhasil dihapus.`)
                          }
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}

        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada item yang cocok.</p>
        )}
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={editId ? "Edit Suku Cadang" : "Tambah Suku Cadang"}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className={labelCls} htmlFor="pt-name">Nama Item</label>
            <Input
              id="pt-name"
              value={form.name}
              onChange={(e) => {
                const newName = e.target.value
                setForm((prev) => ({
                  ...prev,
                  name: newName,
                  sku: isAutoSku ? generatePartSKU(newName, prev.category, parts) : prev.sku,
                }))
              }}
              placeholder="cth. Oli Mesin Motul 5100"
              required
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="pt-sku">SKU</label>
                {isAutoSku && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.6rem] font-semibold text-primary dark:bg-primary/25 dark:text-blue-300">
                    <Sparkles className="size-2.5" />
                    Auto
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAutoSku(true)
                  const newSku = generatePartSKU(form.name, form.category, parts)
                  setForm((prev) => ({ ...prev, sku: newSku }))
                  toast.info("SKU Otomatis", `Kode SKU dibuat: ${newSku}`)
                }}
                className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-primary hover:text-primary/80 transition-colors"
                title="Generate ulang SKU otomatis dari nama & kategori"
              >
                <RefreshCw className="size-2.5" />
                <span>{isAutoSku ? "Acak Ulang" : "Buat Otomatis"}</span>
              </button>
            </div>
            <div className="relative">
              <Input
                id="pt-sku"
                value={form.sku}
                onChange={(e) => {
                  setIsAutoSku(false)
                  setForm({ ...form, sku: e.target.value.toUpperCase() })
                }}
                placeholder="VBM-GLS-25 / OIL-MTL-5100"
                className={cn(
                  "font-mono text-xs uppercase pr-7",
                  isAutoSku && "border-primary/40 bg-primary/[0.03] dark:border-primary/40 dark:bg-primary/[0.06]"
                )}
                required
              />
              {isAutoSku && (
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                  <Sparkles className="size-3.5 text-primary/70" />
                </div>
              )}
            </div>
          </div>

          {/* Kategori Management Section with 4 Workshop Focus Pillars */}
          <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3 dark:border-slate-700/80 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground" htmlFor="pt-cat">
                Kategori Item
              </label>
              {form.category && (
                <span className="truncate max-w-[190px] text-[0.65rem] text-muted-foreground">
                  Terpilih: <span className="font-bold text-primary dark:text-blue-300">{form.category}</span>
                </span>
              )}
            </div>

            {/* 4 Focus Pillar Tabs */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-background p-1 border border-border dark:border-slate-700/80">
              {[
                { id: "vapor", label: "Vapor", icon: "💧" },
                { id: "sand", label: "Sand", icon: "🏖️" },
                { id: "bengkel", label: "Bengkel", icon: "🔧" },
                { id: "kustom", label: "Kustom", icon: "⚡" },
              ].map((pillar) => (
                <button
                  key={pillar.id}
                  type="button"
                  onClick={() => setActivePillarTab(pillar.id)}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded-lg py-1.5 px-1 text-[11px] font-semibold transition-all whitespace-nowrap",
                    activePillarTab === pillar.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground dark:hover:bg-slate-800"
                  )}
                >
                  <span>{pillar.icon}</span>
                  <span className="truncate">{pillar.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Presets for Selected Pillar */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {workshopCategoryPillars
                .find((p) => p.id === activePillarTab)
                ?.categories.map((cat) => {
                  const isSelected = form.category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          category: cat,
                          sku: isAutoSku ? generatePartSKU(prev.name, cat, parts) : prev.sku,
                        }))
                      }}
                      className={cn(
                        "rounded-lg border px-2 py-1 text-[0.68rem] font-medium transition-all",
                        isSelected
                          ? "border-primary bg-primary/15 text-primary font-bold shadow-xs dark:bg-primary/25 dark:text-blue-300 dark:border-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground dark:border-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-700"
                      )}
                    >
                      {cat}
                    </button>
                  )
                })}
            </div>

            {/* Input field for typing/adding new custom category */}
            <div className="pt-1">
              <Input
                id="pt-cat"
                list="category-suggestions"
                value={form.category}
                onChange={(e) => {
                  const newCat = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    category: newCat,
                    sku: isAutoSku ? generatePartSKU(prev.name, newCat, parts) : prev.sku,
                  }))
                }}
                placeholder="Pilih di atas atau ketik kategori baru..."
                className="h-8.5 text-xs bg-background"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls} htmlFor="pt-stock">Stok</label>
              <Input id="pt-stock" type="number" min={0} value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className={labelCls} htmlFor="pt-min">Min. Stok</label>
              <Input id="pt-min" type="number" min={0} value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} placeholder="0" />
            </div>
            <div>
              <label className={labelCls} htmlFor="pt-price">Harga (Rp)</label>
              <Input id="pt-price" type="number" min={0} value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="0" />
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-gradient py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-transform active:scale-[0.99]"
          >
            {editId ? "Simpan Perubahan" : "Simpan Item"}
          </button>
        </form>
      </BottomSheet>

      <BottomSheet open={stockSheetId !== null} onClose={() => setStockSheetId(null)} title="Barang Masuk">
        {stockTarget && (
          <form onSubmit={handleStockIn} className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-sm font-medium">{stockTarget.name}</p>
              <p className="text-xs text-muted-foreground">{stockTarget.sku} · Stok saat ini {stockTarget.stock}</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="stock-qty">Jumlah Masuk</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStockQty((q) => Math.max(1, q - 1))} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold text-foreground">−</button>
                <Input id="stock-qty" type="number" min={1} value={stockQty} onChange={(e) => setStockQty(Math.max(1, Number(e.target.value)))} className="text-center" />
                <button type="button" onClick={() => setStockQty((q) => q + 1)} className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-lg font-semibold text-foreground">+</button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Stok setelah masuk: <span className="font-semibold text-foreground">{stockTarget.stock + stockQty}</span>
            </p>
            <button
              type="submit"
              className="w-full rounded-xl py-3 text-sm font-semibold text-brand-2-foreground shadow-md"
              style={{ backgroundColor: "var(--brand-2)" }}
            >
              Konfirmasi Barang Masuk
            </button>
          </form>
        )}
      </BottomSheet>
    </div>
  )
}
