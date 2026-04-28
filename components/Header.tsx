import Link from 'next/link'
import { Menu, X, User, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, signOut, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-primary-950 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            <span className="text-3xl">🚖</span>
            <span className="text-secondary-500">TaxiHollongi</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="hover:text-secondary-500 transition-smooth">
              Home
            </Link>
            <Link href="/book-taxi" className="hover:text-secondary-500 transition-smooth">
              Book Taxi
            </Link>
            <Link href="/tours" className="hover:text-secondary-500 transition-smooth">
              Tours
            </Link>
            {mounted && user && (
              <Link href="/bookings" className="hover:text-secondary-500 transition-smooth">
                My Bookings
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {mounted && !isLoading ? (
              <>
                {user ? (
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-primary-900 rounded">
                      <User size={20} />
                      <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-smooth"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-3">
                    <Link
                      href="/login"
                      className="px-4 py-2 hover:bg-primary-900 rounded transition-smooth"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 bg-secondary-500 text-primary-950 rounded font-semibold hover:bg-secondary-600 transition-smooth"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <div className="w-20 h-10 bg-primary-900 rounded animate-pulse"></div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-3 border-t border-gray-700 space-y-1">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 hover:bg-primary-900 rounded text-sm font-medium">
              Home
            </Link>
            <Link href="/book-taxi" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 hover:bg-primary-900 rounded text-sm font-medium">
              Book Taxi
            </Link>
            <Link href="/tours" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 hover:bg-primary-900 rounded text-sm font-medium">
              Tours
            </Link>
            {mounted && user && (
              <Link href="/bookings" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 hover:bg-primary-900 rounded text-sm font-medium">
                My Bookings
              </Link>
            )}

            {mounted && !isLoading && (
              <div className="pt-2 border-t border-gray-700 mt-2">
                {user ? (
                  <div className="space-y-2 pt-2">
                    <div className="px-4 py-2 bg-primary-900 rounded text-xs text-gray-300 break-all">{user.email}</div>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false) }}
                      className="w-full px-4 py-3 bg-red-600 rounded text-center font-semibold hover:bg-red-700 transition-smooth"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 px-4 py-3 text-center border border-secondary-500 rounded font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 px-4 py-3 bg-secondary-500 text-primary-950 rounded text-center font-semibold"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
