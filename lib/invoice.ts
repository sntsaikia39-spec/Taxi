import jsPDF from 'jspdf'

export interface InvoiceData {
  bookingId: string
  date: string
  userName: string
  userEmail: string
  userPhone: string
  bookingType: string // 'taxi' or 'tour'
  destination?: string
  tourPackageName?: string
  pickupLocation?: string
  pickupDate: string
  pickupTime?: string
  passengers: number
  carType: string
  totalAmount: number
  advanceAmount: number
  remainingAmount: number
  paymentStatus: string
  paymentMethod: string
  invoiceNumber: string
}

export function generateInvoicePDF(invoiceData: InvoiceData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Header - Logo and Company Info
  doc.setFillColor(26, 21, 18) // Primary dark color
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setTextColor(255, 218, 0) // Yellow
  doc.setFontSize(24)
  doc.text('🚖 TaxiHollongi', margin, yPosition + 15)

  doc.setTextColor(255, 218, 0)
  doc.setFontSize(9)
  doc.text('Airport Transportation & Tour Booking', margin, yPosition + 25)

  yPosition = 50

  // Invoice Title
  doc.setTextColor(26, 21, 18)
  doc.setFontSize(18)
  doc.text('BOOKING INVOICE', margin, yPosition)

  yPosition += 10

  // Invoice Details
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, margin, yPosition)
  yPosition += 6
  doc.text(`Date: ${invoiceData.date}`, margin, yPosition)
  yPosition += 6
  doc.text(`Booking ID: ${invoiceData.bookingId}`, margin, yPosition)

  yPosition += 12

  // Customer Information Section
  doc.setTextColor(26, 21, 18)
  doc.setFontSize(11)
  doc.text('CUSTOMER INFORMATION', margin, yPosition)
  doc.setDrawColor(255, 218, 0)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)

  yPosition += 10
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Name: ${invoiceData.userName}`, margin, yPosition)
  yPosition += 6
  doc.text(`Email: ${invoiceData.userEmail}`, margin, yPosition)
  yPosition += 6
  doc.text(`Phone: ${invoiceData.userPhone}`, margin, yPosition)
  yPosition += 6
  doc.text(`Passengers: ${invoiceData.passengers}`, margin, yPosition)

  yPosition += 12

  // Booking Details Section
  doc.setTextColor(26, 21, 18)
  doc.setFontSize(11)
  doc.text('BOOKING DETAILS', margin, yPosition)
  doc.setDrawColor(255, 218, 0)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)

  yPosition += 10
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)

  if (invoiceData.bookingType === 'taxi') {
    doc.text(`Booking Type: Taxi Booking`, margin, yPosition)
    yPosition += 6
    if (invoiceData.destination) {
      doc.text(`Destination: ${invoiceData.destination}`, margin, yPosition)
      yPosition += 6
    }
  } else {
    doc.text(`Booking Type: Tour Package`, margin, yPosition)
    yPosition += 6
    if (invoiceData.tourPackageName) {
      doc.text(`Tour Package: ${invoiceData.tourPackageName}`, margin, yPosition)
      yPosition += 6
    }
  }

  if (invoiceData.pickupLocation) {
    doc.text(`Pickup Location: ${invoiceData.pickupLocation}`, margin, yPosition)
    yPosition += 6
  }

  doc.text(`Pickup Date: ${invoiceData.pickupDate}`, margin, yPosition)
  yPosition += 6

  if (invoiceData.pickupTime) {
    doc.text(`Pickup Time: ${invoiceData.pickupTime}`, margin, yPosition)
    yPosition += 6
  }

  doc.text(`Car Type: ${invoiceData.carType}`, margin, yPosition)

  yPosition += 12

  // Payment Details Section
  doc.setTextColor(26, 21, 18)
  doc.setFontSize(11)
  doc.text('PAYMENT SUMMARY', margin, yPosition)
  doc.setDrawColor(255, 218, 0)
  doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2)

  yPosition += 10

  // Payment table
  const rightColX = pageWidth - margin - 50
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)

  doc.text('Total Amount:', margin, yPosition)
  doc.text(`₹${invoiceData.totalAmount.toFixed(2)}`, rightColX, yPosition)
  yPosition += 6

  doc.text('Advance Payment (30%):', margin, yPosition)
  doc.text(`₹${invoiceData.advanceAmount.toFixed(2)}`, rightColX, yPosition)
  yPosition += 6

  doc.setTextColor(26, 21, 18)
  doc.setFontSize(11)
  doc.text('Remaining Amount:', margin, yPosition)
  doc.text(`₹${invoiceData.remainingAmount.toFixed(2)}`, rightColX, yPosition)

  yPosition += 10

  // Payment Status
  doc.setFillColor(255, 218, 0)
  doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 8, 'F')
  doc.setTextColor(26, 21, 18)
  doc.setFontSize(10)
  doc.text(
    `Payment Status: ${invoiceData.paymentStatus.toUpperCase()} | Payment Method: ${invoiceData.paymentMethod}`,
    margin + 5,
    yPosition + 3
  )

  yPosition += 15

  // Terms and Conditions
  doc.setTextColor(26, 21, 18)
  doc.setFontSize(9)
  doc.text('TERMS & CONDITIONS', margin, yPosition)
  yPosition += 5

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  const terms = [
    '• Cancellation is allowed up to 24 hours before scheduled booking.',
    '• Refunds will be processed only on the advance amount paid online.',
    '• Remaining amount (if any) should be paid in cash at the airport office.',
    '• Please arrive 15 minutes before your scheduled pickup time.',
    '• For inquiries, contact us at support@taxihollongi.com',
  ]

  terms.forEach((term) => {
    doc.text(term, margin, yPosition)
    yPosition += 5
  })

  // Footer
  yPosition = pageHeight - 20
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('TaxiHollongi - Airport Transportation & Tour Booking', pageWidth / 2, yPosition + 8, {
    align: 'center',
  })
  doc.text('www.taxihollongi.com | support@taxihollongi.com', pageWidth / 2, yPosition + 13, {
    align: 'center',
  })

  return doc
}

export function downloadInvoicePDF(doc: jsPDF, fileName: string) {
  doc.save(fileName)
}
