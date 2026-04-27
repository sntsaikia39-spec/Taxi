/**
 * Payment Database Functions (SERVER-SIDE ONLY)
 * These functions use supabaseAdmin and should only be called from API routes
 */

import { supabaseAdmin } from './supabase-admin'
import { validatePaymentAmounts } from './payment-utils'

/**
 * Create a payment record in the database
 * @param paymentData - Payment data to insert
 * @returns Payment record or error
 */
export async function createPaymentInDB(paymentData: {
  booking_id: string
  payment_type: 'partial' | 'full'
  amount_total: number
  amount_online_paid: number
  amount_cash_paid?: number
  txn_status?: 'pending' | 'success' | 'failed'
  txn_id?: string
  gateway?: string
  payment_status?: 'pending' | 'partial' | 'paid'
}) {
  try {
    // Set default values
    const finalPaymentData = {
      booking_id: paymentData.booking_id,
      payment_type: paymentData.payment_type,
      amount_total: paymentData.amount_total,
      amount_online_paid: paymentData.amount_online_paid,
      amount_cash_paid: paymentData.amount_cash_paid || 0,
      txn_status: paymentData.txn_status || 'success',
      txn_id: paymentData.txn_id || null,
      gateway: paymentData.gateway || 'razorpay',
      payment_status: paymentData.payment_status || 'pending',
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([finalPaymentData])
      .select()
      .single()

    if (error) {
      console.error('Error creating payment record:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception creating payment record:', err)
    return { data: null, error: err }
  }
}

/**
 * Get payment record by booking ID
 * @param bookingId - Booking ID
 * @returns Payment record or null
 */
export async function getPaymentByBookingId(bookingId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not an error
        return { data: null, error: null }
      }
      console.error('Error fetching payment:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception fetching payment:', err)
    return { data: null, error: err }
  }
}

/**
 * Update payment status
 * @param bookingId - Booking ID
 * @param paymentStatus - New payment status
 * @returns Updated payment record or error
 */
export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: 'pending' | 'partial' | 'paid'
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({ payment_status: paymentStatus })
      .eq('booking_id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment status:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception updating payment status:', err)
    return { data: null, error: err }
  }
}

/**
 * Mark cash payment as collected
 * @param bookingId - Booking ID
 * @param amountCashPaid - Cash amount collected
 * @param collectedBy - Admin/staff who collected the cash
 * @returns Updated payment record or error
 */
export async function markCashPaymentCollected(
  bookingId: string,
  amountCashPaid: number,
  collectedBy: string
) {
  try {
    const now = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({
        amount_cash_paid: amountCashPaid,
        cash_paid_at: now,
        cash_collected_by: collectedBy,
        payment_status: 'paid',
      })
      .eq('booking_id', bookingId)
      .select()
      .single()

    if (error) {
      console.error('Error updating cash payment:', error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Exception updating cash payment:', err)
    return { data: null, error: err }
  }
}
