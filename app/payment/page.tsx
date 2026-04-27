'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
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

export default function Payment() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const amount = parseFloat(searchParams.get('amount') || '0')
  const bookingType = searchParams.get('type') || 'taxi'

  const [bookingData, setBookingData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<'partial' | 'full'>('partial')
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

  const calculatePaymentAmount = () => {
    if (!bookingData) return 0
    if (paymentMethod === 'full') {
      return bookingData.totalPrice
    }
    return bookingData.advancePayment
  }

  const handleRazorpayPayment = async () => {
    if (!bookingData) {
      toast.error('Booking data not found')
      return
    }

    setLoading(true)

    try {
      const paymentAmount = calculatePaymentAmount()

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
                paymentMethod,
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

  const handleDemoPayment = async () => {
    if (!bookingData) {
      toast.error('Booking data not found')
      return
    }

    setLoading(true)
    try {
      console.log('=== Demo Payment Flow Started ===')
      console.log('Payment Method:', paymentMethod)
      console.log('Booking ID:', bookingData.bookingId)
      console.log('Total Amount:', bookingData.totalPrice)

      // Calculate payment amounts based on payment type
      const { amountOnlinePaid, amountCashPaid } = calculatePaymentAmounts(
        bookingData.totalPrice,
        paymentMethod
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
          paymentType: paymentMethod,
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
      const message = paymentMethod === 'full'
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

  const paymentAmount = calculatePaymentAmount()
  const remaining = bookingData.totalPrice - paymentAmount

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12">Complete Your Payment</h1>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Payment Options</h2>

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-8">
                <label className="block">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="partial"
                    checked={paymentMethod === 'partial'}
                    onChange={() => setPaymentMethod('partial')}
                    className="mr-3"
                  />
                  <span className="font-semibold cursor-pointer">
                    Partial Payment (30% Advance)
                  </span>
                  <p className="text-sm text-gray-600 mt-2 ml-6">
                    Pay ₹{bookingData.advancePayment.toFixed(2)} now and ₹{remaining.toFixed(2)} in cash at pickup
                  </p>
                </label>

                <label className="block">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="full"
                    checked={paymentMethod === 'full'}
                    onChange={() => setPaymentMethod('full')}
                    className="mr-3"
                  />
                  <span className="font-semibold cursor-pointer">Full Online Payment</span>
                  <p className="text-sm text-gray-600 mt-2 ml-6">
                    Pay ₹{bookingData.totalPrice.toFixed(2)} now. No additional payments required.
                  </p>
                </label>
              </div>

              {/* Payment Details */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold mb-4">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Booking Amount:</span>
                    <span>₹{bookingData.totalPrice.toFixed(2)}</span>
                  </div>
                  {paymentMethod === 'partial' && (
                    <div className="flex justify-between text-green-600">
                      <span>Advance Payment (30%):</span>
                      <span>₹{bookingData.advancePayment.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>You pay now:</span>
                    <span className="text-secondary-500">₹{paymentAmount.toFixed(2)}</span>
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
                    <p><strong>Duration:</strong> {bookingData.noOfHours} hour{bookingData.noOfHours > 1 ? 's' : ''}</p>
                  )}
                  <p><strong>Car:</strong> {bookingData.car}</p>
                  <p><strong>Passengers:</strong> {bookingData.passengers}</p>
                  <p><strong>Booking Date:</strong> {bookingData.date}</p>
                  <p><strong>Pickup Time:</strong> {bookingData.startTime}</p>
                </div>
              </div>

              {/* Payment Methods */}
              <h3 className="font-bold mb-4">Select Payment Method</h3>
              <div className="space-y-3 mb-8">
                <button
                  onClick={handleRazorpayPayment}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:shadow-lg transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>💳</span>
                  <span>{loading ? 'Processing...' : 'Pay with Razorpay'}</span>
                </button>

                <button
                  onClick={handleDemoPayment}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-secondary-500 to-secondary-600 text-primary-950 rounded-lg font-semibold hover:shadow-lg transition-smooth disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Demo Payment (Testing)'}
                </button>
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
                    <span>You Pay</span>
                    <span className="text-secondary-500">₹{paymentAmount.toFixed(2)}</span>
                  </div>
                </div>

                {paymentMethod === 'partial' && remaining > 0 && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded p-3">
                    <p className="text-sm text-orange-900">
                      <strong>Remaining: </strong>₹{remaining.toFixed(2)} to be paid in cash at airport
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
