'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'
import Logo from '@/components/Logo'

export default function Footer() {

  return (
    <footer className="bg-primary-950 text-gray-400 pt-3 max-[760px]:pt-2.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] max-[760px]:pb-[calc(0.5rem+env(safe-area-inset-bottom)+12px)] border-t border-white/[0.06]">
      <div className="container mx-auto px-4">
        {/* Main grid — 2-col on mobile (brand full-width, nav+support side-by-side), 4-col on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 sm:gap-y-5 lg:gap-6 pb-3 sm:pb-5 border-b border-white/[0.06]">

          {/* Brand — full width on mobile */}
          <div className="footer-col col-span-2 lg:col-span-1">
            <div className="mb-1.5">
              <Logo size="lg" showName nameClass="text-secondary-500 text-xl" />
            </div>
            <p className="hidden lg:block text-sm leading-relaxed text-gray-500 mb-3">
              Arunachal Pradesh&apos;s trusted airport taxi and tour booking platform. Safe, reliable, always on time.
            </p>
            <div className="space-y-1">
              <a
                href="mailto:support@rinastoursandtravels.com"
                className="flex items-center gap-2.5 text-xs hover:text-secondary-500 transition-colors duration-200 group overflow-hidden"
              >
                <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center group-hover:bg-secondary-500/10 transition-colors shrink-0">
                  <Mail size={12} className="text-secondary-500" />
                </div>
                <span className="truncate min-w-0">support@rinastoursandtravels.com</span>
              </a>
              <a
                href="tel:+919876543210"
                className="flex items-center gap-2.5 text-xs hover:text-secondary-500 transition-colors duration-200 group"
              >
                <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center group-hover:bg-secondary-500/10 transition-colors shrink-0">
                  <Phone size={12} className="text-secondary-500" />
                </div>
                +91 98765 43210
              </a>
              <div className="flex items-start gap-2.5 text-xs">
                <div className="w-7 h-7 rounded-lg bg-primary-900 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={12} className="text-secondary-500" />
                </div>
                <span>Hollongi Airport, Itanagar, Arunachal Pradesh</span>
              </div>
            </div>
          </div>

          {/* Navigate */}
          <div className="footer-col">
            <h4 className="text-white font-semibold mb-2 text-xs tracking-widest uppercase">Navigate</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/book-taxi', label: 'Book Taxi' },
                { href: '/tours', label: 'Tour Packages' },
                { href: '/bookings', label: 'My Bookings' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs flex items-center gap-2 hover:text-secondary-500 transition-colors duration-200 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-700 group-hover:bg-secondary-500 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-col">
            <h4 className="text-white font-semibold mb-2 text-xs tracking-widest uppercase">Support</h4>
            <ul className="space-y-2">
              {[
                { href: '/help', label: 'Help Center' },
                { href: '/faq', label: 'FAQ' },
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms & Conditions' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs flex items-center gap-2 hover:text-secondary-500 transition-colors duration-200 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-700 group-hover:bg-secondary-500 transition-colors shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA col — desktop only (mobile already has a full CTA section above) */}
          <div className="footer-col hidden lg:block">
            <h4 className="text-white font-semibold mb-2 text-xs tracking-widest uppercase">Ready to Book?</h4>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              Your next adventure in Arunachal Pradesh starts here. Secure your seat in minutes.
            </p>
            <Link
              href="/book-taxi"
              className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary-500 text-primary-950 font-black rounded-xl hover:bg-secondary-400 transition-all duration-200 text-xs shadow-lg shadow-secondary-500/20 mb-2 w-full"
            >
              Book Taxi Now
              <ArrowUpRight
                size={13}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/tours"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 text-gray-400 font-medium rounded-xl hover:border-secondary-500/30 hover:text-secondary-500 transition-all duration-200 text-xs w-full"
            >
              Explore Tours
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <p className="text-[11px] sm:text-xs text-gray-600">
            &copy; 2026 Rina&apos;s Tours and Travels. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] sm:text-xs text-gray-600">
            <Link href="/privacy" className="hover:text-secondary-500 transition-colors duration-200">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-secondary-500 transition-colors duration-200">
              Terms
            </Link>
            <span>Made with ♥ in Arunachal Pradesh</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

