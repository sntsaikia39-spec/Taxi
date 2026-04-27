import { createRazorpayOrder } from '@/lib/payment'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, bookingId, currency } = body

    if (!amount || !bookingId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const order = await createRazorpayOrder(amount, bookingId)

    return Response.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Order creation error:', error)
    return Response.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
