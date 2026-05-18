'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/Header'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { Clock, Users, Car, Calendar, ArrowRight, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import gsap from 'gsap'
import { useAuth } from '@/context/AuthContext'
import { fetchAllTours, fetchAllTourRatingStats, type RatingStats } from '@/lib/db'
import type { TourPackage } from '@/lib/db'
import Link from 'next/link'

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
  const [ratingStats, setRatingStats] = useState<Record<string, RatingStats>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingTours, setLoadingTours] = useState(true)
  const [cardImgIdx, setCardImgIdx] = useState<Record<string, number>>({})
  const touchStartX = useRef<number>(0)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    document.documentElement.style.overflowY = 'auto'
    document.body.style.overflowY = 'auto'
    document.documentElement.style.overflowX = 'hidden'
    document.body.style.overflowX = 'hidden'
  }, [])

  useEffect(() => {
    loadTours()
  }, [])

  // Preload all tour carousel images in the background after data arrives
  useEffect(() => {
    if (!tours.length) return
    const timer = setTimeout(() => {
      tours.forEach((tour, i) => {
        const images = tour.image_urls?.length
          ? tour.image_urls
          : tour.image_url ? [tour.image_url]
          : [TOUR_IMAGES[i % TOUR_IMAGES.length]]
        images.forEach(url => {
          for (const w of [828, 1080]) {
            const img = new window.Image()
            img.src = `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`
          }
        })
      })
    }, 1000)
    return () => clearTimeout(timer)
  }, [tours])

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
    const scroller = scrollRef.current
    const header = document.querySelector('header') as HTMLElement | null
    if (!scroller || !header) return

    let autoHideTimer: ReturnType<typeof setTimeout> | null = null
    let hideAfterScrollTimer: ReturnType<typeof setTimeout> | null = null
    let headerHovered = false

    const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
      if (timer) clearTimeout(timer)
      return null
    }

    const isInteractiveTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      if (!el) return false
      return Boolean(el.closest('a, button, input, textarea, select, label, summary, [role="button"], [data-no-header-peek]'))
    }

    const hideHeader = () => {
      gsap.killTweensOf(header)
      gsap.to(header, { yPercent: -110, opacity: 1, duration: 0.46, ease: 'power3.inOut' })
    }

    const showHeaderTemporarily = () => {
      autoHideTimer = clearTimer(autoHideTimer)
      gsap.killTweensOf(header)
      gsap.to(header, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power2.out' })
      autoHideTimer = setTimeout(() => {
        if (!headerHovered) hideHeader()
        autoHideTimer = null
      }, 6500)
    }

    const scheduleHideAfterScroll = () => {
      hideAfterScrollTimer = clearTimer(hideAfterScrollTimer)
      hideAfterScrollTimer = setTimeout(() => {
        if (!headerHovered) hideHeader()
        hideAfterScrollTimer = null
      }, 250)
    }

    const onScroll = () => {
      scheduleHideAfterScroll()
      setExpandedId(null) // Reset expanded card on scroll
    }
    const onClick = (e: MouseEvent) => {
      if (!isInteractiveTarget(e.target)) showHeaderTemporarily()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (!isInteractiveTarget(e.target)) showHeaderTemporarily()
    }
    const onHeaderMouseEnter = () => {
      headerHovered = true
      autoHideTimer = clearTimer(autoHideTimer)
      hideAfterScrollTimer = clearTimer(hideAfterScrollTimer)
    }
    const onHeaderMouseLeave = () => {
      headerHovered = false
      scheduleHideAfterScroll()
    }

    // Start visible, then apply the same delayed auto-hide window on first entry.
    gsap.set(header, { yPercent: 0, opacity: 1 })
    autoHideTimer = setTimeout(() => {
      if (!headerHovered) hideHeader()
      autoHideTimer = null
    }, 6500)

    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('click', onClick, { passive: true })
    scroller.addEventListener('touchend', onTouchEnd, { passive: true })
    header.addEventListener('mouseenter', onHeaderMouseEnter)
    header.addEventListener('mouseleave', onHeaderMouseLeave)

    return () => {
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('click', onClick)
      scroller.removeEventListener('touchend', onTouchEnd)
      header.removeEventListener('mouseenter', onHeaderMouseEnter)
      header.removeEventListener('mouseleave', onHeaderMouseLeave)
      autoHideTimer = clearTimer(autoHideTimer)
      hideAfterScrollTimer = clearTimer(hideAfterScrollTimer)
      gsap.set(header, { yPercent: 0, opacity: 1 })
    }
  }, [])

  const loadTours = async () => {
    setLoadingTours(true)
    try {
      const [data, stats] = await Promise.all([fetchAllTours(), fetchAllTourRatingStats()])
      setTours(data)
      setRatingStats(stats)
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
      router.push('/login?redirect=/tours&source=booking')
      return
    }
    router.push(`/tours/${tourId}/book`)
  }

  if (loadingTours) {
    return (
      <div ref={scrollRef} className="scrollbar-thin-modern flex h-[100dvh] flex-col overflow-y-auto overflow-x-hidden bg-primary-950">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 md:w-32 md:h-32 translate-y-[30px]">
              <DotLottieReact
                src="/assets/yellow taxi.lottie"
                loop
                autoplay
                className="app-lottie-brand-yellow"
              />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="scrollbar-thin-modern h-[100dvh] overflow-y-auto overflow-x-hidden bg-primary-950">
      <Header />

      <main className="relative overflow-x-hidden flex flex-col min-h-full">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,218,0,0.75) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        <div className="relative z-10 container mx-auto px-4 pt-[60px] pb-12 md:pt-[108px] md:pb-24 flex-1 flex flex-col">
          {/* Hero heading */}
          <div className="text-center mb-6 md:mb-12">
            <h1 className="font-black text-white text-3xl md:text-5xl mb-2">
              Tour Packages
            </h1>

          </div>

          {tours.length === 0 ? (
            <div className="max-w-lg mx-auto text-center rounded-2xl border border-primary-800 bg-primary-900/60 backdrop-blur-sm p-8 md:p-14 my-auto">
              <div className="w-14 h-14 rounded-full bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center mx-auto mb-5">
                <Star size={24} className="text-secondary-500" />
              </div>
              <p className="text-white font-bold text-xl mb-2">No tours available right now</p>
              <p className="text-gray-400 text-sm mb-8">Check back soon or book a private taxi for a custom trip.</p>
              <a
                href="/book-taxi"
                className="inline-flex items-center gap-2 bg-secondary-500 text-primary-950 font-black px-6 py-3 rounded-xl hover:bg-secondary-400 transition-colors"
              >
                Book a Taxi Instead
                <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {tours.map((tour, index) => {
                  const isExpanded = expandedId === tour.id
                  return (
                    <div 
                      key={tour.id} 
                      onClick={() => setExpandedId(isExpanded ? null : tour.id)}
                      className="flex flex-col h-[clamp(460px,70svh,506px)] md:h-[500px] rounded-3xl bg-primary-900/80 backdrop-blur-md border border-primary-800/60 shadow-[0_16px_44px_rgba(0,0,0,0.45)] overflow-hidden hover:shadow-[0_24px_56px_rgba(0,0,0,0.55)] transition-all duration-300 cursor-pointer"
                    >
                    {/* Image Carousel */}
                    {(() => {
                      const images = tour.image_urls?.length ? tour.image_urls : tour.image_url ? [tour.image_url] : [TOUR_IMAGES[index % TOUR_IMAGES.length]]
                      const idx = cardImgIdx[tour.id] ?? 0
                      const goTo = (e: React.MouseEvent | React.TouchEvent, next: number) => {
                        e.stopPropagation()
                        setCardImgIdx(prev => ({ ...prev, [tour.id]: (next + images.length) % images.length }))
                      }
                      return (
                        <div
                          className={`relative transition-all duration-500 ease-in-out w-full overflow-hidden shrink-0 ${isExpanded ? 'h-[129px] md:h-[140px]' : 'h-[clamp(230px,35svh,254px)] md:h-[228px]'}`}
                          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
                          onTouchEnd={(e) => {
                            if (images.length < 2) return
                            const diff = touchStartX.current - e.changedTouches[0].clientX
                            if (Math.abs(diff) > 30) goTo(e, diff > 0 ? idx + 1 : idx - 1)
                          }}
                        >
                          <Image
                            src={images[idx]}
                            alt={tour.name}
                            fill
                            className="object-cover w-full h-full transition-opacity duration-300"
                          />
                          {images.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => goTo(e, idx - 1)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary-950/70 text-white flex items-center justify-center text-xs hover:bg-primary-950/90 transition-colors"
                              >‹</button>
                              <button
                                type="button"
                                onClick={(e) => goTo(e, idx + 1)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary-950/70 text-white flex items-center justify-center text-xs hover:bg-primary-950/90 transition-colors"
                              >›</button>
                              <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex gap-1">
                                {images.map((_, i) => (
                                  <span key={i} className={`block w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
                                ))}
                              </div>
                            </>
                          )}
                          {/* Price badge */}
                          <div className="absolute top-2 left-3 bg-primary-950/80 backdrop-blur-sm text-secondary-500 font-black text-sm px-2.5 py-1 rounded-xl border border-secondary-500/30">
                            ₹{toNum(tour.price).toFixed(0)}
                          </div>
                          {/* Departure time badge */}
                          {tour.arrival_time && (
                            <div className="absolute bottom-2 right-3 bg-primary-950/75 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1 border border-white/10">
                              <Calendar size={10} />
                              Daily {formatDepartureTime(tour.arrival_time)}
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Content Wrapper */}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      {/* Fixed-height middle content to avoid nested scroll on touch devices */}
                      <div className={`flex-1 p-4 pb-2 transition-all duration-500 scrollbar-hide ${isExpanded ? 'overflow-y-auto bg-primary-900/50' : 'overflow-hidden'}`}>
                        <h3 className="text-lg font-black text-white mb-1.5">{tour.name}</h3>
                        {tour.description && (
                          <p className={`text-gray-400 mb-2.5 text-xs leading-relaxed transition-all duration-500 ${isExpanded ? '' : 'line-clamp-2'}`}>{tour.description}</p>
                        )}

                        {/* Key Details */}
                        <div className="grid grid-cols-2 gap-1.5 mb-3">
                          {tour.duration_hours && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Clock size={13} className="text-secondary-500 flex-shrink-0" />
                              <span>{tour.duration_hours} hours</span>
                            </div>
                          )}
                          {tour.max_passengers && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Users size={13} className="text-secondary-500 flex-shrink-0" />
                              <span>Up to {tour.max_passengers} passengers</span>
                            </div>
                          )}
                          {tour.car_model && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                              <Car size={13} className="text-secondary-500 flex-shrink-0" />
                              <span>{tour.car_model}</span>
                            </div>
                          )}
                          {tour.arrival_time && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Clock size={13} className="text-secondary-500 flex-shrink-0" />
                              <span className="font-semibold text-secondary-400">Departs {formatDepartureTime(tour.arrival_time)}</span>
                            </div>
                          )}
                        </div>

                        {/* Highlights */}
                        {tour.highlights && tour.highlights.length > 0 && (
                          <div className={`mb-3 transition-all duration-500 ${isExpanded ? 'mt-4' : ''}`}>
                            <h4 className="font-bold text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{isExpanded ? 'Everything Included' : 'Includes'}</h4>
                            <ul className="text-xs text-gray-400 space-y-0.5">
                              {(isExpanded ? tour.highlights : tour.highlights.slice(0, 3)).map((highlight, i) => (
                                <li key={i} className={`flex items-center gap-1.5 ${isExpanded ? 'animate-in fade-in slide-in-from-left-2' : ''}`} style={{ animationDelay: isExpanded ? `${i * 50}ms` : '0ms' }}>
                                  <span className="text-secondary-500 font-bold text-sm leading-none">✓</span>
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Itinerary Preview */}
                        {tour.itinerary && (
                          <div className={`mb-1 bg-primary-950/50 border border-primary-800 rounded-xl px-3 py-2 text-xs text-gray-500 transition-all duration-500 ${isExpanded ? 'animate-in fade-in slide-in-from-top-2 mt-4' : 'line-clamp-3'}`}>
                            {isExpanded && <h4 className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">Full Itinerary</h4>}
                            {tour.itinerary}
                          </div>
                        )}
                      </div>

                      {/* Fixed Footer */}
                      <div className="p-4 pt-2 shrink-0 bg-gradient-to-b from-transparent to-primary-950/40">
                        {/* Ratings */}
                        {ratingStats[tour.id]?.count > 0 && (
                          <div className="mb-3 pb-3 border-b border-white/5">
                            <Link
                              href={`/tours/${tour.id}/reviews`}
                              onClick={(e) => { e.stopPropagation(); }}
                              className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-secondary-500 transition-colors"
                            >
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} size={10} className={s <= Math.round(ratingStats[tour.id].avg) ? 'text-secondary-500 fill-secondary-500' : 'text-secondary-500/20 fill-secondary-500/20'} />
                                ))}
                              </div>
                              <span className="font-semibold">{ratingStats[tour.id].avg} · {ratingStats[tour.id].count} reviews →</span>
                            </Link>
                          </div>
                        )}

                        {/* Price + CTA */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <div>
                            <p className="text-gray-500 text-[10px] mb-0.5">Price per person</p>
                            <p className="text-xl font-black text-white">₹{toNum(tour.price).toFixed(0)}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleBookTour(tour.id); }}
                            className="flex items-center gap-1 bg-primary-950 text-white font-black px-3 py-1.5 text-xs rounded-xl hover:bg-secondary-500 hover:text-primary-950 transition-colors duration-200 whitespace-nowrap"
                          >
                            Book Now
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>

              {/* Custom tours banner */}
              <div className="mt-16 rounded-2xl border border-primary-800 bg-primary-900/60 backdrop-blur-sm p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
                <div className="w-12 h-12 rounded-full bg-secondary-500/10 border border-secondary-500/20 flex items-center justify-center flex-shrink-0">
                  <Star size={22} className="text-secondary-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-white text-lg mb-1">Custom Tours Available</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Don&apos;t see what you&apos;re looking for? We can customize tours based on your preferences and schedule.{' '}
                    <a
                      href="mailto:support@rinastoursandtravels.in"
                      className="text-secondary-500 hover:text-secondary-400 font-semibold transition-colors"
                    >
                      support@rinastoursandtravels.in
                    </a>
                  </p>
                </div>
                <a
                  href="mailto:support@rinastoursandtravels.in"
                  className="inline-flex items-center gap-2 bg-secondary-500 text-primary-950 font-black px-5 py-3 rounded-xl hover:bg-secondary-400 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  Contact Us
                  <ArrowRight size={15} />
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
