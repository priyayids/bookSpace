import "dotenv/config"
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { router as roomsRouter } from './routes/rooms.js'
import { router as bookingsRouter } from './routes/bookings.js'
import { router as settingsRouter } from './routes/settings.js'
import { router as dashboardRouter } from './routes/dashboard.js'
import { router as authRouter } from './routes/auth.js'
import { authMiddleware } from './middleware/auth.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/rooms', roomsRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/dashboard', authMiddleware, dashboardRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})
