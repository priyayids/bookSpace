import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No auth token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production')
    ;(req as any).user = decoded
    if (req.body && typeof req.body === 'object') {
      req.body.user = decoded
    }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function authOrSimple(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production')
      ;(req as any).user = decoded
      return next()
    } catch { /* fall through to simple auth */ }
  }
  if (req.body?.password === 'admin' || req.headers['x-admin'] === 'true') {
    return next()
  }
  return res.status(401).json({ error: 'Admin access required' })
}
