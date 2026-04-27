'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Users, Star, Clock, ArrowRight } from 'lucide-react'
import { fetchAllTours } from '@/lib/db'
import type { TourPackage } from '@/lib/db'

const TOUR_IMAGES = [
  'https://images.pexels.com/photos/1172064/pexels-photo-1172064.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/258109/pexels-photo-258109.jpeg?cs=srgb&dl=backlit-beach-color-258109.jpg&fm=jpg',
  'https://www.goodfreephotos.com/albums/other-landscapes/mountains-and-pond-landscape-with-majestic-scenery.jpg',
  'https://i0.wp.com/picjumbo.com/wp-content/uploads/beautiful-nature-mountain-scenery-with-flowers-free-photo.jpg?w=2210&quality=70',
]

export default function Home() {
  const [featuredTours, setFeaturedTours] = useState<TourPackage[]>([])
  const [loadingTours, setLoadingTours] = useState(true)

  useEffect(() => {
    fetchAllTours().then((tours) => {
      setFeaturedTours(tours.slice(0, 4))
      setLoadingTours(false)
    })
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-950 via-primary-900 to-primary-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Airport Taxi & Tour Booking Made Easy
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Pre-book your ride from Hollongi Airport with transparent pricing and guaranteed availability
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/book-taxi"
                className="px-8 py-4 bg-secondary-500 text-primary-950 font-bold rounded-lg hover:bg-secondary-600 transition-smooth text-lg"
              >
                Book Taxi Now
              </Link>
              <Link
                href="/tours"
                className="px-8 py-4 border-2 border-secondary-500 text-secondary-500 font-bold rounded-lg hover:bg-secondary-500 hover:text-primary-950 transition-smooth text-lg"
              >
                Explore Tours
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-500 opacity-5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500 opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Featured Tours Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Tours</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore our top-rated tour packages. Each includes professional transportation and expert guidance.
            </p>
          </div>

          {loadingTours ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="bg-gray-200 h-40"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTours.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No tours available at the moment.</p>
              <Link href="/tours" className="btn-primary inline-block">View All Tours</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredTours.map((tour, index) => (
                <div
                  key={tour.id}
                  className="card overflow-hidden hover:shadow-lg transition-smooth group"
                >
                  {/* Image */}
                  <div className="relative h-40 w-full bg-gray-200 overflow-hidden">
                    <Image
                      src={TOUR_IMAGES[index % TOUR_IMAGES.length]}
                      alt={tour.name}
                      fill
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform"
                    />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{tour.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{tour.description}</p>

                    {/* Details */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <Clock size={16} className="text-secondary-500" />
                        <span>{tour.duration_hours} hours</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <Users size={16} className="text-secondary-500" />
                        <span>Up to {tour.max_passengers} passengers</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <Star size={16} className="text-secondary-500 fill-secondary-500" />
                        <span>4.8 / 5</span>
                      </div>
                    </div>

                    {/* Price and Button */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-gray-600 text-xs">From</p>
                        <p className="text-2xl font-bold text-secondary-500">₹{tour.price}</p>
                      </div>
                      <Link
                        href={`/tours/${tour.id}/book`}
                        className="btn-secondary flex items-center gap-2"
                      >
                        Book <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Explore More Button */}
          <div className="text-center mt-12">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-950 text-white font-bold rounded-lg hover:bg-primary-900 transition-smooth"
            >
              Explore All Tours <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary-950 text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-4xl font-bold mb-6">Ready to Book Your Ride?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Don't wait in queues at the airport. Pre-book your taxi with transparent pricing and 24/7 support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book-taxi"
              className="px-8 py-4 bg-secondary-500 text-primary-950 font-bold rounded-lg hover:bg-secondary-600 transition-smooth"
            >
              Book Taxi Now
            </Link>
            <Link
              href="/tours"
              className="px-8 py-4 border-2 border-secondary-500 text-secondary-500 font-bold rounded-lg hover:bg-secondary-500 hover:text-primary-950 transition-smooth"
            >
              Explore Tours
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
