"use client"

import { useState } from "react"
import {
  Wrench,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  Sparkles,
  Lock,
  User,
  Info,
} from "lucide-react"
import { useWorkshop } from "@/lib/store"
import { defaultUsers, type UserAccount } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/workshop/toast"
import { cn } from "@/lib/utils"

export function LoginScreen() {
  const { profile, login, loginAs } = useWorkshop()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error("Username Kosong", "Silakan masukkan username Anda.")
      return
    }

    setLoading(true)
    setTimeout(() => {
      const ok = login(username, password)
      setLoading(false)
      if (ok) {
        toast.success("Login Berhasil", `Selamat datang kembali di ${profile.name || "GTA GARAGE"}!`)
      } else {
        toast.error(
          "Login Gagal",
          "Username atau password salah. Coba gunakan: owner, admin, atau mekanik (password: 123456)."
        )
      }
    }, 350)
  }

  const handleQuickLogin = (user: UserAccount) => {
    setLoading(true)
    setTimeout(() => {
      loginAs(user)
      setLoading(false)
      toast.success(
        `Login sebagai ${user.role}`,
        `Selamat datang, ${user.name}! ${
          user.role === "Mekanik"
            ? "Mode Mekanik aktif (akses baca saja)."
            : "Akses penuh aktif."
        }`
      )
    }, 250)
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 text-foreground">
      <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-48 rounded-full bg-primary/20 blur-3xl" />

        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/30 ring-4 ring-primary/10">
            <Wrench className="size-7" strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              {profile.name || "GTA GARAGE"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Sistem Manajemen Bengkel, Blasting &amp; Kustomisasi
            </p>
          </div>
        </div>

        {/* Quick Role Selection (Paling Praktis & Cepat) */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>Pilih Role Akun</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              1-Klik Masuk Langsung
            </span>
          </div>

          <div className="space-y-2">
            {defaultUsers.map((u) => {
              const isOwner = u.role === "Owner"
              const isAdmin = u.role === "Admin"
              const isMekanik = u.role === "Mekanik"

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  disabled={loading}
                  className={cn(
                    "group flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.98]",
                    isOwner
                      ? "border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary text-white"
                      : isAdmin
                      ? "border-emerald-500/40 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-500 text-white"
                      : "border-amber-500/40 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-500 text-white"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs ring-1",
                        isOwner
                          ? "bg-primary text-white ring-primary/40"
                          : isAdmin
                          ? "bg-emerald-600 text-white ring-emerald-500/40"
                          : "bg-amber-600 text-white ring-amber-500/40"
                      )}
                    >
                      {u.avatarInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-xs text-white truncate">{u.name}</p>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0",
                            isOwner
                              ? "bg-primary/30 text-blue-200 border border-primary/40"
                              : isAdmin
                              ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/40"
                              : "bg-amber-500/25 text-amber-200 border border-amber-500/40"
                          )}
                        >
                          {isMekanik ? "Mekanik · Hanya Lihat" : `${u.role} · Full Access`}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {isOwner
                          ? "Owner: Kendali penuh finansial & tarif"
                          : isAdmin
                          ? "Admin: Kasir, SPK, & faktur WhatsApp"
                          : "Mekanik: Cek antrian pengerjaan & stok"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-400 group-hover:text-white transition-colors">
                    <ArrowRight className="size-4" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <span className="relative bg-slate-900 px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Atau Masuk Manual
          </span>
        </div>

        {/* Manual Form */}
        <form onSubmit={handleManualLogin} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="owner / admin / mekanik"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (default: 123456)"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-9 text-xs text-white placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 rounded-xl bg-brand-gradient py-2.5 text-xs font-semibold text-white shadow-md shadow-primary/20 active:scale-98 mt-2"
          >
            <LogIn className="size-4" />
            {loading ? "Memproses..." : "Masuk ke Sistem Bengkel"}
          </Button>
        </form>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Info className="size-3" />
            Role Mekanik dibatasi hanya untuk melihat (Read-Only).
          </p>
        </div>
      </div>
    </div>
  )
}
