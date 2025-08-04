import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import ReactQueryProvider from '@/components/providers/ReactQueryProvider'
import RealtimeProvider from '@/components/providers/RealtimeProvider'
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { ToastContainer } from '@/components/ui/ToastContainer'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SalonSphere - Salon CRM & Management Platform',
  description: 'Complete CRM and management solution for beauty salons',
  icons: {
    icon: '/brand/salon-logo.png',
    shortcut: '/brand/salon-logo.png',
    apple: '/brand/salon-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl" className="h-full">
      <body className={`${outfit.className} h-full`}>
        <ReactQueryProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <RealtimeProvider>
                <ToastProvider>
                  {children}
                  <ToastContainer />
                </ToastProvider>
              </RealtimeProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}