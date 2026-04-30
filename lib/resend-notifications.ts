import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@rinastoursandtravels.in'
const BRAND_NAME = "Rina's Tours and Travels"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rinastoursandtravels.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rinastoursandtravels.in'

// ─── Shared helpers ──────────────────────────────────────────────────────────

function inr(amount: number) {
  return `&#8377;${amount.toLocaleString('en-IN')}`
}

function shell(title: string, preheader: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:20px;">
        <div style="width:56px;height:56px;background:#ffda00;border-radius:50%;text-align:center;line-height:56px;font-family:Georgia,serif;font-weight:bold;font-size:32px;color:#1a1a2e;display:inline-block;">R</div>
        <div style="font-size:14px;font-weight:700;color:#1a1a2e;margin-top:8px;">${BRAND_NAME}</div>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="height:5px;background:#ffda00;"></td></tr>
          <tr><td style="padding:36px 40px 40px;">
            ${body}
          </td></tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 8px 8px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">&copy; 2026 ${BRAND_NAME} &nbsp;&middot;&nbsp; All rights reserved</p>
        <p style="margin:0;font-size:11px;color:#d1d5db;">Hollongi Airport, Itanagar, Arunachal Pradesh</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:7px 0;font-size:14px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:7px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`
}

async function send(to: string | string[], subject: string, html: string) {
  console.log(`[EMAIL] Attempting: "${subject}" → ${to}`)
  console.log(`[EMAIL] From: ${BRAND_NAME} <${FROM_EMAIL}>`)
  console.log(`[EMAIL] API key set: ${!!process.env.RESEND_API_KEY}`)

  if (!process.env.RESEND_API_KEY) {
    console.error('[EMAIL] ❌ RESEND_API_KEY is not set — email not sent')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const result = await resend.emails.send({
      from: `${BRAND_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    })
    console.log(`[EMAIL] Resend raw response:`, JSON.stringify(result))
    if (result.error) {
      console.error(`[EMAIL] ❌ Resend returned error:`, result.error)
      return { success: false, error: result.error }
    }
    console.log(`[EMAIL] ✅ Sent successfully. ID: ${result.data?.id}`)
    return { success: true, data: result }
  } catch (error: any) {
    console.error(`[EMAIL] ❌ Exception thrown:`, error?.message, error)
    return { success: false, error }
  }
}

// ─── 1. Booking confirmation (after Razorpay payment) ────────────────────────

export interface BookingConfirmationEmail {
  to: string
  bookingId: string
  userName: string
  bookingType: string
  destination?: string
  tourPackageName?: string
  pickupDate: string
  pickupTime?: string
  carType: string
  totalAmount: number
  amountPaid: number
  amountDue: number
  paymentMethod: string // 'full' | 'partial' | 'cash'
}

export async function sendBookingConfirmation(data: BookingConfirmationEmail) {
  const isPaid = data.amountDue === 0
  const statusColor = isPaid ? '#16a34a' : '#d97706'
  const statusLabel = isPaid ? 'Fully Paid' : `Partially Paid — ${inr(data.amountDue)} due on arrival`
  const tripLabel = data.bookingType === 'tour'
    ? (data.tourPackageName || 'Tour Package')
    : (data.destination || 'Taxi Booking')

  const body = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e;">Booking Confirmed!</p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">Hi ${data.userName}, your booking is all set.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('Booking ID', `<span style="font-family:monospace;">${data.bookingId}</span>`)}
      ${row('Type', data.bookingType === 'tour' ? 'Tour Package' : 'Taxi Booking')}
      ${row(data.bookingType === 'tour' ? 'Package' : 'Destination', tripLabel)}
      ${row('Pickup Date', new Date(data.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }))}
      ${data.pickupTime ? row('Pickup Time', data.pickupTime) : ''}
      ${row('Vehicle', data.carType.charAt(0).toUpperCase() + data.carType.slice(1))}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('Total Fare', inr(data.totalAmount))}
      ${row('Paid Online', inr(data.amountPaid))}
      ${data.amountDue > 0 ? row('Due on Arrival', inr(data.amountDue)) : ''}
    </table>

    <p style="margin:0 0 20px;padding:12px 16px;background:${isPaid ? '#f0fdf4' : '#fffbeb'};border-left:4px solid ${statusColor};border-radius:4px;font-size:14px;color:${statusColor};font-weight:600;">${statusLabel}</p>

    <p style="margin:0 0 8px;font-size:14px;color:#374151;font-weight:600;">What happens next</p>
    <ol style="margin:0 0 28px;padding-left:20px;color:#6b7280;font-size:14px;line-height:1.8;">
      <li>We'll review your booking and assign a vehicle</li>
      <li>You'll receive driver details before your pickup</li>
      <li>Arrive 10 minutes early at the pickup point</li>
      ${data.amountDue > 0 ? '<li>Pay the remaining amount in cash to the driver</li>' : ''}
    </ol>

    <center>
      <a href="${APP_URL}/bookings" style="display:inline-block;background:#ffda00;color:#1a1a2e;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px;">View My Booking</a>
    </center>

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      Questions? Reply to this email or contact <a href="mailto:support@rinastoursandtravels.com" style="color:#6b7280;">support@rinastoursandtravels.com</a>
    </p>`

  return send(data.to, `Booking Confirmed — ${data.bookingId} | ${BRAND_NAME}`, shell(`Booking Confirmed — ${data.bookingId}`, `Your booking ${data.bookingId} is confirmed. ${isPaid ? 'Payment complete.' : `${inr(data.amountDue)} due on arrival.`}`, body))
}

// ─── 2. Cash payment invoice (after admin confirms cash collection) ───────────

export interface CashPaymentInvoiceEmail {
  to: string
  userName: string
  bookingId: string
  totalAmount: number
  amountOnlinePaid: number
  amountCashPaid: number
  cashCollectedBy: string
  paidAt: string
}

export async function sendCashPaymentInvoice(data: CashPaymentInvoiceEmail) {
  const totalCollected = data.amountOnlinePaid + data.amountCashPaid
  const isFullyPaid = totalCollected >= data.totalAmount

  const body = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e;">Payment Receipt</p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">Hi ${data.userName}, here's your payment summary for booking <strong>${data.bookingId}</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('Booking ID', `<span style="font-family:monospace;">${data.bookingId}</span>`)}
      ${row('Total Fare', inr(data.totalAmount))}
      ${data.amountOnlinePaid > 0 ? row('Online Payment', inr(data.amountOnlinePaid)) : ''}
      ${row('Cash Payment', inr(data.amountCashPaid))}
      ${row('Collected By', data.cashCollectedBy)}
      ${row('Date', new Date(data.paidAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}
    </table>

    <p style="margin:0 0 24px;padding:12px 16px;background:${isFullyPaid ? '#f0fdf4' : '#fffbeb'};border-left:4px solid ${isFullyPaid ? '#16a34a' : '#d97706'};border-radius:4px;font-size:14px;color:${isFullyPaid ? '#16a34a' : '#d97706'};font-weight:600;">
      ${isFullyPaid ? `Payment complete — ${inr(totalCollected)} received in full.` : `Partial payment received. Balance: ${inr(data.totalAmount - totalCollected)}`}
    </p>

    <center>
      <a href="${APP_URL}/bookings" style="display:inline-block;background:#ffda00;color:#1a1a2e;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px;">View My Booking</a>
    </center>

    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
      Thank you for travelling with ${BRAND_NAME}. We hope to see you again!
    </p>`

  return send(data.to, `Payment Receipt — ${data.bookingId} | ${BRAND_NAME}`, shell(`Payment Receipt — ${data.bookingId}`, `Payment confirmed for booking ${data.bookingId}.`, body))
}

// ─── 3. Vehicle assignment (when admin assigns a vehicle) ────────────────────

export interface VehicleAssignmentEmail {
  to: string
  userName: string
  bookingId: string
  pickupDate: string
  pickupTime?: string
  vehicleModel: string
  numberPlate: string
  driverName: string
  driverPhone: string
  isReassignment?: boolean
}

export async function sendVehicleAssignment(data: VehicleAssignmentEmail) {
  const title = data.isReassignment ? 'Vehicle Reassigned' : 'Driver Assigned!'
  const subtitle = data.isReassignment
    ? `Hi ${data.userName}, your vehicle for booking <strong>${data.bookingId}</strong> has been <strong>changed</strong>. Here are your updated driver and vehicle details.`
    : `Hi ${data.userName}, your vehicle has been assigned for booking <strong>${data.bookingId}</strong>.`

  const body = `
    <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1a1a2e;">${title}</p>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;">${subtitle}</p>

    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a2e;">Driver & Vehicle Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('Driver', data.driverName)}
      ${row('Contact', `<a href="tel:${data.driverPhone}" style="color:#1a1a2e;">${data.driverPhone}</a>`)}
      ${row('Vehicle', data.vehicleModel)}
      ${row('Registration', data.numberPlate)}
    </table>

    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1a2e;">Pickup Details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('Date', new Date(data.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }))}
      ${data.pickupTime ? row('Time', data.pickupTime) : ''}
    </table>

    <p style="margin:0 0 24px;padding:12px 16px;background:#eff6ff;border-left:4px solid #3b82f6;border-radius:4px;font-size:14px;color:#1e40af;">
      Please be ready 10 minutes before pickup time. Save your driver's number in case you need to contact them.
    </p>

    <center>
      <a href="${APP_URL}/bookings" style="display:inline-block;background:#ffda00;color:#1a1a2e;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px;">View My Booking</a>
    </center>`

  const subject = data.isReassignment
    ? `Vehicle Reassigned — ${data.bookingId} | ${BRAND_NAME}`
    : `Driver Assigned — ${data.bookingId} | ${BRAND_NAME}`
  const preheader = data.isReassignment
    ? `Your vehicle for booking ${data.bookingId} has been changed. New driver: ${data.driverName}.`
    : `Your driver ${data.driverName} has been assigned for booking ${data.bookingId}.`

  return send(data.to, subject, shell(subject, preheader, body))
}

// ─── 4. Admin notification (new booking received) ────────────────────────────

export async function sendAdminNotification(data: {
  bookingId: string
  userEmail: string
  userName: string
  totalAmount: number
  bookingType: string
  destination?: string
  pickupDate?: string
}) {
  const body = `
    <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#1a1a2e;">New Booking Received</p>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">A new booking has just been confirmed and needs vehicle assignment.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row('Booking ID', `<span style="font-family:monospace;">${data.bookingId}</span>`)}
      ${row('Customer', `${data.userName} &lt;${data.userEmail}&gt;`)}
      ${row('Type', data.bookingType === 'tour' ? 'Tour Package' : 'Taxi Booking')}
      ${data.destination ? row('Destination', data.destination) : ''}
      ${data.pickupDate ? row('Pickup Date', new Date(data.pickupDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })) : ''}
      ${row('Amount', inr(data.totalAmount))}
    </table>

    <center>
      <a href="${APP_URL}/admin" style="display:inline-block;background:#1a1a2e;color:#ffda00;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:8px;">Open Admin Panel</a>
    </center>`

  return send(ADMIN_EMAIL, `New Booking: ${data.bookingId} — Action Required`, shell(`New Booking: ${data.bookingId}`, `New booking from ${data.userName} for ${inr(data.totalAmount)}.`, body))
}
