"use client"

import { useState, useEffect } from "react"
import {
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  Lock,
  User,
  Sun,
  Moon,
  HelpCircle,
} from "lucide-react"
import { useWorkshop } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/workshop/toast"

export function LoginScreen() {
  const { profile, login } = useWorkshop()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isDark, setIsDark] = useState(false)

  // Sync theme state on mount
  useEffect(() => {
    const currentIsDark = document.documentElement.classList.contains("dark")
    setIsDark(currentIsDark)
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    document.documentElement.classList.toggle("dark", nextDark)
    try {
      localStorage.setItem("bengkel_theme", nextDark ? "dark" : "light")
    } catch {}
  }

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error("Username Kosong", "Silakan masukkan nama pengguna atau ID akun.")
      return
    }

    setLoading(true)
    setTimeout(() => {
      const ok = login(username, password)
      setLoading(false)
      if (ok) {
        try {
          sessionStorage.removeItem("notif_prompt_dismissed")
        } catch {}
        toast.success(
          "Login Berhasil",
          `Selamat datang di sistem operasional ${profile.name || "GTA GARAGE"}!`
        )
      } else {
        toast.error(
          "Kredensial Tidak Sesuai",
          "Username atau kata sandi tidak cocok. Silakan periksa kembali akun Anda."
        )
      }
    }, 300)
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-slate-100/80 dark:bg-zinc-950 p-4 sm:p-6 text-foreground transition-colors duration-200">
      {/* Background subtle texture for authentic industrial feel */}
      <div className="fixed inset-0 pointer-events-none opacity-40 dark:opacity-20 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative w-full max-w-[420px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/60 transition-all">
        {/* Top Header: Brand & Theme Toggle */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Automotive Monogram / Badge */}
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-white font-black text-sm tracking-wider shadow-md shadow-primary/25 ring-2 ring-primary/20">
              GTA
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                  {profile.name || "GTA GARAGE"}
                </h1>
                <span className="rounded bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Sistem Operasional &amp; Manajemen Bengkel
              </p>
            </div>
          </div>

          {/* Theme switcher button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            className="flex size-8 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700/80 transition-colors"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1.5">
              Nama Pengguna / ID Akun
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 size-4 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="mis. owner / admin / mekanik"
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/60 py-2.5 pl-9 pr-3 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-slate-800 dark:focus:border-zinc-400 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-slate-800 dark:focus:ring-zinc-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors flex items-center gap-1"
              >
                <HelpCircle className="size-3" />
                <span>Bantuan Masuk</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-slate-400 dark:text-zinc-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Kata sandi akun"
                className="w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/60 py-2.5 pl-9 pr-9 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:border-slate-800 dark:focus:border-zinc-400 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-slate-800 dark:focus:ring-zinc-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Help box for credentials */}
          {showHelp && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 p-2.5 text-[11px] text-blue-800 dark:text-blue-300 space-y-1 animate-in fade-in duration-150">
              <p className="font-semibold">Info Kredensial Shift Bengkel:</p>
              <p>
                • <strong>Owner:</strong> username <code className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded">owner</code> (pass: owner atau 123456)
              </p>
              <p>
                • <strong>Admin:</strong> username <code className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded">admin</code> (pass: admin atau 123456)
              </p>
              <p>
                • <strong>Mekanik:</strong> username <code className="bg-blue-100 dark:bg-blue-900/60 px-1 rounded">mekanik</code> (pass: mekanik atau 123456)
              </p>
            </div>
          )}

          {/* Remember me & submit */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 dark:border-zinc-700 dark:bg-zinc-800"
            />
            <label htmlFor="remember" className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
              Ingat sesi di perangkat bengkel ini
            </label>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 py-2.5 text-xs font-semibold shadow-sm transition-all"
            >
              <LogIn className="size-4" />
              {loading ? "Memverifikasi..." : "Masuk ke Sistem Bengkel"}
            </Button>
          </div>
        </form>

        {/* Security & Terminal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-center">
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="size-3.5 text-slate-400 dark:text-zinc-500" />
            <span>Koneksi Terenkripsi • Terminal Operasional GTA Garage</span>
          </p>
        </div>
      </div>
    </div>
  )
}
