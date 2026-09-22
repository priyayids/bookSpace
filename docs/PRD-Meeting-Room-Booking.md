# BookSpace — PRD & System Architecture

## 1. Overview

A web-based meeting room booking system with three main surfaces:

1. **Reservation Page** — form + flow for booking a room (submits requests in `pending` status awaiting admin verification)
2. **Occupancy Display Page** — shows today's room occupancy (designed for a shared screen / TV outside the room, or a dashboard view)
3. **Admin Dashboard** — master data management (Rooms, Bookings verification/approval) + oversight

**Goal:** Replace manual/ad-hoc room booking (chat groups, whiteboards, spreadsheets) with a clean, professional, self-service system that prevents double-booking and gives real-time visibility into room availability.

**Target users:**
- **Employees** — request a room for a meeting
- **Admin/Facility staff** — verify & approve pending bookings, manage rooms, resolve conflicts
- **Passers-by / receptionist** — glance at the occupancy display to see which rooms are free

---

## 2. Core Rules & Constraints

- Minimum booking duration: **1 hour**
- Booking time is **flexible** — not locked to fixed slots (e.g. not only 09:00, 10:00…). User can pick any start time and any duration ≥ 1 hour, in increments of 30 minutes.
- **Pending Default & Verification**: All new bookings created by users default to `status: "pending"`. An administrator reviews the request and clicks **Approve** to verify and confirm it.
- No overlapping bookings allowed for the same room. Both `pending` and `confirmed` reservations reserve the slot to prevent double-booking.
- Operating hours are configurable per room or globally (e.g. 08:00–18:00) — bookings outside this window are blocked.
- A booking belongs to: Room, Date, Start time, End time, Title/Purpose, Booked by (name/email), optional Attendee count, optional Notes, and Status (`pending` | `confirmed` | `cancelled`).

---

## 3. Pages / Modules

### 3.1 Page 1 — Reservation Form & Flow

**Purpose:** Let a user pick a room and time, and submit a booking request.

**Flow:**
1. User lands on the reservation page.
2. Select **Date** (default: today).
3. Select **Room** — show room cards with capacity, facilities (projector, whiteboard, video conf, etc.), and current-day availability status (Available now / Busy until HH:MM / Fully booked).
4. Pick **Start time** and **Duration** (or Start + End) — UI shows existing bookings for that room/day (a simple timeline/gantt strip) so the user can see free gaps at a glance.
5. Live validation:
   - Duration ≥ 1 hour
   - No overlap with existing bookings (confirmed or pending)
   - Within operating hours
6. Fill in **Meeting title**, **Booked by** (name and email), **Number of attendees** (validated against room capacity), **Notes** (optional).
7. Submit → "Booking Requested" success screen with booking summary and amber `Pending` badge indicating the reservation is awaiting administrator approval.
8. **My Bookings lookup**: Users can query their reservations by email to see pending and confirmed statuses, or cancel their bookings.

---

### 3.2 Page 2 — Occupancy Display (Today's View)

**Purpose:** At-a-glance status of all rooms for the current day. Designed for a shared/public display (e.g. lobby screen, kiosk) — read-only, auto-refreshing.

**Content:**
- Grid or list of all rooms, each showing:
  - Room name + photo/icon
  - Current status badge: **Available** (green) / **In Use** (red)
  - Current meeting title and start/end time window
  - Unoccupied state display: shows **Free** if there are other bookings scheduled later today, or **Free all day** if the room has zero meetings today.
- Unified day **timeline bar** (08:00–18:00) showing booked blocks visually with hour ticks and current time progress line.

---

### 3.3 Page 3 — Admin Dashboard

**Purpose:** Manage master data, verify booking requests, and oversee room operations.

**Modules:**

**a) Room Master Data (CRUD)**
- Room name, code, location/floor
- Capacity
- Facilities (multi-select: projector, TV, whiteboard, video conferencing, phone)
- Photo upload / preview
- Operating hours override (optional, per room)
- Active/Inactive toggle (soft-disable a room under maintenance)

**b) Bookings Management & Approval Workflow**
- Table view of all bookings with filter options: `All statuses`, `Pending`, `Confirmed`, and `Cancelled`.
- **Verification & Approval**: For pending reservations, provides an **Approve** button (transitions status to `confirmed`) and a **Reject** button (cancels booking).
- Edit / cancel any booking.
- Real-time status update in table rows.

**c) Time Slot / Operating Hours Settings**
- Global operating hours (e.g. 08:00–18:00)
- Minimum booking duration (default 60 min, configurable)
- Booking granularity (15/30 min steps)

**d) Dashboard / Overview**
- Key metrics: Active rooms, Today's bookings, Total confirmed bookings, Pending approval bookings, Cancelled bookings.
- Most booked rooms utilization bar chart.
- Recent booking activity log.

---

## 4. Data Model

```
Room
- id: string (cuid)
- name: string
- code: string (unique)
- location: string
- floor: int
- capacity: int
- facilities: string[]
- photo_url: string (nullable)
- operating_hours: json ({open: "08:00", close: "18:00"})
- is_active: boolean (default true)
- created_at, updated_at

Booking
- id: string (cuid)
- room_id: string (FK → Room)
- date: string (YYYY-MM-DD)
- start_time: string (HH:mm)
- end_time: string (HH:mm)
- title: string
- booked_by_name: string
- booked_by_email: string
- attendee_count: int (nullable)
- notes: string (nullable)
- status: "pending" | "confirmed" | "cancelled" (default "pending")
- created_at, updated_at
```

Settings (singleton or key-value)
- operating_hours: {open, close}
- min_duration_minutes: default 60
- slot_granularity_minutes: default 30
- blackout_dates: date[] (optional)
```

---

## 5. API Endpoints (suggested)

```
GET    /api/rooms                      list rooms (with today's status computed)
POST   /api/rooms                      create room        [admin]
PUT    /api/rooms/:id                  update room         [admin]
DELETE /api/rooms/:id                  deactivate room     [admin]

GET    /api/bookings?date=&room_id=    list bookings (for a date / room)
POST   /api/bookings                   create booking (validates overlap + min duration + hours)
PUT    /api/bookings/:id               edit booking
DELETE /api/bookings/:id               cancel booking

GET    /api/rooms/:id/availability?date=   returns free/busy timeline for a room

GET    /api/settings                   get global settings
PUT    /api/settings                   update settings      [admin]

GET    /api/dashboard/stats            (optional) usage stats [admin]
```

**Server-side validation is mandatory** for overlap checking and min-duration — never trust client-side validation alone, since concurrent bookings can race.

---

## 6. Non-Functional Requirements

- **Professional, clean UI** — consistent design system, generous whitespace, clear status colors (green/red/amber), no clutter.
- **Responsive**: reservation page works on mobile; occupancy display optimized for large screens/kiosks.
- **Real-time-ish updates**: occupancy display should reflect new bookings within ~30–60s without manual refresh.
- **Timezone**: fix to a single timezone (e.g. Asia/Jakarta) unless multi-location is needed.
- **Concurrency-safe booking creation**: use a DB-level unique/overlap constraint or transaction check to prevent race-condition double-bookings.
- **Auth**: admin dashboard requires login; reservation/display pages can be public within the office network or lightly gated (e.g. simple email, no password) depending on your needs — decide before dev starts.

---

## 7. Suggested Tech Stack

Matches a stack you already run in production, so an agent can reuse familiar patterns:

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express (Node.js) + TypeScript
- **Database**: PostgreSQL (or SQLite for a lightweight single-server deployment) via Prisma ORM — Prisma gives you migrations + type-safe queries, which agentic agents handle well.
- **Realtime**: simple polling (every 30s) for v1; upgrade to WebSocket/SSE later if needed.
- **Deployment**: Docker + nginx (matches your existing infra), single container or docker-compose with app + db.
- **Auth (admin)**: simple JWT/session-based auth, or basic-auth behind nginx if you want to keep it minimal for v1.

---

## 8. Dev Flow (for the Agentic Agent)

Structured as phases so the agent can work incrementally and you can review at each checkpoint.

### Phase 0 — Project Setup
- Scaffold monorepo or two folders: `/frontend` (Vite + React + TS + Tailwind) and `/backend` (Express + TS)
- Set up Prisma with the schema from Section 4
- Set up Docker + docker-compose (app + Postgres)
- Basic health-check endpoint

### Phase 1 — Backend Core
- Implement Room CRUD API
- Implement Booking API with server-side overlap + min-duration + operating-hours validation
- Implement Settings API
- Seed script with sample rooms + a few bookings for testing
- Write basic tests for the overlap-validation logic (this is the highest-risk part — test it explicitly)

### Phase 2 — Reservation Page (Frontend)
- Room list with availability status
- Date + room + time picker with visual timeline strip
- Form validation (client-side mirrors server rules for good UX, server remains source of truth)
- Success/confirmation screen
- Basic "my bookings" lookup + cancel flow

### Phase 3 — Occupancy Display Page
- Grid of rooms with live status
- Per-room timeline bar for the day
- Polling refresh logic
- Kiosk-friendly styling (large text, high contrast, auto-scroll if many rooms)

### Phase 4 — Admin Dashboard
- Admin auth (login page + protected routes)
- Room master data CRUD UI
- Bookings table with filter/edit/cancel
- Settings page (operating hours, min duration, granularity)
- (Optional) simple stats widget

### Phase 5 — Polish & Hardening
- Concurrency test: simulate two simultaneous bookings for the same slot, confirm only one succeeds
- Timezone correctness check
- Responsive/mobile pass on reservation page
- Empty states, loading states, error states across all three pages
- Final visual pass for "professional and clean" — consistent spacing, typography scale, color system

### Phase 6 — Deployment
- Dockerize frontend build (served via nginx) + backend
- docker-compose with Postgres volume
- Environment variable config (DB URL, JWT secret, timezone)
- Smoke test in production-like environment

---

## 9. Acceptance Criteria (v1 "done")

- [ ] User can book a room for ≥1 hour without needing to know exact fixed slots
- [ ] System rejects overlapping bookings, including under concurrent submission
- [ ] Occupancy display shows correct real-time-ish status for all rooms, refreshing automatically
- [ ] Admin can create/edit/deactivate rooms
- [ ] Admin can view, edit, and cancel any booking
- [ ] Admin can configure operating hours and minimum duration
- [ ] All three pages are responsive and visually consistent (shared design system)
- [ ] Deployed via Docker with a working docker-compose setup

---

## 10. Open Questions (decide before/at Phase 0)

1. Does the reservation page require login, or is name+email enough to identify a booker?
2. Single location/timezone, or multi-building/multi-floor from day one?
3. Do you want email/WhatsApp notifications on booking confirmation or cancellation? (out of scope for v1 unless specified)
4. Expected number of rooms and expected concurrent users — affects whether polling is sufficient or WebSocket is worth the extra complexity now.
