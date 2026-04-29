# Changelog

All notable changes to TaxiHollongi will be documented in this file.

---

## [2026-04-29]

**Author:** Yami

### Changes
- fix: tour booking demo 30% advance payment failing due to stale sessionStorage key (taxi data shadowing tour data)
- fix: TypeScript error in invoice.ts color tuple spread argument
- fix: payment page now reads correct sessionStorage key based on booking type in URL

## [2026-04-28]

**Author:** Yami

### Changes
- fix: replace stale setNoOfHours with setDurationDays/setDurationHrs on mode reset
- fix: mobile-first polish across all screens
- fix: remaining payment copy updated to "airport office on arrival"
- feat: admin complete and cancel booking feature
- feat: hourly booking system update
- feat: make full payment the primary CTA, demote 30% prebook to secondary option
- feat: invoice generation with digital signatures
- feat: enhanced booking system with real-time updates
- feat: improved payment processing workflow

---

> This changelog is automatically updated on every commit. Latest updates appear at the top.
