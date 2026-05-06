'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import ReviewCard from '@/components/ReviewCard'
import ReviewForm from '@/components/ReviewForm'
import Loader from '@/components/Loader'
import { ArrowLeft, Star, LogIn, Car } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { fetchTourById } from '@/lib/db'
import type { TourPackage } from '@/lib/db'
import gsap from 'gsap'
import type { Review, RatingStats } from '@/lib/reviews'
import toast from 'react-hot-toast'

export default function ToursReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const tourId = params.id as string

  const [tour, setTour] = useState<TourPackage | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<RatingStats>({
    avg: 0,
    count: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [hasReviewed, setHasReviewed] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    document.documentElement.style.overflowY = 'auto'
    document.body.style.overflowY = 'auto'
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
  }, [])

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return

    let targetTop = scroller.scrollTop

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight)
      targetTop = Math.min(max, Math.max(0, targetTop + e.deltaY))
      gsap.to(scroller, {
        scrollTop: targetTop,
        duration: 0.75,
        ease: 'power3.out',
        overwrite: true,
      })
    }

    scroller.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      scroller.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [tourId])

  useEffect(() => {
    const loadTourAndReviews = async () => {
      setIsLoadingReviews(true)
      const tourData = await fetchTourById(tourId)
      setTour(tourData)

      const res = await fetch(`/api/reviews?reviewable_type=tour&reviewable_id=${tourId}`)
      const data = await res.json()

      if (data.success) {
        setReviews(data.reviews)
        setStats(data.stats)

        if (user && data.reviews.some((r: Review) => r.user_email === user.email)) {
          setHasReviewed(true)
        }
      }

      setIsLoadingReviews(false)
    }

    loadTourAndReviews()
  }, [tourId, user])

  const handleReviewSubmitted = async () => {
    setHasReviewed(true)
    const res = await fetch(`/api/reviews?reviewable_type=tour&reviewable_id=${tourId}`)
    const data = await res.json()
    if (data.success) {
      setReviews(data.reviews)
      setStats(data.stats)
    }
  }

  return (
    <div ref={scrollRef} className="scrollbar-thin-modern h-[100dvh] overflow-y-auto overflow-x-hidden bg-primary-950 flex flex-col">
      <Header />

      <main className="relative flex-1 pt-20 md:pt-28 pb-12 px-4">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.75) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        ></div>
        {isLoadingReviews ? (
          <div className="max-w-3xl mx-auto min-h-[60dvh] flex items-center justify-center">
            <Loader />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-secondary-500 transition-colors mb-6 md:mb-8"
            >
              <ArrowLeft size={16} />
              Back to Tours
            </Link>

            {/* Tour Header */}
            {tour && (
              <div className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{tour.name}</h1>
                <p className="text-gray-400">{tour.description}</p>
              </div>
            )}

            <div className="space-y-8 md:space-y-12">
              {/* Rating Summary Section */}
              <div className="border border-primary-800 rounded-3xl p-6 md:p-8 bg-primary-900/40">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                  {/* Large Rating Display */}
                  <div className="flex items-baseline gap-3">
                    <div className="text-6xl md:text-7xl font-black text-secondary-500">
                      {stats.count === 0 ? '-' : stats.avg}
                    </div>
                    <div>
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={18}
                            className={
                              star <= Math.round(stats.avg)
                                ? 'text-secondary-500 fill-secondary-500'
                                : 'text-secondary-500/20 fill-secondary-500/20'
                            }
                          />
                        ))}
                      </div>
                      <p className="text-sm text-gray-400">
                        {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>

                  {/* Distribution Chart */}
                  {stats.count > 0 && (
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm text-gray-400 w-8">{star}★</span>
                          <div className="flex-1 h-2 bg-primary-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary-500 transition-all duration-300"
                              style={{
                                width: `${stats.count > 0 ? (stats.distribution[star as keyof typeof stats.distribution] / stats.count) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {stats.distribution[star as keyof typeof stats.distribution]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {stats.count === 0 && (
                  <p className="text-center text-gray-400 text-sm mt-4">No reviews yet. Be the first to review!</p>
                )}
              </div>

              {/* Review Form Section */}
              {!isLoading && !user ? (
                <div className="border border-primary-800 rounded-3xl p-6 md:p-8 bg-primary-900/40 text-center">
                  <LogIn size={32} className="text-secondary-500 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white mb-2">Sign In to Leave a Review</h3>
                  <p className="text-gray-400 mb-6">You need to be logged in to share your experience with this tour.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={`/login?redirect=/tours/${tourId}/reviews`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary-500 text-primary-950 font-black rounded-xl hover:bg-secondary-400 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href={`/signup?redirect=/tours/${tourId}/reviews`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-secondary-500 text-secondary-500 font-semibold rounded-xl hover:bg-secondary-500/10 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              ) : (
                !isLoading && (
                  <div className="border border-primary-800 rounded-3xl p-6 md:p-8 bg-primary-900/40">
                    <h3 className="text-xl font-black text-white mb-6">
                      {hasReviewed ? 'Your Review' : 'Share Your Experience'}
                    </h3>
                    {hasReviewed && (
                      <div className="mb-6 p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-xl">
                        <p className="text-secondary-400 text-sm">You've already reviewed this tour. Your review has been posted.</p>
                      </div>
                    )}
                    {!hasReviewed && (
                      <ReviewForm
                        tourId={tourId}
                        userName={user?.user_metadata?.full_name || 'Anonymous'}
                        userEmail={user?.email || ''}
                        userId={user?.id || null}
                        onReviewSubmitted={handleReviewSubmitted}
                      />
                    )}
                  </div>
                )
              )}

              {/* Reviews List */}
              {reviews.length > 0 && (
                <div>
                  <h3 className="text-xl font-black text-white mb-6">
                    Reviews ({reviews.length})
                  </h3>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
