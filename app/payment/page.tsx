'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import toast from 'react-hot-toast'
import { generateInvoiceNumber } from '@/lib/utils'
import { calculatePaymentAmounts } from '@/lib/payment-utils'

declare global {
  interface Window {
    Razorpay: any
  }
}

function PaymentContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const amount = parseFloat(searchParams.get('amount') || '0')
  const bookingType = searchParams.get('type') || 'taxi'

  const [bookingData, setBookingData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [paymentData, setPaymentData] = useState<any>(null)

  useEffect(() => {
    // Load booking data from session
    const taxiData = sessionStorage.getItem('bookingData')
    const tourData = sessionStorage.getItem('tourBookingData')
    const data = taxiData ? JSON.parse(taxiData) : tourData ? JSON.parse(tourData) : null

    if (data) {
      setBookingData(data)
    }

    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const handleRazorpayPayment = async (method: 'partial' | 'full') => {
    if (!bookingData) {
      toast.error('Booking data not found')
      return
    }

    setLoading(true)

    try {
      const paymentAmount = method === 'full' ? bookingData.totalPrice : bookingData.advancePayment

      // Create order on backend
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentAmount,
          bookingId: bookingData.dbBookingId,
          currency: 'INR',
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.orderId) {
        throw new Error('Failed to create payment order')
      }

      // Razorpay payment options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(paymentAmount * 100),
        currency: 'INR',
        name: 'TaxiHollongi',
        description: `${bookingType === 'tour' ? 'Tour Package' : 'Taxi'} Booking`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: orderData.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId: bookingData.dbBookingId,
                bookingType,
                paymentMethod: method,
                amount: paymentAmount,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              toast.success('Payment successful! Your booking is confirmed.')
              // Redirect to booking confirmation
              setTimeout(() => {
                window.location.href = `/booking-confirmed?bookingId=${bookingData.dbBookingId}`
              }, 2000)
            } else {
              toast.error('Payment verification failed')
            }
          } catch (error) {
            console.error('Verification error:', error)
            toast.error('Error verifying payment')
          }
        },
        prefill: {
          name: bookingData.name,
          email: bookingData.email,
          contact: bookingData.phone,
        },
        theme: {
          color: '#ffda00',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoPayment = async (method: 'partial' | 'full') => {
    if (!bookingData) {
      toast.error('Booking data not found')
      return
    }

    setLoading(true)
    try {
      console.log('=== Demo Payment Flow Started ===')
      console.log('Payment Method:', method)
      console.log('Booking ID:', bookingData.bookingId)
      console.log('Total Amount:', bookingData.totalPrice)

      // Calculate payment amounts based on payment type
      const { amountOnlinePaid, amountCashPaid } = calculatePaymentAmounts(
        bookingData.totalPrice,
        method
      )

      console.log('Calculated amounts:', { amountOnlinePaid, amountCashPaid })

      // Simulate payment processing delay (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Create demo transaction ID
      const demoTxnId = `DEMO_TXN_${Date.now()}`
      console.log('Generated Demo Txn ID:', demoTxnId)

      // Call create-payment API to store in database
      console.log('Calling /api/payment/create-payment...')
      const createPaymentResponse = await fetch('/api/payment/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: bookingData.dbBookingId,
          paymentType: method,
          amountTotal: bookingData.totalPrice,
          amountOnlinePaid: amountOnlinePaid,
          txnId: demoTxnId,
          txnStatus: 'success',
          gateway: 'razorpay',
        }),
      })

      const paymentResult = await createPaymentResponse.json()

      if (!createPaymentResponse.ok || !paymentResult.success) {
        console.error('Payment API Error:', paymentResult)
        toast.error(paymentResult.error || 'Failed to process payment. Please try again.')
        return
      }

      console.log('✅ Payment created successfully:', paymentResult.payment)

      // Show success message with payment details
      const message = method === 'full'
        ? `Full payment of ₹${amountOnlinePaid.toFixed(2)} completed successfully!`
        : `Advance payment of ₹${amountOnlinePaid.toFixed(2)} received. Remaining ₹${amountCashPaid.toFixed(2)} to be paid at airport.`

      toast.success(message)

      // Redirect to booking confirmation after 2 seconds
      setTimeout(() => {
        window.location.href = `/booking-confirmed?bookingId=${bookingData.dbBookingId}`
      }, 2000)
    } catch (error) {
      console.error('=== Demo Payment Error ===', error)
      const errorMessage = error instanceof Error ? error.message : 'Demo payment failed'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!bookingData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg text-gray-600">Loading payment details...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const advanceAmount = bookingData.advancePayment
  const remainingAmount = bookingData.totalPrice - advanceAmount

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12">Complete Your Payment</h1>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Payment</h2>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold mb-4">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Booking Amount:</span>
                    <span>₹{bookingData.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>You pay now:</span>
                    <span className="text-secondary-500">₹{bookingData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
                <h3 className="font-bold mb-2">Booking Summary</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Booking ID:</strong> {bookingData.bookingId}</p>
                  <p><strong>Name:</strong> {bookingData.name}</p>
                  <p><strong>Phone:</strong> {bookingData.phone}</p>
                  {bookingData.destination && (
                    <p><strong>Destination:</strong> {bookingData.destination}</p>
                  )}
                  {bookingData.tourName && (
                    <p><strong>Tour:</strong> {bookingData.tourName}</p>
                  )}
                  {bookingData.noOfHours && (
                    <p><strong>Duration:</strong> {(() => {
                      const h = bookingData.noOfHours
                      const d = Math.floor(h / 24)
                      const rem = h % 24
                      if (d > 0 && rem > 0) return `${d}d ${rem}h (${h} hrs)`
                      if (d > 0) return `${d}d (${h} hrs)`
                      return `${h}h`
                    })()}</p>
                  )}
                  <p><strong>Car:</strong> {bookingData.car}</p>
                  <p><strong>Passengers:</strong> {bookingData.passengers}</p>
                  <p><strong>Booking Date:</strong> {bookingData.date}</p>
                  <p><strong>Pickup Time:</strong> {bookingData.startTime}</p>
                </div>
              </div>

              {/* Primary: Full Payment */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleRazorpayPayment('full')}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>💳</span>
                  <span>{loading ? 'Processing...' : `Pay ₹${bookingData.totalPrice.toFixed(2)} — Full Payment`}</span>
                </button>

                <button
                  onClick={() => handleDemoPayment('full')}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-primary-950 rounded-lg font-semibold hover:shadow-lg transition-smooth disabled:opacity-50"
                >
                  {loading ? 'Processing...' : `Demo Full Payment — ₹${bookingData.totalPrice.toFixed(2)} (Testing)`}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-400 text-sm font-medium">or</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Secondary: Prebook with 30% */}
              <div className="rounded-lg border border-gray-200 p-5 mb-8">
                <p className="text-sm text-gray-600 mb-4">
                  Want to just prebook? Pay <strong>₹{advanceAmount.toFixed(2)}</strong> (30% advance) online now and the remaining{' '}
                  <strong>₹{remainingAmount.toFixed(2)}</strong> in cash at pickup.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleRazorpayPayment('partial')}
                    disabled={loading}
                    className="w-full px-5 py-3 border-2 border-blue-400 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-smooth disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    <span>💳</span>
                    <span>{loading ? 'Processing...' : `Pay ₹${advanceAmount.toFixed(2)} to Prebook (30% advance)`}</span>
                  </button>
                  <button
                    onClick={() => handleDemoPayment('partial')}
                    disabled={loading}
                    className="w-full px-5 py-3 border border-gray-200 text-gray-500 rounded-lg font-medium hover:bg-gray-50 transition-smooth disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Processing...' : `Demo Prebook — ₹${advanceAmount.toFixed(2)} (Testing)`}
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4 text-sm">
                <p className="text-green-900">
                  🔒 <strong>Secure Payment:</strong> All payments are encrypted and secure. Your data is protected.
                </p>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>

                {bookingData.destination && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">Destination</p>
                    <p className="font-semibold">{bookingData.destination}</p>
                  </div>
                )}

                {bookingData.tourName && (
                  <div className="mb-4">
                    <p className="text-gray-600 text-sm">Tour Package</p>
                    <p className="font-semibold">{bookingData.tourName}</p>
                  </div>
                )}

                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Passengers</p>
                  <p className="font-semibold">{bookingData.passengers}</p>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 text-sm">Date</p>
                  <p className="font-semibold">{bookingData.date}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{bookingData.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span>₹0</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-secondary-500">₹{bookingData.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-800">
                    Or prebook for just <strong>₹{advanceAmount.toFixed(2)}</strong> — pay rest in cash at pickup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function Payment() {
  return <Suspense><PaymentContent /></Suspense>
}
