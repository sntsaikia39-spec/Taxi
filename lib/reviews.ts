import { supabase } from './supabase'

export interface Review {
  id: string
  reviewable_type: 'tour' | 'taxi_booking'
  reviewable_id: string
  user_id: string | null
  user_email: string
  user_name: string
  rating: number
  title: string | null
  comment: string | null
  created_at: string
}

export interface RatingStats {
  avg: number
  count: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export async function fetchTourReviews(tourId: string): Promise<{ reviews: Review[], stats: RatingStats }> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewable_type', 'tour')
      .eq('reviewable_id', tourId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return { reviews: [], stats: { avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } }
    }

    const reviews = data as Review[] || []
    const stats = calculateRatingStats(reviews)

    return { reviews, stats }
  } catch (error) {
    console.error('Exception fetching reviews:', error)
    return { reviews: [], stats: { avg: 0, count: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } } }
  }
}

export function calculateRatingStats(reviews: Review[]): RatingStats {
  if (reviews.length === 0) {
    return {
      avg: 0,
      count: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>
  let sum = 0

  reviews.forEach(review => {
    sum += review.rating
    distribution[review.rating as keyof typeof distribution]++
  })

  return {
    avg: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution: distribution as RatingStats['distribution']
  }
}
