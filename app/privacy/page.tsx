"use client"

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
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
          <p className="text-secondary-500 font-semibold text-xs uppercase tracking-widest mb-2">Privacy</p>
          <h1 className="text-3xl md:text-4xl font-black mb-3">Privacy Policy</h1>
          <p className="text-gray-400 mb-8">We value your privacy. This policy explains what we collect and how we use it.</p>

          <article className="space-y-6 text-gray-300">
            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">Information We Collect</h2>
              <p>We collect information you provide when creating an account or booking: name, contact, and payment details.</p>
            </section>

            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">How We Use Information</h2>
              <p>We use data to provide services, process payments, send booking updates, and improve the platform.</p>
            </section>

            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">Data Security</h2>
              <p>We follow industry practices to secure your data. For detailed measures, contact our support team.</p>
            </section>

            <section className="bg-primary-900/50 border border-primary-800 rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">Contact</h2>
              <p>Questions? Email support@rinastoursandtravels.com.</p>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
