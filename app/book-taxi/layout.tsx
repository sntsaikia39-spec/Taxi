import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book Taxi – Airport Cab & Hourly Rental Itanagar',
  description:
    "Book your taxi online in seconds. Airport cab from Donyi Polo Airport (Hollongi) or hourly taxi rental in Itanagar. Choose your vehicle, set your time — transparent pricing, no hidden fees.",
  keywords: [
    'book taxi itanagar',
    'book airport taxi hollongi',
    'donyi polo airport cab booking',
    'taxi booking itanagar online',
    'hourly taxi booking itanagar',
    'airport cab booking arunachal',
    'pre-book taxi hollongi airport',
  ],
  alternates: {
    canonical: '/book-taxi',
  },
  openGraph: {
    title: 'Book Taxi – Airport Cab & Hourly Rental Itanagar',
    description:
      "Book airport taxi from Donyi Polo Airport (Hollongi) or hourly taxi in Itanagar. Transparent pricing, verified drivers.",
    url: '/book-taxi',
  },
}

export default function BookTaxiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
