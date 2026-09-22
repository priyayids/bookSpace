import { Router } from 'express'
import { prisma } from '../prisma/client.js'
import { z } from 'zod'
import { hasOverlap, timeToMinutes } from '../utils/validation.js'

export const router = Router()

export function formatBooking(b: any) {
  if (!b) return b
  return {
    ...b,
    roomId: b.room_id,
    startTime: b.start_time,
    endTime: b.end_time,
    bookedByName: b.booked_by_name,
    bookedByEmail: b.booked_by_email,
    attendeeCount: b.attendee_count,
  }
}

const bookingSchema = z.object({
  roomId: z.string().optional(),
  room_id: z.string().optional(),
  date: z.string(),
  startTime: z.string().optional(),
  start_time: z.string().optional(),
  endTime: z.string().optional(),
  end_time: z.string().optional(),
  title: z.string().min(1),
  bookedByName: z.string().optional(),
  booked_by_name: z.string().optional(),
  bookedByEmail: z.string().email().optional(),
  booked_by_email: z.string().email().optional(),
  attendeeCount: z.number().int().min(0).optional(),
  attendee_count: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
})

router.get('/', async (req, res) => {
  try {
    const { date, room_id, roomId, booked_by_email, bookedByEmail, status } = req.query
    const filter: any = {}
    if (date) filter.date = date as string
    const targetRoomId = (room_id || roomId) as string | undefined
    if (targetRoomId) filter.room_id = targetRoomId
    const targetEmail = (booked_by_email || bookedByEmail) as string | undefined
    if (targetEmail) filter.booked_by_email = targetEmail

    if (status && status !== 'all') {
      filter.status = status as string
    } else if (!status && !targetEmail && date) {
      filter.status = 'confirmed'
    }

    const bookings = await prisma.booking.findMany({
      where: filter,
      include: { room: { select: { id: true, name: true, code: true, location: true } } },
      orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
    })
    res.json(bookings.map(formatBooking))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' })
  }
})

router.post('/', async (req, res) => {
  try {
    const raw = bookingSchema.parse(req.body)
    const roomId = raw.roomId || raw.room_id
    const startTime = raw.startTime || raw.start_time
    const endTime = raw.endTime || raw.end_time
    const bookedByName = raw.bookedByName || raw.booked_by_name
    const bookedByEmail = raw.bookedByEmail || raw.booked_by_email
    const attendeeCount = raw.attendeeCount ?? raw.attendee_count ?? 0
    const notes = raw.notes || null

    if (!roomId || !startTime || !endTime || !bookedByName || !bookedByEmail) {
      return res.status(400).json({ error: 'Missing required booking fields' })
    }

    const settings = await prisma.settings.findUnique({ where: { id: 'settings' } })
    const opHours: any = settings?.operating_hours
      ? (typeof settings.operating_hours === 'string' ? JSON.parse(settings.operating_hours) : settings.operating_hours)
      : { open: '08:00', close: '18:00' }
    const open = opHours?.open || '08:00'
    const close = opHours?.close || '18:00'
    const minDuration = settings?.min_duration_minutes ?? 60

    const start = timeToMinutes(startTime)
    const end = timeToMinutes(endTime)

    if (end - start < minDuration) {
      return res.status(400).json({ error: `Minimum booking duration is ${minDuration} minutes` })
    }
    if (start < timeToMinutes(open) || end > timeToMinutes(close)) {
      return res.status(400).json({ error: 'Booking outside operating hours' })
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        room_id: roomId,
        date: raw.date,
        status: { in: ['confirmed', 'pending'] },
      },
    })
    if (hasOverlap(existingBookings, startTime, endTime)) {
      return res.status(409).json({ error: 'Time conflicts with existing booking' })
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room || !room.is_active) {
      return res.status(400).json({ error: 'Room not available' })
    }
    if (attendeeCount && attendeeCount > room.capacity) {
      return res.status(400).json({ error: `Exceeds room capacity (${room.capacity})` })
    }

    // If there was a previously cancelled booking occupying this exact slot, clean it up
    await prisma.booking.deleteMany({
      where: {
        room_id: roomId,
        date: raw.date,
        start_time: startTime,
        end_time: endTime,
        status: 'cancelled',
      },
    })

    const booking = await prisma.booking.create({
      data: {
        room_id: roomId,
        date: raw.date,
        start_time: startTime,
        end_time: endTime,
        title: raw.title,
        booked_by_name: bookedByName,
        booked_by_email: bookedByEmail,
        attendee_count: attendeeCount,
        notes,
        status: raw.status || 'pending',
      },
      include: { room: { select: { id: true, name: true, code: true, location: true } } },
    })

    res.status(201).json(formatBooking(booking))
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Duplicate booking detected' })
    res.status(500).json({ error: 'Failed to create booking' })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const raw = bookingSchema.partial().parse(req.body)
    const updateData: any = {}
    if (raw.title !== undefined) updateData.title = raw.title
    if (raw.date !== undefined) updateData.date = raw.date
    if (raw.startTime || raw.start_time) updateData.start_time = raw.startTime || raw.start_time
    if (raw.endTime || raw.end_time) updateData.end_time = raw.endTime || raw.end_time
    if (raw.roomId || raw.room_id) updateData.room_id = raw.roomId || raw.room_id
    if (raw.bookedByName || raw.booked_by_name) updateData.booked_by_name = raw.bookedByName || raw.booked_by_name
    if (raw.bookedByEmail || raw.booked_by_email) updateData.booked_by_email = raw.bookedByEmail || raw.booked_by_email
    if (raw.attendeeCount !== undefined || raw.attendee_count !== undefined) updateData.attendee_count = raw.attendeeCount ?? raw.attendee_count
    if (raw.notes !== undefined) updateData.notes = raw.notes
    if (raw.status !== undefined) updateData.status = raw.status

    const id = String(req.params.id)
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { room: { select: { id: true, name: true, code: true, location: true } } },
    })
    res.json(formatBooking(booking))
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed to update booking' })
  }
})

router.post('/:id/approve', async (req, res) => {
  try {
    const id = String(req.params.id)
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'confirmed' },
      include: { room: { select: { id: true, name: true, code: true, location: true } } },
    })
    res.json({ message: 'Booking approved', booking: formatBooking(booking) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve booking' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const id = String(req.params.id)
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { room: { select: { id: true, name: true, code: true, location: true } } },
    })
    res.json({ message: 'Booking cancelled', booking: formatBooking(booking) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel booking' })
  }
})
