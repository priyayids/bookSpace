import { Router } from 'express'
import { prisma } from '../prisma/client.js'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'

export const router = Router()

const roomSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  location: z.string().min(1),
  floor: z.number().int().min(1),
  capacity: z.number().int().min(1),
  facilities: z.array(z.string()).optional().default([]),
  photo_url: z.string().nullable().optional(),
  operating_hours: z.union([
    z.string(),
    z.object({ open: z.string(), close: z.string() })
  ]).optional(),
  is_active: z.boolean().optional(),
})

router.get('/', async (req, res) => {
  try {
    const all = req.query.all === 'true'
    const rooms = await prisma.room.findMany({
      where: all ? {} : { is_active: true },
      orderBy: { name: 'asc' },
    })
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = String(req.params.id)
    const room = await prisma.room.findUnique({
      where: { id },
    })
    if (!room) return res.status(404).json({ error: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch room' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = roomSchema.parse(req.body)
    const room = await prisma.room.create({ data: data as any })
    res.status(201).json(room)
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Room code already exists' })
    res.status(500).json({ error: 'Failed to create room' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id)
    const data = roomSchema.partial().parse(req.body)
    const room = await prisma.room.update({ where: { id }, data: data as any })
    res.json(room)
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed to update room' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = String(req.params.id)
    await prisma.room.update({ where: { id }, data: { is_active: false } })
    res.json({ message: 'Room deactivated' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate room' })
  }
})

router.get('/:id/availability', async (req, res) => {
  try {
    const id = String(req.params.id)
    const room = await prisma.room.findUnique({ where: { id } })
    if (!room) return res.status(404).json({ error: 'Room not found' })

    const date = req.query.date as string
    const bookings = await prisma.booking.findMany({
      where: { room_id: id, date, status: { in: ['confirmed', 'pending'] } },
    })

    const opHours: any = typeof room.operating_hours === 'string' ? JSON.parse(room.operating_hours) : room.operating_hours
    const op = opHours?.open || '08:00'
    const close = opHours?.close || '18:00'
    const allSlots = generateSlots(op, close, 30)

    const busySlots = bookings.map(b => ({
      start: b.start_time,
      end: b.end_time,
      title: b.title,
      status: b.status,
    }))

    res.json({ room, date, slots: allSlots, busySlots })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch availability' })
  }
})

function generateSlots(open: string, close: string, granularity: number): string[] {
  const slots: string[] = []
  const toMin = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1])
  let cur = toMin(open)
  const end = toMin(close)
  while (cur <= end) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0')
    const m = String(cur % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    cur += granularity
  }
  return slots
}
