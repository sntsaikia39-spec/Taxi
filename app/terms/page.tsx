"use client"

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TermsPage() {
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
          <p className="text-secondary-500 font-semibold text-xs uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Terms &amp; Conditions</h1>
          <p className="text-gray-400 mb-8">These terms govern your use of Rina's Tours and Travels. Please read them carefully.</p>

          <article className="space-y-6 text-gray-300">
            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
              <p>By accessing or using our services, you agree to be bound by these terms.</p>
            </section>

            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">2. Bookings & Payments</h2>
              <p>Bookings are confirmed subject to availability. Payment and cancellation rules are presented at checkout and may vary by service.</p>
            </section>

            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">3. Liability</h2>
              <p>We make reasonable efforts to provide reliable services but are not liable for delays or events outside our control.</p>
            </section>

            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">4. Changes to Terms</h2>
              <p>We may update these terms; material changes will be posted on this page with an effective date.</p>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
