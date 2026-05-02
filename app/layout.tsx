import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/context/AuthContext'
import RouteScrollUnlocker from '@/components/RouteScrollUnlocker'
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
        <link rel="icon" href="https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/sign/internal/image-removebg-preview%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iMjA1YjRkYi0wMDA4LTQyOWUtYTFmZi02NzBjZTE1OWJhOTkiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbnRlcm5hbC9pbWFnZS1yZW1vdmViZy1wcmV2aWV3ICgxKS5wbmciLCJpYXQiOjE3Nzc3NTQ5NzksImV4cCI6MTkzNTQzNDk3OX0.FR2fYD_zRiEMwQcrMja4J1PCZI6o6EFZ-_-8i6T0dy8" />
      </head>
      <body>
        <AuthProvider>
          <RouteScrollUnlocker />
          <Toaster position="top-center" />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
