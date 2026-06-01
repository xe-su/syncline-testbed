import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, type JWTPayload } from '../services/token'

export interface AuthRequest extends Request {
  auth?: JWTPayload
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' })
    return
  }
  try {
    req.auth = verifyAccessToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
