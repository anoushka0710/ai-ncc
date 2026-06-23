import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NCC CAMS — Non-Conformance Case Management',
  description: 'Manage and analyse Non-Conformance Cases with AI assistance',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
