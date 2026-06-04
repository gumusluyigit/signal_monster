import type { Metadata } from 'next'
import { DM_Sans, DM_Mono, Bebas_Neue } from 'next/font/google'
import { AuthProvider } from '@/components/AuthProvider'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500'],
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['300', '400', '500'],
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'Signal Monster — ScateAI Intelligence',
  description: 'Market intelligence alarm platform by ScateAI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${dmSans.variable} ${dmMono.variable} ${bebasNeue.variable}`}>
      <body className="bg-bg-base text-text-primary font-body antialiased min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}