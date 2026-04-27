import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

// Create Razorpay order
export async function createRazorpayOrder(amount: number, bookingId: string) {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        booking_id: bookingId,
      },
    })
    return order
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error)
    throw error
  }
}

// Verify Razorpay payment
export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require('crypto')
  const key_secret = process.env.RAZORPAY_KEY_SECRET || ''

  const body = orderId + '|' + paymentId
  const expectedSignature = crypto.createHmac('sha256', key_secret).update(body).digest('hex')

  return expectedSignature === signature
}

// Get payment details
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error('Razorpay Payment Fetch Error:', error)
    throw error
  }
}

// Refund payment
export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    })
    return refund
  } catch (error) {
    console.error('Razorpay Refund Error:', error)
    throw error
  }
}
