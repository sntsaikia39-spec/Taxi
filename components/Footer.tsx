import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary-950 text-gray-300 py-12 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-secondary-500 mb-4">
              🚖 TaxiHollongi
            </h3>
            <p className="text-sm">
              Your trusted airport taxi and tour booking platform. Safe, reliable, and transparent pricing.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-secondary-500 transition-smooth">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/book-taxi" className="hover:text-secondary-500 transition-smooth">
                  Book Taxi
                </Link>
              </li>
              <li>
                <Link href="/tours" className="hover:text-secondary-500 transition-smooth">
                  Tours
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-secondary-500 transition-smooth">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-secondary-500 transition-smooth">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-secondary-500 transition-smooth">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-secondary-500 transition-smooth">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-secondary-500 transition-smooth">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-secondary-500" />
                <a href="mailto:support@taxihollongi.com" className="hover:text-secondary-500 transition-smooth">
                  support@taxihollongi.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-secondary-500" />
                <a href="tel:+919876543210" className="hover:text-secondary-500 transition-smooth">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-secondary-500 mt-0.5" />
                <span>Hollongi Airport, Itanagar, Arunachal Pradesh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-500">5000+</div>
              <div className="text-xs text-gray-400">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-500">1000+</div>
              <div className="text-xs text-gray-400">Bookings Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary-500">50+</div>
              <div className="text-xs text-gray-400">Verified Drivers</div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-gray-500">
            <p>&copy; 2024 TaxiHollongi. All rights reserved.</p>
            <p className="mt-2">Made with ❤️ for safe and reliable airport transportation</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
