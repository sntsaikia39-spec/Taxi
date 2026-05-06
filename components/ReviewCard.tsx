'use client'

import { Star } from 'lucide-react'
import type { Review } from '@/lib/reviews'

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.created_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="border border-primary-800 rounded-2xl p-5 md:p-6 bg-primary-900/40 hover:bg-primary-900/60 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white text-sm md:text-base">{review.user_name}</p>
          <p className="text-gray-500 text-xs md:text-sm">{formattedDate}</p>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={
                star <= review.rating
                  ? 'text-secondary-500 fill-secondary-500'
                  : 'text-secondary-500/20 fill-secondary-500/20'
              }
            />
          ))}
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h4 className="font-bold text-white text-sm md:text-base mb-2">{review.title}</h4>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-400 text-sm md:text-base leading-relaxed">{review.comment}</p>
      )}
    </div>
  )
}
