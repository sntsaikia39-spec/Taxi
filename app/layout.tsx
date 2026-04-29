import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: "Rina's Tours and Travels - Airport Taxi & Tour Booking",
  description:
    "Book your airport taxi or tour package with Rina's Tours and Travels. Transparent pricing and secure payment. Pre-book taxis from Hollongi Airport to your destination.",
  keywords: [
    'taxi booking',
    'airport taxi',
    'tour package',
    'transportation',
    'hollongi airport',
    "rina's tours and travels",
  ],
  authors: [{ name: "Rina's Tours and Travels" }],
  openGraph: {
    title: "Rina's Tours and Travels - Airport Taxi & Tour Booking",
    description: "Book your airport taxi with transparent pricing and easy payment",
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23ffda00'/><text x='50' y='67' text-anchor='middle' font-family='Georgia,serif' font-weight='bold' font-size='52' fill='%231a1a2e'>R</text></svg>" />
      </head>
      <body>
        <AuthProvider>
          <Toaster position="top-center" />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
