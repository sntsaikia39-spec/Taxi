import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAdminFromRequest, requireAdminRequest } from '@/lib/admin-auth'
import { sendCashPaymentInvoice } from '@/lib/resend-notifications'
import { createPaymentRecord } from '@/lib/payment-db'
import { logSystemEvent } from '@/lib/system-events'

export async function POST(request: Request) {
  const unauthorized = requireAdminRequest(request)
  if (unauthorized) return unauthorized
  const admin = getAdminFromRequest(request)

  try {
    const body = await request.json()
    const {
      payment_id,
      booking_id,
      amount_cash_paid,
      cash_collected_by,
      user_email,
      user_name,
      amount_total,
    } = body

    console.log('=== Confirming Cash Payment ===')
    console.log('Payment ID:', payment_id)
    console.log('Booking ID:', booking_id)
    console.log('Cash Amount:', amount_cash_paid)
    console.log('Collected By:', cash_collected_by)

    // Validate required fields
    if (!payment_id || !amount_cash_paid || !cash_collected_by) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    const cashAmount = parseFloat(String(amount_cash_paid))
    if (isNaN(cashAmount) || cashAmount <= 0) {
      return Response.json(
        { success: false, error: 'Invalid cash amount' },
        { status: 400 }
      )
    }

    // Fetch current payment details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError)
      return Response.json(
        { success: false, error: 'Payment record not found' },
        { status: 404 }
      )
    }

    console.log('Current payment record:', payment)

    // Calculate total collected amount
    const totalCollected = parseFloat(payment.amount_online_paid || 0) + cashAmount
    const totalAmount = parseFloat(payment.amount_total || amount_total)

    // Determine new payment status
    let newPaymentStatus = payment.payment_status
    if (totalCollected >= totalAmount) {
      newPaymentStatus = 'paid'
    } else {
      newPaymentStatus = 'partial'
    }

    console.log('Total Collected:', totalCollected)
    console.log('Total Amount:', totalAmount)
    console.log('New Payment Status:', newPaymentStatus)

    // Update payment record
    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from('payments')
      .update({
        amount_cash_paid: cashAmount,
        cash_paid_at: new Date().toISOString(),
        cash_collected_by: cash_collected_by,
        payment_status: newPaymentStatus,
      })
      .eq('id', payment_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating payment:', updateError)
      return Response.json(
        { success: false, error: 'Failed to update payment record' },
        { status: 500 }
      )
    }

    console.log('✅ Payment updated successfully:', updatedPayment)

    // Create payment_records row for this cash transaction
    const now = new Date().toISOString()
    await createPaymentRecord({
      payment_id: payment.id,
      booking_id: booking_id,
      txn_type: 'cash',
      amount: cashAmount,
      status: 'success',
      collected_by: cash_collected_by,
      collected_at: now,
    }).catch(err => console.error('[CONFIRM-CASH] payment_record insert failed:', err))

    // Send invoice email to customer (awaited — Vercel kills fire-and-forget after response)
    if (user_email) {
      await sendCashPaymentInvoice({
        to: user_email,
        userName: user_name || 'Customer',
        bookingId: booking_id,
        totalAmount,
        amountOnlinePaid: parseFloat(payment.amount_online_paid || 0),
        amountCashPaid: cashAmount,
        cashCollectedBy: cash_collected_by,
        paidAt: new Date().toISOString(),
      }).catch((err) => console.error('Invoice email error:', err))
    }

    await logSystemEvent({
      severity: 'info',
      event_type: 'cash_payment_confirmed',
      actor_type: 'admin',
      actor_id: admin?.id || null,
      actor_label: admin?.email || null,
      entity_type: 'booking',
      entity_id: booking_id,
      message: 'Cash payment confirmed',
      metadata: {
        payment_id,
        amount_cash_paid: cashAmount,
        payment_status: newPaymentStatus,
      },
    })

    return Response.json(
      {
        success: true,
        message: 'Cash payment confirmed successfully',
        payment: updatedPayment,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in confirm-cash route:', error)
    await logSystemEvent({
      severity: 'error',
      event_type: 'cash_payment_confirm_failed',
      actor_type: 'admin',
      actor_id: admin?.id || null,
      actor_label: admin?.email || null,
      message: 'Cash payment confirmation failed',
      metadata: { error: error instanceof Error ? error.message : String(error) },
    })
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
