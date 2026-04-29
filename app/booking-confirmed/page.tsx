'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { generateInvoicePDF, downloadInvoicePDF, type InvoiceData } from '@/lib/invoice'
import { CheckCircle, Download, Home } from 'lucide-react'

function BookingConfirmedContent() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId')
  const [booking, setBooking] = useState<any>(null)
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const taxiData = sessionStorage.getItem('bookingData')
    const tourData = sessionStorage.getItem('tourBookingData')
    const data = taxiData ? JSON.parse(taxiData) : tourData ? JSON.parse(tourData) : null

    if (data) {
      setBooking(data)
      // Fetch payment using the client-generated bookingId (not dbBookingId)
      fetchPaymentData(data.bookingId)
    }
  }, [])

  const fetchPaymentData = async (bookingUuid: string) => {
    try {
      const response = await fetch(`/api/payment/get-payment?bookingId=${bookingUuid}`)
      if (response.ok) {
        const paymentData = await response.json()
        setPayment(paymentData)
      }
    } catch (error) {
      console.error('Error fetching payment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAndDownloadInvoice = () => {
    if (!booking || !payment) return

    const invoiceData: InvoiceData = {
      bookingId: booking.bookingId,
      date: new Date().toLocaleDateString('en-IN'),
      userName: booking.name,
      userEmail: booking.email,
      userPhone: booking.phone,
      bookingType: booking.bookingType === 'tour' ? 'tour' : 'taxi',
      destination: booking.destination,
      tourPackageName: booking.tourName,
      pickupLocation: 'Hollongi Airport',
      pickupDate: booking.date,
      pickupTime: booking.time,
      passengers: booking.passengers,
      carType: booking.carType,
      totalAmount: parseFloat(payment.amount_total),
      advanceAmount: parseFloat(payment.amount_online_paid),
      remainingAmount: payment.payment_type === 'full' ? 0 : parseFloat(payment.amount_total) - parseFloat(payment.amount_online_paid),
      paymentStatus: payment.payment_status === 'paid' ? 'completed' : payment.payment_status,
      paymentMethod: payment.payment_type === 'full' ? 'Full Online Payment' : 'Partial Online + Cash',
      invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    }

    const doc = generateInvoicePDF(invoiceData)
    downloadInvoicePDF(doc, `Invoice-${booking.bookingId}.pdf`)
  }

  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-lg text-gray-600">Loading booking confirmation...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gradient-to-b from-green-50 to-gray-50">
        <div className="container mx-auto px-4">
          {/* Success Icon and Message */}
          <div className="max-w-2xl mx-auto text-center mb-6 md:mb-12">
            <div className="flex justify-center mb-4 md:mb-6">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-green-600 mb-3 md:mb-4">Booking Confirmed!</h1>
            <p className="text-base md:text-xl text-gray-600 mb-2">Your {booking.bookingType === 'tour' ? 'tour package' : 'taxi'} booking has been successfully confirmed.</p>
            <p className="text-gray-600">A confirmation email has been sent to {booking.email}</p>
          </div>

          {/* Booking Details Card */}
          <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-12">
            {/* Details */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
              <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Booking Details</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Booking ID</p>
                  <p className="font-mono text-lg font-semibold">{booking.bookingId}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Name</p>
                  <p className="font-semibold">{booking.name}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Phone Number</p>
                  <p className="font-semibold">{booking.phone}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="font-semibold break-all">{booking.email}</p>
                </div>

                {booking.destination && (
                  <div>
                    <p className="text-gray-600 text-sm">Destination</p>
                    <p className="font-semibold">{booking.destination}</p>
                  </div>
                )}

                {booking.tourName && (
                  <div>
                    <p className="text-gray-600 text-sm">Tour Package</p>
                    <p className="font-semibold">{booking.tourName}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-600 text-sm">Passengers</p>
                  <p className="font-semibold">{booking.passengers}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Booking Date</p>
                  <p className="font-semibold">{booking.date}</p>
                </div>

                {booking.time && (
                  <div>
                    <p className="text-gray-600 text-sm">Pickup Time</p>
                    <p className="font-semibold">{booking.time}</p>
                  </div>
                )}

                <div>
                  <p className="text-gray-600 text-sm">Vehicle Type</p>
                  <p className="font-semibold capitalize">{booking.carType}</p>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
              <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Payment Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between pb-4 border-b">
                  <span className="text-gray-600">Total Booking Amount:</span>
                  <span className="font-semibold text-lg">₹{(payment?.amount_total || booking.totalPrice).toFixed(2)}</span>
                </div>

                {payment?.payment_type === 'full' ? (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-6">
                    <p className="text-sm text-green-900">
                      <strong>✅ Payment Status:</strong> Full payment completed online successfully.
                      <br />
                      No additional payment required.
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      <strong>Payment Status:</strong> 30% advance payment completed online.
                      <br />
                      Remaining 70% to be paid in cash at the airport office.
                    </p>
                  </div>
                )}

                <button
                  onClick={generateAndDownloadInvoice}
                  className="w-full mt-6 px-6 py-3 bg-secondary-500 text-primary-950 font-semibold rounded-lg hover:bg-secondary-600 transition-smooth flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-4 md:p-8 mb-6 md:mb-12">
            <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-primary-950 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Confirmation Details Sent</p>
                  <p className="text-gray-600 text-sm">Check your email for booking details and invoice</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-primary-950 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Driver Assignment</p>
                  <p className="text-gray-600 text-sm">Within 2 hours, you'll receive driver and vehicle details</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-primary-950 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Arrive Early</p>
                  <p className="text-gray-600 text-sm">Please arrive 15 minutes before your scheduled pickup time</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-secondary-500 text-primary-950 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <p className="font-semibold">Complete Payment</p>
                  <p className="text-gray-600 text-sm">Pay remaining amount in cash at the airport office</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link
              href="/bookings"
              className="flex-1 px-6 py-4 bg-primary-950 text-white rounded-lg font-semibold hover:bg-primary-900 transition-smooth text-center"
            >
              View My Bookings
            </Link>
            <Link
              href="/"
              className="flex-1 px-6 py-4 border-2 border-secondary-500 text-secondary-500 rounded-lg font-semibold hover:bg-secondary-50 transition-smooth text-center flex items-center justify-center gap-2"
            >
              <Home size={20} />
              Back to Home
            </Link>
          </div>

          {/* Support Info */}
          <div className="max-w-2xl mx-auto mt-12 bg-yellow-50 border-l-4 border-secondary-500 p-6 rounded">
            <h3 className="font-bold mb-2">Need Help?</h3>
            <p className="text-sm text-gray-700">
              If you have any questions or need to modify your booking, contact our support team at:
              <br />
              <strong>📧 support@taxihollongi.com</strong> | <strong>📞 +91 98765 43210</strong>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function BookingConfirmed() {
  return <Suspense><BookingConfirmedContent /></Suspense>
}
