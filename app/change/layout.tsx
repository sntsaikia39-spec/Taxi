import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Modify Booking',
  robots: { index: false, follow: false },
}

export default function ChangeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
