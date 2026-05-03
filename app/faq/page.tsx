"use client"

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const FAQ_ITEMS = [
  { q: 'How do I book a taxi?', a: 'Visit Book Taxi, choose pickup, destination and time, then confirm. You will receive booking details via email and in your account.' },
  { q: 'Can I cancel or modify a booking?', a: 'Modifications and cancellations are available from My Bookings. Cancellation fees may apply depending on timing and service type.' },
  { q: 'What payment methods are accepted?', a: 'We accept UPI and major cards. Some services allow cash on arrival — payment options are shown at checkout.' },
  { q: 'Is my data safe?', a: 'We protect your data using industry-standard practices. See our Privacy Policy for more details.' },
]

export default function FAQPage() {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    let targetTop = scroller.scrollTop
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      targetTop = Math.min(max, Math.max(0, targetTop + e.deltaY))
      gsap.to(scroller, { scrollTop: targetTop, duration: 0.7, ease: 'power3.out', overwrite: true })
    }
    scroller.addEventListener('wheel', onWheel, { passive: false })
    return () => scroller.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div ref={scrollRef} className="scrollbar-thin-modern h-[100dvh] overflow-y-auto overflow-x-hidden bg-primary-950 text-white">
      <Header />
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-secondary-500 font-semibold text-xs uppercase tracking-widest mb-2">Support</p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-400 mb-8">Common questions about bookings, payments and policies — clear and concise answers to help you get moving.</p>

          <section className="space-y-4">
            {FAQ_ITEMS.map((it, idx) => (
              <details key={idx} className="group bg-primary-900/50 border border-primary-800 rounded-2xl p-4" open={idx === 0}>
                <summary className="flex items-center justify-between cursor-pointer list-none text-white font-semibold">
                  <span>{it.q}</span>
                  <span className="ml-3 text-gray-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="mt-3 text-gray-300 leading-relaxed">{it.a}</div>
              </details>
            ))}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
