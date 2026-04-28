'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Clock, Users, Car, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { fetchAllTours } from '@/lib/db'
import type { TourPackage } from '@/lib/db'

const TOUR_IMAGES = [
  'https://images.pexels.com/photos/1172064/pexels-photo-1172064.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/258109/pexels-photo-258109.jpeg?cs=srgb&dl=backlit-beach-color-258109.jpg&fm=jpg',
  'https://www.goodfreephotos.com/albums/other-landscapes/mountains-and-pond-landscape-with-majestic-scenery.jpg',
  'https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=2210&quality=70',
]

function formatDepartureTime(arrival_time: string | null): string {
  if (!arrival_time) return 'Time TBD'
  const match = arrival_time.match(/T(\d{2}):(\d{2})/)
  if (!match) return 'Time TBD'
  const h = parseInt(match[1])
  const m = match[2]
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${m} ${period}`
}

function toNum(val: unknown): number {
  const n = parseFloat(String(val ?? 0))
  return isNaN(n) ? 0 : n
}

export default function Tours() {
  const router = useRouter()
  const { user } = useAuth()
  const [tours, setTours] = useState<TourPackage[]>([])
  const [loadingTours, setLoadingTours] = useState(true)

  useEffect(() => {
    loadTours()
  }, [])

  const loadTours = async () => {
    setLoadingTours(true)
    try {
      const data = await fetchAllTours()
      setTours(data)
    } catch (error) {
      console.error('Error loading tours:', error)
      toast.error('Failed to load tours')
    } finally {
      setLoadingTours(false)
    }
  }

  const handleBookTour = (tourId: string) => {
    if (!user) {
      toast.error('Please sign in to book a tour')
      router.push('/login?redirect=/tours')
      return
    }
    router.push(`/tours/${tourId}/book`)
  }

  if (loadingTours) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600">Loading tours...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-center mb-3 md:mb-4">Tour Packages</h1>
          <p className="text-center text-gray-600 mb-6 md:mb-12 max-w-2xl mx-auto">
            Explore amazing tour packages with our experienced drivers. Each package includes transportation and tour guidance.
          </p>

          {tours.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No tours available at the moment.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {tours.map((tour, index) => (
                  <div key={tour.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {/* Image / Banner */}
                    <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                      <Image
                        src={TOUR_IMAGES[index % TOUR_IMAGES.length]}
                        alt={tour.name}
                        fill
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      />
                      {tour.arrival_time && (
                        <div className="absolute bottom-3 right-4 bg-black/60 text-white text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                          <Calendar size={13} />
                          Daily {formatDepartureTime(tour.arrival_time)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2">{tour.name}</h3>
                      {tour.description && (
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">{tour.description}</p>
                      )}

                      {/* Key Details */}
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        {tour.duration_hours && (
                          <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <Clock size={16} className="text-yellow-500 flex-shrink-0" />
                            <span>{tour.duration_hours} hours</span>
                          </div>
                        )}
                        {tour.max_passengers && (
                          <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <Users size={16} className="text-yellow-500 flex-shrink-0" />
                            <span>Up to {tour.max_passengers} passengers</span>
                          </div>
                        )}
                        {tour.car_model && (
                          <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <Car size={16} className="text-yellow-500 flex-shrink-0" />
                            <span>{tour.car_model}</span>
                          </div>
                        )}
                        {tour.arrival_time && (
                          <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <Clock size={16} className="text-green-500 flex-shrink-0" />
                            <span className="font-medium text-green-700">Departs {formatDepartureTime(tour.arrival_time)}</span>
                          </div>
                        )}
                      </div>

                      {/* Highlights */}
                      {tour.highlights && tour.highlights.length > 0 && (
                        <div className="mb-5">
                          <h4 className="font-semibold mb-2 text-sm text-gray-500 uppercase tracking-wide">Includes</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {tour.highlights.slice(0, 4).map((highlight, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <span className="text-yellow-500">✓</span>
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Itinerary Preview */}
                      {tour.itinerary && (
                        <div className="mb-5 bg-gray-50 rounded p-3 text-sm text-gray-600 line-clamp-2">
                          {tour.itinerary}
                        </div>
                      )}

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <p className="text-gray-500 text-xs">Price per person</p>
                          <p className="text-3xl font-bold text-yellow-500">₹{toNum(tour.price).toFixed(0)}</p>
                        </div>
                        <button
                          onClick={() => handleBookTour(tour.id)}
                          className="btn-secondary whitespace-nowrap"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-16 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                <h3 className="font-bold text-lg mb-2">Custom Tours Available</h3>
                <p className="text-gray-700">
                  Don't see what you're looking for? We can customize tours based on your preferences.
                  <br />
                  <span className="text-sm">Contact us at support@taxihollongi.com for custom packages.</span>
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
