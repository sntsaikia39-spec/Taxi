'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Mail, Lock, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdmin } from '@/context/AdminContext'
import Logo from '@/components/Logo'

function AdminLoginContent() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { login, isAdmin, isLoading } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Clear customer auth session on admin-login entry.
  // This keeps admin auth separated from public user auth state.
  useEffect(() => {
    const clearCustomerSession = async () => {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Failed to clear customer session on admin-login:', error)
      } finally {
        sessionStorage.removeItem('bookingData')
        sessionStorage.removeItem('tourBookingData')
      }
    }
    clearCustomerSession()
  }, [supabase])

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAdmin && !isLoading) {
      router.push('/admin')
    }
  }, [isAdmin, isLoading, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(email, password)
      if (result.success) {
        toast.success('Admin login successful!')
        router.push('/admin')
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="sticky top-0 z-30 bg-primary-950 border-b border-white/10">
          <div className="container mx-auto px-4 py-3">
            <Link href="/" className="inline-flex items-center">
              <Logo size="sm" showName nameClass="text-secondary-500 text-sm" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-lg text-gray-600">Loading...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-primary-950 border-b border-white/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Logo size="sm" showName nameClass="text-secondary-500 text-sm" />
          </Link>
          <span className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Admin Access</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-20 bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-900 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary-950 to-secondary-900 px-8 py-12">
              <h1 className="text-3xl font-bold text-white text-center">Admin Panel</h1>
              <p className="text-secondary-200 text-center mt-2">Secure Access</p>
            </div>

            <div className="px-8 py-8">
              <form onSubmit={handleEmailLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@taxihollongi.com"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition transform hover:scale-105 disabled:scale-100"
                >
                  <LogIn size={20} />
                  {loading ? 'Logging in...' : 'Login to Admin Panel'}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  All communications are encrypted and secure. Never share your admin credentials.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-white">
            <p className="text-sm opacity-75">TaxiHollongi Admin Management System</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-gray-50">
          <header className="sticky top-0 z-30 bg-primary-950 border-b border-white/10">
            <div className="container mx-auto px-4 py-3">
              <Link href="/" className="inline-flex items-center">
                <Logo size="sm" showName nameClass="text-secondary-500 text-sm" />
              </Link>
            </div>
          </header>
          <main className="flex-1 flex items-center justify-center py-20">
            <p className="text-lg text-gray-600">Loading admin login...</p>
          </main>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}

