import nodemailer from 'nodemailer'

// Configure email transporter based on provider
let transporter: any

const initializeTransporter = () => {
  // Check if using Resend API
  if (process.env.RESEND_API_KEY) {
    // For demo purposes, we'll use a console log. In production, use actual Resend SDK
    return {
      send: async (mailOptions: any) => {
        console.log('📧 [DEMO] Email would be sent via Resend:', mailOptions)
        return { success: true }
      },
    }
  }

  // Fallback to SMTP if configured
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  // Demo transporter that logs to console
  return {
    send: async (mailOptions: any) => {
      console.log('📧 [DEMO] Email would be sent:', mailOptions)
      return { success: true }
    },
  }
}

transporter = initializeTransporter()

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
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #1a1512; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1512; color: #ffda00; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f5f5f5; padding: 20px; }
            .section { margin: 20px 0; }
            .section-title { color: #1a1512; font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 2px solid #ffda00; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: bold; color: #1a1512; }
            .value { color: #666; }
            .footer { background-color: #1a1512; color: #ffda00; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
            .btn { display: inline-block; padding: 10px 20px; background-color: #ffda00; color: #1a1512; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
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
                  <span class="value">${data.bookingId}</span>
                </div>
                <div class="info-row">
                  <span class="label">Booking Type:</span>
                  <span class="value">${data.bookingType === 'taxi' ? 'Taxi Booking' : 'Tour Package'}</span>
                </div>
                ${data.destination ? `<div class="info-row"><span class="label">Destination:</span><span class="value">${data.destination}</span></div>` : ''}
                ${data.tourPackageName ? `<div class="info-row"><span class="label">Tour Package:</span><span class="value">${data.tourPackageName}</span></div>` : ''}
                <div class="info-row">
                  <span class="label">Pickup Date:</span>
                  <span class="value">${data.pickupDate}</span>
                </div>
                ${data.pickupTime ? `<div class="info-row"><span class="label">Pickup Time:</span><span class="value">${data.pickupTime}</span></div>` : ''}
                <div class="info-row">
                  <span class="label">Car Type:</span>
                  <span class="value">${data.carType}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Payment Information</div>
                <div class="info-row">
                  <span class="label">Total Amount:</span>
                  <span class="value">₹${data.totalAmount.toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Advance Payment (30%):</span>
                  <span class="value">₹${(data.totalAmount * 0.3).toFixed(2)}</span>
                </div>
                <div class="info-row">
                  <span class="label">Remaining (70%):</span>
                  <span class="value">₹${(data.totalAmount * 0.7).toFixed(2)} (Cash at Airport)</span>
                </div>
                <div class="info-row">
                  <span class="label">Payment Status:</span>
                  <span class="value" style="color: ${data.paymentStatus === 'completed' ? 'green' : 'orange'}">${data.paymentStatus.toUpperCase()}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Important Notes</div>
                <ul style="color: #666;">
                  <li>Please arrive 15 minutes before your scheduled pickup time</li>
                  <li>Keep your booking ID handy for reference</li>
                  <li>You can cancel up to 24 hours before your booking</li>
                  <li>Check your email for invoice and receipt</li>
                </ul>
              </div>
              
              <p>If you have any questions, please contact us at support@taxihollongi.com</p>
            </div>
            
            <div class="footer">
              <p>© 2024 TaxiHollongi. All rights reserved.</p>
              <p>www.taxihollongi.com</p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@taxihollongi.com',
      to: data.to,
      subject: `Booking Confirmed - ${data.bookingId}`,
      html: htmlContent,
    }

    const result = await transporter.send(mailOptions)
    console.log('✅ Booking confirmation email sent to:', data.to)
    return { success: true, result }
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error)
    return { success: false, error }
  }
}

export interface AdminNotificationEmail {
  to: string
  bookingId: string
  userName: string
  userPhone: string
  bookingType: string
  details: string
  totalAmount: number
}

export async function sendAdminNotification(data: AdminNotificationEmail) {
  try {
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #1a1512; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a1512; color: #ffda00; padding: 20px; text-align: center; }
            .content { background-color: #f5f5f5; padding: 20px; }
            .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚖 New Booking Received</h1>
            </div>
            
            <div class="content">
              <div class="alert">
                <strong>New Booking Alert</strong>
                <p>Booking ID: ${data.bookingId}</p>
              </div>
              
              <p><strong>Customer Details:</strong></p>
              <ul>
                <li>Name: ${data.userName}</li>
                <li>Phone: ${data.userPhone}</li>
                <li>Booking Type: ${data.bookingType}</li>
                <li>Amount: ₹${data.totalAmount.toFixed(2)}</li>
              </ul>
              
              <p><strong>Booking Details:</strong></p>
              <p>${data.details}</p>
              
              <p>Please review and assign a vehicle at: [Admin Panel URL]</p>
            </div>
          </div>
        </body>
      </html>
    `

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@taxihollongi.com',
      to: data.to,
      subject: `[ALERT] New Booking - ${data.bookingId}`,
      html: htmlContent,
    }

    const result = await transporter.send(mailOptions)
    console.log('✅ Admin notification sent')
    return { success: true, result }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error)
    return { success: false, error }
  }
}

export interface DriverNotificationData {
  driverId: string
  driverName: string
  driverPhone: string
  bookingId: string
  customerName: string
  customerPhone: string
  pickupLocation: string
  pickupDate: string
  pickupTime: string
  destination?: string
  passengers: number
  carType: string
  specialInstructions?: string
}

export async function sendDriverNotification(data: DriverNotificationData) {
  try {
    // In a real app, you'd send SMS or WhatsApp
    // For demo, we'll just log
    console.log('📱 [DEMO] Driver notification would be sent via SMS/WhatsApp:')
    console.log(`
      Driver: ${data.driverName}
      Booking: ${data.bookingId}
      Customer: ${data.customerName} (${data.customerPhone})
      Pickup: ${data.pickupLocation} on ${data.pickupDate} at ${data.pickupTime}
      Destination: ${data.destination || 'Tour Package'}
      Passengers: ${data.passengers}
      Car: ${data.carType}
      Notes: ${data.specialInstructions || 'None'}
    `)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending driver notification:', error)
    return { success: false, error }
  }
}
