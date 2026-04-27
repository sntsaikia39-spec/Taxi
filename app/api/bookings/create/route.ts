import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

// Helper function to parse duration string or number
// Formats: "12 hours", "12 hrs", "12", "30 mins", "30 min"
// If no unit specified, assumes hours
function parseDurationToMinutes(durationStr: string | number): number {
  const strValue = String(durationStr).trim()
  
  // Try to match: number with optional unit (hours/hrs/hour/hr or mins/min)
  const hourMatch = strValue.match(/^(\d+)\s*(hours?|hrs?|hr)?$/i)
  if (hourMatch) {
    const hours = parseInt(hourMatch[1])
    return hours * 60 // Convert to minutes
  }
  
  const minMatch = strValue.match(/^(\d+)\s*(mins?|min)$/i)
  if (minMatch) {
    return parseInt(minMatch[1])
  }
  
  // If it's just a number with no unit, assume hours
  const justNumber = parseInt(strValue)
  if (!isNaN(justNumber)) {
    return justNumber * 60 // Convert hours to minutes
  }
  
  return 60 // Default to 60 minutes if parsing fails
}

// Helper function to create ISO datetime string in IST (without timezone conversion)
// User enters time in IST, so we preserve it as-is without converting to UTC
function createDateTimeIST(dateStr: string, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date(dateStr)
  date.setHours(hours, minutes, 0, 0)
  
  // Format as ISO string with IST timezone offset (+05:30)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  
  // Return in ISO format with IST timezone offset
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    console.log('Booking data received:', bookingData)

    // Validate required fields
    if (
      !bookingData.booking_id ||
      !bookingData.booking_type ||
      !bookingData.user_name ||
      !bookingData.phone ||
      bookingData.passenger_count === undefined ||
      bookingData.passenger_count === null ||
      !bookingData.booking_date ||
      !bookingData.start_time ||
      bookingData.amount_total === undefined ||
      bookingData.amount_total === null
    ) {
      const missingFields = []
      if (!bookingData.booking_id) missingFields.push('booking_id')
      if (!bookingData.booking_type) missingFields.push('booking_type')
      if (!bookingData.user_name) missingFields.push('user_name')
      if (!bookingData.phone) missingFields.push('phone')
      if (bookingData.passenger_count === undefined || bookingData.passenger_count === null) missingFields.push('passenger_count')
      if (!bookingData.booking_date) missingFields.push('booking_date')
      if (!bookingData.start_time) missingFields.push('start_time')
      if (bookingData.amount_total === undefined || bookingData.amount_total === null) missingFields.push('amount_total')

      return Response.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received: bookingData
        }, 
        { status: 400 }
      )
    }

    // Validate booking_type enum
    const validBookingTypes = ['airport', 'tour', 'hourly']
    if (!validBookingTypes.includes(bookingData.booking_type)) {
      return Response.json(
        { error: `Invalid booking_type. Must be one of: ${validBookingTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate booking_status enum (optional, defaults to 'pending')
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (bookingData.booking_status && !validStatuses.includes(bookingData.booking_status)) {
      return Response.json(
        { error: `Invalid booking_status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Ensure passenger_count is a positive integer
    const passengerCount = parseInt(String(bookingData.passenger_count))
    if (isNaN(passengerCount) || passengerCount <= 0) {
      return Response.json(
        { error: 'passenger_count must be a positive integer' },
        { status: 400 }
      )
    }

    // Ensure amount_total is a positive number
    const amountTotal = parseFloat(String(bookingData.amount_total))
    if (isNaN(amountTotal) || amountTotal <= 0) {
      return Response.json(
        { error: 'amount_total must be a positive number' },
        { status: 400 }
      )
    }

    // Create start_datetime from booking_date and start_time (in IST)
    let startDateTimeStr: string
    try {
      startDateTimeStr = createDateTimeIST(bookingData.booking_date, bookingData.start_time)
    } catch (e) {
      return Response.json(
        { error: 'Invalid date or time format' },
        { status: 400 }
      )
    }

    // Calculate end_datetime based on booking type
    let endDateTimeStr: string = startDateTimeStr
    let durationMinutes = 0

    if (bookingData.booking_type === 'hourly' && bookingData.no_of_hours) {
      // For hourly bookings: use the provided no_of_hours directly
      durationMinutes = parseFloat(String(bookingData.no_of_hours)) * 60
      console.log(`Hourly booking: ${bookingData.no_of_hours} hrs (${durationMinutes} minutes)`)
    } else if (bookingData.booking_type === 'tour' && bookingData.tour_package_id) {
      // For tour bookings: fetch duration_hours from the tour package
      try {
        const { data: tourPkg, error: tourErr } = await supabaseAdmin
          .from('tour_packages')
          .select('duration_hours')
          .eq('id', bookingData.tour_package_id)
          .single()

        if (!tourErr && tourPkg && tourPkg.duration_hours) {
          durationMinutes = parseInt(String(tourPkg.duration_hours)) * 60
          console.log(`Tour booking: ${tourPkg.duration_hours} hrs (${durationMinutes} minutes)`)
        } else {
          console.warn('Could not fetch tour package duration, defaulting to 240 minutes')
          durationMinutes = 240
        }
      } catch (e) {
        console.error('Error fetching tour package:', e)
        durationMinutes = 240
      }
    } else if (bookingData.destination_id) {
      // For airport bookings: fetch estimated_duration from the destination
      try {
        const { data: destination, error: destError } = await supabaseAdmin
          .from('destinations')
          .select('estimated_duration')
          .eq('id', bookingData.destination_id)
          .single()

        if (!destError && destination) {
          durationMinutes = parseDurationToMinutes(destination.estimated_duration)
          console.log(`Destination duration: ${destination.estimated_duration} (${durationMinutes} minutes)`)
        } else {
          console.warn('Could not fetch destination, using default duration of 60 minutes')
          durationMinutes = 60
        }
      } catch (e) {
        console.error('Error fetching destination:', e)
        durationMinutes = 60
      }
    } else {
      durationMinutes = 60
    }

    // Calculate end_datetime by adding duration to start_datetime (in milliseconds)
    // Parse the ISO format string: "2026-04-30T13:30:00+05:30"
    const timeMatch = startDateTimeStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!timeMatch) {
      return Response.json(
        { error: 'Invalid start_datetime format' },
        { status: 400 }
      )
    }

    const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = timeMatch
    const year = parseInt(yearStr)
    const month = parseInt(monthStr) - 1 // JavaScript months are 0-indexed
    const day = parseInt(dayStr)
    const hours = parseInt(hourStr)
    const minutes = parseInt(minuteStr)
    const seconds = parseInt(secondStr)

    // Create start Date object with extracted components
    const startDate = new Date(year, month, day, hours, minutes, seconds, 0)
    
    // Calculate end_datetime by adding duration
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    
    // Format end_datetime back to ISO string with IST timezone
    const endYear = endDate.getFullYear()
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0')
    const endDay = String(endDate.getDate()).padStart(2, '0')
    const endHour = String(endDate.getHours()).padStart(2, '0')
    const endMinute = String(endDate.getMinutes()).padStart(2, '0')
    const endSecond = String(endDate.getSeconds()).padStart(2, '0')
    
    endDateTimeStr = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}:${endSecond}+05:30`
    console.log(`Start: ${startDateTimeStr}, End: ${endDateTimeStr}, Duration: ${durationMinutes} minutes (${(durationMinutes / 60).toFixed(2)} hours)`)

    // Determine no_of_hours
    // - For "hourly": use what the user selected
    // - For "airport" / "tour": always NULL
    let noOfHours: number | null = null
    if (bookingData.booking_type === 'hourly' && bookingData.no_of_hours) {
      noOfHours = parseFloat(String(bookingData.no_of_hours))
    }

    // Prepare booking data with new datetime schema
    const preparedBookingData = {
      booking_id: bookingData.booking_id,
      booking_type: bookingData.booking_type,
      user_name: bookingData.user_name,
      user_email: bookingData.user_email || null,
      phone: bookingData.phone,
      passenger_count: passengerCount,
      start_datetime: startDateTimeStr,
      end_datetime: endDateTimeStr,
      destination_id: bookingData.destination_id || null,
      tour_package_id: bookingData.tour_package_id || null,
      no_of_hours: noOfHours,
      car_model: bookingData.car_model || null,
      amount_total: amountTotal,
      booking_status: bookingData.booking_status || 'pending',
    }

    console.log('Prepared booking data:', preparedBookingData)

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([preparedBookingData])
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return Response.json(
        { error: `Failed to create booking: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    console.log('Booking created successfully:', data)
    return Response.json({ success: true, booking: data })
  } catch (error) {
    console.error('Booking creation error:', error)
    return Response.json(
      { error: 'Failed to create booking', details: String(error) },
      { status: 500 }
    )
  }
}
