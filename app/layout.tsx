import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'ASCET Interview Hub',
  description: 'College Interview & Aptitude Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  )
}