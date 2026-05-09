import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    "Privacy Policy for Rina's Tours and Travels. Learn how we collect, use, and protect your personal data when you book airport taxis and tours.",
  alternates: {
    canonical: '/privacy',
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
