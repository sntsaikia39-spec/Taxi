CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    car_id UUID NOT NULL,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    conflict_override BOOLEAN NOT NULL DEFAULT false,
    conflict_override_reason TEXT,
    conflict_override_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_assignment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_assignment_car
        FOREIGN KEY (car_id)
        REFERENCES cars(id)
        ON DELETE RESTRICT,
    
    CONSTRAINT check_valid_datetime CHECK (end_datetime > start_datetime)
);

CREATE INDEX IF NOT EXISTS idx_assignments_booking_id ON vehicle_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_assignments_car_id ON vehicle_assignments(car_id);
CREATE INDEX IF NOT EXISTS idx_assignments_datetime ON vehicle_assignments(start_datetime, end_datetime);

-- Existing databases: add override columns if the table already existed.
ALTER TABLE vehicle_assignments
  ADD COLUMN IF NOT EXISTS conflict_override BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS conflict_override_reason TEXT,
  ADD COLUMN IF NOT EXISTS conflict_override_at TIMESTAMP WITH TIME ZONE;

-- Mark already-overlapping rows as explicit legacy overrides before adding
-- the non-override trigger guard below.
UPDATE vehicle_assignments va
SET
  conflict_override = true,
  conflict_override_reason = COALESCE(conflict_override_reason, 'Existing overlapping assignment marked as admin override during schema upgrade.'),
  conflict_override_at = COALESCE(conflict_override_at, NOW())
WHERE EXISTS (
  SELECT 1
  FROM bookings this_booking
  JOIN vehicle_assignments other ON other.id <> va.id
  JOIN bookings other_booking ON other_booking.booking_id = other.booking_id
  WHERE this_booking.booking_id = va.booking_id
    AND this_booking.booking_status IN ('pending', 'confirmed')
    AND other_booking.booking_status IN ('pending', 'confirmed')
    AND other.car_id = va.car_id
    AND other.start_datetime < va.end_datetime
    AND other.end_datetime > va.start_datetime
);

-- Prevent accidental hard conflicts at the database layer. This is a trigger
-- instead of an exclusion constraint because only pending/confirmed bookings
-- should block capacity; cancelled/completed historical assignments should not.
ALTER TABLE vehicle_assignments
  DROP CONSTRAINT IF EXISTS vehicle_assignments_no_overlap_without_override;

CREATE OR REPLACE FUNCTION validate_vehicle_assignment_conflict()
RETURNS trigger AS $$
DECLARE
  new_booking_status booking_status_enum;
BEGIN
  SELECT booking_status
  INTO new_booking_status
  FROM bookings
  WHERE booking_id = NEW.booking_id;

  IF NEW.conflict_override
     OR new_booking_status IS NULL
     OR new_booking_status NOT IN ('pending', 'confirmed') THEN
    RETURN NEW;
  END IF;

  -- Serialise same-car checks so two concurrent non-override inserts cannot
  -- both pass the overlap check before either transaction commits.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.car_id::text));

  IF EXISTS (
    SELECT 1
    FROM vehicle_assignments other
    JOIN bookings other_booking ON other_booking.booking_id = other.booking_id
    WHERE other.id <> NEW.id
      AND other.car_id = NEW.car_id
      AND other_booking.booking_status IN ('pending', 'confirmed')
      AND other.start_datetime < NEW.end_datetime
      AND other.end_datetime > NEW.start_datetime
  ) THEN
    RAISE EXCEPTION 'Overlapping active vehicle assignment for car %', NEW.car_id
      USING ERRCODE = '23P01';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_vehicle_assignment_conflict ON vehicle_assignments;
CREATE TRIGGER trg_validate_vehicle_assignment_conflict
BEFORE INSERT OR UPDATE OF car_id, start_datetime, end_datetime, conflict_override
ON vehicle_assignments
FOR EACH ROW
EXECUTE FUNCTION validate_vehicle_assignment_conflict();




-- 1. Assigning the Airport Transfer (John Doe) to the Innova Crysta
INSERT INTO vehicle_assignments (
    booking_id,
    car_id,
    start_datetime,
    end_datetime
) 
SELECT 
    b.booking_id, 
    c.id, 
    b.start_datetime, 
    b.end_datetime
FROM bookings b, cars c
WHERE b.user_name = 'John Doe' 
  AND c.number_plate = 'TR03IJ5566' -- Innova Crysta
LIMIT 1;

-- 2. Assigning the Hourly Rental (Jane Smith) to a Premium Toyota Innova
INSERT INTO vehicle_assignments (
    booking_id,
    car_id,
    start_datetime,
    end_datetime
) 
SELECT 
    b.booking_id, 
    c.id, 
    b.start_datetime, 
    b.end_datetime
FROM bookings b, cars c
WHERE b.user_name = 'Jane Smith' 
  AND c.number_plate = 'TR02EF1122' -- Toyota Innova
LIMIT 1;

-- 3. Assigning the Tour Package (Alice Wong) to the Toyota Alphard 
-- (Assuming Alphard was intended to be the Innova Crysta TR03IJ5566 or similar luxury)
INSERT INTO vehicle_assignments (
    booking_id,
    car_id,
    start_datetime,
    end_datetime
) 
SELECT 
    b.booking_id, 
    c.id, 
    b.start_datetime, 
    b.end_datetime
FROM bookings b, cars c
WHERE b.user_name = 'Alice Wong' 
  AND c.number_plate = 'TR04MN9900' -- Force Traveller (for the group tour)
LIMIT 1;



INSERT INTO vehicle_assignments (
    booking_id,
    car_id,
    start_datetime,
    end_datetime
) 
SELECT 
    'c6c9020c-3af4-49a8-9517-d3598ff0a077', -- booking_id from your JSON
    id, 
    '2026-05-09 22:22:00',                 -- start_datetime from JSON
    '2026-05-09 22:32:00'                  -- end_datetime from JSON
FROM cars 
WHERE number_plate = 'TR02GH3344'          -- Specifically the Mahindra Xylo plate
LIMIT 1;
