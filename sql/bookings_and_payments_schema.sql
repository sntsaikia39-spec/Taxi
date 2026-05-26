-- Booking type
DO $$ BEGIN
    CREATE TYPE booking_type_enum AS ENUM ('airport', 'hourly', 'tour');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Booking status
DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Payment type (user intent)
DO $$ BEGIN
    CREATE TYPE payment_type_enum AS ENUM ('partial', 'full');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL UNIQUE,

    booking_type booking_type_enum NOT NULL,

    user_name TEXT NOT NULL,
    user_email TEXT,
    phone TEXT NOT NULL,
    passenger_count INTEGER NOT NULL CHECK (passenger_count > 0),

    -- ✅ FIXED TIME MODEL
    start_datetime TIMESTAMP  NOT NULL,
    end_datetime TIMESTAMP NOT NULL,

    -- Type-specific
    destination_id UUID,
    tour_package_id UUID,
    no_of_hours NUMERIC(10,2),

    car_model VARCHAR,

    amount_total NUMERIC(10,2) NOT NULL CHECK (amount_total >= 0),

    booking_status booking_status_enum DEFAULT 'pending',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- sanity check
    CONSTRAINT check_booking_datetime CHECK (end_datetime > start_datetime)
);

CREATE INDEX IF NOT EXISTS idx_bookings_active_model_window
  ON bookings(car_model, start_datetime, end_datetime)
  WHERE booking_status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_bookings_active_status_window
  ON bookings(booking_status, start_datetime, end_datetime)
  WHERE booking_status IN ('pending', 'confirmed');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_booking_datetime'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT check_booking_datetime CHECK (end_datetime > start_datetime);
  END IF;
END $$;

-- =========================
-- PAYMENTS TABLE
-- =========================
-- This table stores ALL payment-related data for a booking.
-- One booking = one row (single payment model)

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- FK: Links payment to booking
    booking_id UUID NOT NULL UNIQUE,

    -- Payment plan selected by user
    -- 'partial' = 30% online + rest cash
    -- 'full' = 100% online
    payment_type TEXT NOT NULL CHECK (payment_type IN ('partial', 'full')),

    -- Total amount for the booking (copied from bookings for consistency)
    amount_total NUMERIC(10,2) NOT NULL CHECK (amount_total >= 0),

    -- Amount paid online via gateway
    -- For full: = amount_total
    -- For partial: = ~30% of total
    amount_online_paid NUMERIC(10,2) DEFAULT 0 CHECK (amount_online_paid >= 0),

    -- Online transaction status
    -- 'pending' = not completed
    -- 'success' = payment done
    -- 'failed' = payment failed
    txn_status TEXT DEFAULT 'pending' CHECK (txn_status IN ('pending', 'success', 'failed')),

    -- Payment gateway transaction reference
    txn_id TEXT,

    -- Gateway used (e.g., razorpay)
    gateway TEXT,

    -- =========================
    -- CASH PAYMENT TRACKING
    -- =========================

    -- Amount collected in cash at airport
    -- 0 = not paid yet or payment_type = "full"
    -- >0 = cash received
    amount_cash_paid NUMERIC(10,2) DEFAULT 0 CHECK (amount_cash_paid >= 0),

    -- Timestamp when cash was collected
    cash_paid_at TIMESTAMP WITH TIME ZONE,

    -- Admin / staff who collected the cash
    cash_collected_by TEXT,

    -- =========================
    -- DERIVED STATUS
    -- =========================

    -- 'pending' = nothing paid or txn failed
    -- 'partial' = some paid but not full
    -- 'paid' = full amount paid
    payment_status TEXT DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'partial', 'paid')),

    -- Record creation timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- =========================
    -- CONSTRAINTS
    -- =========================

    -- Ensure total paid never exceeds total amount
    CONSTRAINT check_total_paid_valid CHECK (
        amount_online_paid + amount_cash_paid <= amount_total
    ),

    -- Ensure full payment does not allow cash
    CONSTRAINT check_full_payment_no_cash CHECK (
        payment_type != 'full' OR amount_cash_paid = 0
    ),

    -- Foreign key constraint
    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(booking_id)
        ON DELETE CASCADE
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);




CREATE TABLE payment_records (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id        UUID        NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  booking_id        TEXT        NOT NULL,
  txn_type          TEXT        NOT NULL CHECK (txn_type IN ('online', 'cash')),
  txn_id            TEXT,                          -- Razorpay payment_id for online, null for cash
  gateway           TEXT,                          -- 'razorpay' or null
  amount            NUMERIC(10,2) NOT NULL,
  currency          TEXT        NOT NULL DEFAULT 'INR',
  status            TEXT        NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
  razorpay_order_id TEXT,                          -- Razorpay order ID
  collected_by      TEXT,                          -- for cash: admin who collected
  collected_at      TIMESTAMPTZ,                   -- for cash: when collected
  invoice_number    TEXT        UNIQUE,            -- stable invoice number (set on online txn, null for cash)
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- 1. Airport Transfer Booking
INSERT INTO bookings (
    booking_id, 
    booking_type, 
    user_name, 
    user_email, 
    phone, 
    passenger_count, 
    start_datetime, 
    end_datetime, 
    destination_id, 
    car_model, 
    amount_total, 
    booking_status
) VALUES (
    uuid_generate_v4(),
    'airport',
    'John Doe',
    'john.doe@example.com',
    '+15550102030',
    2,
    '2026-05-15 10:30:00',
    '2026-05-15 11:15:00',
    uuid_generate_v4(), -- Simulated destination_id
    'Tesla Model S',
    85.50,
    'confirmed'
);

-- 2. Hourly Rental Booking
INSERT INTO bookings (
    booking_id, 
    booking_type, 
    user_name, 
    user_email, 
    phone, 
    passenger_count, 
    start_datetime, 
    end_datetime, 
    no_of_hours, 
    car_model, 
    amount_total, 
    booking_status
) VALUES (
    uuid_generate_v4(),
    'hourly',
    'Jane Smith',
    'jane.smith@business.com',
    '+15550998877',
    1,
    '2026-05-20 09:00:00',
    '2026-05-20 13:00:00',
    4.00,
    'Mercedes-Benz E-Class',
    300.00,
    'pending'
);

-- 3. Tour Package Booking
INSERT INTO bookings (
    booking_id, 
    booking_type, 
    user_name, 
    user_email, 
    phone, 
    passenger_count, 
    start_datetime, 
    end_datetime, 
    tour_package_id, 
    car_model, 
    amount_total, 
    booking_status
) VALUES (
    uuid_generate_v4(),
    'tour',
    'Alice Wong',
    'alice.w@traveler.net',
    '+442079460958',
    4,
    '2026-06-01 08:00:00',
    '2026-06-01 20:00:00',
    uuid_generate_v4(), -- Simulated tour_package_id
    'Toyota Alphard',
    550.00,
    'completed'
);




-- Alterations

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;


ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none'
    CHECK (refund_status IN ('none', 'pending', 'processed', 'failed')),
  ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_id TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS refund_notes TEXT;
