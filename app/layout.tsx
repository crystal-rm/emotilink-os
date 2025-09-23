import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EmotiLink OS - Oracle-based Emotional Intelligence Platform',
  description: 'A blockchain-powered platform for processing and validating emotional data using advanced oracle technology.',
  keywords: ['blockchain', 'oracle', 'emotional intelligence', 'AI', 'DeFi', 'Polygon'],
  authors: [{ name: 'EmotiLink OS Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'EmotiLink OS - Oracle-based Emotional Intelligence Platform',
    description: 'A blockchain-powered platform for processing and validating emotional data using advanced oracle technology.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EmotiLink OS - Oracle-based Emotional Intelligence Platform',
    description: 'A blockchain-powered platform for processing and validating emotional data using advanced oracle technology.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          {children}
        </div>
      </body>
    </html>
  )
}
