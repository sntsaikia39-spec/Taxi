'use client'

import { useEffect, useMemo, useState } from 'react'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import type { Booking } from '@/lib/db'

type AdminApiResponse = {
  success?: boolean
  bookings?: Booking[]
  error?: string
}

type Car = {
  id: string
  model_name: string
  class: string
  number_plate: string
  capacity: number
  per_km_charge: number
  per_hr_charge: number
  driver_name: string
  driver_phone: string
  driver_email: string | null
  driver_license_number: string | null
  driver_license_expiry: string | null
  driver_verified: boolean
  is_active: boolean
  created_at: string
}

type CarsResponse = {
  success: boolean
  cars?: Car[]
  error?: string
}

type Destination = {
  id: string
  name: string
  distance_km: number
  estimated_duration: string
  description: string | null
  is_active: boolean
  created_at: string
}

type DestinationsResponse = {
  success: boolean
  destinations?: Destination[]
  error?: string
}

type Tour = {
  id: string
  name: string
  description: string | null
  arrival_time: string | null
  duration_hours: number | null
  price: number
  max_passengers: number | null
  car_model: string | null
  itinerary: string | null
  highlights: string[]
  image_url: string | null
  is_active: boolean
  created_at: string
}

type ToursResponse = {
  success: boolean
  tours?: Tour[]
  error?: string
}

type Payment = {
  id: string
  booking_id: string
  payment_type: 'partial' | 'full'
  amount_total: number
  amount_online_paid: number
  amount_cash_paid: number
  txn_status: 'pending' | 'success' | 'failed'
  txn_id: string | null
  gateway: string | null
  payment_status: 'pending' | 'partial' | 'paid'
  cash_paid_at: string | null
  cash_collected_by: string | null
  created_at: string
}

type VehicleAssignment = {
  id: string
  booking_id: string
  car_id: string
  start_datetime: string
  end_datetime: string
  assigned_at: string
  created_at: string
}

type PaymentsResponse = {
  success: boolean
  payments?: Payment[]
  error?: string
}

const ACTIVE_STATUSES = new Set(['pending', 'confirmed'])

function toNum(val: unknown): number {
  const n = parseFloat(String(val ?? 0))
  return isNaN(n) ? 0 : n
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusClass(status: string) {
  if (status === 'completed') {
    return 'bg-green-100 text-green-800'
  }

  if (status === 'confirmed') {
    return 'bg-blue-100 text-blue-800'
  }

  if (status === 'pending') {
    return 'bg-yellow-100 text-yellow-800'
  }

  if (status === 'cancelled') {
    return 'bg-red-100 text-red-800'
  }

  return 'bg-gray-100 text-gray-800'
}

function getPaymentStatusClass(status: string) {
  if (status === 'paid') {
    return 'bg-green-100 text-green-800'
  }
  if (status === 'partial') {
    return 'bg-blue-100 text-blue-800'
  }
  return 'bg-yellow-100 text-yellow-800'
}

function bookingTypeLabel(type: string | null | undefined) {
  if (type === 'airport') return 'Airport'
  if (type === 'hourly') return 'Hourly'
  if (type === 'tour') return 'Tour'
  return type ?? '-'
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [vehicleAssignments, setVehicleAssignments] = useState<VehicleAssignment[]>([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [cars, setCars] = useState<Car[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [loadingCars, setLoadingCars] = useState(true)
  const [loadingDestinations, setLoadingDestinations] = useState(true)
  const [loadingTours, setLoadingTours] = useState(true)
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [showAddCar, setShowAddCar] = useState(false)
  const [showAddDestination, setShowAddDestination] = useState(false)
  const [showAddTour, setShowAddTour] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null)
  const [editingTour, setEditingTour] = useState<Tour | null>(null)
  const [formData, setFormData] = useState({
    model_name: '',
    class: '',
    number_plate: '',
    capacity: '',
    per_km_charge: '',
    per_hr_charge: '',
    driver_name: '',
    driver_phone: '',
    driver_email: '',
    driver_license_number: '',
    driver_license_expiry: '',
    driver_verified: false,
  })
  const [destinationData, setDestinationData] = useState({
    name: '',
    distance_km: '',
    estimated_duration: '',
    description: '',
  })
  const [tourData, setTourData] = useState({
    name: '',
    description: '',
    arrival_time: '',
    duration_hours: '',
    price: '',
    max_passengers: '',
    car_model: '',
    itinerary: '',
    highlights: '',
    image_url: '',
  })
  const [showCashCollectionModal, setShowCashCollectionModal] = useState(false)
  const [selectedPaymentForCash, setSelectedPaymentForCash] = useState<Payment | null>(null)
  const [selectedBookingForCash, setSelectedBookingForCash] = useState<Booking | null>(null)
  const [cashCollectionData, setCashCollectionData] = useState({
    amount_cash_paid: '',
    cash_collected_by: '',
  })
  const [submittingCashPayment, setSubmittingCashPayment] = useState(false)
  const [showVehicleAssignmentModal, setShowVehicleAssignmentModal] = useState(false)
  const [selectedPaymentForVehicle, setSelectedPaymentForVehicle] = useState<Payment | null>(null)
  const [selectedBookingForVehicle, setSelectedBookingForVehicle] = useState<Booking | null>(null)
  const [selectedCarForAssignment, setSelectedCarForAssignment] = useState<Car | null>(null)
  const [submittingVehicleAssignment, setSubmittingVehicleAssignment] = useState(false)
  const [confirmBookedCarAssignment, setConfirmBookedCarAssignment] = useState<Car | null>(null)
  const [confirmLowCapacityCarAssignment, setConfirmLowCapacityCarAssignment] = useState<Car | null>(null)

  // ── Clear cache and logout on admin page load ─────────────────────────────
  useEffect(() => {
    // Clear all browser storage (cache, session, local data)
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear IndexedDB
    if (window.indexedDB) {
      const dbRequest = indexedDB.databases?.()
      if (dbRequest) {
        dbRequest.then((dbs) => {
          dbs.forEach((db) => {
            if (db.name) indexedDB.deleteDatabase(db.name)
          })
        })
      }
    }
    
    // Sign out any existing user sessions
    const signOutFromAuth = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
      } catch (error) {
        console.error('Error signing out:', error)
      }
    }
    
    signOutFromAuth()
  }, [])

  useEffect(() => {
    loadBookings()
    loadPayments()
    loadVehicleAssignments()
    loadCars()
    loadDestinations()
    loadTours()
  }, [])

  const loadBookings = async () => {
    setLoadingBookings(true)

    try {
      const response = await fetch('/api/bookings/admin', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const result: AdminApiResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch bookings')
      }

      setBookings(result.bookings || [])
    } catch (error) {
      console.error('Error loading admin bookings:', error)
      toast.error('Failed to load booking data')
      setBookings([])
    } finally {
      setLoadingBookings(false)
    }
  }

  const loadPayments = async () => {
    setLoadingPayments(true)

    try {
      const response = await fetch('/api/payment/get-all', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const result: PaymentsResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch payments')
      }

      setPayments(result.payments || [])
    } catch (error) {
      console.error('Error loading payments:', error)
      // Don't show error toast as payments might not exist yet
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  const loadVehicleAssignments = async () => {
    try {
      const response = await fetch('/api/bookings/get-assignments', {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        console.warn('Failed to fetch vehicle assignments')
        setVehicleAssignments([])
        return
      }

      setVehicleAssignments(result.assignments || [])
    } catch (error) {
      console.error('Error loading vehicle assignments:', error)
      setVehicleAssignments([])
    }
  }

  const loadCars = async () => {
    setLoadingCars(true)

    try {
      const response = await fetch('/api/cars?include_inactive=true', { method: 'GET' })
      const result: CarsResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch cars')
      }

      setCars(result.cars || [])
    } catch (error) {
      console.error('Error loading cars:', error)
      toast.error('Failed to load cars data')
      setCars([])
    } finally {
      setLoadingCars(false)
    }
  }

  const loadDestinations = async () => {
    setLoadingDestinations(true)

    try {
      const response = await fetch('/api/destinations', { method: 'GET' })
      const result: DestinationsResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch destinations')
      }

      setDestinations(result.destinations || [])
    } catch (error) {
      console.error('Error loading destinations:', error)
      toast.error('Failed to load destinations data')
      setDestinations([])
    } finally {
      setLoadingDestinations(false)
    }
  }

  const loadTours = async () => {
    setLoadingTours(true)

    try {
      const response = await fetch('/api/tours', { method: 'GET' })
      const result: ToursResponse = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch tours')
      }

      setTours(result.tours || [])
    } catch (error) {
      console.error('Error loading tours:', error)
      toast.error('Failed to load tours data')
      setTours([])
    } finally {
      setLoadingTours(false)
    }
  }

  const handleAddTour = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tourData.name || !tourData.price) {
      toast.error('Please fill required fields (name and price)')
      return
    }

    try {
      const highlights = tourData.highlights
        ? tourData.highlights.split(',').map((h) => h.trim()).filter((h) => h)
        : []

      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tourData, highlights }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add tour')
      }

      toast.success('Tour added successfully!')
      setTourData({
        name: '',
        description: '',
        arrival_time: '',
        duration_hours: '',
        price: '',
        max_passengers: '',
        car_model: '',
        itinerary: '',
        highlights: '',
        image_url: '',
      })
      setShowAddTour(false)
      loadTours()
    } catch (error) {
      console.error('Error adding tour:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add tour')
    }
  }

  const handleUpdateTour = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingTour) return

    if (!tourData.name || !tourData.price) {
      toast.error('Please fill required fields (name and price)')
      return
    }

    try {
      const highlights = tourData.highlights
        ? tourData.highlights.split(',').map((h) => h.trim()).filter((h) => h)
        : []

      const response = await fetch(`/api/tours/${editingTour.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...tourData, highlights }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update tour')
      }

      toast.success('Tour updated successfully!')
      setTourData({
        name: '',
        description: '',
        arrival_time: '',
        duration_hours: '',
        price: '',
        max_passengers: '',
        car_model: '',
        itinerary: '',
        highlights: '',
        image_url: '',
      })
      setEditingTour(null)
      loadTours()
    } catch (error) {
      console.error('Error updating tour:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update tour')
    }
  }

  const handleDeleteTour = async (tourId: string) => {
    if (!window.confirm('Are you sure you want to delete this tour?')) return

    try {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete tour')
      }

      toast.success('Tour deleted successfully!')
      loadTours()
    } catch (error) {
      console.error('Error deleting tour:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete tour')
    }
  }

  const startEditTour = (tour: Tour) => {
    setEditingTour(tour)
    // Format arrival_time from ISO timestamp to datetime-local format (YYYY-MM-DDTHH:mm)
    let arrivalTimeLocal = ''
    if (tour.arrival_time) {
      const dt = new Date(tour.arrival_time)
      const pad = (n: number) => String(n).padStart(2, '0')
      arrivalTimeLocal = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
    }
    setTourData({
      name: tour.name,
      description: tour.description || '',
      arrival_time: arrivalTimeLocal,
      duration_hours: tour.duration_hours?.toString() || '',
      price: tour.price.toString(),
      max_passengers: tour.max_passengers?.toString() || '',
      car_model: tour.car_model || '',
      itinerary: tour.itinerary || '',
      highlights: tour.highlights?.join(', ') || '',
      image_url: tour.image_url || '',
    })
    setShowAddTour(false)
  }

  const cancelEditTour = () => {
    setEditingTour(null)
    setTourData({
      name: '',
      description: '',
      arrival_time: '',
      duration_hours: '',
      price: '',
      max_passengers: '',
      car_model: '',
      itinerary: '',
      highlights: '',
      image_url: '',
    })
    setShowAddTour(false)
  }

  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!destinationData.name || !destinationData.distance_km || !destinationData.estimated_duration) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add destination')
      }

      toast.success('Destination added successfully!')
      setDestinationData({ name: '', distance_km: '', estimated_duration: '', description: '' })
      setShowAddDestination(false)
      loadDestinations()
    } catch (error) {
      console.error('Error adding destination:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add destination')
    }
  }

  const handleUpdateDestination = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingDestination) return

    if (!destinationData.name || !destinationData.distance_km || !destinationData.estimated_duration) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch(`/api/destinations/${editingDestination.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update destination')
      }

      toast.success('Destination updated successfully!')
      setDestinationData({ name: '', distance_km: '', estimated_duration: '', description: '' })
      setEditingDestination(null)
      loadDestinations()
    } catch (error) {
      console.error('Error updating destination:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update destination')
    }
  }

  const handleDeleteDestination = async (destinationId: string) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return

    try {
      const response = await fetch(`/api/destinations/${destinationId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete destination')
      }

      toast.success('Destination deleted successfully!')
      loadDestinations()
    } catch (error) {
      console.error('Error deleting destination:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete destination')
    }
  }

  const startEditDestination = (destination: Destination) => {
    setEditingDestination(destination)
    setDestinationData({
      name: destination.name,
      distance_km: destination.distance_km.toString(),
      estimated_duration: destination.estimated_duration,
      description: destination.description || '',
    })
    setShowAddDestination(false)
  }

  const cancelEditDestination = () => {
    setEditingDestination(null)
    setDestinationData({ name: '', distance_km: '', estimated_duration: '', description: '' })
    setShowAddDestination(false)
  }

  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.model_name || !formData.class || !formData.number_plate || !formData.capacity || !formData.per_km_charge || !formData.per_hr_charge || !formData.driver_name || !formData.driver_phone) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add car')
      }

      toast.success('Car added successfully!')
      setFormData({
        model_name: '',
        class: '',
        capacity: '',
        number_plate: '',
        per_km_charge: '',
        per_hr_charge: '',
        driver_name: '',
        driver_phone: '',
        driver_email: '',
        driver_license_number: '',
        driver_license_expiry: '',
        driver_verified: false,
      })
      setShowAddCar(false)
      loadCars()
    } catch (error) {
      console.error('Error adding car:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add car')
    }
  }

  const handleUpdateCar = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingCar) return

    if (!formData.model_name || !formData.class || !formData.number_plate || !formData.capacity || !formData.per_km_charge || !formData.per_hr_charge || !formData.driver_name || !formData.driver_phone) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      const response = await fetch(`/api/cars/${editingCar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update car')
      }

      toast.success('Car updated successfully!')
      setFormData({
        model_name: '',
        class: '',
        capacity: '',
        number_plate: '',
        per_km_charge: '',
        per_hr_charge: '',
        driver_name: '',
        driver_phone: '',
        driver_email: '',
        driver_license_number: '',
        driver_license_expiry: '',
        driver_verified: false,
      })
      setEditingCar(null)
      loadCars()
    } catch (error) {
      console.error('Error updating car:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update car')
    }
  }

  const handleDeleteCar = async (carId: string) => {
    if (!window.confirm('Are you sure you want to delete this car?')) return

    try {
      const response = await fetch(`/api/cars/${carId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete car')
      }

      toast.success('Car deleted successfully!')
      loadCars()
    } catch (error) {
      console.error('Error deleting car:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete car')
    }
  }

  const handleToggleCarActive = async (car: Car) => {
    try {
      const newStatus = !car.is_active
      const response = await fetch(`/api/cars/${car.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update car status')
      }

      toast.success(newStatus ? 'Car activated!' : 'Car deactivated!')
      loadCars()
    } catch (error) {
      console.error('Error toggling car status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update car status')
    }
  }

  const startEditCar = (car: Car) => {
    setEditingCar(car)
    setFormData({
      model_name: car.model_name,
      class: car.class,
      number_plate: car.number_plate,
      capacity: car.capacity.toString(),
      per_km_charge: car.per_km_charge.toString(),
      per_hr_charge: car.per_hr_charge.toString(),
      driver_name: car.driver_name,
      driver_phone: car.driver_phone,
      driver_email: car.driver_email || '',
      driver_license_number: car.driver_license_number || '',
      driver_license_expiry: car.driver_license_expiry || '',
      driver_verified: car.driver_verified,
    })
    setShowAddCar(false)
  }

  const cancelEdit = () => {
    setEditingCar(null)
    setFormData({
      model_name: '',
      class: '',
      number_plate: '',
      capacity: '',
      per_km_charge: '',
      per_hr_charge: '',
      driver_name: '',
      driver_phone: '',
      driver_email: '',
      driver_license_number: '',
      driver_license_expiry: '',
      driver_verified: false,
    })
    setShowAddCar(false)
  }

  const todayDate = new Date().toISOString().slice(0, 10)
  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings])

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') {
      return bookings
    }

    return bookings.filter((booking) => booking.booking_status === statusFilter)
  }, [bookings, statusFilter])

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + toNum(booking.amount_total), 0)
    const activeBookings = bookings.filter((booking) => ACTIVE_STATUSES.has(booking.booking_status)).length
    const completedToday = bookings.filter(
      (booking) => booking.booking_status === 'completed' && booking.start_datetime && booking.start_datetime.slice(0, 10) === todayDate
    ).length

    return {
      totalBookings: bookings.length,
      totalRevenue,
      activeBookings,
      completedToday,
    }
  }, [bookings, todayDate])

  // Handler to navigate to a booking in the All Bookings section
  const openBookingDetails = (bookingId: string) => {
    setActiveTab('bookings')
    setExpandedBookingId(bookingId)
  }

  // Open cash collection modal for a payment
  const openCashCollectionModal = (payment: Payment, booking: Booking) => {
    setSelectedPaymentForCash(payment)
    setSelectedBookingForCash(booking)
    const remainingBalance = Math.max(
      0,
      toNum(payment.amount_total) - (toNum(payment.amount_online_paid) + toNum(payment.amount_cash_paid))
    )
    setCashCollectionData({
      amount_cash_paid: remainingBalance.toFixed(2),
      cash_collected_by: '',
    })
    setShowCashCollectionModal(true)
  }

  // Close cash collection modal
  const closeCashCollectionModal = () => {
    setShowCashCollectionModal(false)
    setSelectedPaymentForCash(null)
    setSelectedBookingForCash(null)
    setCashCollectionData({
      amount_cash_paid: '',
      cash_collected_by: '',
    })
  }

  // Submit cash payment and update database
  const handleConfirmCashPayment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPaymentForCash || !selectedBookingForCash) {
      toast.error('Invalid payment or booking data')
      return
    }

    if (!cashCollectionData.amount_cash_paid || !cashCollectionData.cash_collected_by) {
      toast.error('Please fill all required fields')
      return
    }

    const cashAmount = toNum(cashCollectionData.amount_cash_paid)
    if (cashAmount <= 0) {
      toast.error('Cash amount must be greater than 0')
      return
    }

    setSubmittingCashPayment(true)

    try {
      // Call API to update payment with cash collection details
      const response = await fetch('/api/payment/confirm-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPaymentForCash.id,
          booking_id: selectedPaymentForCash.booking_id,
          amount_cash_paid: cashAmount,
          cash_collected_by: cashCollectionData.cash_collected_by,
          user_email: selectedBookingForCash.user_email,
          user_name: selectedBookingForCash.user_name,
          amount_total: selectedPaymentForCash.amount_total,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to confirm cash payment')
      }

      toast.success('Cash payment confirmed! Invoice sent to customer email.')
      closeCashCollectionModal()
      
      // Reload payments and bookings to show updated data
      await loadPayments()
      await loadBookings()
    } catch (error) {
      console.error('Error confirming cash payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to confirm cash payment')
    } finally {
      setSubmittingCashPayment(false)
    }
  }

  // Helper function: Check if a car is available (no conflicting assignments) for a booking's timeslot
  const isCarAvailableForBooking = (car: Car, booking: Booking): boolean => {
    const bookingStart = new Date(booking.start_datetime).getTime()
    const bookingEnd = new Date(booking.end_datetime).getTime()
    const currentBookingId = booking.booking_id || booking.id

    return !vehicleAssignments.some((assignment) => {
      // Skip if it's the same booking being reassigned
      if (assignment.booking_id === currentBookingId) return false
      
      if (assignment.car_id !== car.id) return false

      const assignmentStart = new Date(assignment.start_datetime).getTime()
      const assignmentEnd = new Date(assignment.end_datetime).getTime()

      // Check for overlap: booking_start < assignment_end AND booking_end > assignment_start
      return bookingStart < assignmentEnd && bookingEnd > assignmentStart
    })
  }

  // Helper function: Get conflicting assignment for display purposes
  const getConflictingAssignment = (car: Car, booking: Booking) => {
    const bookingStart = new Date(booking.start_datetime).getTime()
    const bookingEnd = new Date(booking.end_datetime).getTime()
    const currentBookingId = booking.booking_id || booking.id

    return vehicleAssignments.find((assignment) => {
      if (assignment.booking_id === currentBookingId) return false
      if (assignment.car_id !== car.id) return false

      const assignmentStart = new Date(assignment.start_datetime).getTime()
      const assignmentEnd = new Date(assignment.end_datetime).getTime()

      return bookingStart < assignmentEnd && bookingEnd > assignmentStart
    })
  }

  // Helper function: Check if car has sufficient capacity for the booking
  const hasInsufficientCapacity = (car: Car, booking: Booking): boolean => {
    return car.capacity < (booking.passenger_count ?? 0)
  }

  // Helper function: Handle car selection - check for conflicts AND capacity
  const handleCarSelectionForAssignment = (car: Car) => {
    if (!selectedBookingForVehicle) return

    // Check capacity first
    if (hasInsufficientCapacity(car, selectedBookingForVehicle)) {
      // Insufficient capacity, show confirmation
      setConfirmLowCapacityCarAssignment(car)
      setConfirmBookedCarAssignment(null)
      return
    }

    // Check if car is available
    if (isCarAvailableForBooking(car, selectedBookingForVehicle)) {
      // Car is available, select it directly
      setSelectedCarForAssignment(car)
      setConfirmBookedCarAssignment(null)
      setConfirmLowCapacityCarAssignment(null)
    } else {
      // Car is booked, show confirmation
      setConfirmBookedCarAssignment(car)
      setConfirmLowCapacityCarAssignment(null)
    }
  }

  // Helper function: Confirm selection of booked car
  const confirmBookedCarSelection = () => {
    if (confirmBookedCarAssignment) {
      setSelectedCarForAssignment(confirmBookedCarAssignment)
      setConfirmBookedCarAssignment(null)
    }
  }

  // Helper function: Confirm selection of low capacity car
  const confirmLowCapacityCarSelection = () => {
    if (confirmLowCapacityCarAssignment) {
      setSelectedCarForAssignment(confirmLowCapacityCarAssignment)
      setConfirmLowCapacityCarAssignment(null)
    }
  }

  // Open vehicle assignment modal
  const openVehicleAssignmentModal = (payment: Payment, booking: Booking) => {
    setSelectedPaymentForVehicle(payment)
    setSelectedBookingForVehicle(booking)
    
    // Check if an assignment already exists for this booking
    const existingAssignment = vehicleAssignments.find(
      (va) => va.booking_id === (booking.booking_id || booking.id)
    )
    
    if (existingAssignment) {
      // Find the car for this assignment to pre-select it
      const assignedCar = cars.find((c) => c.id === existingAssignment.car_id)
      setSelectedCarForAssignment(assignedCar || null)
    } else {
      setSelectedCarForAssignment(null)
    }
    
    setShowVehicleAssignmentModal(true)
  }

  // Close vehicle assignment modal
  const closeVehicleAssignmentModal = () => {
    setShowVehicleAssignmentModal(false)
    setSelectedPaymentForVehicle(null)
    setSelectedBookingForVehicle(null)
    setSelectedCarForAssignment(null)
  }

  // Submit vehicle assignment or reassignment
  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCarForAssignment || !selectedBookingForVehicle) {
      toast.error('Please select a vehicle')
      return
    }

    setSubmittingVehicleAssignment(true)

    try {
      // Check if assignment already exists for this booking
      const existingAssignment = vehicleAssignments.find(
        (va) => va.booking_id === (selectedBookingForVehicle.booking_id || selectedBookingForVehicle.id)
      )

      const endpoint = existingAssignment 
        ? '/api/bookings/update-assignment'
        : '/api/bookings/assign-vehicle'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: selectedBookingForVehicle.booking_id || selectedBookingForVehicle.id,
          car_id: selectedCarForAssignment.id,
          start_datetime: selectedBookingForVehicle.start_datetime,
          end_datetime: selectedBookingForVehicle.end_datetime,
          assignment_id: existingAssignment?.id,
          user_email: selectedBookingForVehicle.user_email,
          user_name: selectedBookingForVehicle.user_name,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to assign vehicle')
      }

      const actionText = existingAssignment ? 'reassigned' : 'assigned'
      toast.success(`Vehicle ${selectedCarForAssignment.model_name} ${actionText} successfully! Confirmation email sent.`)
      closeVehicleAssignmentModal()
      
      // Reload assignments and bookings to show updated data
      await loadVehicleAssignments()
      await loadBookings()
    } catch (error) {
      console.error('Error assigning vehicle:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign vehicle')
    } finally {
      setSubmittingVehicleAssignment(false)
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Total Bookings', value: stats.totalBookings },
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toFixed(2)}` },
          { label: 'Active Bookings', value: stats.activeBookings },
          { label: 'Completed Today', value: stats.completedToday },
          { label: 'Pending Bookings', value: bookings.filter((booking) => booking.booking_status === 'pending').length },
          { label: 'Cancelled Bookings', value: bookings.filter((booking) => booking.booking_status === 'cancelled').length },
        ].map((stat) => (
          <div key={stat.label} className="card p-6">
            <p className="text-gray-600 text-sm font-semibold mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold mb-6">Recent Bookings</h3>

        {loadingBookings ? (
          <p className="text-gray-600">Loading bookings...</p>
        ) : recentBookings.length === 0 ? (
          <p className="text-gray-600">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Booking ID</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold">Type</th>
                  <th className="text-left py-3 px-4 font-semibold">Passengers</th>
                  <th className="text-left py-3 px-4 font-semibold">Date & Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold">Booking Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const bookingPayment = payments.find(
                    (p) => p.booking_id === (booking.booking_id || booking.id)
                  )
                  return (
                    <tr
                      key={booking.id}
                      onClick={() => openBookingDetails(booking.id)}
                      className="border-b hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-blue-700">
                        {(booking.booking_id || booking.id).slice(0, 8)}…
                      </td>
                      <td className="py-3 px-4">
                        <div>{booking.user_name || '-'}</div>
                        <div className="text-xs text-gray-500">{booking.user_email || ''}</div>
                      </td>
                      <td className="py-3 px-4">{booking.phone || '-'}</td>
                      <td className="py-3 px-4">{bookingTypeLabel(booking.booking_type)}</td>
                      <td className="py-3 px-4">{booking.passenger_count ?? '-'}</td>
                      <td className="py-3 px-4">
                        <div className="text-xs">
                          <div>{booking.start_datetime ? formatDate(booking.start_datetime) : '-'}</div>
                          <div className="text-gray-500">
                            {booking.start_datetime
                              ? new Date(booking.start_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-green-700">Rs. {toNum(booking.amount_total).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClass(booking.booking_status)}`}>
                          {booking.booking_status || 'pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {bookingPayment ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPaymentStatusClass(bookingPayment.payment_status)}`}>
                            {bookingPayment.payment_status}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">no payment</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6 gap-3">
          <h3 className="text-2xl font-bold">
            All Bookings <span className="text-base text-gray-500 font-normal">({filteredBookings.length})</span>
          </h3>
          <select
            className="input-field max-w-xs"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loadingBookings ? (
          <p className="text-gray-600">Loading bookings...</p>
        ) : filteredBookings.length === 0 ? (
          <p className="text-gray-600">No bookings found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.</p>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking) => {
              // match payment by booking_id (app-level UUID); fall back to id
              const bookingPayment = payments.find(
                (p) => p.booking_id === (booking.booking_id || booking.id)
              )
              const isExpanded = expandedBookingId === booking.id
              // display the application booking_id if present, otherwise fall back to table id
              const displayId = (booking.booking_id || booking.id).slice(0, 12)

              return (
                <div key={booking.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Summary row — click to expand */}
                  <button
                    onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-3 items-center text-sm">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Booking ID</p>
                        <p className="font-mono text-xs text-blue-700">{displayId}…</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Customer</p>
                        <p className="font-medium">{booking.user_name || '-'}</p>
                        <p className="text-xs text-gray-500">{booking.phone || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Type</p>
                        <p>{bookingTypeLabel(booking.booking_type)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Start Date</p>
                        <p>{booking.start_datetime ? formatDate(booking.start_datetime) : '-'}</p>
                        <p className="text-xs text-gray-500">
                          {booking.start_datetime
                            ? new Date(booking.start_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Amount</p>
                        <p className="font-semibold text-green-700">Rs. {toNum(booking.amount_total).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-semibold mb-0.5">Status</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(booking.booking_status)} inline-block`}>
                          {booking.booking_status
                            ? booking.booking_status.charAt(0).toUpperCase() + booking.booking_status.slice(1)
                            : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`ml-4 w-5 h-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* ── Booking Details ── */}
                        <div className="bg-white rounded-lg border p-4">
                          <h4 className="font-semibold text-base mb-3 text-gray-800">Booking Details</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">booking_id</dt>
                              <dd className="font-mono text-xs text-right break-all">{booking.booking_id || '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">booking_type</dt>
                              <dd className="font-medium">{bookingTypeLabel(booking.booking_type)}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">user_name</dt>
                              <dd>{booking.user_name || '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">user_email</dt>
                              <dd>{booking.user_email || '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">phone</dt>
                              <dd>{booking.phone || '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">passenger_count</dt>
                              <dd>{booking.passenger_count ?? '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">car_model</dt>
                              <dd>{booking.car_model || '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">start_datetime</dt>
                              <dd className="text-right">{booking.start_datetime ? new Date(booking.start_datetime).toLocaleString('en-IN') : '-'}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">end_datetime</dt>
                              <dd className="text-right">{booking.end_datetime ? new Date(booking.end_datetime).toLocaleString('en-IN') : '-'}</dd>
                            </div>
                            {booking.tour_package_id && (
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">tour_package_id</dt>
                                <dd className="font-mono text-xs text-right break-all">{booking.tour_package_id}</dd>
                              </div>
                            )}
                            {booking.destination_id && (
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">destination_id</dt>
                                <dd className="font-mono text-xs text-right break-all">{booking.destination_id}</dd>
                              </div>
                            )}
                            {booking.no_of_hours != null && (
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">no_of_hours</dt>
                                <dd>{booking.no_of_hours}</dd>
                              </div>
                            )}
                            <div className="flex justify-between gap-2 pt-2 border-t font-semibold">
                              <dt>amount_total</dt>
                              <dd className="text-green-700">Rs. {toNum(booking.amount_total).toFixed(2)}</dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">booking_status</dt>
                              <dd>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(booking.booking_status)}`}>
                                  {booking.booking_status || 'pending'}
                                </span>
                              </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-gray-500 shrink-0">created_at</dt>
                              <dd className="text-xs text-right">{booking.created_at ? new Date(booking.created_at).toLocaleString('en-IN') : '-'}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* ── Vehicle Assignment Details ── */}
                        {(() => {
                          const assignment = vehicleAssignments.find(
                            (va) => va.booking_id === (booking.booking_id || booking.id)
                          )
                          const assignedCar = assignment ? cars.find((c) => c.id === assignment.car_id) : null
                          
                          return assignment && assignedCar ? (
                            <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                              <h4 className="font-semibold text-base mb-3 text-green-800">✓ Vehicle Assignment</h4>
                              <dl className="space-y-2 text-sm">
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-600 shrink-0">Car Model</dt>
                                  <dd className="font-semibold text-green-700">{assignedCar.model_name}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-600 shrink-0">Registration</dt>
                                  <dd className="font-mono">{assignedCar.number_plate}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-600 shrink-0">Class</dt>
                                  <dd>{assignedCar.class}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-600 shrink-0">Driver</dt>
                                  <dd>{assignedCar.driver_name}</dd>
                                </div>
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-600 shrink-0">Driver Phone</dt>
                                  <dd className="font-mono">{assignedCar.driver_phone}</dd>
                                </div>
                                <div className="flex justify-between gap-2 pt-2 border-t border-green-200">
                                  <dt className="text-gray-600 shrink-0">Assigned At</dt>
                                  <dd className="text-xs">{new Date(assignment.assigned_at).toLocaleString('en-IN')}</dd>
                                </div>
                              </dl>
                              <button
                                onClick={() => openVehicleAssignmentModal(bookingPayment, booking)}
                                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                              >
                                Reassign Vehicle
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-6 text-center gap-4">
                              <p className="text-sm text-gray-600">No vehicle assigned yet</p>
                              {bookingPayment?.payment_status === 'paid' && (
                                <button
                                  onClick={() => openVehicleAssignmentModal(bookingPayment, booking)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
                                >
                                  Assign Vehicle
                                </button>
                              )}
                            </div>
                          )
                        })()}

                        {/* ── Payment Details ── */}
                        {bookingPayment ? (
                          <div className="bg-white rounded-lg border p-4">
                            <h4 className="font-semibold text-base mb-3 text-gray-800">Payment Details</h4>
                            <dl className="space-y-2 text-sm">
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">payment_type</dt>
                                <dd className="font-medium capitalize">{bookingPayment.payment_type}</dd>
                              </div>
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">amount_total</dt>
                                <dd>Rs. {toNum(bookingPayment.amount_total).toFixed(2)}</dd>
                              </div>
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">amount_online_paid</dt>
                                <dd className="text-blue-700 font-medium">Rs. {toNum(bookingPayment.amount_online_paid).toFixed(2)}</dd>
                              </div>
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">amount_cash_paid</dt>
                                <dd>Rs. {toNum(bookingPayment.amount_cash_paid).toFixed(2)}</dd>
                              </div>
                              <div className="flex justify-between gap-2 pt-2 border-t font-semibold">
                                <dt>Total Collected</dt>
                                <dd className="text-green-700">Rs. {(toNum(bookingPayment.amount_online_paid) + toNum(bookingPayment.amount_cash_paid)).toFixed(2)}</dd>
                              </div>
                              {bookingPayment.payment_type === 'partial' && (
                                <div className="flex justify-between gap-2 font-semibold">
                                  <dt className="text-orange-600">Remaining Balance to Pay</dt>
                                  <dd className="text-orange-700">Rs. {Math.max(0, toNum(bookingPayment.amount_total) - (toNum(bookingPayment.amount_online_paid) + toNum(bookingPayment.amount_cash_paid))).toFixed(2)}</dd>
                                </div>
                              )}
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">payment_status</dt>
                                <dd>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusClass(bookingPayment.payment_status)}`}>
                                    {bookingPayment.payment_status}
                                  </span>
                                </dd>
                              </div>
                              <div className="flex justify-between gap-2">
                                <dt className="text-gray-500 shrink-0">txn_status</dt>
                                <dd>
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    bookingPayment.txn_status === 'success' ? 'bg-green-100 text-green-800'
                                      : bookingPayment.txn_status === 'failed' ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {bookingPayment.txn_status}
                                  </span>
                                </dd>
                              </div>
                              {bookingPayment.txn_id && (
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-500 shrink-0">txn_id</dt>
                                  <dd className="font-mono text-xs break-all text-right">{bookingPayment.txn_id}</dd>
                                </div>
                              )}
                              {bookingPayment.gateway && (
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-500 shrink-0">gateway</dt>
                                  <dd className="capitalize">{bookingPayment.gateway}</dd>
                                </div>
                              )}
                              {bookingPayment.cash_collected_by && (
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-500 shrink-0">cash_collected_by</dt>
                                  <dd>{bookingPayment.cash_collected_by}</dd>
                                </div>
                              )}
                              {bookingPayment.cash_paid_at && (
                                <div className="flex justify-between gap-2">
                                  <dt className="text-gray-500 shrink-0">cash_paid_at</dt>
                                  <dd>{new Date(bookingPayment.cash_paid_at).toLocaleString('en-IN')}</dd>
                                </div>
                              )}
                              {bookingPayment.payment_status === 'partial' && (
                                <div className="flex gap-2 pt-4 border-t">
                                  <button 
                                    onClick={() => openCashCollectionModal(bookingPayment, booking)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                                  >
                                    Confirm Cash Payment
                                  </button>
                                </div>
                              )}
                            </dl>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                            <p className="text-sm text-yellow-800">No payment record linked to this booking.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const renderCarManagement = () => (
    <div className="space-y-8">
      {/* Add/Edit Car Form */}
      {(showAddCar || editingCar) && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">{editingCar ? 'Edit Car' : 'Add New Car'}</h3>
          <form onSubmit={editingCar ? handleUpdateCar : handleAddCar} className="space-y-6">
            {/* Car Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Car Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Model Name (e.g., Toyota Innova)"
                  className="input-field"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Class (e.g., Premium, Economy, Luxury)"
                  className="input-field"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Number Plate (e.g., AP-01-XY-1234)"
                  className="input-field"
                  value={formData.number_plate}
                  onChange={(e) => setFormData({ ...formData, number_plate: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Capacity (e.g., 4)"
                  className="input-field"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Per KM Charge (Rs.)"
                  className="input-field"
                  step="0.01"
                  value={formData.per_km_charge}
                  onChange={(e) => setFormData({ ...formData, per_km_charge: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Per Hour Charge (Rs.)"
                  className="input-field"
                  step="0.01"
                  value={formData.per_hr_charge}
                  onChange={(e) => setFormData({ ...formData, per_hr_charge: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Driver Details */}
            <div>
              <h4 className="text-lg font-semibold mb-4 text-gray-700">Driver Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Driver Name (required)"
                  className="input-field"
                  value={formData.driver_name}
                  onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                  required
                />
                <input
                  type="tel"
                  placeholder="Driver Phone (required)"
                  className="input-field"
                  value={formData.driver_phone}
                  onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Driver Email"
                  className="input-field"
                  value={formData.driver_email}
                  onChange={(e) => setFormData({ ...formData, driver_email: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="License Number"
                  className="input-field"
                  value={formData.driver_license_number}
                  onChange={(e) => setFormData({ ...formData, driver_license_number: e.target.value })}
                />
                <input
                  type="date"
                  placeholder="License Expiry Date"
                  className="input-field"
                  value={formData.driver_license_expiry}
                  onChange={(e) => setFormData({ ...formData, driver_license_expiry: e.target.value })}
                />
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.driver_verified}
                      onChange={(e) => setFormData({ ...formData, driver_verified: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">Driver Verified</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingCar ? 'Update Car' : 'Add Car'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cars List */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Manage Cars</h3>
          {!showAddCar && !editingCar && (
            <button onClick={() => setShowAddCar(true)} className="btn-primary">
              Add New Car
            </button>
          )}
        </div>

        {loadingCars ? (
          <p className="text-gray-600">Loading cars...</p>
        ) : cars.length === 0 ? (
          <p className="text-gray-600">No cars available. Add a new car to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Model</th>
                  <th className="text-left py-3 px-4 font-semibold">Class</th>
                  <th className="text-left py-3 px-4 font-semibold">Number Plate</th>
                  <th className="text-left py-3 px-4 font-semibold">Capacity</th>
                  <th className="text-left py-3 px-4 font-semibold">Per KM</th>
                  <th className="text-left py-3 px-4 font-semibold">Per Hour</th>
                  <th className="text-left py-3 px-4 font-semibold">Driver Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Driver Phone</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car.id} className={`border-b hover:bg-gray-50 ${!car.is_active ? 'bg-gray-100 opacity-70' : ''}`}>
                    <td className="py-3 px-4">{car.model_name}</td>
                    <td className="py-3 px-4">{car.class}</td>
                    <td className="py-3 px-4 font-mono">{car.number_plate}</td>
                    <td className="py-3 px-4">{car.capacity} seats</td>
                    <td className="py-3 px-4">Rs. {car.per_km_charge}</td>
                    <td className="py-3 px-4">Rs. {car.per_hr_charge}</td>
                    <td className="py-3 px-4">{car.driver_name}</td>
                    <td className="py-3 px-4">{car.driver_phone}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        car.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {car.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => startEditCar(car)}
                          className="text-sm text-secondary-500 hover:text-secondary-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleCarActive(car)}
                          className={`text-sm ${car.is_active ? 'text-orange-500 hover:text-orange-600' : 'text-green-500 hover:text-green-600'}`}
                        >
                          {car.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteCar(car.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const renderDestinations = () => (
    <div className="space-y-8">
      {/* Add/Edit Destination Form */}
      {(showAddDestination || editingDestination) && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">{editingDestination ? 'Edit Destination' : 'Add New Destination'}</h3>
          <form onSubmit={editingDestination ? handleUpdateDestination : handleAddDestination} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Destination Name (e.g., Guwahati)"
                className="input-field"
                value={destinationData.name}
                onChange={(e) => setDestinationData({ ...destinationData, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Distance (KM)"
                className="input-field"
                step="0.1"
                value={destinationData.distance_km}
                onChange={(e) => setDestinationData({ ...destinationData, distance_km: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Estimated Duration (e.g., 1 hour 30 minutes)"
                className="input-field"
                value={destinationData.estimated_duration}
                onChange={(e) => setDestinationData({ ...destinationData, estimated_duration: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                className="input-field"
                value={destinationData.description}
                onChange={(e) => setDestinationData({ ...destinationData, description: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelEditDestination}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingDestination ? 'Update Destination' : 'Add Destination'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Destinations List */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Manage Destinations</h3>
          {!showAddDestination && !editingDestination && (
            <button onClick={() => setShowAddDestination(true)} className="btn-primary">
              Add New Destination
            </button>
          )}
        </div>

        {loadingDestinations ? (
          <p className="text-gray-600">Loading destinations...</p>
        ) : destinations.length === 0 ? (
          <p className="text-gray-600">No destinations available. Add a new destination to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Distance (KM)</th>
                  <th className="text-left py-3 px-4 font-semibold">Estimated Duration</th>
                  <th className="text-left py-3 px-4 font-semibold">Description</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((destination) => (
                  <tr key={destination.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{destination.name}</td>
                    <td className="py-3 px-4">{destination.distance_km}</td>
                    <td className="py-3 px-4">{destination.estimated_duration}</td>
                    <td className="py-3 px-4">{destination.description || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditDestination(destination)}
                          className="text-sm text-secondary-500 hover:text-secondary-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDestination(destination.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const renderTours = () => (
    <div className="space-y-8">
      {/* Add/Edit Tour Form */}
      {(showAddTour || editingTour) && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">{editingTour ? 'Edit Tour' : 'Add New Tour'}</h3>
          <form onSubmit={editingTour ? handleUpdateTour : handleAddTour} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tour Name (required)"
                className="input-field"
                value={tourData.name}
                onChange={(e) => setTourData({ ...tourData, name: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Price (Rs.) (required)"
                className="input-field"
                step="0.01"
                value={tourData.price}
                onChange={(e) => setTourData({ ...tourData, price: e.target.value })}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 font-medium">Arrival Time</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={tourData.arrival_time}
                  onChange={(e) => setTourData({ ...tourData, arrival_time: e.target.value })}
                />
              </div>
              <input
                type="number"
                placeholder="Duration (Hours)"
                className="input-field"
                value={tourData.duration_hours}
                onChange={(e) => setTourData({ ...tourData, duration_hours: e.target.value })}
              />
              <input
                type="number"
                placeholder="Max Passengers"
                className="input-field"
                value={tourData.max_passengers}
                onChange={(e) => setTourData({ ...tourData, max_passengers: e.target.value })}
              />
              <input
                type="text"
                placeholder="Car Model"
                className="input-field"
                value={tourData.car_model}
                onChange={(e) => setTourData({ ...tourData, car_model: e.target.value })}
              />
              <input
                type="text"
                placeholder="Image URL"
                className="input-field"
                value={tourData.image_url}
                onChange={(e) => setTourData({ ...tourData, image_url: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Description"
              className="input-field w-full"
              rows={3}
              value={tourData.description}
              onChange={(e) => setTourData({ ...tourData, description: e.target.value })}
            />
            <textarea
              placeholder="Itinerary"
              className="input-field w-full"
              rows={3}
              value={tourData.itinerary}
              onChange={(e) => setTourData({ ...tourData, itinerary: e.target.value })}
            />
            <input
              type="text"
              placeholder="Highlights (comma-separated, e.g., Beach, Mountains, Temple)"
              className="input-field w-full"
              value={tourData.highlights}
              onChange={(e) => setTourData({ ...tourData, highlights: e.target.value })}
            />

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={cancelEditTour}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingTour ? 'Update Tour' : 'Add Tour'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tours List */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Manage Tours</h3>
          {!showAddTour && !editingTour && (
            <button onClick={() => setShowAddTour(true)} className="btn-primary">
              Add New Tour
            </button>
          )}
        </div>

        {loadingTours ? (
          <p className="text-gray-600">Loading tours...</p>
        ) : tours.length === 0 ? (
          <p className="text-gray-600">No tours available. Add a new tour to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Name</th>
                  <th className="text-left py-3 px-4 font-semibold">Price</th>
                  <th className="text-left py-3 px-4 font-semibold">Arrival Time</th>
                  <th className="text-left py-3 px-4 font-semibold">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold">Max Pax</th>
                  <th className="text-left py-3 px-4 font-semibold">Car Model</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{tour.name}</td>
                    <td className="py-3 px-4">Rs. {toNum(tour.price).toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm">
                      {tour.arrival_time
                        ? new Date(tour.arrival_time).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: false,
                          })
                        : '-'}
                    </td>
                    <td className="py-3 px-4">{tour.duration_hours ? `${tour.duration_hours}h` : '-'}</td>
                    <td className="py-3 px-4">{tour.max_passengers || '-'}</td>
                    <td className="py-3 px-4">{tour.car_model || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditTour(tour)}
                          className="text-sm text-secondary-500 hover:text-secondary-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTour(tour.id)}
                          className="text-sm text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  const analytics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, booking) => sum + toNum(booking.amount_total), 0)
    const completedBookings = bookings.filter((booking) => booking.booking_status === 'completed').length
    const pendingBookings = bookings.filter((booking) => booking.booking_status === 'pending').length
    const cancelledBookings = bookings.filter((booking) => booking.booking_status === 'cancelled').length
    const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0

    // Real payment statistics
    const totalPaid = payments.reduce((sum, p) => sum + toNum(p.amount_online_paid), 0)
    const totalCashCollected = payments.reduce((sum, p) => sum + toNum(p.amount_cash_paid), 0)
    const paidBookings = payments.filter((p) => p.payment_status === 'paid').length
    const partialPayments = payments.filter((p) => p.payment_status === 'partial').length

    // Real booking trend - group by date (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().slice(0, 10)
    })

    const bookingTrend = last7Days.map((dateStr) => {
      const dayBookings = bookings.filter((b) => b.start_datetime && b.start_datetime.slice(0, 10) === dateStr)
      const dayRevenue = dayBookings.reduce((sum, b) => sum + toNum(b.amount_total), 0)
      const dayName = new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' })
      return { date: dayName, bookings: dayBookings.length, revenue: dayRevenue }
    })

    // Real top destinations - count bookings per destination
    const destinationBookingCounts = bookings
      .filter((b) => b.destination_id)
      .reduce(
        (acc, b) => {
          acc[b.destination_id!] = (acc[b.destination_id!] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

    const topDestinations = destinations
      .map((dest) => ({
        name: dest.name,
        bookings: destinationBookingCounts[dest.id] || 0,
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    // Real top tours - count bookings per tour
    const tourBookingCounts = bookings
      .filter((b) => b.tour_package_id)
      .reduce(
        (acc, b) => {
          acc[b.tour_package_id!] = (acc[b.tour_package_id!] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )

    const topTours = tours
      .map((tour) => ({
        name: tour.name,
        bookings: tourBookingCounts[tour.id] || 0,
        revenue: (tourBookingCounts[tour.id] || 0) * tour.price,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Calculate tour revenue from topTours
    const tourRevenue = topTours.reduce((sum, tour) => sum + tour.revenue, 0)

    const fleetUtilization = cars.length > 0 ? (bookings.filter((b) => b.car_model).length / bookings.length) * 100 : 0

    return {
      totalRevenue,
      totalPaid,
      totalCashCollected,
      paidBookings,
      partialPayments,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      averageBookingValue,
      fleetUtilization,
      bookingTrend,
      topDestinations,
      topTours,
      tourRevenue,
    }
  }, [bookings, payments, tours, cars, destinations])

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-blue-700">Rs. {analytics.totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500 mt-2">All bookings combined</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100">
          <p className="text-gray-600 text-sm font-semibold mb-2">Completed Bookings</p>
          <p className="text-3xl font-bold text-green-700">{analytics.completedBookings}</p>
          <p className="text-xs text-gray-500 mt-2">Successfully delivered</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-gray-600 text-sm font-semibold mb-2">Avg Booking Value</p>
          <p className="text-3xl font-bold text-yellow-700">Rs. {analytics.averageBookingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <p className="text-xs text-gray-500 mt-2">Per booking average</p>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100">
          <p className="text-gray-600 text-sm font-semibold mb-2">Fleet Utilization</p>
          <p className="text-3xl font-bold text-purple-700">{analytics.fleetUtilization.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">Cars in active use</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
              <span className="font-semibold">{analytics.pendingBookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="font-semibold">{analytics.completedBookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
              <span className="font-semibold">{analytics.cancelledBookings}</span>
            </div>
            <hr className="my-3" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{bookings.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Fleet Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Cars</span>
              <span className="font-semibold">{cars.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Available Destinations</span>
              <span className="font-semibold">{destinations.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Tours</span>
              <span className="font-semibold">{tours.length}</span>
            </div>
            <hr className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Services</span>
              <span className="font-semibold">{cars.length + destinations.length + tours.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Online Collected</span>
              <span className="font-semibold">Rs. {analytics.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cash Collected</span>
              <span className="font-semibold">Rs. {analytics.totalCashCollected.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
            <hr className="my-3" />
            <div className="flex items-center justify-between font-semibold">
              <span>Total Collected</span>
              <span className="text-lg">Rs. {(analytics.totalPaid + analytics.totalCashCollected).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Booking Trend */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h3 className="text-2xl font-bold mb-6">Weekly Booking Trend</h3>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-7 gap-4">
              {analytics.bookingTrend.map((day) => (
                <div key={day.date} className="text-center">
                  <div className="text-sm font-semibold text-gray-600 mb-2">{day.date}</div>
                  <div className="bg-blue-100 rounded-lg p-4 mb-2">
                    <div className="h-24 flex items-end justify-center gap-1">
                      <div
                        className="bg-secondary-500 rounded"
                        style={{
                          height: `${(day.bookings / 35) * 100}%`,
                          width: '60%',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="font-semibold">{day.bookings} bookings</p>
                    <p>Rs. {day.revenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Destinations and Tours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Top Destinations</h3>
          <div className="space-y-4">
            {analytics.topDestinations.length > 0 ? (
              analytics.topDestinations.map((dest, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center text-sm font-semibold text-secondary-700">
                      {idx + 1}
                    </div>
                    <span className="font-semibold">{dest.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary-600">{dest.bookings}</p>
                    <p className="text-xs text-gray-500">bookings</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No destination data available</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold mb-6">Top Tours</h3>
          <div className="space-y-4">
            {analytics.topTours.length > 0 ? (
              analytics.topTours.map((tour, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{tour.name}</p>
                      <p className="text-xs text-gray-500">{tour.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">Rs. {tour.revenue.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No tour data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Admin Panel Header */}
      <header className="sticky top-0 z-50 bg-primary-950 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <h2 className="text-sm font-semibold text-secondary-500">Admin Panel</h2>
                <p className="text-xl font-bold">Hello! Yami</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 md:py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between mb-8 gap-3">
            <h1 className="text-4xl font-bold">Management Dashboard</h1>
            <button onClick={loadBookings} className="btn-secondary">
              Refresh Data
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-lg shadow-lg p-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'bookings', label: 'All Bookings' },
              { id: 'car-management', label: 'Car Management' },
              { id: 'destinations', label: 'Destinations' },
              { id: 'tours', label: 'Tours' },
              { id: 'analytics', label: 'Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-smooth ${
                  activeTab === tab.id
                    ? 'bg-secondary-500 text-primary-950'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'car-management' && renderCarManagement()}
          {activeTab === 'destinations' && renderDestinations()}
          {activeTab === 'tours' && renderTours()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </main>

      {/* Cash Collection Modal */}
      {showCashCollectionModal && selectedPaymentForCash && selectedBookingForCash && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Confirm Cash Payment</h2>
                <p className="text-sm text-gray-600 mt-1">Booking ID: {(selectedBookingForCash.booking_id || selectedBookingForCash.id).slice(0, 12)}…</p>
              </div>
              <button
                onClick={closeCashCollectionModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-3">Booking Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Customer Name:</dt>
                    <dd className="font-medium">{selectedBookingForCash.user_name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Email:</dt>
                    <dd className="font-medium">{selectedBookingForCash.user_email || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Phone:</dt>
                    <dd className="font-medium">{selectedBookingForCash.phone || '-'}</dd>
                  </div>
                </dl>
              </div>

              {/* Payment Summary */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold mb-3">Payment Summary</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Total Amount:</dt>
                    <dd className="font-semibold text-green-700">Rs. {toNum(selectedPaymentForCash.amount_total).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Already Paid (Online):</dt>
                    <dd className="font-medium text-blue-700">Rs. {toNum(selectedPaymentForCash.amount_online_paid).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Already Paid (Cash):</dt>
                    <dd className="font-medium">Rs. {toNum(selectedPaymentForCash.amount_cash_paid).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-300 font-semibold">
                    <dt>Remaining Balance:</dt>
                    <dd className="text-orange-600">Rs. {Math.max(0, toNum(selectedPaymentForCash.amount_total) - (toNum(selectedPaymentForCash.amount_online_paid) + toNum(selectedPaymentForCash.amount_cash_paid))).toFixed(2)}</dd>
                  </div>
                </dl>
              </div>

              {/* Cash Collection Form */}
              <form onSubmit={handleConfirmCashPayment} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cash Amount to Collect <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-600 font-semibold">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="input-field pl-10"
                      value={cashCollectionData.amount_cash_paid}
                      onChange={(e) => setCashCollectionData({ ...cashCollectionData, amount_cash_paid: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: Rs. {Math.max(0, toNum(selectedPaymentForCash.amount_total) - (toNum(selectedPaymentForCash.amount_online_paid) + toNum(selectedPaymentForCash.amount_cash_paid))).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Collected By <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name or admin ID"
                    className="input-field"
                    value={cashCollectionData.cash_collected_by}
                    onChange={(e) => setCashCollectionData({ ...cashCollectionData, cash_collected_by: e.target.value })}
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <p className="font-semibold mb-1">📧 Invoice will be sent to:</p>
                  <p className="font-mono">{selectedBookingForCash.user_email || 'N/A'}</p>
                  <p className="text-xs mt-2 text-yellow-700">(Placeholder: Email system not implemented yet)</p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeCashCollectionModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    disabled={submittingCashPayment}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submittingCashPayment}
                  >
                    {submittingCashPayment ? 'Processing...' : 'Confirm & Send Invoice'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Assignment Modal */}
      {showVehicleAssignmentModal && selectedPaymentForVehicle && selectedBookingForVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            {(() => {
              const existingAssignment = vehicleAssignments.find(
                (va) => va.booking_id === (selectedBookingForVehicle.booking_id || selectedBookingForVehicle.id)
              )
              const assignedCar = existingAssignment ? cars.find((c) => c.id === existingAssignment.car_id) : null
              return (
                <>
                  <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{existingAssignment ? 'Reassign Vehicle' : 'Assign Vehicle'}</h2>
                      <p className="text-sm text-gray-600 mt-1">Booking ID: {(selectedBookingForVehicle.booking_id || selectedBookingForVehicle.id).slice(0, 12)}…</p>
                      {existingAssignment && assignedCar && (
                        <p className="text-sm text-blue-600 mt-2">Currently assigned: <span className="font-semibold">{assignedCar.model_name}</span> ({assignedCar.number_plate})</p>
                      )}
                    </div>
                    <button
                      onClick={closeVehicleAssignmentModal}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
              {/* Booking Details */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold mb-3">Booking Details</h3>
                <dl className="space-y-2 text-sm grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-gray-600">Customer:</dt>
                    <dd className="font-medium">{selectedBookingForVehicle.user_name || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Phone:</dt>
                    <dd className="font-medium">{selectedBookingForVehicle.phone || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Preferred Model:</dt>
                    <dd className="font-medium">{selectedBookingForVehicle.car_model || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Passengers:</dt>
                    <dd className="font-medium">{selectedBookingForVehicle.passenger_count ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Start Date/Time:</dt>
                    <dd className="font-medium">{selectedBookingForVehicle.start_datetime ? new Date(selectedBookingForVehicle.start_datetime).toLocaleString('en-IN') : '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">End Date/Time:</dt>
                    <dd className="font-medium">{selectedBookingForVehicle.end_datetime ? new Date(selectedBookingForVehicle.end_datetime).toLocaleString('en-IN') : '-'}</dd>
                  </div>
                </dl>
              </div>

              {/* Vehicle Selection */}
              <form onSubmit={handleAssignVehicle} className="space-y-6">
                {(() => {
                  const matchingCars = cars.filter((car) => car.model_name === selectedBookingForVehicle.car_model && car.is_active)
                  const availableMatching = matchingCars.filter((car) => isCarAvailableForBooking(car, selectedBookingForVehicle))
                  const bookedMatching = matchingCars.filter((car) => !isCarAvailableForBooking(car, selectedBookingForVehicle))

                  const alternativeCars = cars.filter((car) => car.model_name !== selectedBookingForVehicle.car_model && car.is_active)
                  const availableAlternative = alternativeCars.filter((car) => isCarAvailableForBooking(car, selectedBookingForVehicle))
                  const bookedAlternative = alternativeCars.filter((car) => !isCarAvailableForBooking(car, selectedBookingForVehicle))

                  return (
                    <>
                      {/* Available Matching Cars */}
                      {availableMatching.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-green-700 mb-3">✓ Available - Preferred Model</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableMatching.map((car) => {
                              const isLowCapacity = hasInsufficientCapacity(car, selectedBookingForVehicle)
                              return (
                              <button
                                key={car.id}
                                type="button"
                                onClick={() => handleCarSelectionForAssignment(car)}
                                className={`p-4 border-2 rounded-lg transition-all text-left ${
                                  isLowCapacity
                                    ? 'border-red-400 hover:border-red-500'
                                    : selectedCarForAssignment?.id === car.id
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-green-300'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{car.model_name}</p>
                                    <p className="text-xs text-gray-600">{car.number_plate}</p>
                                    <p className="text-xs text-gray-500 mt-1">{car.class}</p>
                                    {isLowCapacity && (
                                      <span className="inline-block mt-2 px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                                        Low Capacity ({car.capacity} seats)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right text-xs">
                                    <p className="font-semibold">{car.capacity} seats</p>
                                    <p className="text-gray-600">Driver: {car.driver_name}</p>
                                  </div>
                                </div>
                              </button>
                            )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Available Alternative Cars */}
                      {availableAlternative.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-blue-700 mb-3">✓ Available - Alternative Models</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableAlternative.map((car) => {
                              const isLowCapacity = hasInsufficientCapacity(car, selectedBookingForVehicle)
                              return (
                              <button
                                key={car.id}
                                type="button"
                                onClick={() => handleCarSelectionForAssignment(car)}
                                className={`p-4 border-2 rounded-lg transition-all text-left ${
                                  isLowCapacity
                                    ? 'border-red-400 hover:border-red-500'
                                    : selectedCarForAssignment?.id === car.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{car.model_name}</p>
                                    <p className="text-xs text-gray-600">{car.number_plate}</p>
                                    <p className="text-xs text-gray-500 mt-1">{car.class}</p>
                                    {isLowCapacity && (
                                      <span className="inline-block mt-2 px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                                        Low Capacity ({car.capacity} seats)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right text-xs">
                                    <p className="font-semibold">{car.capacity} seats</p>
                                    <p className="text-gray-600">Driver: {car.driver_name}</p>
                                  </div>
                                </div>
                              </button>
                            )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Booked Matching Cars */}
                      {bookedMatching.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-orange-700 mb-3">⚠ Booked - Preferred Model</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {bookedMatching.map((car) => {
                              const isLowCapacity = hasInsufficientCapacity(car, selectedBookingForVehicle)
                              return (
                              <button
                                key={car.id}
                                type="button"
                                onClick={() => handleCarSelectionForAssignment(car)}
                                className={`p-4 border-2 rounded-lg transition-all text-left opacity-60 ${
                                  selectedCarForAssignment?.id === car.id
                                    ? 'border-orange-400 bg-orange-50'
                                    : 'border-gray-300 hover:border-orange-300 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-700">{car.model_name}</p>
                                    <p className="text-xs text-gray-600">{car.number_plate}</p>
                                    <p className="text-xs text-gray-500 mt-1">{car.class}</p>
                                    <div className="mt-2 space-y-1">
                                      <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 text-xs font-semibold rounded mr-2">
                                        Booked
                                      </span>
                                      {isLowCapacity && (
                                        <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                                          Low Capacity ({car.capacity} seats)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right text-xs">
                                    <p className="font-semibold">{car.capacity} seats</p>
                                    <p className="text-gray-600">Driver: {car.driver_name}</p>
                                  </div>
                                </div>
                              </button>
                            )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Booked Alternative Cars */}
                      {bookedAlternative.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-orange-700 mb-3">⚠ Booked - Alternative Models</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {bookedAlternative.map((car) => {
                              const isLowCapacity = hasInsufficientCapacity(car, selectedBookingForVehicle)
                              return (
                              <button
                                key={car.id}
                                type="button"
                                onClick={() => handleCarSelectionForAssignment(car)}
                                className={`p-4 border-2 rounded-lg transition-all text-left opacity-60 ${
                                  selectedCarForAssignment?.id === car.id
                                    ? 'border-orange-400 bg-orange-50'
                                    : 'border-gray-300 hover:border-orange-300 bg-gray-50'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-700">{car.model_name}</p>
                                    <p className="text-xs text-gray-600">{car.number_plate}</p>
                                    <p className="text-xs text-gray-500 mt-1">{car.class}</p>
                                    <div className="mt-2 space-y-1">
                                      <span className="inline-block px-2 py-1 bg-orange-200 text-orange-800 text-xs font-semibold rounded mr-2">
                                        Booked
                                      </span>
                                      {isLowCapacity && (
                                        <span className="inline-block px-2 py-1 bg-red-200 text-red-800 text-xs font-semibold rounded">
                                          Low Capacity ({car.capacity} seats)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right text-xs">
                                    <p className="font-semibold">{car.capacity} seats</p>
                                    <p className="text-gray-600">Driver: {car.driver_name}</p>
                                  </div>
                                </div>
                              </button>
                            )
                            })}
                          </div>
                        </div>
                      )}

                      {/* No cars available message */}
                      {matchingCars.length === 0 && alternativeCars.length === 0 && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-800">No active vehicles available for assignment.</p>
                        </div>
                      )}

                      {/* Inactive Matching Cars */}
                      {(() => {
                        const inactiveMatching = cars.filter((car) => car.model_name === selectedBookingForVehicle.car_model && !car.is_active)
                        return inactiveMatching.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-500 mb-3">🚫 Inactive - Preferred Model</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {inactiveMatching.map((car) => (
                                <div
                                  key={car.id}
                                  className="p-4 border-2 border-gray-300 rounded-lg text-left opacity-40 bg-gray-200 cursor-not-allowed"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-600">{car.model_name}</p>
                                      <p className="text-xs text-gray-500">{car.number_plate}</p>
                                      <p className="text-xs text-gray-500 mt-1">{car.class}</p>
                                      <span className="inline-block mt-2 px-2 py-1 bg-gray-400 text-white text-xs font-semibold rounded">
                                        Inactive
                                      </span>
                                    </div>
                                    <div className="text-right text-xs">
                                      <p className="font-semibold text-gray-600">{car.capacity} seats</p>
                                      <p className="text-gray-500">Driver: {car.driver_name}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Inactive Alternative Cars */}
                      {(() => {
                        const inactiveAlternative = cars.filter((car) => car.model_name !== selectedBookingForVehicle.car_model && !car.is_active)
                        return inactiveAlternative.length > 0 && (
                          <div>
                            <h3 className="font-semibold text-gray-500 mb-3">🚫 Inactive - Alternative Models</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {inactiveAlternative.map((car) => (
                                <div
                                  key={car.id}
                                  className="p-4 border-2 border-gray-300 rounded-lg text-left opacity-40 bg-gray-200 cursor-not-allowed"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-600">{car.model_name}</p>
                                      <p className="text-xs text-gray-500">{car.number_plate}</p>
                                      <p className="text-xs text-gray-500 mt-1">{car.class}</p>
                                      <span className="inline-block mt-2 px-2 py-1 bg-gray-400 text-white text-xs font-semibold rounded">
                                        Inactive
                                      </span>
                                    </div>
                                    <div className="text-right text-xs">
                                      <p className="font-semibold text-gray-600">{car.capacity} seats</p>
                                      <p className="text-gray-500">Driver: {car.driver_name}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </>
                  )
                })()}


                {/* Selected Car Summary */}
                {selectedCarForAssignment && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Selected Vehicle</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Model:</dt>
                        <dd className="font-medium">{selectedCarForAssignment.model_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Registration:</dt>
                        <dd className="font-medium">{selectedCarForAssignment.number_plate}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Driver:</dt>
                        <dd className="font-medium">{selectedCarForAssignment.driver_name}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Driver Phone:</dt>
                        <dd className="font-medium">{selectedCarForAssignment.driver_phone}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Capacity:</dt>
                        <dd className="font-medium">{selectedCarForAssignment.capacity} passengers</dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeVehicleAssignmentModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    disabled={submittingVehicleAssignment}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submittingVehicleAssignment || !selectedCarForAssignment}
                  >
                    {submittingVehicleAssignment 
                      ? (vehicleAssignments.find((va) => va.booking_id === (selectedBookingForVehicle?.booking_id || selectedBookingForVehicle?.id)) ? 'Reassigning...' : 'Assigning...')
                      : (vehicleAssignments.find((va) => va.booking_id === (selectedBookingForVehicle?.booking_id || selectedBookingForVehicle?.id)) ? 'Reassign Vehicle' : 'Assign Vehicle')}
                  </button>
                </div>
              </form>

              {/* Booked Car Confirmation Dialog */}
              {confirmBookedCarAssignment && selectedBookingForVehicle && (() => {
                const conflict = getConflictingAssignment(confirmBookedCarAssignment, selectedBookingForVehicle)
                const conflictingBooking = conflict ? bookings.find(b => b.booking_id === conflict.booking_id || b.id === conflict.booking_id) : null
                
                return (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-orange-100 rounded-full mb-4">
                        <span className="text-2xl">⚠️</span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-center mb-2">Car Already Assigned</h3>
                      <p className="text-gray-600 text-center text-sm mb-4">
                        This car is assigned to a different booking for this timeframe.
                      </p>

                      {conflictingBooking && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-sm">
                          <p className="font-semibold text-orange-800 mb-2">Conflicting Booking:</p>
                          <dl className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Customer:</dt>
                              <dd className="font-medium">{conflictingBooking.user_name || '-'}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-600">Time:</dt>
                              <dd className="font-medium">{new Date(conflictingBooking.start_datetime).toLocaleString('en-IN').split(',')[1]} - {new Date(conflictingBooking.end_datetime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</dd>
                            </div>
                          </dl>
                        </div>
                      )}

                      <p className="text-gray-700 text-sm mb-6">
                        Are you sure you want to assign <span className="font-semibold">{confirmBookedCarAssignment.model_name}</span> ({confirmBookedCarAssignment.number_plate}) to this booking?
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmBookedCarAssignment(null)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmBookedCarSelection}
                          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors"
                        >
                          Yes, Assign Anyway
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Low Capacity Confirmation Dialog */}
              {confirmLowCapacityCarAssignment && selectedBookingForVehicle && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-center mb-2">Insufficient Car Capacity</h3>
                    <p className="text-gray-600 text-center text-sm mb-4">
                      The selected car does not have enough seats for the number of passengers.
                    </p>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm">
                      <p className="font-semibold text-red-800 mb-2">Capacity Mismatch:</p>
                      <dl className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Required Passengers:</dt>
                          <dd className="font-medium text-red-700">{selectedBookingForVehicle.passenger_count ?? '-'}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Car Capacity:</dt>
                          <dd className="font-medium text-red-700">{confirmLowCapacityCarAssignment.capacity}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Shortage:</dt>
                          <dd className="font-medium text-red-700">{(selectedBookingForVehicle.passenger_count ?? 0) - confirmLowCapacityCarAssignment.capacity} seats</dd>
                        </div>
                      </dl>
                    </div>

                    <p className="text-gray-700 text-sm mb-6">
                      Are you sure you want to assign <span className="font-semibold">{confirmLowCapacityCarAssignment.model_name}</span> ({confirmLowCapacityCarAssignment.number_plate}) with only <span className="font-semibold">{confirmLowCapacityCarAssignment.capacity} seats</span> to this booking?
                    </p>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmLowCapacityCarAssignment(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmLowCapacityCarSelection}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors"
                      >
                        Yes, Assign Anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
