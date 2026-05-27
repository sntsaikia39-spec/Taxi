# Database Schema — Rina's Tours and Travels (RT&T)

Supabase (PostgreSQL). Run each file in the Supabase SQL Editor in the order listed below.
All 10 tables live here — there are no phantom `pricing_rules` or `hourly_rates` tables;
pricing is embedded on the `cars` row (`per_km_charge`, `per_hr_charge`).

## Execution Order

| # | File | Tables Created | Notes |
|---|------|---------------|-------|
| 1 | `cars_schema.sql` | `cars` | Vehicle fleet + driver info. `per_km_charge` drives airport fare; `per_hr_charge` drives hourly fare. |
| 2 | `destinations_schema.sql` | `destinations` | Drop-off points measured FROM Hollongi Airport. Includes `distance_km` and `estimated_duration_minutes`. |
| 3 | `tour_packages.sql` | `tour_packages` | Tour catalogue with fixed price per package. |
| 4 | `bookings_and_payments_schema.sql` | `bookings`, `payments`, `payment_records` | Core transaction tables. Creates enum types first. Includes ALTER statements for cancellation and refund columns. |
| 5 | `assignments_schema.sql` | `vehicle_assignments` | Links a booking to a car for a time window. Used for conflict detection. |
| 6 | `admin_schema.sql` | `admins` | Admin users, bcrypt passwords, RLS. |
| 7 | `reviews_schema.sql` | `reviews` | Polymorphic reviews for tours and taxi bookings. Includes seed data. |
| 8 | `app_settings_schema.sql` | `app_settings` | Key-value settings. Seeds `conflict_control_enabled = 'true'`. |
| 9 | `system_events_schema.sql` | `system_events` | Sanitized operational/audit events for the admin Logs tab. |
| 10 | `seed_system_logs_setting.sql` | - | One-time seed for `app_settings.system_logs_max_rows` in existing deployments. |
| 11 | `cleanup_demo_payment_data.sql` | - | One-time cleanup for demo payment rows (`demo_txn_*` / `razorpay_demo`). |

## Booking Types & Their Key Columns

| `booking_type` | Uses `destination_id` | Uses `tour_package_id` | Uses `no_of_hours` | Pricing formula |
|---------------|----------------------|----------------------|-------------------|-----------------|
| `airport`     | ✅ (FK → destinations) | — | — | `distance_km × cars.per_km_charge` |
| `hourly`      | — | — | ✅ | `no_of_hours × cars.per_hr_charge` |
| `tour`        | — | ✅ (FK → tour_packages) | — | `tour_packages.price` (fixed) |

## Key Relationships

```
cars ──────────────────────────────── vehicle_assignments
                                               │
bookings ──────────────────────────── vehicle_assignments
   │
   ├── payments ── payment_records
   │
   ├── destination_id → destinations      (airport bookings)
   ├── tour_package_id → tour_packages    (tour bookings)
   │
   └── reviews (polymorphic, reviewable_type = 'taxi_booking')

tour_packages → reviews (polymorphic, reviewable_type = 'tour')

admins        (standalone — JWT auth, no FK to bookings)
app_settings  (standalone — key/value feature flags)
```
