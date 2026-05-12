# TaxiHollongi — Complete Application Documentation

**Product:** Rina's Tours and Travels  
**Version:** 1.0  
**Last Updated:** 2026-05-12  
**Branch:** v2-unstable  

---

## Table of Contents

1. [Business Requirements Document (BRD)](#1-business-requirements-document-brd)
2. [Product Requirements Document (PRD)](#2-product-requirements-document-prd)
3. [Software Requirements Specification (SRS)](#3-software-requirements-specification-srs)
4. [System Architecture Document (SAD)](#4-system-architecture-document-sad)
5. [High-Level Design (HLD)](#5-high-level-design-hld)
6. [Low-Level Design (LLD)](#6-low-level-design-lld)
7. [Technical Design Document (TDD)](#7-technical-design-document-tdd)
8. [Entity-Relationship Diagram (ERD)](#8-entity-relationship-diagram-erd)
9. [Data Flow Diagrams (DFDs)](#9-data-flow-diagrams-dfds)
10. [UML Diagrams](#10-uml-diagrams)
11. [API Documentation](#11-api-documentation)
12. [Development Documentation](#12-development-documentation)

---

## 1. Business Requirements Document (BRD)

### 1.1 Business Overview

Rina's Tours and Travels is a taxi and tour service operator based in Itanagar, Arunachal Pradesh. The business provides:

- **Airport taxi services** to/from Hollongi (Donyi Polo) Airport
- **Curated tour packages** covering Arunachal Pradesh destinations (Tawang, Ziro, Bomdila, etc.)
- **Hourly taxi rental** services within Itanagar

The digital platform is developed under the product name **TaxiHollongi**.

### 1.2 Business Problem

The business previously relied on phone calls, WhatsApp, and manual payment tracking. This caused:

- Lost bookings due to missed calls or unanswered messages
- No clear payment tracking or receipts for customers
- Manual (error-prone) conflict detection for vehicle availability
- No centralized view of bookings for the admin team
- No formal invoice or confirmation system for customers

### 1.3 Business Objectives

| # | Objective |
|---|-----------|
| 1 | Digitize the complete booking and payment process |
| 2 | Provide customers with a self-service web platform accessible on mobile |
| 3 | Give the admin team a centralized operations dashboard |
| 4 | Track all payments (online + cash) with digital invoices |
| 5 | Automate email notifications for booking confirmation and driver assignment |
| 6 | Reduce administrative overhead for routine operations |

### 1.4 Stakeholders

| Stakeholder | Role | Key Needs |
|-------------|------|-----------|
| Customers | End users booking taxis and tours | Easy booking, transparent pricing, payment receipts, booking history |
| Admin / Operator | Rina's Tours staff | Booking management, vehicle assignment, payment tracking, CRUD over content |
| Drivers | Assigned to bookings by admin | Receive notifications about trip assignments via email |
| Developer | TaxiHollongi development team | Clean API surface, maintainable TypeScript codebase |

### 1.5 Business Constraints

- Platform must be fully functional on mobile devices (primary user device)
- Payment gateway limited to Indian market — Razorpay (INR only)
- Deployed on Vercel Hobby plan (10-second function timeout, limited execution units)
- No real-time driver GPS integration in current scope
- Refund processing is manual (no automated refund flow)

### 1.6 Success Metrics

- Volume of online bookings vs. prior phone-based bookings
- Payment collection rate: online advance vs. cash-only
- Customer re-booking rate
- Admin time saved on manual booking and payment tracking operations

---

## 2. Product Requirements Document (PRD)

### 2.1 Product Vision

A mobile-first web application that lets customers book airport taxis, tour packages, and hourly taxis from Rina's Tours and Travels — and gives the admin team a single dashboard to manage all operations.

### 2.2 Target Users

**Primary — Customer**
- Travelers arriving at or departing from Hollongi (Donyi Polo) Airport
- Tourists looking for guided tour packages in Arunachal Pradesh
- Local residents needing hourly taxi services
- Age range: 18–60, smartphone users, moderate digital literacy

**Secondary — Admin**
- Rina's Tours and Travels operations staff
- Manages bookings, vehicles, pricing, and payments through the admin dashboard

### 2.3 Core Features

#### F-01: User Authentication
- Email/password signup with mandatory email verification
- Login with verified credentials; session persistence across tabs
- Google OAuth login
- Password change flow
- Email verification link enables cross-device auto-login

#### F-02: Airport Taxi Booking
- Select source and destination from managed list
- Select date, time, and passenger count
- View only available car models for the selected time window
- See full fare breakdown before confirming

#### F-03: Tour Package Booking
- Browse active tour packages by destination category
- View itinerary, highlights, duration, pricing, and multi-image gallery
- Book a tour for a specific date with passenger count selection
- View star ratings and customer reviews per package

#### F-04: Hourly Taxi Booking
- Select rental duration (hours or days)
- Select start date and time from Itanagar base
- View applicable rates before confirming

#### F-05: Payment Processing
- **Partial mode**: 30% advance paid online (Razorpay), 70% cash paid to driver
- **Full mode**: 100% paid online (Razorpay)
- Real-time payment status tracking per booking
- Invoice PDF generation and in-browser download
- Admin confirms cash collection with timestamp

#### F-06: Customer Booking Management
- View all bookings with live status (pending, confirmed, completed, cancelled)
- Download invoice for confirmed/completed bookings
- Cancel booking (allowed only >24 hours before trip start)
- Resume payment for pending (unpaid) bookings

#### F-07: Review System
- Submit a 1–5 star rating with title and comment on completed bookings or tours
- One review enforced per user per item (database constraint)
- Reviews displayed on tour package pages with aggregated rating stats

#### F-08: Admin Dashboard
- View and search/filter all bookings by status
- Assign specific vehicle (car) and driver to a confirmed booking
- Confirm cash payment received from customer
- Full CRUD: cars, destinations, pricing rules, tour packages
- Process cancellation requests
- Toggle conflict control system on/off
- View conflicting booking pairs

#### F-09: Email Notifications
- Booking confirmation email to customer (on payment verified)
- Driver assignment notification email (on vehicle assigned)
- Cancellation confirmation email to customer

### 2.4 Out of Scope (Current Version)

- Real-time GPS driver tracking
- Driver-facing mobile application
- SMS or WhatsApp notifications (placeholders exist, not integrated)
- Automated refund processing (manual admin step)
- Multi-language support
- In-app customer support chat
- Advanced analytics and reporting

### 2.5 Customer Booking Journey

```
[Land on Homepage]
        │
        ▼
[Choose Service Type]
  ┌─────┴──────┬──────────────┐
  ▼            ▼              ▼
[Book Taxi] [Book Tour] [Hourly Taxi]
  │            │              │
  └─────┬──────┴──────────────┘
        ▼
[Enter Booking Details]
[Select Available Car Model]
[View Fare Breakdown]
        │
        ▼
[Sign In / Sign Up]  ←── If not authenticated
        │
        ▼
[Choose Payment Mode: Partial 30% | Full 100%]
        │
        ▼
[Razorpay Payment Gateway]
        │
        ▼
[Booking Confirmed + Invoice Generated]
[Email Confirmation Sent]
        │
        ▼
[Admin Assigns Vehicle & Driver]
[Driver Notified by Email]
        │
        ▼
[Trip Completed]
        │
        ▼
[Customer Submits Review]
```

---

## 3. Software Requirements Specification (SRS)

### 3.1 Functional Requirements

#### FR-01: User Authentication

| ID | Requirement |
|----|-------------|
| FR-01.1 | The system shall allow users to register with an email address and password |
| FR-01.2 | The system shall send an email verification link upon registration |
| FR-01.3 | The system shall not allow login before the email address is verified |
| FR-01.4 | The system shall allow users to log in with a verified email and password |
| FR-01.5 | The system shall support Google OAuth as an alternative login method |
| FR-01.6 | The system shall allow authenticated users to change their password |
| FR-01.7 | Email verification links shall auto-login the user on any device upon click |

#### FR-02: Booking

| ID | Requirement |
|----|-------------|
| FR-02.1 | The system shall allow airport taxi bookings with source, destination, date, time, and passenger count |
| FR-02.2 | The system shall allow tour package bookings with a selected date and passenger count |
| FR-02.3 | The system shall allow hourly taxi bookings with selected duration and start time |
| FR-02.4 | The system shall display only car models that have at least one available vehicle for the selected time window |
| FR-02.5 | The system shall calculate and display the full fare breakdown before booking confirmation |
| FR-02.6 | The system shall require user authentication before accepting a booking |
| FR-02.7 | The system shall generate a unique booking ID for every booking (format: `BK` + `YYYYMMDD` + 6 random chars) |
| FR-02.8 | When conflict control is enabled, the system shall prevent booking a car model with no available units |

#### FR-03: Payment

| ID | Requirement |
|----|-------------|
| FR-03.1 | The system shall offer partial payment (30% online) and full payment (100% online) modes |
| FR-03.2 | The system shall integrate Razorpay as the online payment gateway |
| FR-03.3 | The system shall verify Razorpay payment signatures server-side (HMAC-SHA256) before confirming a booking |
| FR-03.4 | The system shall create a payment record and generate an invoice number upon successful payment verification |
| FR-03.5 | The system shall allow admin to mark the cash portion of a partial payment as collected |
| FR-03.6 | The system shall track payment status: `pending`, `partial`, `paid`, `refunded` |
| FR-03.7 | Customers shall be able to download an invoice PDF for their confirmed bookings |

#### FR-04: Admin Operations

| ID | Requirement |
|----|-------------|
| FR-04.1 | Admin shall authenticate via email/password and receive a JWT token valid for 24 hours |
| FR-04.2 | Admin shall view all bookings with filter capability by status |
| FR-04.3 | Admin shall assign a specific vehicle and driver to a booking post-payment |
| FR-04.4 | Admin shall confirm cash payment collection with their name and the collected amount |
| FR-04.5 | Admin shall perform full CRUD on cars, destinations, pricing rules, and tour packages |
| FR-04.6 | Admin shall be able to toggle the conflict control system on or off |
| FR-04.7 | Admin shall process customer cancellation requests |
| FR-04.8 | Admin shall create new admin accounts with hashed passwords |

#### FR-05: Reviews

| ID | Requirement |
|----|-------------|
| FR-05.1 | Authenticated users shall be able to rate a completed booking or tour (1–5 stars) |
| FR-05.2 | The system shall enforce a maximum of one review per user per booking/tour (unique DB constraint) |
| FR-05.3 | Reviews and aggregated rating statistics shall be visible on tour package pages |
| FR-05.4 | Admin shall be able to hide any review from public display |

### 3.2 Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-01 | Performance | Page load time on 4G mobile | < 3 seconds |
| NFR-02 | Availability | Platform uptime | 99.5% (Vercel SLA) |
| NFR-03 | Security | API secret keys must never appear in client-side code | Zero exceptions |
| NFR-04 | Scalability | Concurrent user handling | 100 simultaneous users |
| NFR-05 | Usability | UI must be fully functional on mobile screens (≥320px) | Mobile-first |
| NFR-06 | Maintainability | TypeScript strict mode; modular lib architecture | Enforced via tsconfig |
| NFR-07 | SEO | Semantic HTML, Next.js Metadata API, route-specific SEO pages | Organic traffic optimized |
| NFR-08 | Browser Support | Chrome, Safari, Firefox — last 2 major versions | No IE support |
| NFR-09 | Payment Security | No raw card data handled by the application server | PCI-compliant via Razorpay |
| NFR-10 | Data Privacy | Personal data stored in Supabase (SOC 2 compliant) | Supabase managed |

### 3.3 System Constraints

- Vercel Hobby plan: 10-second serverless function timeout; limited monthly execution budget
- Supabase free tier: 500MB database storage, 2GB monthly bandwidth
- Razorpay: Indian market only, INR currency, minimum amount ₹1
- No native server-side rendering for user-specific pages (all CSR via Supabase client)

---

## 4. System Architecture Document (SAD)

### 4.1 Architecture Style

**Monolithic Full-Stack Web Application** built on Next.js 14 App Router.

The system follows a **3-Tier Architecture**:

1. **Presentation Layer** — Next.js React pages with Tailwind CSS, GSAP animations, and Lottie
2. **Application Layer** — Next.js API Route Handlers (serverless functions on Vercel)
3. **Data Layer** — Supabase managed PostgreSQL database

### 4.2 System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                        │
│              Next.js React Pages + Tailwind CSS                │
│          AuthContext (Supabase)  │  AdminContext (JWT)         │
│                      Zustand Global Store                      │
└─────────────────────────┬──────────────────────────────────────┘
                          │  HTTPS  (Next.js App Router)
┌─────────────────────────▼──────────────────────────────────────┐
│              VERCEL — SERVERLESS FUNCTIONS (10s limit)         │
│                    Next.js API Routes /api/*                    │
│                                                                │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────┐  │
│  │ /admin/*  │ │/bookings/ │ │/payment/  │ │/tours/       │  │
│  │ /auth/*   │ │/cars/*    │ │           │ │/destinations/│  │
│  │           │ │           │ │           │ │/reviews/     │  │
│  └───────────┘ └───────────┘ └───────────┘ └──────────────┘  │
│                                                                │
│         lib/db.ts  lib/payment-db.ts  lib/payment.ts          │
│         lib/utils.ts  lib/validation.ts  lib/invoice.ts       │
└──┬─────────────────────┬──────────────┬───────────────────────┘
   │                     │              │
   ▼                     ▼              ▼
┌──────────┐      ┌────────────┐  ┌──────────┐   ┌────────────┐
│ Supabase │      │  Razorpay  │  │  Resend  │   │  Vercel    │
│PostgreSQL│      │  Payment   │  │  Email   │   │  Cron Jobs │
│+ Auth    │      │  Gateway   │  │  API     │   │ (daily)    │
└──────────┘      └────────────┘  └──────────┘   └────────────┘
```

### 4.3 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 14.0.0 | Full-stack React framework, App Router |
| Language | TypeScript | 5.0.0 | Type-safe development |
| Styling | Tailwind CSS | 3.3.0 | Utility-first CSS framework |
| Database | Supabase (PostgreSQL) | — | Managed relational database |
| User Auth | Supabase Auth | 2.38.0 | Email/OAuth authentication |
| Admin Auth | bcryptjs + jsonwebtoken | — | Password hashing + JWT sessions |
| Payment | Razorpay | 2.9.1 | Indian payment gateway |
| Email | Resend API | 2.1.0 | Transactional email delivery |
| Email (fallback) | Nodemailer (SMTP) | 6.9.7 | SMTP email fallback |
| Animation | GSAP | 3.15.0 | Page and UI animations |
| Animation | @lottiefiles/dotlottie-react | 0.19.0 | Lottie JSON animations |
| PDF | jsPDF + html2canvas | — | Client-side invoice PDF generation |
| Global State | Zustand | 4.4.1 | Lightweight client state management |
| Toast Alerts | react-hot-toast | 2.4.1 | In-app user notifications |
| Icons | lucide-react | 0.292.0 | Icon library |
| Date Utilities | date-fns | 2.30.0 | Date formatting and calculation |
| HTTP Client | axios | 1.6.0 | HTTP requests |
| Deployment | Vercel | — | Cloud hosting, CDN, cron jobs |

### 4.4 Security Architecture

| Concern | Implementation |
|---------|----------------|
| User authentication | Supabase JWTs via managed session cookies |
| Admin authentication | bcryptjs password hash + JWT stored in localStorage |
| Secret API keys | Stored in server-only env vars — never in `NEXT_PUBLIC_*` |
| Payment security | Razorpay handles all card data (PCI DSS compliant) |
| Payment verification | HMAC-SHA256 signature check server-side before booking confirmation |
| HTTP security headers | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()` |
| Admin route protection | JWT middleware on every `/api/admin/*` handler |
| Input validation | `lib/validation.ts` applied to all user-facing inputs |
| Supabase RLS | Row Level Security enforced via anon-key client for user operations |

### 4.5 Deployment Architecture

```
┌──────────────┐      git push       ┌──────────────────────────┐
│    GitHub    │ ──────────────────► │   Vercel CI/CD Pipeline  │
│  Repository  │                     │   npm run build          │
└──────────────┘                     │   (generates changelog)  │
                                     └──────────┬───────────────┘
                                                │
                               ┌────────────────┴─────────────────┐
                               ▼                                   ▼
                    ┌──────────────────┐               ┌──────────────────┐
                    │  Static Assets   │               │  Serverless Fns  │
                    │  (CDN Edge)      │               │  API Routes      │
                    │  JS bundles      │               │  10s timeout     │
                    │  CSS, Images     │               │  Vercel Regions  │
                    └──────────────────┘               └──────────────────┘
                                                                │
                                                   ┌────────────┴────────────┐
                                                   ▼                         ▼
                                          ┌──────────────┐       ┌──────────────────┐
                                          │   Supabase   │       │  Vercel Cron Job │
                                          │  PostgreSQL  │       │  /api/admin/     │
                                          │  + Auth      │       │  cleanup-pending │
                                          └──────────────┘       │  daily 00:00 UTC │
                                                                  └──────────────────┘
```

---

## 5. High-Level Design (HLD)

### 5.1 System Modules

| Module | Responsibility | Key Files |
|--------|---------------|-----------|
| User Auth | Signup, login, verification, OAuth | `context/AuthContext.tsx`, `app/api/auth/` |
| Admin Auth | Admin login, JWT session, profile management | `context/AdminContext.tsx`, `app/api/admin/login` |
| Booking Engine | Create, read, update booking records | `app/api/bookings/`, `lib/db.ts` |
| Payment Processor | Razorpay order creation, signature verification, cash tracking | `app/api/payment/`, `lib/payment.ts`, `lib/payment-db.ts` |
| Vehicle Availability | Check car model availability for a time window | `app/api/cars/available-models` |
| Vehicle Assignment | Admin assigns specific car + driver to booking | `app/api/bookings/assign-vehicle` |
| Tour Management | CRUD for tour packages with images | `app/api/tours/`, `lib/database.ts` |
| Destination Management | CRUD for destinations and pricing rules | `app/api/destinations/`, `lib/database.ts` |
| Notification Service | Email delivery for confirmations and alerts | `lib/notifications.ts`, `lib/resend-notifications.ts` |
| Invoice Generator | Client-side PDF invoice creation | `lib/invoice.ts` |
| Review System | Submit and display ratings for tours/bookings | `app/api/reviews/`, `lib/reviews.ts` |
| Admin Dashboard | Unified operations UI | `app/admin/page.tsx` |
| Conflict Control | Toggle-controlled double-booking prevention | `app/api/admin/settings`, `app_settings` table |
| Cleanup Cron | Auto-delete stale pending bookings | `app/api/admin/cleanup-pending` |

### 5.2 Module Interaction

```
Customer Browser
    │
    ├── User Auth Module ─────────────────► Supabase Auth
    │
    ├── Booking Engine ───────────────────► bookings table (Supabase)
    │       └── Vehicle Availability ──────► cars + vehicle_assignments tables
    │
    ├── Payment Processor ────────────────► Razorpay API
    │       └── Payment DB ───────────────► payments table (Supabase)
    │
    ├── Notification Service ─────────────► Resend API → Customer Email
    │
    └── Invoice Generator ────────────────► jsPDF (client-side, no server needed)

Admin Browser
    │
    ├── Admin Auth Module ────────────────► JWT + bcrypt (admins table)
    │
    ├── Admin Dashboard ──────────────────► All modules above
    │       ├── Vehicle Assignment ────────► vehicle_assignments + cars tables
    │       ├── Cash Confirmation ─────────► payments table
    │       ├── Conflict Control Toggle ───► app_settings table
    │       └── Content CRUD ─────────────► tours, destinations, pricing_rules, cars tables
    │
    └── Cron: Cleanup Pending ────────────► bookings table (auto-delete >24h pending)
```

---

## 6. Low-Level Design (LLD)

### 6.1 User Authentication — Detailed Flow

**Signup:**
```
Client → POST /api/auth/signup (handled by Supabase client)
  supabase.auth.signUp({ email, password })
    └── Supabase sends verification email with link

User clicks email link → /auth/verify page
  GET /api/auth/exchange-code?code=<code>
    supabase.auth.exchangeCodeForSession(code)
      └── Creates session + sets JWT cookie
        └── User redirected to homepage (authenticated)
```

**Login:**
```
Client: supabase.auth.signInWithPassword({ email, password })
  Supabase validates credentials → returns session
    └── Session persisted in browser (auto-refresh)
```

**Admin Authentication:**
```
POST /api/admin/login
  Input: { email, password }
    SELECT * FROM admins WHERE email = ? AND is_active = true
      bcrypt.compare(password, admin.password_hash)
        If valid:
          jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '24h' })
          UPDATE admins SET last_login = NOW() WHERE id = ?
          Return: { token, admin: { email, fullName, role } }

Every protected admin API request:
  Authorization: Bearer <token>
    jwt.verify(token, JWT_SECRET) → { id, email, role }
      Proceed with admin operation
```

### 6.2 Booking Creation — Detailed Flow

```
POST /api/bookings/create
  Input: {
    booking_type: 'airport_taxi' | 'tour' | 'hourly',
    user_name, user_email, phone,
    passenger_count,
    start_datetime, end_datetime,
    destination_id?,      // airport_taxi only
    tour_package_id?,     // tour only
    no_of_hours?,         // hourly only
    car_model,
    amount_total
  }

  Step 1: Generate booking_id
    "BK" + format(now, "yyyyMMdd") + randomAlphaNum(6).toUpperCase()

  Step 2: Read conflict control setting
    SELECT value FROM app_settings WHERE key = 'conflict_control_enabled'

  Step 3 (if enabled): Check vehicle availability
    SELECT car_id FROM vehicle_assignments
    WHERE car_model = ? AND start_datetime < input.end AND end_datetime > input.start
    If any results → return 409 Conflict

  Step 4: Insert booking
    INSERT INTO bookings (booking_id, booking_type, user_name, user_email, phone,
    passenger_count, start_datetime, end_datetime, destination_id, tour_package_id,
    no_of_hours, car_model, amount_total, booking_status)
    VALUES (..., 'pending')

  Return: { success: true, booking_id }
```

### 6.3 Payment Processing — Detailed Flow

**Phase 1 — Create Razorpay Order:**
```
POST /api/payment/create-payment
  Input: { bookingId, amount, currency: 'INR', paymentType }

  razorpay.orders.create({
    amount: Math.round(amount * 100),  // paise
    currency: 'INR',
    receipt: bookingId
  }) → { id: orderId }

  supabaseAdmin.from('payments').insert({
    booking_id: bookingId,
    payment_type: paymentType,         // 'partial' | 'full'
    amount_total: bookingTotalAmount,
    amount_online_paid: amount,        // 30% or 100%
    amount_cash_paid: 0,
    txn_status: 'initiated',
    gateway: 'razorpay',
    payment_status: 'pending'
  })

  Return: { orderId, amount: amount * 100, currency }
```

**Phase 2 — Client Completes Payment:**
```
Browser opens Razorpay modal with { orderId, amount, currency, key }
User pays → Razorpay returns:
  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
```

**Phase 3 — Verify and Confirm:**
```
POST /api/payment/verify
  Input: { orderId, paymentId, signature, bookingId, amount, paymentType, userEmail, userName }

  HMAC verification:
    expectedSig = HMAC-SHA256(orderId + "|" + paymentId, RAZORPAY_KEY_SECRET)
    if expectedSig !== signature → return 400 "Invalid payment signature"

  UPDATE payments SET
    txn_status = 'paid',
    txn_id = paymentId,
    payment_status = paymentType === 'partial' ? 'partial' : 'paid'
  WHERE booking_id = bookingId

  UPDATE bookings SET
    booking_status = 'confirmed'
  WHERE booking_id = bookingId

  Generate invoiceNumber = "INV-" + format(now, "yyyyMMdd") + "-" + sequential

  sendBookingConfirmation({ to: userEmail, bookingId, invoiceNumber, ... })

  Return: { success: true, bookingId, invoiceNumber }
```

### 6.4 Vehicle Availability Algorithm

```
GET /api/cars/available-models
Query params: booking_date, start_time, end_time

const requestedStart = new Date(`${booking_date}T${start_time}`)
const requestedEnd   = new Date(`${booking_date}T${end_time}`)

// All active cars
const allCars = supabaseAdmin.from('cars').select('*').eq('is_active', true)

// Find car IDs that are assigned during the requested window
// Overlap condition: assignment_start < requestedEnd AND assignment_end > requestedStart
const occupiedCarIds = supabaseAdmin
  .from('vehicle_assignments')
  .select('car_id')
  .lt('start_datetime', requestedEnd.toISOString())
  .gt('end_datetime', requestedStart.toISOString())

// Available cars = all - occupied
const availableCars = allCars.filter(car => !occupiedCarIds.includes(car.id))

// Group by model and return with count
const models = groupBy(availableCars, 'model_name').map(group => ({
  model_name: group.model_name,
  class: group.class,
  capacity: group.capacity,
  per_km_charge: group.per_km_charge,
  per_hr_charge: group.per_hr_charge,
  available_count: group.cars.length
}))

Return: { models }
```

### 6.5 Conflict Control System

The `conflict_control_enabled` key in the `app_settings` table acts as a global toggle.

| Value | Behaviour |
|-------|-----------|
| `'true'` (default) | Vehicle conflicts are blocked at booking creation. Customers cannot book if no units are free. |
| `'false'` | Conflict check is skipped. Admin can manually manage overlapping assignments. |

Toggle endpoint: `POST /api/admin/settings` with `{ key: 'conflict_control_enabled', value: 'true' | 'false' }`.

### 6.6 Invoice Generation

```typescript
// lib/invoice.ts
interface InvoiceData {
  invoiceNumber: string
  bookingId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceType: string        // 'Airport Taxi' | 'Tour Package' | 'Hourly Taxi'
  bookingDate: string
  pickupTime: string
  vehicleModel: string
  passengers: number
  amountTotal: number
  amountOnlinePaid: number   // 30% or 100%
  amountCashDue: number      // 70% or 0
  paymentType: 'partial' | 'full'
}

// generateInvoicePDF(data: InvoiceData): jsPDF
//   Builds PDF with:
//   - Company header (Rina's Tours and Travels, logo, contact)
//   - Invoice meta (number, date, booking ID)
//   - Customer details table
//   - Service details table
//   - Payment breakdown table (online paid / cash due / total)
//   - Footer with terms
```

---

## 7. Technical Design Document (TDD)

### 7.1 Frontend Architecture

**State Management:**

| State Type | Tool | Examples |
|------------|------|---------|
| Authentication state | `AuthContext` (Supabase session) | `user`, `isLoading`, `signOut()` |
| Admin session | `AdminContext` (JWT + localStorage) | `isAdmin`, `adminEmail`, `login()` |
| UI / cross-component | Zustand store | Form data bridging pages |
| Local component state | `useState` | Form fields, toggles, loading flags |
| Server data | Direct Supabase calls in components | Bookings, tours, cars lists |

**Page Rendering Strategy:**

| Page | Strategy | Reason |
|------|----------|--------|
| Homepage | CSR | Animation-heavy (GSAP, Lottie), interactive |
| Book Taxi | CSR | Dynamic car availability, form-driven |
| Tours Listing | CSR | Fetches from Supabase client, dynamic filters |
| Tour Detail | CSR | Per-tour content with reviews |
| Booking Confirmed | CSR | Auth-dependent, payment state |
| My Bookings | CSR | User-specific, always-fresh data |
| Admin Dashboard | CSR | Real-time data, protected, no SEO needed |
| SEO Pages (`*-airport-taxi`, `arunachal-tours`) | Static with dynamic review section | Organic traffic; core content is static |

**Root Layout Structure:**
```
app/layout.tsx
  └── AuthContext.Provider (Supabase session)
      └── AdminContext.Provider (JWT)
          ├── AppSplashLoader   ← First-load splash animation
          ├── RouteScrollUnlocker
          ├── Header
          ├── {page content}
          └── Footer
```

### 7.2 API Design Conventions

- All handlers live in `app/api/**/route.ts` (Next.js App Router)
- Standard response envelope:
  ```json
  { "success": true, "data": {}, "message": "optional" }
  { "success": false, "error": "description" }
  ```
- HTTP status codes used correctly: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`
- Admin routes: JWT extracted from `Authorization: Bearer <token>` header, verified before business logic
- Supabase usage rule:
  - `supabase` (anon key) — client-accessible, RLS enforced
  - `supabaseAdmin` (service role) — server-only, bypasses RLS

### 7.3 Database Client Usage Matrix

| Operation | Client Used | Library |
|-----------|------------|---------|
| Read user's own bookings | `supabase` (RLS) | `lib/db.ts` |
| Create/update bookings (server) | `supabaseAdmin` | `lib/db.ts` |
| All payment operations | `supabaseAdmin` | `lib/payment-db.ts` |
| Admin CRUD (tours, cars, etc.) | `supabaseAdmin` | `lib/database.ts` |
| User auth operations | Supabase Auth SDK | `lib/supabase.ts` |
| Admin auth (admins table) | `supabaseAdmin` | Direct in route handler |

### 7.4 Email Notification System

**Primary channel**: Resend API (`lib/resend-notifications.ts`)  
**Fallback channel**: SMTP via Nodemailer (`lib/notifications.ts`)

| Trigger | Recipient | Template |
|---------|-----------|----------|
| Payment verified | Customer | Booking confirmation with invoice number and trip details |
| Vehicle assigned by admin | Driver | Assignment notification with booking details and customer contact |
| Cancellation processed | Customer | Cancellation confirmation with refund notes if applicable |

### 7.5 Cron Jobs

| Job | Vercel Schedule | Endpoint | Action |
|-----|----------------|----------|--------|
| Cleanup Stale Pending Bookings | `0 0 * * *` (daily 00:00 UTC) | `POST /api/admin/cleanup-pending` | Deletes bookings with `status='pending'` and `created_at < NOW() - INTERVAL '24 hours'` |

### 7.6 Utility Functions Reference (`lib/utils.ts`)

| Function | Signature | Output |
|----------|-----------|--------|
| `formatCurrency` | `(amount: number) => string` | `₹1,500.00` |
| `formatDate` | `(date: string) => string` | `21 Apr 2026` |
| `formatDateTime` | `(dt: string) => string` | `21 Apr 2026, 10:30 AM` |
| `formatTime` | `(time: string) => string` | `10:30 AM` |
| `generateBookingId` | `() => string` | `BK20260512ABC123` |
| `generateInvoiceNumber` | `() => string` | `INV-20260512-001` |
| `calculateAdvancePayment` | `(total: number) => number` | 30% of total |
| `calculateRemainingPayment` | `(total: number) => number` | 70% of total |
| `canCancelBooking` | `(startDatetime: string) => boolean` | `true` if >24h before trip |
| `getBookingStatus` | `(status: string) => string` | Human-readable label |
| `getPaymentStatusBadge` | `(status: string) => object` | `{ label, color }` |

### 7.7 Input Validation (`lib/validation.ts`)

| Validator | Rules | Return |
|-----------|-------|--------|
| `validateEmail` | Valid email format | `{ valid: boolean, error?: string }` |
| `validatePassword` | Min 6, max 128 characters | `{ valid: boolean, error?: string }` |
| `validateFullName` | Minimum 2 words | `{ valid: boolean, error?: string }` |
| `validatePhoneNumber` | 10-digit Indian mobile format | `{ valid: boolean, error?: string }` |

### 7.8 Error Handling Strategy

**Client-side:**
- `react-hot-toast` for all user-facing error and success messages
- Form-level validation via `lib/validation.ts` before any API call
- Caught API errors display the `error` field from response envelope

**Server-side:**
- All route handlers wrapped in `try/catch`
- Known errors return specific messages with appropriate status codes
- Unknown errors return generic `500 Internal Server Error`
- No error tracking service integrated yet (Sentry listed as a TODO)

### 7.9 Performance Considerations

- Next.js `<Image>` component used for all images (automatic WebP conversion, lazy loading)
- Tailwind CSS unused class purging in production build
- GSAP animations scoped to component lifecycle (cleanup on unmount)
- Lottie JSON assets loaded asynchronously
- `supabaseAdmin` client instance is module-level cached to survive Vercel warm starts
- SEO pages are lightweight static pages to maximize Core Web Vitals

---

## 8. Entity-Relationship Diagram (ERD)

### 8.1 Full ER Diagram

> **Note:** Text representation — replace with a visual ERD (e.g., dbdiagram.io, Lucidchart) using this schema.

```
┌────────────────────────┐           ┌────────────────────────┐
│        BOOKINGS        │    1:1    │        PAYMENTS        │
├────────────────────────┤◄─────────►├────────────────────────┤
│ PK  id            UUID │           │ PK  id            UUID │
│     booking_id    TEXT │           │     booking_id    TEXT │ ← FK → bookings
│     booking_type  TEXT │           │     payment_type  TEXT │   'partial'|'full'
│     user_name     TEXT │           │     amount_total  NUM  │
│     user_email    TEXT │           │     amount_online NUM  │
│     phone         TEXT │           │     amount_cash   NUM  │
│     passenger_cnt INT  │           │     txn_status    TEXT │
│     start_datetime TSTZ│           │     txn_id        TEXT │
│     end_datetime  TSTZ │           │     gateway       TEXT │
│ FK  destination_id UUID│           │     payment_status TEXT│
│ FK  tour_pkg_id   UUID │           │     cash_paid_at  TSTZ │
│     no_of_hours   INT  │           │     cash_coll_by  TEXT │
│     car_model     TEXT │           │     refund_status TEXT │
│     amount_total  NUM  │           │     refund_amount NUM  │
│     booking_status TEXT│           │     refund_id     TEXT │
│     cancel_req_at TSTZ │           │     refunded_at   TSTZ │
│     cancel_reason TEXT │           │     refund_notes  TEXT │
│     created_at    TSTZ │           │     created_at    TSTZ │
└────────────┬───────────┘           └────────────┬───────────┘
             │ 1:N                                │ 1:N
             ▼                                    ▼
┌────────────────────────┐           ┌────────────────────────┐
│   VEHICLE_ASSIGNMENTS  │           │    PAYMENT_RECORDS     │
├────────────────────────┤           ├────────────────────────┤
│ PK  id            UUID │           │ PK  id            UUID │
│ FK  booking_id    TEXT │           │ FK  payment_id    UUID │
│ FK  car_id        UUID │           │     record_type   TEXT │
│     driver_name   TEXT │           │     amount        NUM  │
│     driver_phone  TEXT │           │     status        TEXT │
│     start_datetime TSTZ│           │     created_at    TSTZ │
│     end_datetime  TSTZ │           └────────────────────────┘
│     assigned_at   TSTZ │
│     assigned_by   TEXT │
└────────────┬───────────┘
             │ N:1
             ▼
┌────────────────────────┐
│          CARS          │
├────────────────────────┤
│ PK  id            UUID │
│     model_name    TEXT │
│     class         TEXT │   'Standard' | 'Premium' | 'SUV'
│     capacity      INT  │
│     number_plate  TEXT │
│     per_km_charge NUM  │
│     per_hr_charge NUM  │
│     is_active     BOOL │
│     created_at    TSTZ │
└────────────────────────┘

┌────────────────────────┐    1:N    ┌────────────────────────┐
│      DESTINATIONS      │◄─────────►│        BOOKINGS        │
├────────────────────────┤           │ FK destination_id      │
│ PK  id            UUID │           └────────────────────────┘
│     name          TEXT │
│     region        TEXT │
│     is_active     BOOL │
└────────────┬───────────┘
             │ 1:N
             ▼
┌────────────────────────┐
│     PRICING_RULES      │
├────────────────────────┤
│ PK  id            UUID │
│ FK  destination_id UUID│
│     car_type      TEXT │
│     base_fare     NUM  │
│     per_km_rate   NUM  │
└────────────────────────┘

┌────────────────────────┐    1:N    ┌────────────────────────┐
│     TOUR_PACKAGES      │◄─────────►│        BOOKINGS        │
├────────────────────────┤           │ FK tour_package_id     │
│ PK  id            UUID │           └────────────────────────┘
│     name          TEXT │
│     description   TEXT │
│     price         NUM  │
│     duration_hours INT │
│     max_passengers INT │
│     car_model     TEXT │
│     image_url     TEXT │
│     image_urls    TEXT[]
│     itinerary     TEXT │
│     highlights    TEXT[]
│     is_active     BOOL │
│     created_at    TSTZ │
│     updated_at    TSTZ │
└────────────┬───────────┘
             │ 1:N  (polymorphic)
             ▼
┌────────────────────────┐
│        REVIEWS         │◄── Also linked to BOOKINGS polymorphically
├────────────────────────┤
│ PK  id            UUID │
│     reviewable_type TEXT│  'tour' | 'taxi_booking'
│     reviewable_id UUID  │  FK → tour_packages.id OR bookings.id
│     user_id       UUID  │  nullable → auth.users.id
│     user_email    TEXT  │
│     user_name     TEXT  │
│     rating        INT   │  CHECK (1–5)
│     title         TEXT  │
│     comment       TEXT  │
│     is_visible    BOOL  │
│     created_at    TSTZ  │
│     updated_at    TSTZ  │
└────────────────────────┘
  UNIQUE (user_email, reviewable_type, reviewable_id)

┌────────────────────────┐
│      HOURLY_RATES      │
├────────────────────────┤
│ PK  id            UUID │
│     car_type      TEXT │
│     per_hr_rate   NUM  │
│     per_day_rate  NUM  │
└────────────────────────┘

┌────────────────────────┐
│         ADMINS         │
├────────────────────────┤
│ PK  id            UUID │
│     email         TEXT │  UNIQUE NOT NULL
│     password_hash TEXT │  bcrypt hash
│     full_name     TEXT │
│     role          TEXT │  DEFAULT 'admin'
│     is_active     BOOL │
│     last_login    TSTZ │
│     created_at    TSTZ │
│     updated_at    TSTZ │
└────────────────────────┘

┌────────────────────────┐
│      APP_SETTINGS      │
├────────────────────────┤
│ PK  key           TEXT │  e.g. 'conflict_control_enabled'
│     value         TEXT │  e.g. 'true'
│     updated_at    TSTZ │
└────────────────────────┘
```

### 8.2 Relationships Summary

| From | To | Cardinality | Foreign Key |
|------|----|-------------|-------------|
| `bookings` | `payments` | One-to-One | `payments.booking_id` |
| `payments` | `payment_records` | One-to-Many | `payment_records.payment_id` |
| `bookings` | `vehicle_assignments` | One-to-Many | `vehicle_assignments.booking_id` |
| `cars` | `vehicle_assignments` | One-to-Many | `vehicle_assignments.car_id` |
| `destinations` | `bookings` | One-to-Many | `bookings.destination_id` |
| `destinations` | `pricing_rules` | One-to-Many | `pricing_rules.destination_id` |
| `tour_packages` | `bookings` | One-to-Many | `bookings.tour_package_id` |
| `tour_packages` | `reviews` | Polymorphic 1:N | `reviewable_type='tour'` |
| `bookings` | `reviews` | Polymorphic 1:N | `reviewable_type='taxi_booking'` |

---

## 9. Data Flow Diagrams (DFDs)

### 9.1 Level 0 — Context Diagram

> **Note:** Text representation — replace with visual DFD diagram.

```
                         ┌──────────────────────────────┐
    Booking Request      │                              │   Booking Confirmation
[CUSTOMER] ────────────► │                              │ ──────────────────────► [CUSTOMER]
                         │     TaxiHollongi System      │
[ADMIN] ───────────────► │                              │ ──────────────────────► [ADMIN]
    Management Actions   │                              │   Dashboard Data
                         └────────────┬─────────────────┘
                                      │
                    ┌─────────────────┼─────────────────────┐
                    ▼                 ▼                      ▼
               [Razorpay]         [Resend]            [Supabase]
               Payment GW         Email API           Database + Auth
```

### 9.2 Level 1 — Main Process Flows

```
[CUSTOMER]
    │
    │ ① Register / Login
    ▼
┌────────────────────┐
│   P1: AUTH         │ ◄────────────────────► Supabase Auth
│   User Management  │
└────────┬───────────┘
         │
    ② Select Service + Enter Details
         ▼
┌────────────────────┐             ┌─────────────────┐
│   P2: BOOKING      │ ───────────► │ D1: bookings    │
│   Engine           │ ◄─────────── │ (Supabase PG)   │
└────────┬───────────┘             └─────────────────┘
         │
    ③ Initiate Payment
         ▼
┌────────────────────┐
│   P3: PAYMENT      │ ────────────► Razorpay API
│   Processing       │ ◄──────────── Payment Confirmation
└────────┬───────────┘
         │                          ┌─────────────────┐
    ④    └─────────────────────────► │ D2: payments    │
                                    │ (Supabase PG)   │
                                    └─────────────────┘
    ⑤ Booking Confirmed
         ▼
┌────────────────────┐
│   P4: NOTIFICATION │ ────────────► Resend API ─────────► [CUSTOMER Email]
│   Service          │                                      [DRIVER Email]
└────────┬───────────┘
         │
    ⑥ Download Invoice
         ▼
┌────────────────────┐
│   P5: INVOICE      │ ────────────► jsPDF (client-side) → Browser Download
│   Generation       │
└────────────────────┘

[ADMIN]
    │ ① JWT Login
    │ ② View All Bookings
    │ ③ Assign Vehicle/Driver
    │ ④ Confirm Cash Payment
    │ ⑤ Manage Content (CRUD)
    ▼
┌────────────────────┐
│   P6: ADMIN OPS    │ ────────────► D1 (bookings), D2 (payments),
│   Dashboard        │               D3 (cars), D4 (tours), D5 (destinations)
└────────────────────┘
```

### 9.3 Level 2 — Payment Sub-Process

```
Customer Browser
    │
    │ { bookingId, amount, paymentType }
    ▼
POST /api/payment/create-payment
    │
    ├──► razorpay.orders.create(amount_paise, 'INR', receipt=bookingId)
    │         └──► Returns: { orderId }
    │
    ├──► INSERT INTO payments {
    │      booking_id, payment_type, amount_total,
    │      amount_online_paid=amount, txn_status='initiated'
    │    }
    │
    └──► Return { orderId, amount } to client

Client: Open Razorpay modal
    │
    │ User pays
    │
    ▼ Razorpay returns: { orderId, paymentId, signature }

POST /api/payment/verify
    │
    ├──► Compute: HMAC-SHA256(orderId + "|" + paymentId, secret)
    │         └──► Mismatch → 400 Bad Request "Invalid signature"
    │
    ├──► UPDATE payments SET txn_status='paid', txn_id=paymentId,
    │                        payment_status='partial'|'paid'
    │
    ├──► UPDATE bookings SET booking_status='confirmed'
    │
    ├──► sendBookingConfirmation(email) via Resend API
    │
    └──► Return { success, bookingId, invoiceNumber }
```

### 9.4 Level 2 — Admin Vehicle Assignment Sub-Process

```
Admin Browser
    │
    │ { bookingId, carId, driverName, driverPhone, start, end }
    ▼
POST /api/bookings/assign-vehicle
    │  Authorization: Bearer <JWT>
    │
    ├──► jwt.verify(token) → admin identity
    │
    ├──► INSERT INTO vehicle_assignments {
    │      booking_id, car_id, driver_name, driver_phone,
    │      start_datetime, end_datetime, assigned_by=adminEmail
    │    }
    │
    ├──► UPDATE bookings SET booking_status='confirmed'
    │         (if not already confirmed)
    │
    ├──► sendDriverNotification(driverPhone?, driverEmail?) via Resend
    │
    └──► Return { success: true }
```

---

## 10. UML Diagrams

### 10.1 Use Case Diagram

> **Note:** Text representation — replace with UML diagram tool export (e.g., PlantUML, draw.io).

```
System Boundary: TaxiHollongi

Actors:  [Customer]  [Admin]  [Razorpay]  [Resend Email Service]

─── Customer Use Cases ────────────────────────────────────────────

UC01  Register Account
UC02  Verify Email Address
UC03  Login / Logout
UC04  Change Password
UC05  Book Airport Taxi          ── includes ──► UC-CHK: Check Availability
UC06  Book Tour Package          ── includes ──► UC-CHK: Check Availability
UC07  Book Hourly Taxi           ── includes ──► UC-CHK: Check Availability
UC08  Pay Online (30% or 100%)  ── extends  ──► [Razorpay]
UC09  Download Invoice PDF
UC10  View My Bookings
UC11  Cancel Booking             ── guards   ──► (>24h before trip)
UC12  Submit Review (Tour/Taxi)

─── Admin Use Cases ───────────────────────────────────────────────

UC13  Admin Login (JWT)
UC14  View All Bookings (filtered by status)
UC15  Assign Vehicle & Driver    ── triggers ──► UC-E2: Driver Notification
UC16  Confirm Cash Payment Received
UC17  Process Cancellation Request
UC18  Manage Cars (Create, Read, Update, Delete)
UC19  Manage Tour Packages (CRUD + image upload)
UC20  Manage Destinations (CRUD)
UC21  Manage Pricing Rules (CRUD)
UC22  Toggle Conflict Control On/Off
UC23  View Booking Conflicts
UC24  Create New Admin Account

─── System-triggered Email Use Cases ─────────────────────────────

UC-E1  Send Booking Confirmation   ◄── triggered by UC08 success
         └──────────────────────────────────────────────► [Resend]
UC-E2  Send Driver Assignment Notification ◄── triggered by UC15
         └──────────────────────────────────────────────► [Resend]
UC-E3  Send Cancellation Confirmation ◄── triggered by UC17
         └──────────────────────────────────────────────► [Resend]
```

### 10.2 Class Diagram

> **Note:** Text representation — replace with UML class diagram tool.

```
┌─────────────────────────────────────────────┐
│                   Booking                   │
├─────────────────────────────────────────────┤
│ + id: string                                │
│ + booking_id: string                        │
│ + booking_type: BookingType                 │
│ + user_name: string                         │
│ + user_email: string                        │
│ + phone: string                             │
│ + passenger_count: number                   │
│ + start_datetime: Date                      │
│ + end_datetime: Date                        │
│ + destination_id?: string                   │
│ + tour_package_id?: string                  │
│ + no_of_hours?: number                      │
│ + car_model: string                         │
│ + amount_total: number                      │
│ + booking_status: BookingStatus             │
│ + created_at: Date                          │
│ + cancellation_requested_at?: Date          │
│ + cancellation_reason?: string              │
├─────────────────────────────────────────────┤
│ + canCancel(): boolean                      │
│ + getPayment(): Promise<Payment>            │
│ + getAssignment(): Promise<Assignment>      │
└────────────┬────────────────────────────────┘
             │ "associated with"
             ▼
┌─────────────────────────────────────────────┐
│                  Payment                    │
├─────────────────────────────────────────────┤
│ + id: string                                │
│ + booking_id: string                        │
│ + payment_type: 'partial' | 'full'         │
│ + amount_total: number                      │
│ + amount_online_paid: number                │
│ + amount_cash_paid: number                  │
│ + txn_status: TxnStatus                     │
│ + txn_id?: string                           │
│ + payment_status: PaymentStatus             │
│ + cash_paid_at?: Date                       │
│ + cash_collected_by?: string                │
│ + refund_status?: RefundStatus              │
│ + refund_amount?: number                    │
├─────────────────────────────────────────────┤
│ + getRemainingCash(): number                │
│ + isFullyPaid(): boolean                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│               TourPackage                   │
├─────────────────────────────────────────────┤
│ + id: string                                │
│ + name: string                              │
│ + description: string                       │
│ + price: number                             │
│ + duration_hours: number                    │
│ + max_passengers: number                    │
│ + car_model: string                         │
│ + image_url: string                         │
│ + image_urls: string[]                      │
│ + itinerary: string                         │
│ + highlights: string[]                      │
│ + is_active: boolean                        │
├─────────────────────────────────────────────┤
│ + getReviews(): Promise<Review[]>           │
│ + getRatingStats(): Promise<RatingStats>    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                  Review                     │
├─────────────────────────────────────────────┤
│ + id: string                                │
│ + reviewable_type: 'tour'|'taxi_booking'   │
│ + reviewable_id: string                     │
│ + user_email: string                        │
│ + user_name: string                         │
│ + rating: 1 | 2 | 3 | 4 | 5              │
│ + title?: string                            │
│ + comment?: string                          │
│ + is_visible: boolean                       │
│ + created_at: Date                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                  Car                        │
├─────────────────────────────────────────────┤
│ + id: string                                │
│ + model_name: string                        │
│ + class: string                             │
│ + capacity: number                          │
│ + number_plate: string                      │
│ + per_km_charge: number                     │
│ + per_hr_charge: number                     │
│ + is_active: boolean                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            VehicleAssignment                │
├─────────────────────────────────────────────┤
│ + id: string                                │
│ + booking_id: string                        │
│ + car_id: string                            │
│ + driver_name: string                       │
│ + driver_phone: string                      │
│ + start_datetime: Date                      │
│ + end_datetime: Date                        │
│ + assigned_at: Date                         │
│ + assigned_by: string                       │
└─────────────────────────────────────────────┘

Enumerations:
  BookingType   = 'airport_taxi' | 'tour' | 'hourly'
  BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
  TxnStatus     = 'initiated' | 'paid' | 'failed'
  PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded'
  RefundStatus  = 'none' | 'requested' | 'processed'
```

### 10.3 Sequence Diagrams

#### SEQ-01: Customer Booking and Payment

> **Note:** Text representation — replace with UML sequence diagram (PlantUML, draw.io).

```
Customer   Browser      API Layer         Razorpay      Supabase     Resend
   │          │              │                │             │            │
   │ select   │              │                │             │            │
   │ service  │              │                │             │            │
   ├─────────►│              │                │             │            │
   │          │ GET /api/cars/available-models │             │            │
   │          ├─────────────►│                │             │            │
   │          │              │ query cars+assignments        │            │
   │          │              ├────────────────────────────► │            │
   │          │              │◄────────────────────────────  │            │
   │          │◄─────────────┤ { models[] }   │             │            │
   │          │              │                │             │            │
   │ fill     │              │                │             │            │
   │ form     │              │                │             │            │
   ├─────────►│              │                │             │            │
   │          │ POST /api/bookings/create      │             │            │
   │          ├─────────────►│                │             │            │
   │          │              │ INSERT booking (pending)      │            │
   │          │              ├────────────────────────────► │            │
   │          │◄─────────────┤ { booking_id } │             │            │
   │          │              │                │             │            │
   │ choose   │              │                │             │            │
   │ payment  │              │                │             │            │
   ├─────────►│              │                │             │            │
   │          │ POST /api/payment/create-payment             │            │
   │          ├─────────────►│                │             │            │
   │          │              │ orders.create()│             │            │
   │          │              ├───────────────►│             │            │
   │          │              │◄───────────────┤ { orderId } │            │
   │          │              │ INSERT payment record         │            │
   │          │              ├────────────────────────────► │            │
   │          │◄─────────────┤ { orderId }    │             │            │
   │          │              │                │             │            │
   │ pay via  │              │                │             │            │
   │ Razorpay │ openModal()  │                │             │            │
   │          ├──────────────────────────────►│             │            │
   │          │              │      user completes payment   │            │
   │          │◄─────────────────────────────┤             │            │
   │          │ { orderId, paymentId, sig }   │             │            │
   │          │              │                │             │            │
   │          │ POST /api/payment/verify       │             │            │
   │          ├─────────────►│                │             │            │
   │          │              │ verifyHMAC()   │             │            │
   │          │              │ UPDATE payments + bookings    │            │
   │          │              ├────────────────────────────► │            │
   │          │              │ sendConfirmation()            │            │
   │          │              ├──────────────────────────────────────────►│
   │          │◄─────────────┤ { success, invoiceNumber }   │            │
   │          │              │                │             │            │
   │ view     │              │                │             │            │
   │ confirm  │              │                │             │            │
   ├─────────►│              │                │             │            │
```

#### SEQ-02: Admin Login and Vehicle Assignment

```
Admin     Browser       /api/admin/*      Supabase       Resend
  │          │               │               │              │
  │ enter    │               │               │              │
  │ creds    │               │               │              │
  ├─────────►│               │               │              │
  │          │ POST /api/admin/login          │              │
  │          ├──────────────►│               │              │
  │          │               │ SELECT admin  │              │
  │          │               ├──────────────►│              │
  │          │               │◄──────────────┤ admin record │
  │          │               │ bcrypt.compare()             │
  │          │               │ jwt.sign(...)  │              │
  │          │◄──────────────┤ { token }      │              │
  │          │ localStorage('adminToken')      │              │
  │          │               │               │              │
  │ view all │               │               │              │
  │ bookings │               │               │              │
  ├─────────►│               │               │              │
  │          │ GET /api/bookings/admin        │              │
  │          │ Authorization: Bearer <token>  │              │
  │          ├──────────────►│               │              │
  │          │               │ jwt.verify()   │              │
  │          │               │ SELECT bookings│              │
  │          │               ├──────────────►│              │
  │          │◄──────────────┤◄──────────────┤ bookings[]   │
  │          │               │               │              │
  │ assign   │               │               │              │
  │ vehicle  │               │               │              │
  ├─────────►│               │               │              │
  │          │ POST /api/bookings/assign-vehicle             │
  │          ├──────────────►│               │              │
  │          │               │ jwt.verify()   │              │
  │          │               │ INSERT vehicle_assignments    │
  │          │               ├──────────────►│              │
  │          │               │ UPDATE bookings status        │
  │          │               ├──────────────►│              │
  │          │               │ sendDriverNotification()      │
  │          │               ├──────────────────────────────►│
  │          │◄──────────────┤ { success }    │              │
```

### 10.4 Component Diagram

> **Note:** Text representation — replace with UML component diagram.

```
┌─────────────────────────────────────────────────────────────────┐
│                     TaxiHollongi Application                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      Pages Layer                          │  │
│  │  HomePage · BookTaxi · Tours · TourDetail · Payment      │  │
│  │  BookingConfirmed · MyBookings · AdminDashboard           │  │
│  │  Login · Signup · AuthVerify · AdminLogin                 │  │
│  │  SEO: ArunachalTours · ItanagarTours · AirportTaxi*      │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │ uses                               │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │                   Components Layer                        │  │
│  │  Header · Footer · ReviewForm · ReviewCard · Loader      │  │
│  │  AppSplashLoader · ProtectedAdminPage · Logo             │  │
│  │  HeroBackground · SmoothScrollWrapper                    │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │ subscribes to                      │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │                Context / State Layer                      │  │
│  │  AuthContext (Supabase session)                          │  │
│  │  AdminContext (JWT + bcrypt + localStorage)              │  │
│  │  Zustand Store                                           │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │ HTTP calls                         │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │                   API Routes Layer                        │  │
│  │  /api/admin/*  /api/auth/*  /api/bookings/*              │  │
│  │  /api/cars/*   /api/destinations/*  /api/payment/*       │  │
│  │  /api/tours/*  /api/reviews/*                            │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │ uses                               │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │                      Lib Layer                            │  │
│  │  db.ts · payment-db.ts · payment.ts · payment-utils.ts   │  │
│  │  utils.ts · validation.ts · reviews.ts · invoice.ts      │  │
│  │  database.ts · supabase.ts · supabase-admin.ts           │  │
│  │  notifications.ts · resend-notifications.ts              │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ external connections
             ┌───────────────┼──────────────────────┐
             ▼               ▼                      ▼
    ┌──────────────┐  ┌────────────┐       ┌──────────────┐
    │   Supabase   │  │  Razorpay  │       │   Resend     │
    │  PostgreSQL  │  │  Payment   │       │  Email API   │
    │  + Auth      │  │  Gateway   │       │              │
    └──────────────┘  └────────────┘       └──────────────┘
```

### 10.5 Booking Status State Machine

> **Note:** Text representation — replace with UML state diagram.

```
                    ┌──────────────────────────────────┐
                    │               PENDING             │
                    │   (booking created, not paid yet) │
                    └──────┬───────────────────┬────────┘
                           │                   │
               Payment     │                   │  >24h elapsed
               verified    │                   │  (no payment)
                           │                   │
                           ▼                   ▼
                    ┌──────────────┐    ┌───────────────┐
                    │  CONFIRMED   │    │  Auto-deleted  │
                    │              │    │  (cron job)    │
                    └──────┬───────┘    └───────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
         Trip done               Cancellation
         (admin marks)           request processed
              │                  (admin action)
              ▼                         ▼
       ┌────────────┐           ┌────────────────┐
       │ COMPLETED  │           │   CANCELLED    │
       └────────────┘           └────────────────┘

  Note: Cancellation requests can come from:
  - Customer (must be >24h before start_datetime)
  - Admin (any time, manual override)
```

### 10.6 Payment Status State Machine

```
                    ┌────────────────────────────────┐
                    │            PENDING             │
                    │ (Razorpay order created,       │
                    │  awaiting payment)             │
                    └──────┬─────────────┬───────────┘
                           │             │
                    Partial payment  Full payment
                    (30% online)     (100% online)
                           │             │
                    ┌──────▼───┐   ┌─────▼──────┐
                    │ PARTIAL  │   │    PAID    │
                    │ (online  │   │            │
                    │ paid,    │   └────────────┘
                    │ cash due)│
                    └──────┬───┘
                           │
                    Admin marks
                    cash collected
                    (70% received)
                           │
                    ┌──────▼──────┐
                    │    PAID     │
                    └──────┬──────┘
                           │
                    Refund issued
                    (manual, admin)
                           │
                    ┌──────▼──────┐
                    │  REFUNDED  │
                    └─────────────┘
```

---

## 11. API Documentation

### 11.1 Base URLs

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:3000` |
| Production | `https://<your-domain>.vercel.app` |

### 11.2 Authentication

**User Auth (Supabase)**  
Supabase session managed automatically via `@supabase/auth-helpers-nextjs`. No manual headers needed from the client — the session cookie is attached automatically.

**Admin Auth (JWT)**  
Include the JWT token in every admin request:
```
Authorization: Bearer <token>
```
Token is obtained from `POST /api/admin/login` and expires in 24 hours.

### 11.3 Standard Response Format

```json
// Success
{ "success": true, "data": { ... }, "message": "Optional human-readable message" }

// Error
{ "success": false, "error": "Error description" }
```

---

### 11.4 Admin Endpoints

#### `POST /api/admin/login`
Authenticate an admin and receive a JWT token.

**Request:**
```json
{ "email": "admin@taxihollongi.com", "password": "Secure@Admin123" }
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJ...",
  "admin": { "email": "admin@taxihollongi.com", "fullName": "Admin Name", "role": "admin" }
}
```

**Error 401:** Invalid credentials &nbsp; **Error 403:** Account inactive

---

#### `POST /api/admin/logout`
Invalidate the admin session.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "success": true }`

---

#### `POST /api/admin/verify-session`
Validate a JWT token and return admin info.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "valid": true, "admin": { ... } }`  
**Response 401:** Token expired or invalid

---

#### `POST /api/admin/create-admin`
Create a new admin account.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "email": "newadmin@example.com", "password": "NewPass@123", "fullName": "New Admin" }
```

**Response 201:** `{ "success": true, "message": "Admin created" }`

---

#### `GET /api/admin/settings`
Retrieve application settings.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "conflict_control_enabled": "true" }`

---

#### `POST /api/admin/settings`
Update an application setting.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "key": "conflict_control_enabled", "value": "false" }
```

**Response 200:** `{ "success": true }`

---

#### `GET /api/admin/conflicts`
Get list of conflicting vehicle assignments.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:**
```json
{
  "conflicts": [
    {
      "booking_id": "BK20260512ABC123",
      "car_model": "Toyota Innova",
      "start_datetime": "2026-05-14T08:00:00Z",
      "conflicting_with": ["BK20260512XYZ456"]
    }
  ]
}
```

---

#### `POST /api/admin/process-cancellation`
Process a booking cancellation request.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "booking_id": "BK20260512ABC123", "refund_notes": "Customer requested 48h before trip" }
```

**Response 200:** `{ "success": true }`

---

### 11.5 Booking Endpoints

#### `POST /api/bookings/create`
Create a new booking.

**Request:**
```json
{
  "booking_type": "airport_taxi",
  "user_name": "John Doe",
  "user_email": "john@example.com",
  "phone": "9876543210",
  "passenger_count": 3,
  "start_datetime": "2026-05-20T06:00:00Z",
  "end_datetime": "2026-05-20T08:00:00Z",
  "destination_id": "uuid-here",
  "car_model": "Toyota Innova",
  "amount_total": 1500
}
```

**Response 201:**
```json
{ "success": true, "booking_id": "BK20260520ABC123" }
```

**Response 409:** Booking conflict (car unavailable for time window)

---

#### `GET /api/bookings/user`
Get all bookings for a specific user.  
**Query:** `?email=user@example.com`  
**Response 200:** `{ "bookings": [ { booking_id, booking_type, booking_status, start_datetime, amount_total, car_model } ] }`

---

#### `GET /api/bookings/admin`
Get all bookings (admin only).  
**Headers:** `Authorization: Bearer <token>`  
**Query (optional):** `?status=confirmed&limit=50&offset=0`  
**Response 200:** `{ "bookings": [ ... ] }`

---

#### `POST /api/bookings/assign-vehicle`
Assign a vehicle and driver to a booking.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "booking_id": "BK20260520ABC123",
  "car_id": "uuid-car",
  "driver_name": "Ram Singh",
  "driver_phone": "9876543210",
  "start_datetime": "2026-05-20T06:00:00Z",
  "end_datetime": "2026-05-20T08:00:00Z"
}
```

**Response 200:** `{ "success": true }`

---

#### `PUT /api/bookings/update-status`
Update the status of a booking.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "booking_id": "BK20260520ABC123", "status": "completed" }
```

**Response 200:** `{ "success": true }`

---

#### `POST /api/bookings/cancel-request`
Submit a cancellation request (customer).

**Request:**
```json
{ "booking_id": "BK20260520ABC123", "reason": "Change of plans" }
```

**Validation:** Trip must be more than 24 hours away.  
**Response 200:** `{ "success": true }`  
**Response 400:** `{ "error": "Cannot cancel within 24 hours of trip" }`

---

### 11.6 Payment Endpoints

#### `POST /api/payment/create-payment`
Create a Razorpay order and initialize the payment record.

**Request:**
```json
{ "bookingId": "BK20260520ABC123", "amount": 450, "currency": "INR", "paymentType": "partial" }
```

**Response 200:**
```json
{ "success": true, "orderId": "order_XXXXXXXXXXX", "amount": 45000, "currency": "INR" }
```

> `amount` in response is in paise (multiply by 100). Pass directly to Razorpay SDK.

---

#### `POST /api/payment/verify`
Verify Razorpay payment signature and confirm the booking.

**Request:**
```json
{
  "orderId": "order_XXXXXXXXXXX",
  "paymentId": "pay_XXXXXXXXXXX",
  "signature": "hmac-sha256-hash",
  "bookingId": "BK20260520ABC123",
  "amount": 450,
  "paymentType": "partial",
  "userEmail": "john@example.com",
  "userName": "John Doe"
}
```

**Response 200:**
```json
{ "success": true, "message": "Payment verified", "bookingId": "BK20260520ABC123", "invoiceNumber": "INV-20260520-001" }
```

**Response 400:** `{ "success": false, "error": "Invalid payment signature" }`

---

#### `POST /api/payment/confirm-cash`
Mark cash payment as collected (admin).  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "booking_id": "BK20260520ABC123", "collected_by": "Admin Name", "amount_collected": 1050 }
```

**Response 200:** `{ "success": true }`

---

#### `GET /api/payment/get-payment`
Get payment record for a booking.  
**Query:** `?booking_id=BK20260520ABC123`  
**Response 200:**
```json
{
  "payment": {
    "id": "uuid",
    "booking_id": "BK20260520ABC123",
    "payment_type": "partial",
    "amount_total": 1500,
    "amount_online_paid": 450,
    "amount_cash_paid": 0,
    "payment_status": "partial",
    "txn_status": "paid",
    "txn_id": "pay_XXXXXXXXXXX"
  }
}
```

---

### 11.7 Car / Vehicle Endpoints

#### `GET /api/cars/available-models`
Get available car models for a time window.  
**Query:** `?booking_date=2026-05-20&start_time=06:00&end_time=08:00`

**Response 200:**
```json
{
  "models": [
    {
      "model_name": "Toyota Innova",
      "class": "Premium",
      "capacity": 6,
      "per_km_charge": 25,
      "per_hr_charge": 300,
      "available_count": 2
    }
  ]
}
```

---

#### `GET /api/cars`
Get all cars (admin).  
**Response 200:** `{ "cars": [ { id, model_name, class, capacity, number_plate, is_active, per_km_charge, per_hr_charge } ] }`

---

#### `POST /api/cars`
Add a new car.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "model_name": "Maruti Ertiga",
  "class": "Standard",
  "capacity": 6,
  "number_plate": "AR-01-AB-1234",
  "per_km_charge": 18,
  "per_hr_charge": 200
}
```

**Response 201:** `{ "success": true, "car": { ... } }`

---

#### `PUT /api/cars/[id]`
Update a car record.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "success": true }`

---

#### `DELETE /api/cars/[id]`
Remove a car from inventory.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "success": true }`

---

### 11.8 Tour Endpoints

#### `GET /api/tours`
Get all active tour packages.  
**Response 200:**
```json
{
  "tours": [
    {
      "id": "uuid",
      "name": "Tawang Monastery Tour",
      "description": "...",
      "price": 8000,
      "duration_hours": 48,
      "max_passengers": 6,
      "car_model": "Toyota Innova",
      "image_url": "https://...",
      "image_urls": ["https://..."],
      "highlights": ["Tawang Monastery", "Madhuri Lake"],
      "is_active": true
    }
  ]
}
```

---

#### `GET /api/tours/[id]`
Get a specific tour package.  
**Response 200:** `{ "tour": { ... } }`

---

#### `POST /api/tours`
Create a tour package.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Ziro Valley Tour",
  "description": "Experience the pristine Ziro Valley...",
  "price": 5000,
  "duration_hours": 24,
  "max_passengers": 4,
  "car_model": "Toyota Innova",
  "itinerary": "Day 1: ...",
  "highlights": ["Ziro Valley", "Apatani Culture", "Pine Forests"]
}
```

**Response 201:** `{ "success": true, "tour": { ... } }`

---

#### `PUT /api/tours/[id]`
Update a tour package.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "success": true }`

---

#### `POST /api/tours/upload-image`
Upload a tour image.  
**Headers:** `Authorization: Bearer <token>`  
**Body:** `multipart/form-data` with image file  
**Response 200:** `{ "success": true, "url": "https://..." }`

---

### 11.9 Review Endpoints

#### `GET /api/reviews`
Get reviews for a tour or booking.  
**Query:** `?reviewable_type=tour&reviewable_id=uuid`

**Response 200:**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "user_name": "John Doe",
      "rating": 5,
      "title": "Amazing experience!",
      "comment": "Great tour, very professional driver.",
      "created_at": "2026-05-10T14:00:00Z"
    }
  ],
  "stats": {
    "average_rating": 4.7,
    "total_reviews": 12,
    "breakdown": { "5": 9, "4": 2, "3": 1, "2": 0, "1": 0 }
  }
}
```

---

#### `POST /api/reviews`
Submit a review.

**Request:**
```json
{
  "reviewable_type": "tour",
  "reviewable_id": "uuid",
  "user_email": "john@example.com",
  "user_name": "John Doe",
  "rating": 5,
  "title": "Excellent!",
  "comment": "Highly recommended tour."
}
```

**Response 201:** `{ "success": true }`  
**Response 409:** `{ "error": "You have already reviewed this item" }`

---

### 11.10 Destination Endpoints

#### `GET /api/destinations`
Get all active destinations.  
**Response 200:** `{ "destinations": [ { id, name, region } ] }`

---

#### `POST /api/destinations`
Create a destination.  
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{ "name": "Hollongi Airport", "region": "Papum Pare" }
```

**Response 201:** `{ "success": true, "destination": { ... } }`

---

#### `PUT /api/destinations/[id]` / `DELETE /api/destinations/[id]`
Update or delete a destination.  
**Headers:** `Authorization: Bearer <token>`  
**Response 200:** `{ "success": true }`

---

## 12. Development Documentation

### 12.1 Prerequisites

- Node.js 18+
- npm 9+
- Supabase account and project
- Razorpay account (test and live keys)
- Resend account (or SMTP credentials)

### 12.2 Local Setup

```bash
git clone <repo-url>
cd TaxiHollongi
npm install
cp .env.example .env.local
# Fill all variables in .env.local
npm run dev
# → http://localhost:3000
```

### 12.3 Environment Variables

| Variable | Required | Exposure | Description |
|----------|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **Server only** | Supabase service role key (bypasses RLS) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Public | Razorpay publishable key |
| `RAZORPAY_KEY_SECRET` | Yes | **Server only** | Razorpay secret key |
| `JWT_SECRET` | Yes | **Server only** | Secret for admin JWT signing |
| `RESEND_API_KEY` | Yes | **Server only** | Resend email API key |
| `RESEND_FROM_EMAIL` | Yes | **Server only** | Sender email address |
| `ADMIN_EMAIL` | Yes | **Server only** | Primary admin email address |
| `NEXT_PUBLIC_APP_URL` | Yes | Public | Full production URL (e.g., `https://taxihollongi.com`) |
| `NODE_ENV` | Auto | — | Set by Next.js (`development` / `production`) |
| `SMTP_HOST` | No | Server only | SMTP host (fallback email) |
| `SMTP_PORT` | No | Server only | SMTP port |
| `SMTP_USER` | No | Server only | SMTP username |
| `SMTP_PASS` | No | Server only | SMTP password |

> Variables marked **Server only** must NEVER appear in `NEXT_PUBLIC_*` names.

### 12.4 Available Commands

```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Production build (also generates changelog)
npm start          # Start production server
npm run lint       # ESLint check
```

### 12.5 Project Structure

```
TaxiHollongi/
├── app/
│   ├── api/
│   │   ├── admin/          # login, logout, verify-session, create-admin,
│   │   │                   # settings, conflicts, process-cancellation, cleanup-pending
│   │   ├── auth/           # exchange-code
│   │   ├── bookings/       # create, user, admin, assign-vehicle, update-assignment,
│   │   │                   # get-assignments, user-assignments, update-status, resume, cancel-request
│   │   ├── cars/           # [id], available-models
│   │   ├── destinations/   # [id]
│   │   ├── payment/        # create-payment, create-order, verify, confirm-cash,
│   │   │                   # get-payment, get-all
│   │   ├── reviews/
│   │   ├── tours/          # [id], [id]/availability, upload-image
│   │   ├── changelog/
│   │   └── test-email/
│   ├── admin/              # Admin dashboard (protected)
│   ├── book-taxi/
│   ├── booking-confirmed/
│   ├── bookings/
│   ├── payment/
│   ├── tours/
│   │   └── [id]/
│   │       ├── book/
│   │       └── reviews/
│   ├── login/ signup/ change/
│   ├── auth/verify/
│   ├── admin-login/
│   ├── arunachal-tours/    # SEO landing
│   ├── itanagar-tours/     # SEO landing
│   ├── hollongi-airport-taxi/
│   ├── donyi-polo-airport-taxi/
│   ├── itanagar-airport-taxi/
│   ├── hourly-taxi-itanagar/
│   ├── faq/ terms/ privacy/
│   ├── layout.tsx          # Root layout with all context providers
│   ├── page.tsx            # Homepage
│   └── globals.css
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Logo.tsx
│   ├── ReviewForm.tsx
│   ├── ReviewCard.tsx
│   ├── Loader.tsx
│   ├── AppSplashLoader.tsx
│   ├── HeroBackground.tsx
│   ├── SmoothScrollWrapper.tsx
│   ├── RouteScrollUnlocker.tsx
│   ├── ProtectedAdminPage.tsx
│   └── PaymentTestAlert.tsx
├── context/
│   ├── AuthContext.tsx      # Supabase user session
│   └── AdminContext.tsx     # JWT admin session
├── lib/
│   ├── db.ts               # Core DB operations (bookings, payments, tours)
│   ├── payment-db.ts       # Server-only payment DB (service role)
│   ├── payment.ts          # Razorpay integration
│   ├── payment-utils.ts    # Payment calculation helpers (client-safe)
│   ├── utils.ts            # Formatting, validation, ID generation
│   ├── validation.ts       # Strict input validators
│   ├── reviews.ts          # Review fetch and stat calculation
│   ├── invoice.ts          # PDF invoice generation (jsPDF)
│   ├── database.ts         # Additional CRUD (destinations, pricing, cars)
│   ├── supabase.ts         # Supabase anon client
│   ├── supabase-admin.ts   # Supabase service role client (server only)
│   ├── notifications.ts    # Email setup (Resend + SMTP fallback)
│   └── resend-notifications.ts  # Resend-specific email templates
├── sql/
│   ├── admin_schema.sql
│   ├── reviews_schema.sql
│   └── app_settings_schema.sql
├── scripts/
│   └── generate-admin-hash.js
├── public/                 # Static assets (images, icons)
├── database.sql            # Main database schema
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── package.json
├── .env.example
├── README.md
├── DEVREF.md
└── changelog.md
```

### 12.6 Database Setup (Supabase)

Run SQL files in Supabase SQL Editor in this order:

1. `database.sql` — Main tables (bookings, payments, cars, tours, destinations, pricing_rules, etc.)
2. `sql/admin_schema.sql` — `admins` table
3. `sql/reviews_schema.sql` — `reviews` table
4. `sql/app_settings_schema.sql` — `app_settings` table (seeds default `conflict_control_enabled = 'true'`)

### 12.7 Admin Account Setup

```bash
# 1. Generate a bcrypt hash for your password
node scripts/generate-admin-hash.js "YourPassword123"
# → $2b$10$...hash...

# 2. Insert admin in Supabase SQL Editor
INSERT INTO public.admins (email, password_hash, full_name, role, is_active)
VALUES ('admin@yourdomain.com', '$2b$10$...hash...', 'Admin Name', 'admin', true);

# 3. Generate JWT_SECRET
openssl rand -base64 32

# 4. Set JWT_SECRET in .env.local

# 5. Login at /admin-login
```

**Change password:**
```sql
UPDATE public.admins SET password_hash = '$2b$10$...newhash...' WHERE email = 'admin@yourdomain.com';
```

**Disable account:**
```sql
UPDATE public.admins SET is_active = false WHERE email = 'admin@yourdomain.com';
```

**View login history:**
```sql
SELECT email, full_name, last_login, is_active FROM public.admins ORDER BY last_login DESC;
```

### 12.8 Payment Testing

| Method | Test Value |
|--------|------------|
| Card | `4111 1111 1111 1111` — any future expiry, any CVV |
| UPI (success) | `success@razorpay` |
| UPI (failure) | `failure@razorpay` |
| Key prefix (test) | `rzp_test_...` |
| Key prefix (live) | `rzp_live_...` |

Switch to live: replace both `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with live credentials.

### 12.9 Deployment — Vercel

**Initial deployment:**
1. Push repository to GitHub
2. Import at `vercel.com` → New Project
3. Add all environment variables under Settings → Environment Variables
4. Deploy

**Custom domain DNS records:**
```
A      @    76.76.19.165
CNAME  www  cname.vercel-dns.com
```

**Rollback:** Vercel Dashboard → Deployments → select previous deployment → Promote to Production

**Cron job** (`vercel.json`): `/api/admin/cleanup-pending` fires daily at 00:00 UTC automatically.

### 12.10 Coding Conventions

| Convention | Rule |
|------------|------|
| Booking ID | `BK` + `YYYYMMDD` + 6 random uppercase alphanumeric chars |
| Invoice Number | `INV-` + `YYYYMMDD` + `-` + sequential number |
| Currency storage | INR as numeric (integer or decimal). Display via `formatCurrency()` |
| Dates storage | ISO 8601 UTC in Supabase. Display converted to IST (UTC+5:30) via `date-fns` |
| Amounts in Razorpay | Multiply by 100 (paise). Divide by 100 for display |
| Supabase admin client | Server-only. Never import `supabase-admin.ts` in client components |
| Validation | Always run `lib/validation.ts` before API calls from client |
| Tailwind dark bg | `bg-primary-950` (`#1a1512`) |
| Tailwind accent | `bg-secondary-500` (`#ffda00`) |

### 12.11 Key Files Quick Reference

| Need to change… | File |
|----------------|------|
| Homepage content | `app/page.tsx` |
| Header / navigation | `components/Header.tsx` |
| Footer links | `components/Footer.tsx` |
| Taxi booking form | `app/book-taxi/page.tsx` |
| Tours listing | `app/tours/page.tsx` |
| Payment flow | `app/payment/page.tsx` |
| Booking confirmation | `app/booking-confirmed/page.tsx` |
| Admin dashboard | `app/admin/page.tsx` |
| Database functions | `lib/database.ts`, `lib/db.ts` |
| Razorpay integration | `lib/payment.ts` |
| Email templates | `lib/resend-notifications.ts` |
| PDF invoice | `lib/invoice.ts` |
| Utility helpers | `lib/utils.ts` |
| Input validation | `lib/validation.ts` |
| Supabase client | `lib/supabase.ts` |
| Supabase admin | `lib/supabase-admin.ts` |
| Database schema | `database.sql` |
| Global styles | `app/globals.css` |
| Tailwind theme | `tailwind.config.js` |
| Next.js config | `next.config.js` |
| Vercel config + cron | `vercel.json` |

### 12.12 Outstanding TODOs

| Priority | Category | Item |
|----------|----------|------|
| High | Security | Password reset flow for admin accounts |
| High | Security | Rate limiting on `POST /api/admin/login` |
| High | Security | 2FA for admin accounts |
| Medium | Notifications | Real SMS integration (currently console-logged) |
| Medium | Notifications | Real WhatsApp integration (currently console-logged) |
| Medium | Features | Refund management UI for admin |
| Medium | Features | Push notifications for booking updates |
| Low | Features | Real-time driver tracking (GPS) |
| Low | Features | Driver-facing mobile application |
| Low | Features | Advanced analytics and reporting dashboard |
| Low | Features | Multi-language support (Hindi, Bengali) |
| Low | Infrastructure | Error tracking integration (Sentry / Rollbar) |
| Low | Infrastructure | Uptime monitoring |
| Low | Infrastructure | Audit logging for admin actions |
| Low | Infrastructure | Penetration testing / security audit |

---

*TaxiHollongi — Complete Application Documentation v1.0*  
*Generated: 2026-05-12 | Branch: v2-unstable*
