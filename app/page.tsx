import type { Metadata } from 'next'
import HomeClient from '@/components/HomeClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rinastoursandtravels.in'

export const metadata: Metadata = {
  title: "Taxi from Hollongi Airport & Arunachal Tours | Rina's Tours and Travels",
  description:
    "Book taxi from Donyi Polo Airport (Hollongi) to Itanagar or anywhere in Arunachal Pradesh. Fixed pricing, verified drivers, instant confirmation. Also book curated Arunachal Pradesh tour packages.",
  alternates: { canonical: '/' },
  openGraph: {
    title: "Rina's Tours and Travels | Hollongi Airport Taxi & Arunachal Tours",
    description:
      "Pre-book airport taxi from Donyi Polo Airport, Hollongi. Verified drivers, transparent pricing. Also explore Arunachal Pradesh tour packages.",
    url: SITE_URL,
  },
}

export default function Home() {
  return <HomeClient />
}
