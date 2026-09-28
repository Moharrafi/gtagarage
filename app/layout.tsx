import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { PwaInstaller } from '@/components/workshop/pwa-installer'
import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'GTA GARAGE — Sistem Manajemen Bengkel',
  description:
    'Aplikasi POS & Manajemen Bengkel Motor: servis kendaraan, vapor & sand blasting, kustomisasi motor, stok suku cadang, invoice Midtrans, dan analitik.',
  applicationName: 'GTA GARAGE',
  manifest: '/manifest.webmanifest',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GTA Garage',
  },
  icons: {
    icon: [
      {
        url: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        url: '/icons/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#090a0e' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning className={fontSans.variable}>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#2563eb" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#090a0e" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bengkel_theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;if(t==="dark"||((!t||t==="system")&&d)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <PwaInstaller />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

