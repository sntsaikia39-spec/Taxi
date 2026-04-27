import { supabase } from './supabase'

// Types
export interface TourPackage {
  id: string
  name: string
  description: string | null
  arrival_time: string | null
  duration_hours: number | null
  price: number
  max_passengers: number | null
  car_type: string | null
  itinerary: string | null
  highlights: string[] | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  booking_id: string
  booking_type: 'airport' | 'tour' | 'hourly'
  user_name: string
  user_email: string | null
  phone: string
  passenger_count: number
  start_datetime: string
  end_datetime: string
  destination_id: string | null
  tour_package_id: string | null
  no_of_hours: number | null
  car_model: string | null
  amount_total: number
  booking_status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
}

export interface Payment {
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

// ==================== TOURS ====================

export async function fetchAllTours(): Promise<TourPackage[]> {
  try {
    const { data, error } = await supabase
      .from('tour_packages')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tours:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception fetching tours:', error)
    return []
  }
}

export async function fetchTourById(id: string): Promise<TourPackage | null> {
  try {
    const { data, error } = await supabase
      .from('tour_packages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching tour:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception fetching tour:', error)
    return null
  }
}

// ==================== BOOKINGS ====================

export async function fetchBookingsByEmail(email: string): Promise<Booking[]> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_email', email)
      .order('pickup_date', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Exception fetching bookings:', error)
    return []
  }
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching booking:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception fetching booking:', error)
    return null
  }
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception creating booking:', error)
    return null
  }
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating booking:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception updating booking:', error)
    return null
  }
}

export async function updateBookingPaymentStatus(
  bookingId: string,
  paymentStatus: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: paymentStatus })
      .eq('booking_id', bookingId)

    if (error) {
      console.error('Error updating booking payment status:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Exception updating booking payment status:', error)
    return false
  }
}

// ==================== PAYMENTS ====================

export async function createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()

    if (error) {
      console.error('Error creating payment:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception creating payment:', error)
    return null
  }
}

export async function fetchPaymentByBookingId(bookingId: string): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) {
      console.error('Error fetching payment:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception fetching payment:', error)
    return null
  }
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment:', error)
      return null
    }

    return data || null
  } catch (error) {
    console.error('Exception updating payment:', error)
    return null
  }
}
