import { Router } from 'express'
import jwt from 'jsonwebtoken'

export const router = Router()

router.post('/login', (req, res) => {
  const { password } = req.body
  if (password === 'admin') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'change-me-in-production', { expiresIn: '1h' })
    res.json({ token })
  } else {
    res.status(401).json({ error: 'Incorrect password' })
  }
})
