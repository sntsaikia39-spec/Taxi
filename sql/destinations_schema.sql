CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  distance_km DECIMAL(10, 2),
  estimated_duration VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO public.destinations (
  name,
  description,
  distance_km,
  estimated_duration,
  is_active
) VALUES

-- Arunachal Pradesh
('Itanagar', 'Capital city of Arunachal Pradesh', 15, '30 mins', true),
('Naharlagun', 'Gateway town near Itanagar', 10, '20 mins', true),
('Ziro', 'Scenic valley famous for Apatani tribe', 110, '4 hrs', true),
('Bomdila', 'Hill town with monasteries', 320, '8 hrs', true),
('Dirang', 'Valley town near Tawang route', 290, '7 hrs', true),
('Tawang', 'Famous for Tawang Monastery', 450, '12 hrs', true),
('Pasighat', 'Oldest town of Arunachal', 160, '5 hrs', true),
('Roing', 'Scenic town near Dibang Valley', 200, '6 hrs', true),
('Tezu', 'Town in Lohit district', 230, '7 hrs', true),
('Mechuka', 'Remote valley near Indo-China border', 500, '14 hrs', true),
('Along (Aalo)', 'Town on the banks of Siyom river', 380, '10 hrs', true),
('Seppa', 'East Kameng district HQ', 160, '5 hrs', true),
('Changlang', 'Town near Myanmar border', 300, '9 hrs', true),
('Khonsa', 'Tirap district HQ', 320, '10 hrs', true),
('Daporijo', 'Upper Subansiri HQ', 280, '9 hrs', true),

-- Assam
('Dispur', 'Major city and gateway to Northeast', 330, '8 hrs', true),
('Tezpur', 'City on Brahmaputra river', 280, '7 hrs', true),
('Dibrugarh', 'Tea city of India', 250, '7 hrs', true),
('Jorhat', 'Cultural capital of Assam', 230, '6 hrs', true),
('Silchar', 'Barak valley city', 520, '14 hrs', true),
('Nagaon', 'Central Assam town', 300, '7 hrs', true),
('Tinsukia', 'Industrial town in upper Assam', 280, '8 hrs', true),

-- Meghalaya
('Cherrapunji', 'One of the wettest places on Earth', 460, '11 hrs', true),
('Dawki', 'Border town with crystal clear river', 470, '12 hrs', true),
('Mawlynnong', 'Cleanest village in Asia', 480, '12 hrs', true),

-- Nagaland
('Kohima', 'Capital of Nagaland', 400, '10 hrs', true),
('Dimapur', 'Commercial hub of Nagaland', 370, '9 hrs', true),
('Mon', 'Known for Konyak tribe', 550, '14 hrs', true),

-- Manipur
('Imphal', 'Capital of Manipur', 500, '12 hrs', true),
('Bishnupur', 'Known for Loktak Lake', 520, '13 hrs', true),

-- Mizoram
('Aizawl', 'Capital of Mizoram', 550, '14 hrs', true),
('Lunglei', 'Second largest city in Mizoram', 600, '15 hrs', true),

-- Tripura
('Agartala', 'Capital of Tripura', 600, '15 hrs', true),
('Udaipur (Tripura)', 'Temple town of Tripura', 620, '16 hrs', true),

-- Sikkim
('Gangtok', 'Capital of Sikkim', 650, '16 hrs', true),
('Namchi', 'South Sikkim town', 670, '17 hrs', true),

-- Additional useful local routes
('Banderdewa', 'Entry point to Arunachal', 20, '40 mins', true),
('Ganga Lake', 'Popular tourist spot near Itanagar', 25, '45 mins', true),
('Hollongi Airport', 'Donyi Polo Airport', 5, '10 mins', true);



-- 1. Add the new integer column
ALTER TABLE destinations
  ADD COLUMN estimated_duration_minutes INTEGER;

-- 2. Backfill from existing string data
UPDATE destinations SET estimated_duration_minutes =
  CASE
    -- "X mins" / "X min"
    WHEN estimated_duration ~* '^\d+\s*mins?$'
      THEN (regexp_match(estimated_duration, '^(\d+)'))[1]::integer

    -- "X hrs" / "X hr" / "X hours" / "X hour"  (whole hours only)
    WHEN estimated_duration ~* '^\d+\s*(hrs?|hours?)$'
      THEN (regexp_match(estimated_duration, '^(\d+)'))[1]::integer * 60

    -- "X hrs Y mins" mixed
    WHEN estimated_duration ~* '^\d+\s*(hrs?|hours?)\s*\d+\s*mins?$'
      THEN (regexp_match(estimated_duration, '^(\d+)'))[1]::integer * 60
         + (regexp_match(estimated_duration, '(\d+)\s*mins?$'))[1]::integer

    ELSE 60  -- fallback: 1 hour
  END;

-- 3. Make NOT NULL once backfill is verified
ALTER TABLE destinations
  ALTER COLUMN estimated_duration_minutes SET NOT NULL;

-- 4. Drop the old string column
ALTER TABLE destinations
  DROP COLUMN estimated_duration;
