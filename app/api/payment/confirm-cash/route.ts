import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
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

    // TODO: Send invoice email when email system is implemented
    // For now, just log the email details
    console.log('📧 Invoice would be sent to:', user_email)
    console.log('Customer Name:', user_name)
    console.log('Invoice Details:')
    console.log('  - Booking ID:', booking_id)
    console.log('  - Total Amount: Rs.', totalAmount)
    console.log('  - Online Payment: Rs.', payment.amount_online_paid)
    console.log('  - Cash Payment: Rs.', cashAmount)
    console.log('  - Collected By:', cash_collected_by)
    console.log('  - Date:', new Date().toLocaleString('en-IN'))

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
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
