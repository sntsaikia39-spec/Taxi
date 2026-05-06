'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  tourId: string
  userName: string
  userEmail: string
  userId: string | null
  onReviewSubmitted?: () => void
}

export default function ReviewForm({
  tourId,
  userName,
  userEmail,
  userId,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewableType: 'tour',
          reviewableId: tourId,
          userEmail,
          userName,
          userId,
          rating,
          title: title || null,
          comment: comment || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to submit review')
        return
      }

      toast.success('Review submitted successfully!')
      setRating(0)
      setTitle('')
      setComment('')
      onReviewSubmitted?.()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputCls =
    'w-full px-4 py-3 bg-primary-950 border border-primary-700 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500 transition-colors text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Rating */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-2.5 uppercase tracking-wide">
          Rating
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform duration-200 hover:scale-110"
            >
              <Star
                size={28}
                className={
                  star <= (hoverRating || rating)
                    ? 'text-secondary-500 fill-secondary-500'
                    : 'text-secondary-500/20 fill-secondary-500/20'
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Review Title (optional)
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Great tour experience..."
          className={inputCls}
          maxLength={100}
        />
        <p className="text-gray-600 text-xs mt-1">{title.length}/100</p>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Your Review (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className={`${inputCls} resize-none min-h-[100px]`}
          maxLength={500}
        />
        <p className="text-gray-600 text-xs mt-1">{comment.length}/500</p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-secondary-500 text-primary-950 font-black px-6 py-3 rounded-xl hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
