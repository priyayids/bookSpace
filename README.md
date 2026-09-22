# BookSpace — Modern Meeting Room Booking & Occupancy System

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v8.3-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-v5.2-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-v6.18-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16-336791.svg)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b.svg)](https://playwright.dev/)

**BookSpace** is a full-stack meeting room reservation and live occupancy tracking system. It provides self-service room booking with real-time conflict checking, interactive availability timelines, an unattended TV/kiosk occupancy display mode, and an administrative oversight dashboard with review-and-approve verification workflows.

---

## Architecture & Monorepo Structure

```
bookSpace/
├── frontend/                  # React 19 + Vite 8 + Tailwind CSS v4
│   ├── public/                # Static assets (Favicon, logos)
│   ├── src/
│   │   ├── components/        # Shared components (e.g. RoomTimeline)
│   │   ├── lib/api/           # Typed REST client with token management
│   │   ├── pages/
│   │   │   ├── ReservationPage.tsx # Booking form, availability & My Bookings
│   │   │   ├── OccupancyPage.tsx   # Live room status display (Kiosk/DOOH)
│   │   │   └── AdminPage.tsx       # Overview stats, Room CRUD, Bookings & Settings
│   │   ├── types/             # Shared TypeScript models (Room, Booking, Settings)
│   │   ├── App.tsx            # Navigation and page routing
│   │   ├── index.css          # Tailwind CSS v4 + Design tokens theme
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts         # Dev server proxying /api to port 3000
│
├── backend/                   # Express 5 + TypeScript + Prisma 6
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL data models
│   │   ├── migrations/        # Prisma migration history
│   │   └── seed.ts            # Development and demo seed data
│   ├── src/
│   │   ├── middleware/        # JWT Authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.ts        # Admin login & JWT issue
│   │   │   ├── bookings.ts    # Booking CRUD, overlap checks, Approve verification
│   │   │   ├── dashboard.ts   # Overview statistics & room usage
│   │   │   ├── rooms.ts       # Room CRUD & real-time slot availability
│   │   │   └── settings.ts    # Operating hours & duration settings
│   │   ├── utils/             # Time conversion & slot collision algorithms
│   │   └── index.ts           # Server bootstrap & CORS/Helmet setup
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                      # Product Requirements & Design Specifications
│   └── PRD-Meeting-Room-Booking.md
├── tests/                     # Playwright End-to-End & automated test scripts
│   ├── e2e-test.mjs           # Full user & admin journey validation
│   └── take-screenshots.mjs   # Automated UI capture
├── docker-compose.yml         # Container orchestration (Frontend, Backend, Postgres, Nginx)
├── Dockerfile.frontend        # Multi-stage production build for Frontend
├── Dockerfile.backend         # Production build for Backend
├── nginx.conf                 # Reverse proxy configuration
├── pnpm-workspace.yaml        # Monorepo workspace configuration
└── package.json               # Root workspace scripts
```

---

## Core Features

### 1. Reservation Page (`/`)
- **Visual Availability Timeline**: Shows busy blocks throughout operating hours (08:00–18:00) with hour ticks and highlight overlays for the selected duration.
- **Flexible Duration**: Bookings support custom start and end times (minimum 1 hour duration by default, 30-minute increments).
- **Collision Prevention**: Real-time validation blocks overlapping bookings and prevents double-booking.
- **Capacity & Facility Tags**: Room cards highlight seat capacity, equipment (Projector, Whiteboard, Video Conference, TV, Phone), and floor locations.
- **Pending Booking Flow**: Submitting a reservation creates a `pending` booking and renders a confirmation receipt with "Booking Requested" status awaiting administrator verification.
- **Self-Service "My Bookings"**: Users can search reservations by email to monitor pending/confirmed status or cancel anytime.

### 2. Live Occupancy Display (`/` -> Room Status)
- **Shared Screen / Kiosk Mode**: High-contrast, dark-mode display optimized for wall-mounted tablets or lobby TVs.
- **Real-time Status Badges**:
  - `In Use`: Displays active meeting title and remaining time window.
  - `Free`: Displayed when the room is currently unoccupied but has other meetings scheduled today.
  - `Free all day`: Displayed when the room has zero meetings scheduled today.
- **Synchronized Day Progress**: Visual vertical indicator marking current time relative to room operating hours.

### 3. Admin Oversight & Master Data (`/` -> Admin)
- **Overview Dashboard**: Metrics for Active Rooms, Today's Bookings, Total Bookings, Cancelled Bookings, and Most Booked Rooms.
- **Booking Approval Workflow**:
  - Unverified reservations appear with an amber `Pending` badge.
  - Administrators can review details and click **Approve** to verify and confirm the booking, or **Reject** to cancel.
  - Filter bookings by `All statuses`, `Pending`, `Confirmed`, or `Cancelled`.
- **Room Management (CRUD)**:
  - Add new rooms with custom code, capacity, floor, facilities, and image upload.
  - Edit existing room parameters or upload new room photos.
  - Toggle room availability (`Active` / `Inactive`) for maintenance.
- **Global Settings Configuration**:
  - Configure global operating hours (e.g. 08:00–18:00).
  - Adjust minimum booking duration (e.g. 30m, 45m, 60m).
  - Configure time slot granularity (15m or 30m).

---

## API Reference

### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate admin (Default password: `admin`) | Public |

### Rooms
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/rooms` | List active rooms (`?all=true` includes inactive) | Public |
| `GET` | `/api/rooms/:id` | Get details of a single room | Public |
| `POST` | `/api/rooms` | Create a new room | Admin |
| `PUT` | `/api/rooms/:id` | Update room details | Admin |
| `DELETE` | `/api/rooms/:id` | Deactivate room (soft delete) | Admin |
| `GET` | `/api/rooms/:id/availability?date=YYYY-MM-DD` | Get slots and busy blocks | Public |

### Bookings
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/bookings` | List bookings (`date`, `room_id`, `booked_by_email`, `status`) | Public / Admin |
| `POST` | `/api/bookings` | Create a booking (Defaults to `pending` status) | Public |
| `PUT` | `/api/bookings/:id` | Update booking fields or status | Public / Admin |
| `POST` | `/api/bookings/:id/approve` | Approve a pending booking (Sets status to `confirmed`) | Admin |
| `DELETE` | `/api/bookings/:id` | Cancel booking (Sets status to `cancelled`) | Public / Admin |

### Settings & Dashboard
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/settings` | Get global booking rules and operating hours | Public |
| `PUT` | `/api/settings` | Update global settings | Admin |
| `GET` | `/api/dashboard/stats` | Get usage statistics, activity, and room metrics | Admin |

---

## Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **pnpm**: v9 or higher
- **PostgreSQL**: v14 or higher (or Docker)

### 1. Installation

Clone the repository and install all monorepo dependencies:
```bash
git clone https://github.com/priyayids/bookSpace.git
cd bookSpace
pnpm install
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Ensure `DATABASE_URL` in `.env` points to your PostgreSQL database:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/roombook?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET=supersecretjwtkey
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
TIMEZONE=Asia/Jakarta
```

### 3. Database Migration & Seed

Run Prisma migrations to create the schema and seed demo rooms:
```bash
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
pnpm --filter backend db:seed
```

### 4. Running the Development Servers

Start both frontend and backend concurrently:
```bash
# Terminal 1: Express Backend (Port 3000)
pnpm --filter backend dev

# Terminal 2: Vite Frontend (Port 5173)
pnpm --filter frontend dev
```

Open your browser at `http://localhost:5173`.
- Default Admin Password: **`admin`**

---

## Testing & Quality Assurance

Automated End-to-End tests are implemented using Playwright:

```bash
# Run automated E2E test suite
node tests/e2e-test.mjs

# Capture full-page UI screenshots
node tests/take-screenshots.mjs
```

The test suite automatically seeds test fixtures, validates UI rendering, executes booking creation, tests admin verification approval, and verifies error handling.

---

## Production Deployment with Docker

BookSpace includes a production-ready `docker-compose.yml` with multi-stage Dockerfiles and Nginx reverse proxy.

```bash
# Build and start all containers in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f
```

Services started:
- **db**: PostgreSQL 16
- **backend**: Express + Prisma REST API (internal port 3000)
- **frontend**: Nginx serving production Vite bundle and reverse proxying `/api` requests (external port 80)

---

## License

MIT License. Designed and maintained for enterprise meeting space scheduling.
