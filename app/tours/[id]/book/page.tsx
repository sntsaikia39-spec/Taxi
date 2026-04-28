'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import { generateBookingId } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { fetchTourById } from '@/lib/db'
import type { TourPackage } from '@/lib/db'
import { Users, Calendar, CheckCircle, ArrowLeft, Clock, Car, MapPin } from 'lucide-react'

const STEPS = ['Contact', 'Passengers', 'Date', 'Confirm'] as const
type Step = 0 | 1 | 2 | 3

function toNum(val: unknown): number {
  const n = parseFloat(String(val ?? 0))
  return isNaN(n) ? 0 : n
}

// Extract HH:MM from ISO timestamp string without timezone conversion
function extractTime(arrival_time: string): string {
  const match = arrival_time.match(/T(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : '00:00'
}

function formatDisplayTime(arrival_time: string | null): string {
  if (!arrival_time) return 'To be announced'
  const match = arrival_time.match(/T(\d{2}):(\d{2})/)
  if (!match) return 'To be announced'
  const h = parseInt(match[1])
  const m = match[2]
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${period}`
}

function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

export default function BookTour() {
  const params = useParams()
  const router = useRouter()
  const tourId = params.id as string
  const { user, isLoading } = useAuth()

  const [tour, setTour] = useState<TourPackage | null>(null)
  const [loadingTour, setLoadingTour] = useState(true)
  const [step, setStep] = useState<Step>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [date, setDate] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to book a tour')
      router.push(`/login?redirect=/tours/${tourId}/book`)
    }
  }, [user, isLoading, router, tourId])

  useEffect(() => {
    if (user?.email) setEmail(user.email)
    if ((user as any)?.user_metadata?.full_name) setName((user as any).user_metadata.full_name)
  }, [user])

  useEffect(() => {
    if (!tourId) return
    const load = async () => {
      setLoadingTour(true)
      try {
        const data = await fetchTourById(tourId)
        if (data) {
          setTour(data)
        } else {
          toast.error('Tour not found')
          router.push('/tours')
        }
      } catch {
        toast.error('Failed to load tour details')
        router.push('/tours')
      } finally {
        setLoadingTour(false)
      }
    }
    load()
  }, [tourId, router])

  const totalPrice = tour ? toNum(tour.price) * passengers : 0
  const advancePayment = Math.round(totalPrice * 0.3 * 100) / 100

  // ── Step validation ──────────────────────────────────────────────────────────

  const canAdvanceStep = (): boolean => {
    if (step === 0) return name.trim().length > 0 && phone.trim().length >= 10 && email.trim().includes('@')
    if (step === 1) return passengers >= 1 && (tour ? passengers <= (tour.max_passengers ?? 999) : true)
    if (step === 2) return date.length > 0
    return true
  }

  const nextStep = () => {
    if (!canAdvanceStep()) {
      if (step === 0) toast.error('Please fill in your name, a valid phone number, and email.')
      if (step === 2) toast.error('Please select a tour date.')
      return
    }
    setStep((s) => (s + 1) as Step)
  }

  const prevStep = () => setStep((s) => (s - 1) as Step)

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!tour || isSubmitting) return

    setIsSubmitting(true)
    try {
      const bookingId = generateBookingId()
      const startTime = tour.arrival_time ? extractTime(tour.arrival_time) : '09:00'

      const payload = {
        booking_id: bookingId,
        booking_type: 'tour',
        user_name: name.trim(),
        user_email: email.trim(),
        phone: phone.trim(),
        passenger_count: passengers,
        booking_date: date,
        start_time: startTime,
        destination_id: null,
        tour_package_id: tour.id,
        no_of_hours: null,
        car_model: tour.car_model || null,
        amount_total: totalPrice,
        booking_status: 'pending',
      }

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!result.success || !result.booking) {
        toast.error(result.error || 'Failed to create booking. Please try again.')
        setIsSubmitting(false)
        return
      }

      const savedBooking = result.booking
      const displayTime = formatDisplayTime(tour.arrival_time)

      sessionStorage.setItem(
        'tourBookingData',
        JSON.stringify({
          bookingId,
          bookingType: 'tour',
          tourId: tour.id,
          tourName: tour.name,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          passengers,
          date,
          time: displayTime,
          startTime: displayTime,
          car: tour.car_model || '',
          carType: tour.car_model || '',
          totalPrice,
          advancePayment,
          dbBookingId: savedBooking.id,
        })
      )

      toast.success('Booking created! Redirecting to payment...')
      window.location.href = `/payment?bookingId=${bookingId}&type=tour&amount=${advancePayment}`
    } catch (err) {
      console.error('Booking error:', err)
      toast.error('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  // ── Loading / not found ──────────────────────────────────────────────────────

  if (loadingTour) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <p className="text-gray-600">Loading tour details...</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!tour) return null

  const maxPax = tour.max_passengers ?? 20
  const departureTime = formatDisplayTime(tour.arrival_time)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">

          {/* Back */}
          <button
            onClick={() => router.push('/tours')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft size={18} /> Back to Tours
          </button>

          <h1 className="text-3xl font-bold text-center mb-3">Book {tour.name}</h1>
          <p className="text-center text-gray-500 mb-10">Complete the steps below to reserve your spot</p>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="flex items-center">
              {STEPS.map((label, idx) => (
                <div key={label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                      ${idx < step ? 'bg-green-500 text-white' : idx === step ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-500'}`}>
                      {idx < step ? <CheckCircle size={18} /> : idx + 1}
                    </div>
                    <span className={`text-xs mt-1 font-medium ${idx === step ? 'text-yellow-600' : idx < step ? 'text-green-600' : 'text-gray-400'}`}>
                      {label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${idx < step ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">

            {/* ── Form Panel ── */}
            <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-8">

              {/* Step 0: Contact */}
              {step === 0 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-6">Contact Details</h2>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {/* Step 1: Passengers */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-6">Number of Passengers</h2>

                  <div>
                    <label className="block text-sm font-semibold mb-3">
                      Select number of passengers (max {maxPax})
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:border-yellow-400 transition-colors flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-3xl font-bold w-12 text-center">{passengers}</span>
                      <button
                        type="button"
                        onClick={() => setPassengers((p) => Math.min(maxPax, p + 1))}
                        className="w-10 h-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:border-yellow-400 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      {passengers} {passengers === 1 ? 'person' : 'people'} × ₹{toNum(tour.price).toFixed(0)} per person
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Tour Price</span>
                      <span className="text-2xl font-bold text-yellow-600">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      Pay full online, or prebook with just ₹{advancePayment.toFixed(2)} (30% advance) on the next screen.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Date */}
              {step === 2 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-6">Select Tour Date</h2>

                  {tour.arrival_time && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                      <Clock size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">Fixed Daily Departure: {departureTime}</p>
                        <p className="text-sm text-blue-700 mt-0.5">
                          This tour departs at the same time every day. Please arrive 15 minutes early at the meeting point.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2">Tour Date *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={todayISO()}
                      className="input-field"
                    />
                    {date && (
                      <p className="text-sm text-green-700 mt-2 font-medium">
                        Selected: {formatDisplayDate(date)} at {departureTime}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="text-xl font-bold mb-6">Confirm Your Booking</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tour Package</span>
                      <span className="font-semibold">{tour.name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Name</span>
                      <span className="font-semibold">{name}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-semibold">{phone}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Email</span>
                      <span className="font-semibold break-all">{email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Passengers</span>
                      <span className="font-semibold">{passengers} {passengers === 1 ? 'person' : 'people'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tour Date</span>
                      <span className="font-semibold">{formatDisplayDate(date)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Departure Time</span>
                      <span className="font-semibold">{departureTime}</span>
                    </div>
                    {tour.car_model && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Vehicle</span>
                        <span className="font-semibold">{tour.car_model}</span>
                      </div>
                    )}
                    {tour.duration_hours && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-semibold">{tour.duration_hours} hours</span>
                      </div>
                    )}
                    <div className="flex justify-between py-3 text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-yellow-600">₹{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-900">
                    <p><strong>Total to pay:</strong> ₹{totalPrice.toFixed(2)}</p>
                    <p className="mt-1 text-green-700">Or prebook with ₹{advancePayment.toFixed(2)} (30% advance) — choose on the next screen.</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-900">
                    Please arrive at least 15 minutes before departure at {departureTime}.
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 btn-primary py-3 text-base font-bold"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`flex-1 btn-primary py-3 text-base font-bold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                )}
              </div>
            </div>

            {/* ── Tour Summary Sidebar ── */}
            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-20">
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-32 flex items-center justify-center text-6xl">
                  🏞️
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-3">{tour.name}</h3>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {tour.arrival_time && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-yellow-500" />
                        <span>Daily departure {departureTime}</span>
                      </div>
                    )}
                    {tour.duration_hours && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-yellow-500" />
                        <span>{tour.duration_hours} hours</span>
                      </div>
                    )}
                    {tour.max_passengers && (
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-yellow-500" />
                        <span>Max {tour.max_passengers} passengers</span>
                      </div>
                    )}
                    {tour.car_model && (
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-yellow-500" />
                        <span>{tour.car_model}</span>
                      </div>
                    )}
                  </div>

                  {/* Live Price */}
                  <div className="border-t pt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹{toNum(tour.price).toFixed(0)} × {passengers} {passengers === 1 ? 'person' : 'people'}</span>
                      <span>₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-1 border-t">
                      <span>Total</span>
                      <span className="text-yellow-600">₹{totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Pay now (30%)</span>
                      <span>₹{advancePayment.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              {tour.highlights && tour.highlights.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-5">
                  <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-gray-500">What's Included</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {tour.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">✓</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
