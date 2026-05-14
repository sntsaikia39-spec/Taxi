CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL,
    car_id UUID NOT NULL,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
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