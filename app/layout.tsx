import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'TaxiHollongi - Airport Taxi & Tour Booking',
  description:
    'Book your airport taxi or tour package with transparent pricing and secure payment. Pre-book taxis from Hollongi Airport to your destination.',
  keywords: [
    'taxi booking',
    'airport taxi',
    'tour package',
    'transportation',
    'hollongi airport',
  ],
  authors: [{ name: 'TaxiHollongi' }],
  openGraph: {
    title: 'TaxiHollongi - Airport Taxi & Tour Booking',
    description: 'Book your airport taxi with transparent pricing and easy payment',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%23ffda00'>🚖</text></svg>" />
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
