import type { Metadata } from 'next'
import './globals.css'
import './admin.css'
import './storefront.css'
import './admin-responsive.css'

export const metadata: Metadata = {
  title: 'KFC — Chicken Man Plug',
  description: 'Your favourite chicken, pizza and sides delivered through one easy WhatsApp order.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
