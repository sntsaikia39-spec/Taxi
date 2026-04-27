'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Eye, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import type { Booking } from '@/lib/db'

function toNum(val: unknown): number {
  const n = parseFloat(String(val ?? 0))
  return isNaN(n) ? 0 : n
}

interface CarDetails {
  id: string
  model_name: string
  class: string
  number_plate: string
  capacity: number
  driver_name: string
  driver_phone: string
  driver_email: string | null
}

interface Assignment {
  id: string
  booking_id: string
  car_id: string
  start_datetime: string
  end_datetime: string
  assigned_at: string
  cars: CarDetails
}

export default function MyBookings() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [assignmentMap, setAssignmentMap] = useState<Record<string, Assignment>>({})
  const [loadingBookings, setLoadingBookings] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to view your bookings')
      router.push('/login?redirect=/bookings')
      return
    }

    if (user?.email) {
      loadBookings(user.email)
    }
  }, [user, isLoading, router])

  const loadBookings = async (email: string) => {
    setLoadingBookings(true)
    try {
      const response = await fetch('/api/bookings/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      if (result.success) {
        const loadedBookings: Booking[] = result.bookings
        setBookings(loadedBookings)

        // Fetch vehicle assignments for all bookings
        const bookingIds = loadedBookings
          .map((b) => b.booking_id || b.id)
          .filter(Boolean)

        if (bookingIds.length > 0) {
          try {
            const assignRes = await fetch('/api/bookings/user-assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingIds }),
            })
            const assignData = await assignRes.json()
            if (assignData.success && assignData.assignments) {
              const map: Record<string, Assignment> = {}
              for (const a of assignData.assignments) {
                map[a.booking_id] = a
              }
              setAssignmentMap(map)
            }
          } catch (e) {
            console.error('Error loading assignments:', e)
          }
        }
      } else {
        toast.error('Failed to load bookings')
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoadingBookings(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: 'yellow', label: 'Pending' },
      confirmed: { color: 'blue', label: 'Confirmed' },
      assigned: { color: 'purple', label: 'Assigned' },
      in_progress: { color: 'green', label: 'In Progress' },
      completed: { color: 'gray', label: 'Completed' },
      cancelled: { color: 'red', label: 'Cancelled' },
    }
    const s = statusMap[status] || { color: 'gray', label: 'Unknown' }
    const bgColors: Record<string, string> = {
      yellow: 'bg-yellow-100 text-yellow-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
      red: 'bg-red-100 text-red-800',
    }
    return { label: s.label, className: bgColors[s.color] }
  }

  const handleCancel = (bookingId: string) => {
    toast.error('Cannot cancel. Please contact support within 24 hours of booking.')
  }

  const handleDownloadInvoice = (bookingId: string) => {
    toast.success('Invoice downloaded successfully!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  if (loadingBookings) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12">My Bookings</h1>

          {bookings.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow-lg p-12">
              <p className="text-xl text-gray-600 mb-6">You don't have any bookings yet.</p>
              <a href="/book-taxi" className="btn-primary inline-block">
                Make Your First Booking
              </a>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {bookings.map((booking) => {
                const statusBadge = getStatusBadge(booking.booking_status)
                const bookingTypeLabel = booking.booking_type === 'airport' ? 'Airport Transfer' : booking.booking_type === 'tour' ? 'Tour' : 'Hourly Rental'
                const assignment = assignmentMap[booking.booking_id || booking.id]

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    {/* Assignment Notification Banner */}
                    {assignment && (
                      <div className="bg-green-50 border-b-2 border-green-400 px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">🚗</span>
                          <div className="flex-1">
                            <p className="text-green-800 font-bold text-lg mb-1">Car has been assigned to you!</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-green-900 mt-2">
                              <p><span className="font-semibold">Car:</span> {assignment.cars.model_name} ({assignment.cars.class})</p>
                              <p><span className="font-semibold">Number Plate:</span> {assignment.cars.number_plate}</p>
                              <p><span className="font-semibold">Driver:</span> {assignment.cars.driver_name}</p>
                              <p><span className="font-semibold">Driver Phone:</span> {assignment.cars.driver_phone}</p>
                              {assignment.cars.driver_email && (
                                <p><span className="font-semibold">Driver Email:</span> {assignment.cars.driver_email}</p>
                              )}
                              <p><span className="font-semibold">Pickup Time:</span> {formatDate(assignment.start_datetime)} at {formatTime(assignment.start_datetime)}</p>
                            </div>
                            <div className="mt-3 bg-green-100 border border-green-300 rounded px-3 py-2 text-sm text-green-800">
                              Please arrive at the pickup point at least <strong>10 minutes early</strong> to ensure a smooth and on-time departure.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-6 md:p-8">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b">
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{bookingTypeLabel}</h3>
                          <p className="text-gray-600 font-mono text-sm">{booking.booking_id || booking.id}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                          <span className={`px-4 py-2 rounded-full font-semibold text-sm ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          <span className="text-3xl font-bold text-yellow-500">₹{toNum(booking.amount_total).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                          <p className="text-gray-600 text-sm font-semibold">Date</p>
                          <p className="text-lg">{formatDate(booking.start_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm font-semibold">Start Time</p>
                          <p className="text-lg">{formatTime(booking.start_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm font-semibold">End Time</p>
                          <p className="text-lg">{formatTime(booking.end_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm font-semibold">Passengers</p>
                          <p className="text-lg">{booking.passenger_count}</p>
                        </div>
                        {booking.car_model && (
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Car Model</p>
                            <p className="text-lg">{booking.car_model}</p>
                          </div>
                        )}
                        {booking.no_of_hours && (
                          <div>
                            <p className="text-gray-600 text-sm font-semibold">Duration</p>
                            <p className="text-lg">{booking.no_of_hours} hr{booking.no_of_hours > 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>

                      {/* User Contact Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
                        <h4 className="font-semibold mb-3">Contact Information</h4>
                        <div className="space-y-2">
                          <p className="text-gray-800"><span className="font-medium">Name:</span> {booking.user_name}</p>
                          <p className="text-gray-800"><span className="font-medium">Phone:</span> {booking.phone}</p>
                          {booking.user_email && <p className="text-gray-800"><span className="font-medium">Email:</span> {booking.user_email}</p>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-primary-950 text-primary-950 rounded hover:bg-gray-50 transition-smooth">
                          <Eye size={18} />
                          View Details
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(booking.id)}
                          className="flex items-center gap-2 px-4 py-2 border border-yellow-500 text-yellow-600 rounded hover:bg-yellow-50 transition-smooth"
                        >
                          <Download size={18} />
                          Invoice
                        </button>
                        {booking.booking_status === 'pending' || booking.booking_status === 'confirmed' ? (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-smooth"
                          >
                            <Trash2 size={18} />
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
