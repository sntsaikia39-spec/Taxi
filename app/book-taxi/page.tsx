'use client'

import { useState, useEffect, useMemo, useRef, memo } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { MapPin, Users, Car, Clock, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateBookingId } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'

// ── Types ──────────────────────────────────────────────────────────────────
type Destination = {
  id: string
  name: string
  distance_km: number
  estimated_duration: string
  description: string | null
}

// Represents a car model (not a specific car)
// Users see only the model name and basic info, not the number plate or specific car details
type CarModel = {
  model_name: string
  class: string
  capacity: number
  per_km_charge: number
  per_hr_charge: number
  available_count: number // Number of cars of this model available
}

type BookingMode = 'airport' | 'hourly'

// Airport flow steps (optimized: combined related fields)
type AirportStep = 'contact' | 'route' | 'schedule' | 'car' | 'confirm'
// Hourly flow steps (optimized: combined related fields)
type HourlyStep = 'contact' | 'details' | 'schedule' | 'car' | 'confirm'

const AIRPORT_STEPS: AirportStep[] = ['contact', 'route', 'schedule', 'car', 'confirm']
const AIRPORT_LABELS: Record<AirportStep, string> = {
  contact: 'Contact', route: 'Route', schedule: 'Date & Time', car: 'Car', confirm: 'Confirm',
}

const HOURLY_STEPS: HourlyStep[] = ['contact', 'details', 'schedule', 'car', 'confirm']
const HOURLY_LABELS: Record<HourlyStep, string> = {
  contact: 'Contact', details: 'Passengers & Date', schedule: 'Time & Duration', car: 'Car', confirm: 'Confirm',
}

function formatDuration(totalHours: number): string {
  const d = Math.floor(totalHours / 24)
  const h = totalHours % 24
  if (d > 0 && h > 0) return `${d}d ${h}h`
  if (d > 0) return `${d}d`
  return `${h}h`
}

// ── Separate Contact Step Component (memoized to prevent re-creation) ──────
interface ContactStepProps {
  name: string
  phone: string
  email: string
  nameInputRef: React.RefObject<HTMLInputElement>
  phoneInputRef: React.RefObject<HTMLInputElement>
  emailInputRef: React.RefObject<HTMLInputElement>
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onEmailChange: (value: string) => void
}

const ContactStepComponent = memo(({ 
  name, phone, email, 
  nameInputRef, phoneInputRef, emailInputRef,
  onNameChange, onPhoneChange, onEmailChange 
}: ContactStepProps) => (
  <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
    <h2 className="text-2xl font-bold mb-6">Contact Details</h2>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Full Name *</label>
        <input 
          ref={nameInputRef}
          type="text" 
          value={name} 
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter your full name" 
          className="input-field" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Phone Number *</label>
        <input 
          ref={phoneInputRef}
          type="tel" 
          value={phone} 
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="10-digit mobile number" 
          className="input-field" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2">Email *</label>
        <input 
          ref={emailInputRef}
          type="email" 
          value={email} 
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your@email.com" 
          className="input-field" 
          required 
        />
      </div>
    </div>
  </div>
))

ContactStepComponent.displayName = 'ContactStep'

// ── Main Book Taxi Component ───────────────────────────────────────────────
export default function BookTaxi() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  const [mode, setMode] = useState<BookingMode>('airport')
  const [airportStep, setAirportStep] = useState<AirportStep>('contact')
  const [hourlyStep, setHourlyStep] = useState<HourlyStep>('contact')

  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loadingDest, setLoadingDest] = useState(true)
  const [destinationSearch, setDestinationSearch] = useState('')
  const [availableCarModels, setAvailableCarModels] = useState<CarModel[]>([])
  const [loadingCars, setLoadingCars] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Shared form fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [passengers, setPassengers] = useState('1')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [selectedCarModel, setSelectedCarModel] = useState<CarModel | null>(null)

  // Airport-only
  const [destinationId, setDestinationId] = useState('')
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null)

  // Hourly-only
  const [durationDays, setDurationDays] = useState(0)
  const [durationHrs, setDurationHrs] = useState(2)
  const noOfHours = durationDays * 24 + durationHrs

  // ── Refs for focus management ─────────────────────────────────────────────
  const nameInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please sign in to book a taxi')
      router.push('/login?redirect=/book-taxi')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user?.email) setEmail(user.email || '')
  }, [user])

  // ── Focus management for contact step ────────────────────────────────────
  useEffect(() => {
    if ((mode === 'airport' && airportStep === 'contact') || (mode === 'hourly' && hourlyStep === 'contact')) {
      nameInputRef.current?.focus()
    }
  }, [mode, airportStep, hourlyStep])

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/destinations')
      .then((r) => r.json())
      .then((d) => setDestinations(d.success ? d.destinations || [] : []))
      .catch(() => toast.error('Failed to load destinations'))
      .finally(() => setLoadingDest(false))
  }, [])

  const loadCars = async () => {
    setLoadingCars(true)
    try {
      // Calculate estimated end time based on mode and duration
      let estimatedEndTime = startTime
      
      if (mode === 'airport' && selectedDest) {
        // For airport bookings, add the destination's estimated duration
        const durationStr = selectedDest.estimated_duration
        const match = durationStr.match(/(\d+)\s*(?:hour|hr)s?/i)
        const hours = match ? parseInt(match[1]) : 1
        const [startHour, startMin] = startTime.split(':').map(Number)
        const endMinutes = startHour * 60 + startMin + hours * 60
        const endHour = Math.floor(endMinutes / 60) % 24
        const endMin = endMinutes % 60
        estimatedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
      } else if (mode === 'hourly') {
        // For hourly bookings, add the selected hours
        const [startHour, startMin] = startTime.split(':').map(Number)
        const endMinutes = startHour * 60 + startMin + noOfHours * 60
        const endHour = Math.floor(endMinutes / 60) % 24
        const endMin = endMinutes % 60
        estimatedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
      }

      const params = new URLSearchParams({
        booking_date: date,
        start_time: startTime,
        end_time: estimatedEndTime,
      })

      const r = await fetch(`/api/cars/available-models?${params}`)
      const d = await r.json()
      
      if (d.success) {
        // Filter by passenger capacity
        const count = parseInt(passengers)
        const filtered = (d.models || []).filter((m: CarModel) => m.capacity >= count)
        setAvailableCarModels(filtered)
        
        if (filtered.length === 0) {
          toast.error(`No cars available for ${passengers} passenger(s) in the selected timeslot. Try reducing the count or changing the time.`)
        }
      } else {
        toast.error(d.error || 'Failed to load available cars')
      }
    } catch (error) {
      console.error('Error loading cars:', error)
      toast.error('Failed to load available cars')
    } finally {
      setLoadingCars(false)
    }
  }

  // ── Reset when switching modes ────────────────────────────────────────────
  const switchMode = (m: BookingMode) => {
    if (m === mode) return
    setMode(m)
    setAirportStep('contact')
    setHourlyStep('contact')
    setSelectedCarModel(null)
    setDestinationId('')
    setSelectedDest(null)
    setDestinationSearch('')
    setDurationDays(0)
    setDurationHrs(2)
    setAvailableCarModels([])
  }

  // ── Cost calculators ──────────────────────────────────────────────────────
  const airportTotal = selectedDest && selectedCarModel
    ? selectedDest.distance_km * selectedCarModel.per_km_charge
    : 0

  const hourlyTotal = selectedCarModel
    ? noOfHours * selectedCarModel.per_hr_charge
    : 0

  const totalCost = mode === 'airport' ? airportTotal : hourlyTotal

  // ── Filtered destinations based on search ─────────────────────────────────
  const filteredDestinations = useMemo(() => {
    if (!destinationSearch.trim()) return destinations
    const search = destinationSearch.toLowerCase()
    return destinations.filter((dest) =>
      dest.name.toLowerCase().includes(search) ||
      dest.description?.toLowerCase().includes(search)
    )
  }, [destinations, destinationSearch])

  // ── Airport step navigation ───────────────────────────────────────────────
  const handleAirportNext = (e: React.FormEvent) => {
    e.preventDefault()
    const idx = AIRPORT_STEPS.indexOf(airportStep)

    if (airportStep === 'contact') {
      if (!name || !phone || !email) { toast.error('Please fill all contact details'); return }
    }
    if (airportStep === 'route') {
      if (!destinationId || !passengers) { toast.error('Please select destination and passengers'); return }
    }
    if (airportStep === 'schedule') {
      if (!date || !startTime) { toast.error('Please select date and time'); return }
      loadCars()
    }
    if (airportStep === 'car') {
      if (!selectedCarModel) { toast.error('Please select a car model'); return }
    }

    setAirportStep(AIRPORT_STEPS[idx + 1])
  }

  const handleAirportPrev = () => {
    const idx = AIRPORT_STEPS.indexOf(airportStep)
    if (idx > 0) setAirportStep(AIRPORT_STEPS[idx - 1])
  }

  // ── Hourly step navigation ────────────────────────────────────────────────
  const handleHourlyNext = (e: React.FormEvent) => {
    e.preventDefault()
    const idx = HOURLY_STEPS.indexOf(hourlyStep)

    if (hourlyStep === 'contact') {
      if (!name || !phone || !email) { toast.error('Please fill all contact details'); return }
    }
    if (hourlyStep === 'details') {
      if (!passengers || !date) { toast.error('Please select passengers and date'); return }
    }
    if (hourlyStep === 'schedule') {
      if (!startTime) { toast.error('Please select pickup time'); return }
      loadCars()
    }
    if (hourlyStep === 'car') {
      if (!selectedCarModel) { toast.error('Please select a car model'); return }
    }

    setHourlyStep(HOURLY_STEPS[idx + 1])
  }

  const handleHourlyPrev = () => {
    const idx = HOURLY_STEPS.indexOf(hourlyStep)
    if (idx > 0) setHourlyStep(HOURLY_STEPS[idx - 1])
  }

  // ── Booking submission ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    if (!selectedCarModel) { toast.error('Missing car model selection'); return }

    setIsSubmitting(true)

    const cost = mode === 'airport' ? airportTotal : hourlyTotal
    const advance = Math.round(cost * 0.3 * 100) / 100
    const bookingId = generateBookingId()

    try {
      const payload =
        mode === 'airport'
          ? {
              booking_id: bookingId,
              booking_type: 'airport',
              user_name: name,
              user_email: email,
              phone,
              passenger_count: parseInt(passengers),
              booking_date: date,
              start_time: startTime,
              destination_id: selectedDest!.id,
              tour_package_id: null,
              no_of_hours: null,
              car_model: selectedCarModel.model_name,
              amount_total: cost,
              booking_status: 'pending',
            }
          : {
              booking_id: bookingId,
              booking_type: 'hourly',
              user_name: name,
              user_email: email,
              phone,
              passenger_count: parseInt(passengers),
              booking_date: date,
              start_time: startTime,
              destination_id: null,
              tour_package_id: null,
              no_of_hours: noOfHours,
              car_model: selectedCarModel.model_name,
              amount_total: cost,
              booking_status: 'pending',
            }

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      const savedBooking = result.success ? result.booking : null

      if (!savedBooking) {
        toast.error(result.error || 'Failed to save booking. Please try again.')
        setIsSubmitting(false)
        return
      }

      const endDateTime = new Date(savedBooking.end_datetime)
      const endTimeStr = endDateTime.toTimeString().slice(0, 5)

      const sessionPayload =
        mode === 'airport'
          ? {
              bookingId,
              bookingType: 'airport',
              name, email, phone,
              destination: selectedDest!.name,
              distance: selectedDest!.distance_km,
              car: selectedCarModel.model_name,
              carType: selectedCarModel.class,
              passengers,
              date, time: startTime, startTime, endTime: endTimeStr,
              totalPrice: cost,
              advancePayment: advance,
              userId: user?.id,
              dbBookingId: savedBooking.id,
            }
          : {
              bookingId,
              bookingType: 'hourly',
              name, email, phone,
              noOfHours,
              car: selectedCarModel.model_name,
              carType: selectedCarModel.class,
              passengers,
              date, time: startTime, startTime, endTime: endTimeStr,
              totalPrice: cost,
              advancePayment: advance,
              userId: user?.id,
              dbBookingId: savedBooking.id,
            }

      sessionStorage.setItem('bookingData', JSON.stringify(sessionPayload))
      toast.success('Booking created! Proceeding to payment...')
      window.location.href = `/payment?bookingId=${bookingId}&amount=${advance}`
    } catch (err) {
      console.error('Booking error:', err)
      toast.error('An error occurred while creating the booking')
      setIsSubmitting(false)
    }
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────
  const StepIndicator = ({ steps, labels, current }: {
    steps: string[]
    labels: Record<string, string>
    current: string
  }) => {
    const idx = steps.indexOf(current)
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                idx >= i ? 'bg-secondary-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-1 flex-1 mx-1 transition-all ${idx > i ? 'bg-secondary-500' : 'bg-gray-300'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          {steps.map((step) => (
            <span key={step} className="text-center flex-1 truncate px-0.5">
              {labels[step]}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const NavButtons = ({ onPrev, isFirst, isLast }: {
    onPrev: () => void
    isFirst: boolean
    isLast: boolean
  }) => (
    <div className="flex gap-3 mt-8">
      {!isFirst && (
        <button type="button" onClick={onPrev}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-smooth">
          Previous
        </button>
      )}
      <button type="submit" disabled={isSubmitting}
        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-smooth ${
          isLast ? 'btn-primary text-lg' : 'btn-secondary'
        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
        {isSubmitting ? 'Processing...' : isLast ? 'Proceed to Payment' : 'Next'}
      </button>
    </div>
  )

  // ── Passengers step (shared) ──────────────────────────────────────────────
  const PassengersStep = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Number of Passengers</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button key={n} type="button" onClick={() => setPassengers(n.toString())}
            className={`p-4 border-2 rounded-lg font-semibold transition-smooth ${
              passengers === n.toString()
                ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                : 'border-gray-300 hover:border-secondary-300'
            }`}>
            <Users className="w-5 h-5 mx-auto mb-1" />
            {n} {n === 1 ? 'Person' : 'People'}
          </button>
        ))}
      </div>
    </div>
  )

  // ── Date step (shared) ────────────────────────────────────────────────────
  const DateStep = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Booking Date</h2>
      <label className="block text-sm font-semibold mb-2">Select Date *</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
        className="input-field w-full" min={new Date().toISOString().split('T')[0]} required />
    </div>
  )

  // ── Time step (shared) ────────────────────────────────────────────────────
  const TimeStep = ({ hint }: { hint?: string }) => (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Pickup Time</h2>
      <label className="block text-sm font-semibold mb-2">Select Pickup Time *</label>
      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
        className="input-field w-full" required />
      {hint && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">{hint}</p>
        </div>
      )}
    </div>
  )

  // ── Car selection (shared, shows different rate based on mode) ────────────
  const CarStep = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6">Select Your Car Model</h2>
      <p className="text-sm text-gray-600 mb-6">
        Choose your preferred car model. A specific car will be assigned by our team once your booking is confirmed.
      </p>
      {loadingCars ? (
        <p className="text-gray-600">Loading available car models...</p>
      ) : availableCarModels.length === 0 ? (
        <p className="text-gray-600">No car models available for {passengers} passenger(s) in this timeslot. Try adjusting your booking time or passenger count.</p>
      ) : (
        <div className="space-y-3">
          {availableCarModels.map((model) => {
            const rate = mode === 'airport' ? model.per_km_charge : model.per_hr_charge
            const rateLabel = mode === 'airport' ? '/km' : '/hr'
            const estimate = mode === 'airport'
              ? selectedDest ? `Est. Rs. ${(selectedDest.distance_km * model.per_km_charge).toFixed(0)}` : ''
              : `Est. Rs. ${(noOfHours * model.per_hr_charge).toFixed(0)} for ${noOfHours} hr${noOfHours > 1 ? 's' : ''}`
            return (
              <button key={model.model_name} type="button"
                onClick={() => setSelectedCarModel(model)}
                className={`w-full p-4 border-2 rounded-lg text-left transition-smooth ${
                  selectedCarModel?.model_name === model.model_name
                    ? 'border-secondary-500 bg-secondary-50'
                    : 'border-gray-300 hover:border-secondary-300'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{model.model_name}</p>
                    <p className="text-sm text-gray-600">Class: {model.class} · Capacity: {model.capacity} pax · Available: {model.available_count}</p>
                    <p className="text-sm text-secondary-600 font-semibold mt-2">
                      Rs. {rate}{rateLabel}
                      {estimate && <span className="text-gray-500 font-normal ml-2">({estimate})</span>}
                    </p>
                  </div>
                  <Car className="w-6 h-6 text-secondary-500 shrink-0 ml-3" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-500" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!user) return null

  const advance = Math.round(totalCost * 0.3 * 100) / 100
  const remaining = Math.round(totalCost * 0.7 * 100) / 100

  // ── Airport flow render ───────────────────────────────────────────────────
  const renderAirport = () => {
    const idx = AIRPORT_STEPS.indexOf(airportStep)
    const isFirst = idx === 0
    const isLast = airportStep === 'confirm'

    return (
      <form onSubmit={isLast ? handleSubmit : handleAirportNext}>
        {airportStep === 'contact' && (
          <ContactStepComponent
            name={name}
            phone={phone}
            email={email}
            nameInputRef={nameInputRef}
            phoneInputRef={phoneInputRef}
            emailInputRef={emailInputRef}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onEmailChange={setEmail}
          />
        )}

        {/* Route: Destination + Passengers */}
        {airportStep === 'route' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 space-y-8">
            {/* Destination */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Select Destination</h2>
              
              {/* Search Bar */}
              {destinations.length > 0 && (
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={destinationSearch}
                    onChange={(e) => setDestinationSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:border-secondary-500 focus:outline-none"
                  />
                  {destinationSearch && (
                    <button
                      type="button"
                      onClick={() => setDestinationSearch('')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {loadingDest ? (
                <p className="text-gray-600">Loading destinations...</p>
              ) : destinations.length === 0 ? (
                <p className="text-gray-600">No destinations available.</p>
              ) : filteredDestinations.length === 0 ? (
                <p className="text-gray-600">No destinations match your search.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {filteredDestinations.map((dest) => (
                    <button key={dest.id} type="button"
                      onClick={() => { setDestinationId(dest.id); setSelectedDest(dest) }}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-smooth ${
                        destinationId === dest.id
                          ? 'border-secondary-500 bg-secondary-50'
                          : 'border-gray-300 hover:border-secondary-300'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{dest.name}</p>
                          <p className="text-sm text-gray-600">{dest.distance_km} km · Est. {dest.estimated_duration}</p>
                          {dest.description && <p className="text-xs text-gray-500 mt-1">{dest.description}</p>}
                        </div>
                        <MapPin className="w-5 h-5 text-secondary-500 shrink-0 ml-3" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Passengers */}
            <div className="border-t pt-6 md:pt-8">
              <h3 className="text-xl font-bold mb-4">Number of Passengers</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" onClick={() => setPassengers(n.toString())}
                    className={`p-4 border-2 rounded-lg font-semibold transition-smooth text-center ${
                      passengers === n.toString()
                        ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                        : 'border-gray-300 hover:border-secondary-300'
                    }`}>
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    {n} {n === 1 ? 'Person' : 'People'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule: Date + Time */}
        {airportStep === 'schedule' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 space-y-8">
            {/* Date */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Booking Date</h2>
              <label className="block text-sm font-semibold mb-2">Select Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="input-field w-full" min={new Date().toISOString().split('T')[0]} required />
            </div>

            {/* Time */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold mb-4">Pickup Time</h3>
              <label className="block text-sm font-semibold mb-2">Select Pickup Time *</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="input-field w-full" required />
              {selectedDest && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Destination:</strong> {selectedDest.name}<br/>
                    <strong>Estimated trip duration:</strong> {selectedDest.estimated_duration}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {airportStep === 'car' && <CarStep />}

        {airportStep === 'confirm' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
            <div className="bg-gray-50 rounded-lg p-5 space-y-3 text-sm">
              <Row label="Name" value={name} />
              <Row label="Phone" value={phone} />
              <Row label="Email" value={email} />
              <Row label="Destination" value={selectedDest?.name ?? '-'} />
              <Row label="Distance" value={`${selectedDest?.distance_km} km`} />
              <Row label="Passengers" value={passengers} />
              <Row label="Date" value={new Date(date).toLocaleDateString('en-IN')} />
              <Row label="Pickup Time" value={startTime} />
              <div className="border-t pt-3">
                <Row label="Car Model" value={selectedCarModel?.model_name ?? '-'} />
                <Row label="Rate" value={`Rs. ${selectedCarModel?.per_km_charge}/km`} />
              </div>
            </div>
            <PriceBox
              lines={[`${selectedDest?.distance_km} km × Rs. ${selectedCarModel?.per_km_charge}/km`]}
              total={totalCost} advance={advance} remaining={remaining}
            />
          </div>
        )}

        <NavButtons onPrev={handleAirportPrev} isFirst={isFirst} isLast={isLast} />
      </form>
    )
  }

  // ── Hourly flow render ────────────────────────────────────────────────────
  const renderHourly = () => {
    const idx = HOURLY_STEPS.indexOf(hourlyStep)
    const isFirst = idx === 0
    const isLast = hourlyStep === 'confirm'

    return (
      <form onSubmit={isLast ? handleSubmit : handleHourlyNext}>
        {hourlyStep === 'contact' && (
          <ContactStepComponent
            name={name}
            phone={phone}
            email={email}
            nameInputRef={nameInputRef}
            phoneInputRef={phoneInputRef}
            emailInputRef={emailInputRef}
            onNameChange={setName}
            onPhoneChange={setPhone}
            onEmailChange={setEmail}
          />
        )}

        {/* Details: Passengers + Date */}
        {hourlyStep === 'details' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 space-y-8">
            {/* Passengers */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4">Number of Passengers</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button key={n} type="button" onClick={() => setPassengers(n.toString())}
                    className={`p-4 border-2 rounded-lg font-semibold transition-smooth text-center ${
                      passengers === n.toString()
                        ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                        : 'border-gray-300 hover:border-secondary-300'
                    }`}>
                    <Users className="w-5 h-5 mx-auto mb-1" />
                    {n} {n === 1 ? 'Person' : 'People'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold mb-4">Booking Date</h3>
              <label className="block text-sm font-semibold mb-2">Select Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="input-field w-full" min={new Date().toISOString().split('T')[0]} required />
            </div>
          </div>
        )}

        {/* Schedule: Time + Hours */}
        {hourlyStep === 'schedule' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 space-y-8">
            {/* Time */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Pickup Time</h2>
              <label className="block text-sm font-semibold mb-2">Select Pickup Time *</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="input-field w-full" required />
            </div>

            {/* Duration Picker */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-bold mb-4">Select Duration</h3>
              <p className="text-gray-600 text-sm mb-6">How long do you need the taxi? Choose days and/or hours.</p>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Days */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 mb-3">Days</p>
                  <div className="flex items-center justify-center gap-4">
                    <button type="button"
                      onClick={() => setDurationDays(d => Math.max(0, d - 1))}
                      disabled={durationDays === 0}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:border-secondary-400 hover:bg-secondary-50 transition-smooth flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                      −
                    </button>
                    <span className="text-3xl font-bold w-10 text-center">{durationDays}</span>
                    <button type="button"
                      onClick={() => setDurationDays(d => d + 1)}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:border-secondary-400 hover:bg-secondary-50 transition-smooth flex items-center justify-center">
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">day{durationDays !== 1 ? 's' : ''}</p>
                </div>

                {/* Hours */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600 mb-3">Hours</p>
                  <div className="flex items-center justify-center gap-4">
                    <button type="button"
                      onClick={() => setDurationHrs(h => Math.max(durationDays > 0 ? 0 : 1, h - 1))}
                      disabled={durationDays === 0 && durationHrs <= 1}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:border-secondary-400 hover:bg-secondary-50 transition-smooth flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                      −
                    </button>
                    <span className="text-3xl font-bold w-10 text-center">{durationHrs}</span>
                    <button type="button"
                      onClick={() => setDurationHrs(h => Math.min(23, h + 1))}
                      disabled={durationHrs >= 23}
                      className="w-10 h-10 rounded-full border-2 border-gray-300 text-xl font-bold hover:border-secondary-400 hover:bg-secondary-50 transition-smooth flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">hour{durationHrs !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Total summary */}
              <div className="mt-6 p-4 bg-secondary-50 border border-secondary-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-secondary-600" />
                  <span className="text-xl font-bold text-secondary-700">{formatDuration(noOfHours)}</span>
                </div>
                {noOfHours >= 24 && (
                  <p className="text-xs text-gray-500 mt-1">{noOfHours} hours total</p>
                )}
              </div>

              {selectedCarModel && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>{formatDuration(noOfHours)}</strong> ({noOfHours} hrs) × Rs. {selectedCarModel.per_hr_charge}/hr
                    {' = '}
                    <strong>Rs. {hourlyTotal.toFixed(2)}</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {hourlyStep === 'car' && <CarStep />}

        {hourlyStep === 'confirm' && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold">Confirm Your Booking</h2>
            <div className="bg-gray-50 rounded-lg p-5 space-y-3 text-sm">
              <Row label="Name" value={name} />
              <Row label="Phone" value={phone} />
              <Row label="Email" value={email} />
              <Row label="Passengers" value={passengers} />
              <Row label="Date" value={new Date(date).toLocaleDateString('en-IN')} />
              <Row label="Pickup Time" value={startTime} />
              <Row label="Duration" value={`${formatDuration(noOfHours)}${noOfHours >= 24 ? ` (${noOfHours} hrs)` : ''}`} />
              <div className="border-t pt-3">
                <Row label="Car Model" value={selectedCarModel?.model_name ?? '-'} />
                <Row label="Rate" value={`Rs. ${selectedCarModel?.per_hr_charge}/hr`} />
              </div>
            </div>
            <PriceBox
              lines={[`${formatDuration(noOfHours)} (${noOfHours} hrs) × Rs. ${selectedCarModel?.per_hr_charge}/hr`]}
              total={totalCost} advance={advance} remaining={remaining}
            />
          </div>
        )}

        <NavButtons onPrev={handleHourlyPrev} isFirst={isFirst} isLast={isLast} />
      </form>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  const currentStepStr = mode === 'airport' ? airportStep : hourlyStep
  const steps = mode === 'airport' ? AIRPORT_STEPS : HOURLY_STEPS
  const labels = mode === 'airport'
    ? (AIRPORT_LABELS as Record<string, string>)
    : (HOURLY_LABELS as Record<string, string>)

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-5 md:mb-8">Book Your Taxi</h1>

          {/* ── Mode tabs ── */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex rounded-xl overflow-hidden border border-gray-300 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => switchMode('airport')}
                className={`flex-1 py-4 px-6 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  mode === 'airport'
                    ? 'bg-secondary-500 text-primary-950'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Airport Transfer
              </button>
              <button
                type="button"
                onClick={() => switchMode('hourly')}
                className={`flex-1 py-4 px-6 font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  mode === 'hourly'
                    ? 'bg-secondary-500 text-primary-950'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Clock className="w-4 h-4" />
                Hourly Booking
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">
              {mode === 'airport'
                ? 'Fixed rate transfer from Hollongi to your destination'
                : 'Book a taxi by the hour — go wherever you need, no fixed route'}
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <StepIndicator steps={steps} labels={labels} current={currentStepStr} />
            {mode === 'airport' ? renderAirport() : renderHourly()}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Small shared helpers ───────────────────────────────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-600 shrink-0">{label}:</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}

function PriceBox({
  lines, total, advance, remaining,
}: {
  lines: string[]
  total: number
  advance: number
  remaining: number
}) {
  return (
    <div className="bg-blue-50 rounded-lg p-5 space-y-3">
      <h3 className="font-bold text-lg">Price Breakdown</h3>
      {lines.map((l) => (
        <div key={l} className="flex justify-between text-sm">
          <span className="text-gray-700">Calculation:</span>
          <span className="font-semibold">{l} = Rs. {total.toFixed(2)}</span>
        </div>
      ))}
      <div className="border-t pt-3 flex justify-between font-bold text-base">
        <span>Total Amount:</span>
        <span className="text-secondary-600">Rs. {total.toFixed(2)}</span>
      </div>
      <p className="text-xs text-blue-700 pt-1">
        Pay the full amount online, or choose to prebook with just 30% (Rs. {advance.toFixed(2)}) on the next screen.
      </p>
    </div>
  )
}
