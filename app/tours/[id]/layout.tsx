import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rinastoursandtravels.in'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('tour_packages')
      .select('name, description, price, image_url')
      .eq('id', params.id)
      .single()

    if (data) {
      const title = `${data.name} – Arunachal Pradesh Tour Package`
      const description = data.description
        ? data.description.slice(0, 160)
        : `Book the ${data.name} tour package in Arunachal Pradesh. Transparent pricing, verified drivers, all-inclusive experience.`

      return {
        title,
        description,
        alternates: { canonical: `/tours/${params.id}/book` },
        openGraph: {
          title,
          description,
          url: `/tours/${params.id}/book`,
          ...(data.image_url && {
            images: [{ url: data.image_url, alt: data.name }],
          }),
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          ...(data.image_url && { images: [data.image_url] }),
        },
      }
    }
  } catch {
    // Fall through to default metadata
  }

  return {
    title: 'Tour Package – Arunachal Pradesh',
    description:
      "Book this tour package in Arunachal Pradesh with Rina's Tours and Travels. Verified drivers, transparent pricing.",
  }
}

export default function TourDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
