# BookSpace — Meeting Room Booking System

Full-stack monorepo: React + Vite + Tailwind CSS frontend with Express + Prisma + PostgreSQL backend.

## Structure

```
bookSpace/
├── frontend/          # React + Vite + Tailwind CSS v4
│   ├── public/        # Static assets (business meeting favicon, icons)
│   ├── src/
│   │   ├── components/ # RoomTimeline (visual time bar with hour ticks & live indicator)
│   │   ├── lib/api/   # Typed API client with auth token management
│   │   ├── types/     # Shared TypeScript types (Room, Booking, Settings)
│   │   ├── pages/     # ReservationPage, OccupancyPage, AdminPage
│   │   └── index.css  # Tailwind v4 + design token classes (.badge-pending, etc.)
│   ├── package.json
│   ├── vite.config.ts # Proxies /api to backend in dev
│   └── index.html
├── backend/           # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/    # rooms, bookings, settings, dashboard, auth
│   │   ├── middleware/ # JWT auth middleware
│   │   ├── utils/     # Validation & time collision helpers
│   │   └── index.ts
│   ├── prisma/        # Schema (pending default), migrations, seed script
│   └── package.json
├── docs/              # PRD and documentation
├── tests/             # Playwright E2E and visual testing suite
├── docker-compose.yml
├── Dockerfile.frontend
├── Dockerfile.backend
├── nginx.conf
└── package.json       # Root pnpm workspace
```

## Development

```bash
pnpm install
pnpm --filter backend db:seed # Seed test rooms & demo bookings
pnpm --filter frontend dev    # Vite on port 5173
pnpm --filter backend dev     # Express on port 3000
pnpm docker:up                # Docker Compose
node tests/e2e-test.mjs       # Run Playwright E2E tests
```

## API Endpoints

- `GET /api/rooms` — List active rooms (`?all=true` for all)
- `POST /api/rooms` — Create room [admin]
- `PUT /api/rooms/:id` — Update room [admin]
- `DELETE /api/rooms/:id` — Deactivate room [admin]
- `GET /api/rooms/:id/availability?date=` — Room availability (includes confirmed and pending slots)
- `GET /api/bookings` — List bookings (filters by date, room_id, booked_by_email, status)
- `POST /api/bookings` — Create booking (defaults to `pending` status, validates overlap)
- `PUT /api/bookings/:id` — Edit booking
- `POST /api/bookings/:id/approve` — Approve pending booking (`status: "confirmed"`) [admin]
- `DELETE /api/bookings/:id` — Cancel booking (`status: "cancelled"`)
- `GET /api/settings` — Get global booking rules
- `PUT /api/settings` — Update settings [admin]
- `GET /api/dashboard/stats` — Dashboard statistics (today, confirmed, pending, cancelled) [admin]
- `POST /api/auth/login` — Admin login (password: "admin")

## Key Business Logic

- **Default Status**: Newly created reservations default to `status: "pending"`.
- **Admin Verification**: Administrators review pending bookings in the Admin Dashboard Bookings tab and click **Approve** to verify and confirm them, or **Reject** to cancel.
- **Overlap & Conflict Protection**: Both `confirmed` and `pending` bookings block time slots to prevent double-booking.
- **Live Occupancy Status**: Displays `"In Use"` when currently occupied, `"Free"` if there are meetings scheduled later in the day, or `"Free all day"` if zero meetings exist today.

## Stack

- Frontend: React 19 + Vite 8 + TypeScript 5.7 + Tailwind CSS v4
- Backend: Express 5 + TypeScript + Prisma ORM + PostgreSQL
- Database: PostgreSQL (via Docker or local service)
- Deployment: Docker + nginx + docker-compose
- Testing: Playwright E2E
