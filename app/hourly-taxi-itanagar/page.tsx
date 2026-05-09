import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HeroBackground from '@/components/HeroBackground'
import { Car, Clock, MapPin, Shield, CheckCircle, ArrowRight, ChevronRight, Users } from 'lucide-react'
import SmoothScrollWrapper from '@/components/SmoothScrollWrapper'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.rinastoursandtravels.in'

export const metadata: Metadata = {
  title: 'Hourly Taxi Itanagar – Book Cab by the Hour in Itanagar',
  description:
    'Book a taxi by the hour in Itanagar, Arunachal Pradesh. Ideal for local sightseeing, multiple stops, errands, and flexible travel. Fixed hourly rates, verified drivers. Book in 2 minutes.',
  keywords: [
    'hourly taxi itanagar',
    'hourly cab booking itanagar',
    'local cab rental itanagar',
    'cab on rent itanagar',
    'hire taxi by hour itanagar',
    'hourly cab itanagar',
    'taxi rental itanagar',
    'local taxi hire itanagar',
    'hourly car rental itanagar',
  ],
  alternates: { canonical: '/hourly-taxi-itanagar' },
  openGraph: {
    title: 'Hourly Taxi Itanagar – Flexible Cab Booking by the Hour',
    description: 'Hire a taxi by the hour in Itanagar for sightseeing, errands, or flexible city travel. Fixed rates, verified drivers.',
    url: `${SITE_URL}/hourly-taxi-itanagar`,
  },
}

const FAQ_ITEMS = [
  {
    q: 'What is hourly taxi booking?',
    a: "Hourly taxi rental means you hire a car with a driver for a set number of hours. The driver stays with you throughout, waiting while you visit places, complete errands, or explore at your own pace. It's ideal for city sightseeing or when you have multiple stops.",
  },
  {
    q: 'What is the minimum booking duration for hourly taxi in Itanagar?',
    a: 'Our hourly taxi service in Itanagar has a minimum booking duration of 4 hours. This gives you enough time to comfortably cover multiple sightseeing spots or complete several errands.',
  },
  {
    q: 'Can I use the hourly taxi for sightseeing in Itanagar?',
    a: 'Yes — hourly taxi is the most flexible way to sightsee in Itanagar. You set the pace, choose your stops, and the driver handles navigation. Popular routes include Ita Fort, Buddha Temple, Ganga Lake, and the Craft Centre.',
  },
  {
    q: 'Is there a mileage limit for hourly taxi bookings?',
    a: 'Hourly bookings include a standard km allowance per hour. If you exceed this, a small per-km rate applies — shown clearly at the time of booking with no hidden charges.',
  },
  {
    q: 'What types of vehicles are available for hourly rental in Itanagar?',
    a: 'We offer sedans (suitable for 1–4 passengers) and SUVs (suitable for up to 6–7 passengers) for hourly bookings. Choose your preferred vehicle class when you book.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'TaxiService',
  name: "Hourly Taxi Rental Itanagar – Rina's Tours and Travels",
  provider: {
    '@type': 'LocalBusiness',
    name: "Rina's Tours and Travels",
    url: SITE_URL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Itanagar',
      addressRegion: 'Arunachal Pradesh',
      postalCode: '791111',
      addressCountry: 'IN',
    },
  },
  areaServed: { '@type': 'City', name: 'Itanagar' },
  serviceType: 'Hourly Taxi Rental',
  url: `${SITE_URL}/hourly-taxi-itanagar`,
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Hourly Taxi Itanagar', item: `${SITE_URL}/hourly-taxi-itanagar` },
  ],
}

const USE_CASES = [
  { Icon: MapPin, title: 'City Sightseeing', desc: "Explore Itanagar's landmarks at your own pace — Ita Fort, Buddha Temple, Ganga Lake — without fixed departure times." },
  { Icon: Car, title: 'Multiple Errands', desc: 'Markets, hospitals, government offices — keep the cab while you handle your schedule across the city.' },
  { Icon: Users, title: 'Group Travel', desc: 'Groups visiting Itanagar for events or meetings benefit from the flexibility of having a dedicated car all day.' },
  { Icon: Clock, title: 'Flexible Day Out', desc: "Not sure exactly how long you'll need? Book for half a day and extend if needed when you see how the day goes." },
  { Icon: Shield, title: 'Business Travel', desc: 'Itanagar visiting professionals rely on hourly cabs for client meetings, site visits, and reliable point-to-point travel.' },
  { Icon: CheckCircle, title: 'Day After Airport Arrival', desc: 'Arriving at Donyi Polo Airport today? Pair an airport taxi with an hourly booking tomorrow for total travel convenience.' },
]

export default function HourlyTaxiItanagarPage() {
  return (
    <>
      <SmoothScrollWrapper>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-[100dvh] flex flex-col">
        <Header />

        <main className="flex-1">

          {/* ── Hero ── */}
          <section className="relative bg-primary-950 overflow-hidden pt-24 pb-32 md:pt-32 md:pb-40">
            <HeroBackground />
            <div className="container mx-auto px-4 lg:px-8 relative z-10">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
                <Link href="/" className="hover:text-secondary-500 transition-colors">Home</Link>
                <ChevronRight size={12} />
                <span className="text-gray-400">Hourly Taxi Itanagar</span>
              </nav>
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary-500/25 bg-secondary-500/[0.08] text-secondary-400 text-xs font-semibold tracking-widest uppercase mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 animate-pulse" />
                  Itanagar · Arunachal Pradesh
                </div>
                <h1 className="font-black leading-[0.95] tracking-tight mb-5">
                  <span className="block text-4xl md:text-5xl lg:text-6xl text-white">Hourly Taxi</span>
                  <span className="block text-4xl md:text-5xl lg:text-6xl text-secondary-500">Booking Itanagar</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base mb-7 leading-relaxed max-w-lg">
                  Hire a cab by the hour in <strong className="text-white">Itanagar</strong> for sightseeing, errands, or flexible local travel. Keep the driver with you — explore at your own pace with no fixed routes or rush.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <Link
                    href="/book-taxi"
                    className="group flex items-center gap-2.5 px-6 py-3 bg-secondary-500 text-primary-950 font-black rounded-xl hover:bg-secondary-400 active:scale-[0.97] transition-all shadow-2xl shadow-secondary-500/25 text-sm md:text-base"
                  >
                    Book Hourly Taxi
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="/itanagar-tours" className="group flex items-center gap-2.5 px-6 py-3 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/[0.07] hover:border-white/35 transition-all text-sm md:text-base">
                    See Itanagar Tours
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { Icon: Clock, label: '4 hr Minimum' },
                    { Icon: CheckCircle, label: 'Fixed Rates' },
                    { Icon: Shield, label: 'Verified Drivers' },
                    { Icon: Users, label: 'Private & Exclusive' },
                  ].map(({ Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-300 text-xs">
                      <Icon size={11} className="text-secondary-500" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Use cases ── */}
          <section className="py-14 md:py-20" style={{ background: 'linear-gradient(160deg, #16120f 0%, #1c1410 35%, #110e0c 70%, #0d0b09 100%)' }}>
            <div className="container mx-auto px-4">
              <p className="text-secondary-500 font-semibold text-xs tracking-[0.22em] uppercase mb-3 text-center">Use Cases</p>
              <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">When to Choose Hourly Taxi</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {USE_CASES.map(({ Icon, title, desc }) => (
                  <div key={title} className="p-6 rounded-2xl bg-primary-900/40 border border-primary-800 hover:border-secondary-500/30 hover:bg-primary-900/70 transition-all duration-300">
                    <div className="w-11 h-11 rounded-2xl bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center mb-4">
                      <Icon size={18} className="text-secondary-500" />
                    </div>
                    <h3 className="font-black text-white mb-1.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How to book ── */}
          <section className="py-14 md:py-20 bg-primary-950 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.8) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
            <div className="container mx-auto px-4 relative z-10">
              <p className="text-secondary-500 font-semibold text-xs tracking-[0.22em] uppercase mb-3 text-center">Simple Process</p>
              <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-12">How to Book Hourly Taxi</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {[
                  { step: '01', title: 'Open Book Taxi', desc: 'Select Hourly booking mode from the taxi booking page.' },
                  { step: '02', title: 'Set Your Details', desc: 'Enter your pickup location in Itanagar, start time, and hours needed.' },
                  { step: '03', title: 'Choose Vehicle', desc: 'Pick sedan or SUV — hourly rate and km allowance shown before confirming.' },
                  { step: '04', title: 'Pay & Go', desc: 'Complete payment and receive confirmation. Driver arrives at your location.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="p-5 rounded-2xl bg-primary-900/40 border border-primary-800 hover:border-secondary-500/30 transition-all duration-300">
                    <span className="text-4xl font-black text-secondary-500/20 leading-none block mb-3">{step}</span>
                    <h3 className="font-black text-white mb-1.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link href="/book-taxi" className="group inline-flex items-center gap-2.5 px-8 py-3.5 bg-secondary-500 text-primary-950 font-black rounded-xl hover:bg-secondary-400 transition-all shadow-2xl shadow-secondary-500/25">
                  Book Hourly Taxi Now <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>

          {/* ── FAQs ── */}
          <section className="py-14 md:py-20" style={{ background: 'linear-gradient(160deg, #16120f 0%, #1c1410 50%, #0d0b09 100%)' }}>
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <p className="text-secondary-500 font-semibold text-xs tracking-[0.22em] uppercase mb-3">Support</p>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Common Questions</h2>
                <div className="space-y-4">
                  {FAQ_ITEMS.map((item, idx) => (
                    <details key={idx} className="group bg-primary-900/40 border border-primary-800 rounded-2xl p-5" open={idx === 0}>
                      <summary className="flex items-center justify-between cursor-pointer list-none text-white font-semibold">
                        <span>{item.q}</span>
                        <span className="ml-3 text-gray-400 transition-transform group-open:rotate-45 shrink-0">+</span>
                      </summary>
                      <p className="mt-3 text-gray-400 leading-relaxed text-sm">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="py-14 md:py-20 bg-secondary-500 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #1a1512 1.5px, transparent 1.5px)', backgroundSize: '26px 26px' }} />
            <div className="container mx-auto px-4 text-center relative z-10">
              <p className="text-primary-800 font-semibold text-xs tracking-[0.22em] uppercase mb-2">Ready to explore?</p>
              <h2 className="text-3xl md:text-4xl font-black text-primary-950 mb-3">Plan your day in Itanagar</h2>
              <p className="text-primary-800 text-sm md:text-base mb-7 max-w-md mx-auto">Book an hourly cab for the flexibility to see Itanagar on your own terms.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book-taxi" className="group flex items-center justify-center gap-2.5 px-6 py-3 bg-primary-950 text-white font-black rounded-2xl hover:bg-primary-900 transition-all shadow-2xl shadow-primary-950/25">
                  Book Hourly Taxi <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/itanagar-tours" className="flex items-center justify-center gap-2.5 px-6 py-3 border-2 border-primary-950/20 text-primary-950 font-bold rounded-2xl hover:bg-primary-950/[0.07] transition-all">
                  View Itanagar Tours
                </Link>
              </div>
            </div>
          </section>

          {/* ── Related ── */}
          <section className="py-8 border-t border-primary-800 bg-primary-950">
            <div className="container mx-auto px-4">
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-4 text-center">Related Services</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { href: '/hollongi-airport-taxi', label: 'Hollongi Airport Taxi' },
                  { href: '/itanagar-airport-taxi', label: 'Itanagar Airport Taxi' },
                  { href: '/itanagar-tours', label: 'Itanagar Tours' },
                  { href: '/arunachal-tours', label: 'Arunachal Tours' },
                  { href: '/faq', label: 'FAQ' },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} className="px-4 py-2 rounded-xl border border-primary-700 text-gray-400 hover:border-secondary-500/40 hover:text-secondary-400 transition-colors text-sm">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

        </main>
        <Footer />
      </div>
      </SmoothScrollWrapper>
    </>
  )
}
