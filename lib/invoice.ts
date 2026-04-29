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
  const margin = 12
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // ============ PROFESSIONAL HEADER ============
  // Top accent bar
  doc.setFillColor(26, 21, 18) // Dark brown
  doc.rect(0, 0, pageWidth, 35, 'F')

  // Company name and logo area
  doc.setTextColor(255, 218, 0) // Gold
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('>> TAXIHOLLONGI', margin, 14)

  // Tagline
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(220, 220, 220)
  doc.text('Airport Transportation & Premium Tour Booking Services', margin, 24)

  // Document type
  doc.setFontSize(8)
  doc.text('GST: 07AAACR5055K1Z1 | License: ATL/2024/001', pageWidth - margin - 60, 24)

  yPosition = 42

  // ============ INVOICE HEADER INFO ============
  // Left side: Invoice details
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(26, 21, 18)
  doc.text('INVOICE', margin, yPosition)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  yPosition += 7
  doc.text(`Invoice No.: ${invoiceData.invoiceNumber}`, margin, yPosition)
  yPosition += 5
  doc.text(`Date: ${formatDate(invoiceData.date)}`, margin, yPosition)
  yPosition += 5
  doc.text(`Booking ID: ${invoiceData.bookingId}`, margin, yPosition)

  // Right side: Company info
  const rightX = pageWidth - margin - 70
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(26, 21, 18)
  doc.text('BILL FROM:', rightX, 42)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('TaxiHollongi Services', rightX, 48)
  doc.text('Airport Transportation Division', rightX, 52)
  doc.text('Email: support@taxihollongi.com', rightX, 56)
  doc.text('Phone: +91-9876543210', rightX, 60)
  doc.text('Web: www.taxihollongi.com', rightX, 64)

  yPosition = 72

  // ============ DIVIDER LINE ============
  doc.setDrawColor(255, 218, 0)
  doc.setLineWidth(1.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 6

  // ============ BILL TO / CUSTOMER INFORMATION ============
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(26, 21, 18)
  doc.text('BILL TO:', margin, yPosition)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  yPosition += 6
  doc.text(`Name: ${invoiceData.userName}`, margin, yPosition)
  yPosition += 5
  doc.text(`Email: ${invoiceData.userEmail}`, margin, yPosition)
  yPosition += 5
  doc.text(`Phone: ${invoiceData.userPhone}`, margin, yPosition)
  yPosition += 5
  doc.text(`Passengers: ${invoiceData.passengers}`, margin, yPosition)

  yPosition += 8

  // ============ BOOKING INFORMATION SECTION ============
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 21, 18)
  doc.text('BOOKING INFORMATION', margin, yPosition)

  // Background for section
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, yPosition + 2, contentWidth, 45, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)

  const bookingInfo = []
  bookingInfo.push(`Booking Type: ${invoiceData.bookingType === 'taxi' ? 'Taxi Service' : 'Tour Package'}`)

  if (invoiceData.bookingType === 'taxi') {
    if (invoiceData.destination) {
      bookingInfo.push(`Destination: ${invoiceData.destination}`)
    }
    if (invoiceData.pickupLocation) {
      bookingInfo.push(`Pickup Location: ${invoiceData.pickupLocation}`)
    }
  } else {
    if (invoiceData.tourPackageName) {
      bookingInfo.push(`Tour Package: ${invoiceData.tourPackageName}`)
    }
  }

  bookingInfo.push(`Pickup Date: ${formatDate(invoiceData.pickupDate)}`)
  if (invoiceData.pickupTime) {
    bookingInfo.push(`Pickup Time: ${invoiceData.pickupTime}`)
  }
  bookingInfo.push(`Vehicle: ${invoiceData.carType}`)

  let infoY = yPosition + 8
  bookingInfo.forEach((info) => {
    doc.text(info, margin + 5, infoY)
    infoY += 5
  })

  yPosition += 52

  // ============ PAYMENT DETAILS TABLE ============
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 21, 18)
  doc.text('PAYMENT DETAILS', margin, yPosition)
  yPosition += 6

  // Table header
  doc.setFillColor(26, 21, 18)
  doc.rect(margin, yPosition, contentWidth, 8, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 218, 0)
  doc.text('Description', margin + 3, yPosition + 5.5)
  doc.text('Amount', pageWidth - margin - 25, yPosition + 5.5, { align: 'right' })

  yPosition += 8

  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)

  const tableItems = [
    { label: 'Service Charges', amount: invoiceData.totalAmount },
    { label: 'Advance Payment (30%)', amount: invoiceData.advanceAmount },
    { label: 'Remaining Balance', amount: invoiceData.remainingAmount },
  ]

  tableItems.forEach((item, index) => {
    if (index > 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, yPosition - 3, contentWidth, 7, 'F')
    }

    if (index === 2) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(26, 21, 18)
    }

    doc.text(item.label, margin + 3, yPosition + 2)
    doc.text(`₹${item.amount.toFixed(2)}`, pageWidth - margin - 3, yPosition + 2, { align: 'right' })
    yPosition += 7
  })

  yPosition += 2

  // ============ PAYMENT STATUS BANNER ============
  const statusColor = invoiceData.paymentStatus.toLowerCase() === 'paid' ? [76, 175, 80] : [255, 193, 7]
  doc.setFillColor(...statusColor)
  doc.rect(margin, yPosition, contentWidth, 10, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  const statusText = `Status: ${invoiceData.paymentStatus.toUpperCase()} | Method: ${invoiceData.paymentMethod}`
  doc.text(statusText, margin + 3, yPosition + 6.5)

  yPosition += 15

  // ============ TERMS & CONDITIONS ============
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(26, 21, 18)
  doc.text('TERMS & CONDITIONS', margin, yPosition)

  yPosition += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)

  const terms = [
    '• Cancellation is allowed up to 24 hours before the scheduled booking. Cancellations within 24 hours will attract a 50% penalty.',
    '• Refunds for online payments will be processed within 5-7 business days after cancellation.',
    '• Any remaining balance must be paid in cash at the time of service or at our office.',
    '• Customers must arrive 15-20 minutes before the scheduled pickup time.',
    '• Additional charges may apply for delays or schedule changes made on the day of service.',
    '• For complaints or inquiries, please contact support@taxihollongi.com within 48 hours of service completion.',
  ]

  const lineHeight = 4
  let termsY = yPosition
  terms.forEach((term) => {
    if (termsY > pageHeight - 60) {
      doc.addPage()
      termsY = margin
    }
    doc.text(term, margin + 3, termsY, { maxWidth: contentWidth - 6 })
    termsY += lineHeight
  })

  yPosition = pageHeight - 55

  // ============ DIGITAL SIGNATURE SECTION ============
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 5

  // Signature placeholder
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(26, 21, 18)
  doc.text('AUTHORIZED SIGNATURE', margin, yPosition)

  // Digital signature box
  doc.setDrawColor(26, 21, 18)
  doc.setLineWidth(1)
  doc.rect(margin, yPosition + 2, 40, 15)

  // Digital signature with logo
  doc.setFont('courier', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(255, 218, 0)
  doc.text('>>', margin + 8, yPosition + 8)

  doc.setFont('courier', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(80, 80, 80)
  doc.text('Digitally Signed', margin + 3, yPosition + 12)

  // Signature date/time
  doc.setFontSize(6)
  doc.setTextColor(150, 150, 150)
  const now = new Date()
  doc.text(`Generated on: ${now.toLocaleDateString('en-IN')} at ${now.toLocaleTimeString('en-IN')}`, margin, yPosition + 18)

  // ============ FOOTER ============
  yPosition = pageHeight - 15
  doc.setDrawColor(255, 218, 0)
  doc.setLineWidth(1.5)
  doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(26, 21, 18)
  doc.text('TaxiHollongi | Airport Transportation & Premium Tours', pageWidth / 2, yPosition + 3, {
    align: 'center',
  })

  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text('www.taxihollongi.com | support@taxihollongi.com | +91-9876543210', pageWidth / 2, yPosition + 8, {
    align: 'center',
  })

  doc.setFontSize(6)
  doc.setTextColor(150, 150, 150)
  doc.text(`Invoice ID: ${invoiceData.invoiceNumber} | Page 1 of 1`, pageWidth / 2, yPosition + 12, {
    align: 'center',
  })

  return doc
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function downloadInvoicePDF(doc: jsPDF, fileName: string) {
  doc.save(fileName)
}
