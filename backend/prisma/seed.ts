import { PrismaClient, BookingStatus } from '@prisma/client'

const prisma = new PrismaClient()

const rooms = [
  { id: 'r1', name: 'Archipelago', code: 'A-01', location: 'Building A', floor: 1, capacity: 12, facilities: ['projector', 'whiteboard', 'video_conf', 'phone'], operating_hours: { open: '08:00', close: '18:00' }, is_active: true },
  { id: 'r2', name: 'Komodo', code: 'A-02', location: 'Building A', floor: 1, capacity: 6, facilities: ['tv', 'whiteboard'], operating_hours: { open: '08:00', close: '18:00' }, is_active: true },
  { id: 'r3', name: 'Bromo', code: 'B-01', location: 'Building B', floor: 2, capacity: 20, facilities: ['projector', 'video_conf', 'phone', 'whiteboard', 'tv'], operating_hours: { open: '08:00', close: '18:00' }, is_active: true },
  { id: 'r4', name: 'Rinjani', code: 'B-02', location: 'Building B', floor: 2, capacity: 4, facilities: ['tv', 'phone'], operating_hours: { open: '08:00', close: '18:00' }, is_active: true },
  { id: 'r5', name: 'Batur', code: 'C-01', location: 'Building C', floor: 3, capacity: 8, facilities: ['projector', 'whiteboard'], operating_hours: { open: '08:00', close: '18:00' }, is_active: true },
  { id: 'r6', name: 'Semeru', code: 'C-02', location: 'Building C', floor: 3, capacity: 30, facilities: ['projector', 'video_conf', 'phone', 'whiteboard', 'tv'], operating_hours: { open: '07:00', close: '20:00' }, is_active: false },
]

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

const bookings = [
  { id: 'b1', date: today, start_time: '09:00', end_time: '10:30', title: 'Q3 Planning Review', booked_by_name: 'Aditya Putra', booked_by_email: 'aditya@company.co', attendee_count: 8, status: 'confirmed' as BookingStatus, roomId: 'r1' },
  { id: 'b2', date: today, start_time: '13:00', end_time: '15:00', title: 'Product Roadmap Sync', booked_by_name: 'Sari Dewi', booked_by_email: 'sari@company.co', attendee_count: 10, status: 'confirmed' as BookingStatus, roomId: 'r1' },
  { id: 'b3', date: today, start_time: '10:00', end_time: '11:00', title: 'Design Critique', booked_by_name: 'Rizky Halim', booked_by_email: 'rizky@company.co', attendee_count: 4, status: 'confirmed' as BookingStatus, roomId: 'r2' },
  { id: 'b4', date: today, start_time: '08:00', end_time: '09:30', title: 'All-hands Kickoff', booked_by_name: 'Maya Sari', booked_by_email: 'maya@company.co', attendee_count: 18, status: 'confirmed' as BookingStatus, roomId: 'r3' },
  { id: 'b5', date: today, start_time: '14:00', end_time: '16:00', title: 'Partner Integration Demo', booked_by_name: 'Budi Santoso', booked_by_email: 'budi@company.co', attendee_count: 15, status: 'confirmed' as BookingStatus, roomId: 'r3' },
  { id: 'b6', date: today, start_time: '11:00', end_time: '12:00', title: '1-on-1 Coaching', booked_by_name: 'Putri Wulandari', booked_by_email: 'putri@company.co', attendee_count: 2, status: 'confirmed' as BookingStatus, roomId: 'r4' },
  { id: 'b7', date: today, start_time: '15:00', end_time: '17:00', title: 'Engineering Retrospective', booked_by_name: 'Fajar Nugroho', booked_by_email: 'fajar@company.co', attendee_count: 6, status: 'confirmed' as BookingStatus, roomId: 'r5' },
  { id: 'b8', date: tomorrow, start_time: '09:00', end_time: '11:00', title: 'Budget Review FY25', booked_by_name: 'Aditya Putra', booked_by_email: 'aditya@company.co', attendee_count: 6, status: 'confirmed' as BookingStatus, roomId: 'r1' },
]

async function main() {
  await prisma.booking.deleteMany()
  await prisma.room.deleteMany()

  for (const room of rooms) {
    await prisma.room.upsert({ where: { id: room.id }, update: room, create: room })
  }

  for (const booking of bookings) {
    const { roomId, ...bookingData } = booking
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: { ...bookingData, room: { connect: { id: roomId } } },
      create: { ...bookingData, room: { connect: { id: roomId } } },
    })
  }

  await prisma.settings.upsert({
    where: { id: 'settings' },
    update: {},
    create: { id: 'settings', operating_hours: { open: '08:00', close: '18:00' }, min_duration_minutes: 60, slot_granularity_minutes: 30, timezone: 'Asia/Jakarta' },
  })

  console.log('Database seeded successfully!')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
