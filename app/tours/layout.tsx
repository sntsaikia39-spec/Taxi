import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tour Packages – Arunachal Pradesh & Itanagar Sightseeing',
  description:
    "Explore curated tour packages in Arunachal Pradesh and Itanagar. Book sightseeing tours, day trips, and custom travel packages with Rina's Tours and Travels. Verified drivers, all-inclusive pricing.",
  keywords: [
    'itanagar tours',
    'arunachal tours',
    'arunachal pradesh tours',
    'sightseeing itanagar',
    'arunachal travel booking',
    'travel agency itanagar',
    'tour booking arunachal pradesh',
    'local tours itanagar',
    'day trips itanagar',
    'arunachal sightseeing packages',
  ],
  alternates: {
    canonical: '/tours',
  },
  openGraph: {
    title: 'Tour Packages – Arunachal Pradesh & Itanagar',
    description:
      "Curated tour packages in Arunachal Pradesh and Itanagar. Day trips, sightseeing tours, and custom travel packages with verified drivers.",
    url: '/tours',
  },
}

export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
