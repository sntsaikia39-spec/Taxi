-- Create tour_packages table
CREATE TABLE IF NOT EXISTS public.tour_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  arrival_time TIMESTAMP,
  duration_hours INT,
  price DECIMAL(10, 2) NOT NULL,
  max_passengers INT,
  car_model VARCHAR(50),
  itinerary TEXT,
  highlights TEXT[],
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.tour_packages (
  name,
  description,
  arrival_time,
  duration_hours,
  price,
  max_passengers,
  car_model,
  itinerary,
  highlights,
  image_url,
  is_active
) VALUES

-- Tawang Tour (SUV)
(
  'Tawang 3 Days Tour',
  'Explore the beautiful Tawang including monasteries, lakes and mountain passes.',
  NOW(),
  72,
  15000.00,
  6,
  'Toyota Innova',
  'Day 1: Guwahati → Bomdila | Day 2: Bomdila → Tawang (Sela Pass, Jaswant Garh) | Day 3: Tawang sightseeing & return',
  ARRAY['Sela Pass', 'Tawang Monastery', 'Jaswant Garh', 'Madhuri Lake'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
),

-- Ziro Valley (Sedan)
(
  'Ziro Valley Nature Tour',
  'Experience the scenic beauty and Apatani tribal culture in Ziro valley.',
  NOW(),
  48,
  9000.00,
  4,
  'Swift Dzire',
  'Day 1: Itanagar → Ziro | Day 2: Ziro sightseeing (villages, rice fields) | Return',
  ARRAY['Apatani Tribe', 'Ziro Rice Fields', 'Pine Forests'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
),

-- Bomdila + Dirang (Sedan)
(
  'Bomdila & Dirang Tour',
  'Short scenic trip covering Bomdila monastery and Dirang valley.',
  NOW(),
  36,
  7000.00,
  4,
  'Honda Amaze',
  'Day 1: Tezpur → Bomdila | Day 2: Dirang valley & return',
  ARRAY['Bomdila Monastery', 'Dirang Valley', 'Hot Water Springs'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
),

-- Mechuka (SUV)
(
  'Mechuka Adventure Tour',
  'Remote adventure trip to Mechuka valley near Indo-China border.',
  NOW(),
  96,
  20000.00,
  6,
  'Innova Crysta',
  'Day 1: Dibrugarh → Along | Day 2: Along → Mechuka | Day 3: Explore Mechuka | Day 4: Return',
  ARRAY['Mechuka Valley', 'Siyom River', 'Samten Yongcha Monastery'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
),

-- Itanagar Local (Budget)
(
  'Itanagar Local Sightseeing',
  'Half-day city tour covering major attractions in Itanagar.',
  NOW(),
  8,
  2500.00,
  4,
  'Maruti WagonR',
  'Visit Ita Fort, Ganga Lake, State Museum',
  ARRAY['Ita Fort', 'Ganga Lake', 'State Museum'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
),

-- Pasighat (Sedan)
(
  'Pasighat Riverside Tour',
  'Relaxing trip to Arunachal’s oldest town with river views.',
  NOW(),
  48,
  8500.00,
  4,
  'Swift Dzire',
  'Day 1: Dibrugarh → Pasighat | Day 2: River exploration & return',
  ARRAY['Siang River', 'Pasighat Town', 'Hanging Bridge'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
),

-- Group Tour (Traveller)
(
  'Tawang Group Expedition',
  'Group-friendly Tawang tour with large vehicle support.',
  NOW(),
  72,
  30000.00,
  12,
  'Force Traveller',
  'Day 1: Tezpur → Dirang | Day 2: Dirang → Tawang | Day 3: Explore Tawang',
  ARRAY['Sela Pass', 'Tawang Monastery', 'Snow Views'],
  'https://hpobmsfwvrewpjqnmhsv.supabase.co/storage/v1/object/public/tour_images/1777908732287-964aor.jpg',
  true
);


ALTER TABLE tour_packages
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';


UPDATE tour_packages
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url != '';
