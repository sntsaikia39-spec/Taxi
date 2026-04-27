import { verifyRazorpayPayment } from '@/lib/payment'
import { sendBookingConfirmation } from '@/lib/notifications'
import { generateInvoiceNumber } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculatePaymentAmounts } from '@/lib/payment-utils'
import { getPaymentByBookingId, createPaymentInDB } from '@/lib/payment-db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paymentId, signature, bookingId, bookingType, paymentMethod, amount } = body

    console.log('=== Razorpay Payment Verification ===')
    console.log('Booking ID:', bookingId)
    console.log('Payment ID:', paymentId)
    console.log('Payment Method:', paymentMethod)
    console.log('Amount:', amount)

    // Verify payment signature
    const isValidSignature = verifyRazorpayPayment(orderId, paymentId, signature)

    if (!isValidSignature) {
      console.error('Invalid payment signature')
      return Response.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    console.log('✅ Signature verified successfully')

    // Fetch booking details to get total amount
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_status, amount_total')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return Response.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    console.log('Booking found:', booking)

    // Check if payment already exists for this booking
    const { data: existingPayment, error: existingError } = await getPaymentByBookingId(bookingId)

    let paymentRecord = existingPayment

    if (!paymentRecord) {
      console.log('Creating new payment record for Razorpay transaction...')

      // Calculate payment amounts based on payment method
      const { amountOnlinePaid, amountCashPaid } = calculatePaymentAmounts(
        booking.amount_total,
        paymentMethod
      )

      // Create payment record
      const { data: newPayment, error: paymentError } = await createPaymentInDB({
        booking_id: bookingId,
        payment_type: paymentMethod,
        amount_total: booking.amount_total,
        amount_online_paid: amountOnlinePaid,
        amount_cash_paid: amountCashPaid === booking.amount_total ? amountCashPaid : 0,
        txn_status: 'success',
        txn_id: paymentId,
        gateway: 'razorpay',
        payment_status: paymentMethod === 'full' ? 'paid' : 'partial',
      })

      if (paymentError || !newPayment) {
        console.error('Error creating payment record:', paymentError)
        // Continue anyway - payment was successful, just database logging failed
      } else {
        paymentRecord = newPayment
        console.log('Payment record created:', newPayment)
      }
    } else {
      console.log('Payment record already exists for this booking')
    }

    // Update booking status to 'confirmed'
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ booking_status: 'confirmed' })
      .eq('id', bookingId)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
    } else {
      console.log('Booking status updated to confirmed')
    }

    // Send booking confirmation email
    try {
      await sendBookingConfirmation({
        to: body.userEmail || 'user@example.com',
        bookingId,
        userName: body.userName || 'Guest',
        bookingType,
        destination: body.destination,
        tourPackageName: body.tourPackageName,
        pickupDate: body.pickupDate,
        pickupTime: body.pickupTime,
        carType: body.carType || 'Economy',
        totalAmount: booking.amount_total,
        paymentStatus: paymentMethod === 'full' ? 'completed' : 'partially_paid',
      })
    } catch (emailError) {
      console.error('Email sending error (non-critical):', emailError)
    }

    return Response.json({
      success: true,
      message: 'Payment verified and recorded successfully',
      bookingId,
      payment: paymentRecord,
      invoiceNumber: generateInvoiceNumber(),
    })
  } catch (error) {
    console.error('=== Payment verification error ===', error)
    return Response.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
