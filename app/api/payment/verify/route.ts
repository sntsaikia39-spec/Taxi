import { verifyRazorpayPayment } from '@/lib/payment'
import { sendBookingConfirmation, sendAdminNotification } from '@/lib/resend-notifications'
import { generateInvoiceNumber } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculatePaymentAmounts } from '@/lib/payment-utils'
import { getPaymentByBookingId, createPaymentInDB } from '@/lib/payment-db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, paymentId, signature, bookingId, bookingType, paymentMethod, amount } = body

    // ── STEP 1: Log full incoming payload (no signature) ──────────────────────
    console.log('[VERIFY] ══════════════════════════════════')
    console.log('[VERIFY] STEP 1 — Incoming payload:')
    console.log('[VERIFY]   bookingId:', bookingId)
    console.log('[VERIFY]   paymentId:', paymentId)
    console.log('[VERIFY]   bookingType:', bookingType)
    console.log('[VERIFY]   paymentMethod:', paymentMethod)
    console.log('[VERIFY]   amount:', amount)
    console.log('[VERIFY]   userEmail from body:', body.userEmail)
    console.log('[VERIFY]   userName from body:', body.userName)
    console.log('[VERIFY]   destination from body:', body.destination)
    console.log('[VERIFY]   tourPackageName from body:', body.tourPackageName)
    console.log('[VERIFY]   pickupDate from body:', body.pickupDate)
    console.log('[VERIFY]   pickupTime from body:', body.pickupTime)
    console.log('[VERIFY]   carType from body:', body.carType)

    // ── STEP 2: Verify signature ───────────────────────────────────────────────
    console.log('[VERIFY] STEP 2 — Verifying Razorpay signature...')
    const isValidSignature = verifyRazorpayPayment(orderId, paymentId, signature)
    if (!isValidSignature) {
      console.error('[VERIFY] ❌ Invalid signature — aborting')
      return Response.json({ success: false, error: 'Invalid payment signature' }, { status: 400 })
    }
    console.log('[VERIFY] ✅ Signature valid')

    // ── STEP 3: Fetch booking ──────────────────────────────────────────────────
    console.log('[VERIFY] STEP 3 — Fetching booking from DB...')
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_status, amount_total, user_id, pickup_date, pickup_time, car_type, destination, booking_type')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('[VERIFY] ❌ Booking not found:', bookingError)
      return Response.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }
    console.log('[VERIFY] ✅ Booking found:')
    console.log('[VERIFY]   amount_total:', booking.amount_total)
    console.log('[VERIFY]   user_id:', booking.user_id)
    console.log('[VERIFY]   pickup_date:', booking.pickup_date)
    console.log('[VERIFY]   car_type:', booking.car_type)

    // ── STEP 4: Resolve user email ─────────────────────────────────────────────
    console.log('[VERIFY] STEP 4 — Resolving user email...')
    let userEmail: string = body.userEmail || ''
    let userName: string = body.userName || ''
    console.log('[VERIFY]   email from body:', userEmail || '(empty)')

    if (!userEmail && booking.user_id) {
      console.log('[VERIFY]   No email in body — fetching from Supabase auth...')
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(booking.user_id)
        if (authError) console.error('[VERIFY]   Auth lookup error:', authError)
        if (authData?.user) {
          userEmail = authData.user.email || ''
          userName = userName || authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'Customer'
          console.log('[VERIFY]   Resolved from auth:', userEmail)
        } else {
          console.warn('[VERIFY]   Auth lookup returned no user')
        }
      } catch (authErr) {
        console.error('[VERIFY]   Auth lookup threw:', authErr)
      }
    }

    if (!userEmail) {
      console.error('[VERIFY] ❌ CRITICAL — No user email resolved. Email will NOT be sent. bookingId:', bookingId)
    } else {
      console.log('[VERIFY] ✅ Final userEmail:', userEmail, '| userName:', userName)
    }

    // ── STEP 5: Payment record ─────────────────────────────────────────────────
    console.log('[VERIFY] STEP 5 — Creating/checking payment record...')
    const { data: existingPayment } = await getPaymentByBookingId(bookingId)
    let paymentRecord = existingPayment

    if (!paymentRecord) {
      const { amountOnlinePaid, amountCashPaid } = calculatePaymentAmounts(booking.amount_total, paymentMethod)
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
      if (paymentError) console.error('[VERIFY] Payment record error:', paymentError)
      else {
        paymentRecord = newPayment
        console.log('[VERIFY] ✅ Payment record created')
      }
    } else {
      console.log('[VERIFY] Payment record already exists')
    }

    // ── STEP 6: Update booking status ─────────────────────────────────────────
    console.log('[VERIFY] STEP 6 — Updating booking status to confirmed...')
    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({ booking_status: 'confirmed' })
      .eq('id', bookingId)
    if (updateError) console.error('[VERIFY] Status update error:', updateError)
    else console.log('[VERIFY] ✅ Status updated')

    // ── STEP 7: Send emails ────────────────────────────────────────────────────
    console.log('[VERIFY] STEP 7 — Email sending...')
    const amountPaid = paymentMethod === 'full' ? booking.amount_total : Math.round(booking.amount_total * 0.3)
    const amountDue = booking.amount_total - amountPaid
    const destination = body.destination || body.tourPackageName || booking.destination || ''
    const pickupDate = body.pickupDate || booking.pickup_date || ''
    const pickupTime = body.pickupTime || booking.pickup_time || ''
    const carType = body.carType || booking.car_type || 'Economy'
    const resolvedBookingType = bookingType || booking.booking_type || 'taxi'

    console.log('[VERIFY]   amountPaid:', amountPaid, '| amountDue:', amountDue)
    console.log('[VERIFY]   destination:', destination)
    console.log('[VERIFY]   pickupDate:', pickupDate)
    console.log('[VERIFY]   carType:', carType)
    console.log('[VERIFY]   resolvedBookingType:', resolvedBookingType)
    console.log('[VERIFY]   RESEND_API_KEY set:', !!process.env.RESEND_API_KEY)
    console.log('[VERIFY]   RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL)

    if (userEmail) {
      console.log('[VERIFY] 📧 Sending emails — awaiting both...')
      const emailResults = await Promise.allSettled([
        sendBookingConfirmation({
          to: userEmail,
          bookingId,
          userName: userName || 'Customer',
          bookingType: resolvedBookingType,
          destination: resolvedBookingType !== 'tour' ? destination : undefined,
          tourPackageName: resolvedBookingType === 'tour' ? destination : undefined,
          pickupDate,
          pickupTime,
          carType,
          totalAmount: booking.amount_total,
          amountPaid,
          amountDue,
          paymentMethod,
        }),
        sendAdminNotification({
          bookingId,
          userEmail,
          userName: userName || 'Customer',
          totalAmount: booking.amount_total,
          bookingType: resolvedBookingType,
          destination,
          pickupDate,
        }),
      ])

      emailResults.forEach((r, i) => {
        const label = i === 0 ? 'Customer confirmation' : 'Admin notification'
        if (r.status === 'rejected') {
          console.error(`[VERIFY] ❌ ${label} FAILED:`, r.reason)
        } else {
          console.log(`[VERIFY] ✅ ${label} result:`, JSON.stringify(r.value))
        }
      })
    } else {
      console.error('[VERIFY] ❌ Skipping emails — no userEmail')
    }

    console.log('[VERIFY] ══════════════════════════════════')

    return Response.json({
      success: true,
      message: 'Payment verified and recorded successfully',
      bookingId,
      payment: paymentRecord,
      invoiceNumber: generateInvoiceNumber(),
    })
  } catch (error) {
    console.error('[VERIFY] ❌ Unhandled error:', error)
    return Response.json({ success: false, error: 'Payment verification failed' }, { status: 500 })
  }
}
