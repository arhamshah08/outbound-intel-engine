import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Outbound Intelligence Engine',
  description: 'Score, enrich, and personalize outreach for any company list',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
