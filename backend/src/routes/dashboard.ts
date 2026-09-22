import { Router } from 'express'
import { prisma } from '../prisma/client.js'
import { formatBooking } from './bookings.js'

export const router = Router()

router.get('/stats', async (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const [todayBookings, totalConfirmedBookings, totalPendingBookings, totalCancelledBookings, activeRooms, recentActivity] = await Promise.all([
      prisma.booking.count({ where: { date: today, status: 'confirmed' } }),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.count({ where: { status: 'cancelled' } }),
      prisma.room.count({ where: { is_active: true } }),
      prisma.booking.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { room: { select: { id: true, name: true, code: true, location: true } } },
      }),
    ])

    const roomUsage = await prisma.room.findMany({
      where: { is_active: true },
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { bookings: { _count: 'desc' } },
    })

    res.json({
      todayBookings,
      totalBookings: totalConfirmedBookings,
      pendingBookings: totalPendingBookings,
      cancelledBookings: totalCancelledBookings,
      activeRooms,
      totalRooms: roomUsage.length,
      mostBookedRooms: roomUsage.map(r => ({ name: r.name, count: r._count.bookings })),
      recentActivity: recentActivity.map(formatBooking),
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})
