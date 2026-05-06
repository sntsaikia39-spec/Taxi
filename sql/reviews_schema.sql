-- Reviews Table (supports both tour packages and taxi bookings)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewable_type VARCHAR(50) NOT NULL,   -- 'tour' | 'taxi_booking'
  reviewable_id UUID NOT NULL,
  user_id UUID,                            -- auth.users.id (nullable for safety)
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one review per user per item
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique
  ON public.reviews(user_email, reviewable_type, reviewable_id);

-- For fast lookup by reviewable item
CREATE INDEX IF NOT EXISTS idx_reviews_reviewable
  ON public.reviews(reviewable_type, reviewable_id);

-- For user's review history
CREATE INDEX IF NOT EXISTS idx_reviews_user_email
  ON public.reviews(user_email);
