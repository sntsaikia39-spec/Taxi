'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/context/AdminContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Mail, Lock, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

function AdminLoginContent() {
  const router = useRouter()
  const { login, isAdmin, isLoading } = useAdmin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
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
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center py-20 bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-900 px-4">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-950 to-secondary-900 px-8 py-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-4xl">🛡️</span>
              </div>
              <h1 className="text-3xl font-bold text-white text-center">Admin Panel</h1>
              <p className="text-secondary-200 text-center mt-2">Secure Access</p>
            </div>

            {/* Form */}
            <div className="px-8 py-8">
              <form onSubmit={handleEmailLogin} className="space-y-6">
                {/* Email Input */}
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

                {/* Password Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition transform hover:scale-105 disabled:scale-100"
                >
                  <LogIn size={20} />
                  {loading ? 'Logging in...' : 'Login to Admin Panel'}
                </button>
              </form>

              {/* Security Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  🔒 All communications are encrypted and secure. Never share your admin credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center text-white">
            <p className="text-sm opacity-75">
              TaxiHollongi Admin Management System
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-gray-50">
          <Header />
          <main className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-lg text-gray-600">Loading admin login...</p>
            </div>
          </main>
          <Footer />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  )
}
