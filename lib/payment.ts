import Razorpay from 'razorpay'
import crypto from 'crypto'

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  })
}

export async function createRazorpayOrder(amount: number, bookingId: string) {
  try {
    const order = await getRazorpay().orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: { booking_id: bookingId },
    })
    return order
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error)
    throw error
  }
}

export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET || ''
  const body = orderId + '|' + paymentId
  const expectedSignature = crypto.createHmac('sha256', key_secret).update(body).digest('hex')
  return expectedSignature === signature
}

export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await getRazorpay().payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error('Razorpay Payment Fetch Error:', error)
    throw error
  }
}

export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refund = await getRazorpay().payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
    })
    return refund
  } catch (error) {
    console.error('Razorpay Refund Error:', error)
    throw error
  }
}
