import { Router } from 'express'
import { prisma } from '../prisma/client.js'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'

export const router = Router()

const settingsSchema = z.object({
  operating_hours: z.object({ open: z.string(), close: z.string() }).optional(),
  min_duration_minutes: z.number().int().min(15).optional(),
  slot_granularity_minutes: z.number().int().min(5).optional(),
})

router.get('/', async (_req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'settings' } })
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' })
  }
})

router.put('/', authMiddleware, async (req, res) => {
  try {
    const data = settingsSchema.parse(req.body)
    const settings = await prisma.settings.upsert({
      where: { id: 'settings' },
      update: data,
      create: {
        id: 'settings',
        ...data,
      },
    })
    res.json(settings)
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors })
    res.status(500).json({ error: 'Failed to update settings' })
  }
})
