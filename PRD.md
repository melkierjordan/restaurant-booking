# Mini-PRD: Restaurant Table Booking App

**Stack:** Next.js 16 (App Router) + Tailwind CSS + Convex
**Scope:** 60-minute sprint
**Constraints:** 4 tables, 6 slots/day, 7-day rolling window

---

## Convex Schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  slots: defineTable({
    date: v.string(),       // "2026-05-27"
    time: v.string(),       // "18:00"
    tableId: v.number(),    // 1–4
    status: v.union(v.literal("open"), v.literal("booked")),
  }).index("by_date", ["date"]),

  bookings: defineTable({
    slotId: v.id("slots"),
    name: v.string(),
    email: v.string(),
    partySize: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
  }).index("by_status", ["status"]),
});
```

---

## Feature 1: Availability Grid

**Summary:** A 7-day × 6-slot grid showing real-time slot availability pulled from Convex.

**Convex:**
| Function | Type | Purpose |
|---|---|---|
| `getSlots` | query | Returns all slots for the next 7 days |
| `seedSlots` | mutation | One-time: creates 4 × 6 × 7 = 168 slot rows if none exist |

**UI Components:**
| Component | Route | Responsibility |
|---|---|---|
| `AvailabilityGrid` | `/` (home) | Renders 7 columns (days) × 6 rows (time slots). Each cell is color-coded: green = open, grey = booked. Clicking an open cell navigates to the booking form. |
| `SlotCell` | — | Single cell displaying time and status badge. |

**Acceptance criteria:**
- Grid loads from Convex with no local state
- Booked cells are non-clickable
- Open cells link to `/book?slotId=<id>`

---

## Feature 2: Booking Form

**Summary:** Customer selects an open slot, fills in name/email/party size, and submits to create a booking.

**Convex:**
| Function | Type | Purpose |
|---|---|---|
| `createBooking` | mutation | Validates slot is still open, inserts a booking (status: `"pending"`), flips slot status to `"booked"`. Throws if slot was already booked (race-condition guard). |

**UI Components:**
| Component | Route | Responsibility |
|---|---|---|
| `BookingForm` | `/book?slotId=` | Form with fields: name (required), email (required), party size (optional, 1–10). Submit calls `createBooking`. |
| `Confirmation` | `/confirmation` | Shows "Booking received" with name, date, time. Links back to grid. |

**Acceptance criteria:**
- Form validates required fields before submit
- Mutation is atomic — no double-booking possible
- On success, redirect to confirmation screen
- On conflict (slot taken), show inline error and link back to grid

---

## Feature 3: Admin Queue

**Summary:** Admin page listing all bookings with one-click Confirm and Cancel actions.

**Convex:**
| Function | Type | Purpose |
|---|---|---|
| `listBookings` | query | Returns all bookings joined with their slot data, ordered newest-first |
| `updateBookingStatus` | mutation | Sets booking status to `"confirmed"` or `"cancelled"`. If cancelled, flips the slot back to `"open"`. |

**UI Components:**
| Component | Route | Responsibility |
|---|---|---|
| `AdminQueue` | `/admin` | Table of bookings: name, email, party size, date/time, status badge. Each row has Confirm and Cancel buttons (disabled when already in that state). |

**Acceptance criteria:**
- All bookings visible regardless of status
- Confirming a pending booking sets status to `"confirmed"`
- Cancelling any booking sets status to `"cancelled"` and reopens the slot
- UI updates in real-time via Convex subscription

---

## Out of Scope

- Auth / login
- Table assignment logic (any open slot = any table)
- Email notifications
- Payments
- Multi-restaurant support
