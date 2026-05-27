-- Convert tour_packages.arrival_time from TIMESTAMP to TIME.
-- Safe for existing data: preserves hour/minute/second component.

BEGIN;

ALTER TABLE public.tour_packages
  ALTER COLUMN arrival_time TYPE TIME
  USING arrival_time::time;

COMMIT;

