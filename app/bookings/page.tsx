'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Eye, Download, Trash2, ArrowRight, Car, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import gsap from 'gsap'
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
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    document.documentElement.style.overflowY = 'auto'
    document.body.style.overflowY = 'auto'
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
  }, [])

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

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    let targetTop = scroller.scrollTop

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      targetTop = Math.min(max, Math.max(0, targetTop + e.deltaY))
      gsap.to(scroller, {
        scrollTop: targetTop,
        duration: 0.75,
        ease: 'power3.out',
        overwrite: true,
      })
    }

    scroller.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      scroller.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    const scroller = scrollRef.current
    const header = document.querySelector('header') as HTMLElement | null
    if (!scroller || !header) return

    let autoHideTimer: ReturnType<typeof setTimeout> | null = null
    let hideAfterScrollTimer: ReturnType<typeof setTimeout> | null = null
    let headerHovered = false

    const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
      if (timer) clearTimeout(timer)
      return null
    }

    const isInteractiveTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      if (!el) return false
      return Boolean(el.closest('a, button, input, textarea, select, label, summary, [role="button"], [data-no-header-peek]'))
    }

    const hideHeader = () => {
      gsap.killTweensOf(header)
      gsap.to(header, { yPercent: -110, opacity: 1, duration: 0.46, ease: 'power3.inOut' })
    }

    const showHeaderTemporarily = () => {
      autoHideTimer = clearTimer(autoHideTimer)
      gsap.killTweensOf(header)
      gsap.to(header, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power2.out' })
      autoHideTimer = setTimeout(() => {
        if (!headerHovered) hideHeader()
        autoHideTimer = null
      }, 6500)
    }

    const scheduleHideAfterScroll = () => {
      hideAfterScrollTimer = clearTimer(hideAfterScrollTimer)
      hideAfterScrollTimer = setTimeout(() => {
        if (!headerHovered) hideHeader()
        hideAfterScrollTimer = null
      }, 250)
    }

    const onScroll = () => scheduleHideAfterScroll()
    const onClick = (e: MouseEvent) => {
      if (!isInteractiveTarget(e.target)) showHeaderTemporarily()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!isInteractiveTarget(e.target)) showHeaderTemporarily()
    }
    const onHeaderMouseEnter = () => {
      headerHovered = true
      autoHideTimer = clearTimer(autoHideTimer)
      hideAfterScrollTimer = clearTimer(hideAfterScrollTimer)
    }
    const onHeaderMouseLeave = () => {
      headerHovered = false
      scheduleHideAfterScroll()
    }

    gsap.set(header, { yPercent: 0, opacity: 1 })
    autoHideTimer = setTimeout(() => {
      if (!headerHovered) hideHeader()
      autoHideTimer = null
    }, 6500)

    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('click', onClick, { passive: true })
    scroller.addEventListener('touchend', onTouchEnd, { passive: true })
    header.addEventListener('mouseenter', onHeaderMouseEnter)
    header.addEventListener('mouseleave', onHeaderMouseLeave)

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('click', onClick)
      scroller.removeEventListener('touchend', onTouchEnd)
      header.removeEventListener('mouseenter', onHeaderMouseEnter)
      header.removeEventListener('mouseleave', onHeaderMouseLeave)
      autoHideTimer = clearTimer(autoHideTimer)
      hideAfterScrollTimer = clearTimer(hideAfterScrollTimer)
      gsap.set(header, { yPercent: 0, opacity: 1 })
    }
  }, [])

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
    const statusMap: Record<string, { className: string; label: string }> = {
      pending: {
        className: 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-400',
        label: 'Pending',
      },
      confirmed: {
        className: 'bg-blue-500/15 border border-blue-500/30 text-blue-400',
        label: 'Confirmed',
      },
      assigned: {
        className: 'bg-purple-500/15 border border-purple-500/30 text-purple-400',
        label: 'Assigned',
      },
      in_progress: {
        className: 'bg-green-500/15 border border-green-500/30 text-green-400',
        label: 'In Progress',
      },
      completed: {
        className: 'bg-gray-500/15 border border-gray-500/30 text-gray-400',
        label: 'Completed',
      },
      cancelled: {
        className: 'bg-red-500/15 border border-red-500/30 text-red-400',
        label: 'Cancelled',
      },
    }
    return statusMap[status] || { className: 'bg-gray-500/15 border border-gray-500/30 text-gray-400', label: 'Unknown' }
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

  const toggleBookingDetails = (id: string) => {
    setExpandedBookingId((prev) => (prev === id ? null : id))
  }

  if (loadingBookings) {
    return (
      <div ref={scrollRef} className="scrollbar-thin-modern flex h-[100dvh] flex-col overflow-y-auto overflow-x-hidden bg-primary-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading your bookings...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="scrollbar-thin-modern h-[100dvh] overflow-y-auto overflow-x-hidden bg-primary-950">
      <Header />

      <main className="relative overflow-x-hidden">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.75) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Glow blobs */}
        <div
          className="absolute -top-40 -left-40 w-[560px] h-[560px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,193,7,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-60 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,193,7,0.05) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          {/* Hero heading */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-secondary-500 font-semibold text-xs tracking-[0.22em] uppercase mb-4">
              Your Trips
            </p>
            <h1 className="font-black text-white text-3xl md:text-5xl mb-5">
              My Bookings
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
              Track, manage, and review all your upcoming and past journeys in one place.
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="max-w-lg mx-auto text-center rounded-2xl border border-primary-800 bg-primary-900/60 backdrop-blur-sm p-10 md:p-14">
              <div className="w-14 h-14 rounded-full bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center mx-auto mb-5">
                <Car size={24} className="text-secondary-500" />
              </div>
              <p className="text-white font-bold text-xl mb-2">No bookings yet</p>
              <p className="text-gray-400 text-sm mb-8">You don&apos;t have any bookings yet. Start your journey today.</p>
              <a
                href="/book-taxi"
                className="inline-flex items-center gap-2 bg-secondary-500 text-primary-950 font-black px-6 py-3 rounded-xl hover:bg-secondary-400 transition-colors"
              >
                Make Your First Booking
                <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
              {bookings.map((booking) => {
                const statusBadge = getStatusBadge(booking.booking_status)
                const bookingTypeLabel =
                  booking.booking_type === 'airport'
                    ? 'Airport Transfer'
                    : booking.booking_type === 'tour'
                    ? 'Tour'
                    : 'Hourly Rental'
                const assignment = assignmentMap[booking.booking_id || booking.id]
                const isExpanded = expandedBookingId === booking.id

                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-primary-800 bg-primary-900/60 backdrop-blur-sm overflow-hidden hover:border-primary-700 transition-colors duration-200"
                  >
                    {/* Assignment Notification Banner */}
                    {assignment && isExpanded && (
                      <div className="bg-green-500/10 border-b border-green-500/25 px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Car size={18} className="text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-green-300 font-bold text-base mb-2">Car has been assigned to you!</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-sm text-green-300/80 mt-1">
                              <p><span className="font-semibold text-green-300">Car:</span> {assignment.cars.model_name} ({assignment.cars.class})</p>
                              <p><span className="font-semibold text-green-300">Number Plate:</span> {assignment.cars.number_plate}</p>
                              <p><span className="font-semibold text-green-300">Driver:</span> {assignment.cars.driver_name}</p>
                              <p><span className="font-semibold text-green-300">Driver Phone:</span> {assignment.cars.driver_phone}</p>
                              {assignment.cars.driver_email && (
                                <p><span className="font-semibold text-green-300">Driver Email:</span> {assignment.cars.driver_email}</p>
                              )}
                              <p><span className="font-semibold text-green-300">Pickup Time:</span> {formatDate(assignment.start_datetime)} at {formatTime(assignment.start_datetime)}</p>
                            </div>
                            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 text-sm text-green-300/80">
                              Please arrive at the pickup point at least <strong className="text-green-300">10 minutes early</strong> to ensure a smooth and on-time departure.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-4 md:p-5">
                      {/* Header */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 pb-3 border-b border-primary-800">
                        <div>
                          <h3 className="text-base md:text-lg font-black text-white mb-1">{bookingTypeLabel}</h3>
                          <p className="text-gray-500 font-mono text-[11px] md:text-xs truncate max-w-[220px] md:max-w-none">{booking.booking_id || booking.id}</p>
                        </div>
                        <div className="flex items-center gap-2.5 mt-2 md:mt-0">
                          <span className={`px-2.5 py-1 rounded-full font-semibold text-[11px] md:text-xs ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                          <span className="text-xl md:text-3xl font-black text-secondary-500">₹{toNum(booking.amount_total).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 transition-all duration-500 ease-out ${isExpanded ? 'max-h-[420px] opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0 overflow-hidden'}`}>
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Date</p>
                          <p className="text-white font-semibold">{formatDate(booking.start_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Start Time</p>
                          <p className="text-white font-semibold">{formatTime(booking.start_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">End Time</p>
                          <p className="text-white font-semibold">{formatTime(booking.end_datetime)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Passengers</p>
                          <p className="text-white font-semibold">{booking.passenger_count}</p>
                        </div>
                        {booking.car_model && (
                          <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Car Model</p>
                            <p className="text-white font-semibold">{booking.car_model}</p>
                          </div>
                        )}
                        {booking.no_of_hours && (
                          <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">Duration</p>
                            <p className="text-white font-semibold">{booking.no_of_hours} hr{booking.no_of_hours > 1 ? 's' : ''}</p>
                          </div>
                        )}
                      </div>

                      {/* User Contact Info */}
                      <div className={`bg-primary-950/50 border border-primary-800 rounded-xl p-4 md:p-5 mb-4 overflow-hidden transition-all duration-500 ease-out ${isExpanded ? 'max-h-[260px] opacity-100' : 'max-h-0 opacity-0 p-0 mb-0 border-transparent'}`}>
                        <h4 className="text-gray-400 font-semibold text-xs uppercase tracking-wider mb-3">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <p className="text-gray-300"><span className="text-gray-500 font-medium">Name:</span> {booking.user_name}</p>
                          <p className="text-gray-300"><span className="text-gray-500 font-medium">Phone:</span> {booking.phone}</p>
                          {booking.user_email && (
                            <p className="text-gray-300"><span className="text-gray-500 font-medium">Email:</span> {booking.user_email}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2.5">
                        <button onClick={() => toggleBookingDetails(booking.id)} className="flex items-center gap-2 px-3.5 py-2 border border-primary-700 text-gray-300 rounded-lg hover:border-primary-600 hover:text-white transition-colors text-xs">
                          <Eye size={14} />
                          {isExpanded ? 'Hide Details' : 'View Details'}
                          <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(booking.id)}
                          className="flex items-center gap-2 px-3.5 py-2 border border-secondary-500/40 text-secondary-500 rounded-lg hover:border-secondary-500 hover:bg-secondary-500/10 transition-colors text-xs"
                        >
                          <Download size={14} />
                          Invoice
                        </button>
                        {(booking.booking_status === 'pending' || booking.booking_status === 'confirmed') ? (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="flex items-center gap-2 px-3.5 py-2 border border-red-500/40 text-red-400 rounded-lg hover:border-red-500 hover:bg-red-500/10 transition-colors text-xs"
                          >
                            <Trash2 size={14} />
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
    </div>
  )
}


