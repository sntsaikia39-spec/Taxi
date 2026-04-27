import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
  paymentStatus: string
}

export async function sendBookingConfirmation(data: BookingConfirmationEmail) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEMO] Resend API key not configured. Email not sent:', {
        to: data.to,
        bookingId: data.bookingId,
      })
      return { success: true, message: 'Email disabled - Resend not configured' }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #1a1512; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1512; color: #ffda00; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .header p { margin: 5px 0 0 0; font-size: 14px; }
            .content { background-color: #f5f5f5; padding: 30px 20px; }
            .section { margin: 20px 0; background: white; padding: 15px; border-radius: 5px; }
            .section-title { color: #1a1512; font-weight: bold; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #ffda00; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 5px 0; }
            .label { font-weight: bold; color: #1a1512; }
            .value { color: #666; text-align: right; }
            .footer { background-color: #1a1512; color: #ffda00; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            .footer p { margin: 5px 0; }
            .cta-button { display: inline-block; padding: 12px 30px; background-color: #ffda00; color: #1a1512; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
            .payment-status { padding: 10px; border-radius: 5px; margin: 10px 0; }
            .status-pending { background-color: #fef08a; color: #7c2d12; }
            .status-complete { background-color: #dcfce7; color: #15803d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚖 Booking Confirmed!</h1>
              <p>Your TaxiHollongi booking is confirmed</p>
            </div>
            
            <div class="content">
              <p>Hi ${data.userName},</p>
              <p>Thank you for booking with TaxiHollongi. Your booking has been confirmed and we're excited to serve you!</p>
              
              <div class="section">
                <div class="section-title">Booking Details</div>
                <div class="info-row">
                  <span class="label">Booking ID:</span>
                  <span class="value"><strong>${data.bookingId}</strong></span>
                </div>
                <div class="info-row">
                  <span class="label">Booking Type:</span>
                  <span class="value">${data.bookingType === 'taxi' ? 'Taxi Booking' : 'Tour Package'}</span>
                </div>
                ${
                  data.destination
                    ? `
                <div class="info-row">
                  <span class="label">Destination:</span>
                  <span class="value">${data.destination}</span>
                </div>
                `
                    : ''
                }
                ${
                  data.tourPackageName
                    ? `
                <div class="info-row">
                  <span class="label">Tour Package:</span>
                  <span class="value">${data.tourPackageName}</span>
                </div>
                `
                    : ''
                }
                <div class="info-row">
                  <span class="label">Pickup Date:</span>
                  <span class="value">${new Date(data.pickupDate).toLocaleDateString()}</span>
                </div>
                ${data.pickupTime ? `<div class="info-row"><span class="label">Pickup Time:</span><span class="value">${data.pickupTime}</span></div>` : ''}
                <div class="info-row">
                  <span class="label">Vehicle Type:</span>
                  <span class="value">${data.carType.charAt(0).toUpperCase() + data.carType.slice(1)}</span>
                </div>
              </div>

              <div class="section">
                <div class="section-title">Payment Information</div>
                <div class="info-row">
                  <span class="label">Total Amount:</span>
                  <span class="value"><strong>₹${data.totalAmount.toLocaleString('en-IN')}</strong></span>
                </div>
                <div class="payment-status ${data.paymentStatus === 'completed' ? 'status-complete' : 'status-pending'}">
                  <strong>Status: ${data.paymentStatus === 'completed' ? '✓ Payment Received' : '⏳ Payment Pending'}</strong>
                </div>
                <p style="margin-top: 10px; color: #666; font-size: 14px;">
                  ${data.paymentStatus === 'completed' ? 'Your payment has been successfully processed.' : 'Please complete your payment to confirm the booking.'}
                </p>
              </div>

              <div class="section">
                <div class="section-title">What's Next?</div>
                <ol style="color: #666; margin: 10px 0;">
                  <li>Our team will review your booking and confirm the vehicle assignment</li>
                  <li>You'll receive driver details via email/SMS 24 hours before pickup</li>
                  <li>Arrive at the pickup location 10 minutes early</li>
                  <li>Enjoy your journey with TaxiHollongi!</li>
                </ol>
              </div>

              <center>
                <a href="https://taxihollongi.com/bookings" class="cta-button">View My Booking</a>
              </center>
            </div>

            <div class="footer">
              <p><strong>TaxiHollongi</strong></p>
              <p>📍 Hollongi Airport, Itanagar, Arunachal Pradesh</p>
              <p>📞 +91 (0) 98765-43210 | 📧 support@taxihollongi.com</p>
              <p style="margin-top: 10px; border-top: 1px solid #ffda00; padding-top: 10px;">
                © 2026 TaxiHollongi. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'TaxiHollongi <onboarding@resend.dev>',
      to: data.to,
      subject: `Booking Confirmed - ${data.bookingId} | TaxiHollongi`,
      html: htmlContent,
    })

    console.log('✅ Email sent successfully:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    return { success: false, error }
  }
}

export async function sendAdminNotification(data: {
  bookingId: string
  userEmail: string
  userName: string
  totalAmount: number
  bookingType: string
  destination?: string
}) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEMO] Admin notification - Resend not configured')
      return { success: true }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #1a1512; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1512; color: #ffda00; padding: 15px; text-align: center; border-radius: 5px; }
            .content { background-color: #f5f5f5; padding: 20px; margin-top: 10px; border-radius: 5px; }
            .info { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Booking Alert</h2>
            </div>
            <div class="content">
              <p><strong>A new booking has been received:</strong></p>
              <div class="info">
                <strong>Booking ID:</strong> ${data.bookingId}<br>
                <strong>Customer:</strong> ${data.userName} (${data.userEmail})<br>
                <strong>Type:</strong> ${data.bookingType}<br>
                ${data.destination ? `<strong>Destination:</strong> ${data.destination}<br>` : ''}
                <strong>Amount:</strong> ₹${data.totalAmount.toLocaleString('en-IN')}
              </p>
              <p>Please log in to the admin panel to view full details and take action.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'TaxiHollongi Admin <onboarding@resend.dev>',
      to: process.env.ADMIN_EMAIL || 'admin@taxihollongi.com',
      subject: `New Booking: ${data.bookingId}`,
      html: htmlContent,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending admin notification:', error)
    return { success: false, error }
  }
}

export async function sendDriverNotification(data: {
  driverEmail: string
  driverPhone: string
  bookingId: string
  pickupLocation: string
  pickupTime: string
  passenger: string
  phoneNumber: string
}) {
  try {
    // SMS/WhatsApp notifications are demo mode
    console.log('📱 [DEMO] SMS/WhatsApp notification would be sent to:', data.driverPhone)
    console.log('Message: New booking assigned -', data.bookingId)

    if (!process.env.RESEND_API_KEY) {
      return { success: true, message: 'Demo mode - email not sent' }
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>New Booking Assignment</h2>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Pickup Location:</strong> ${data.pickupLocation}</p>
            <p><strong>Pickup Time:</strong> ${data.pickupTime}</p>
            <p><strong>Passenger:</strong> ${data.passenger}</p>
            <p><strong>Contact:</strong> ${data.phoneNumber}</p>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: 'TaxiHollongi <onboarding@resend.dev>',
      to: data.driverEmail,
      subject: `New Booking: ${data.bookingId}`,
      html: htmlContent,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending driver notification:', error)
    return { success: false, error }
  }
}
