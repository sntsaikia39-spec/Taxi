import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    "Terms and Conditions for Rina's Tours and Travels. Read our booking, cancellation, and payment policies for airport taxi and tour services.",
  alternates: {
    canonical: '/terms',
  },
  robots: {
    index: true,
    follow: false,
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
