import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from './env'
import { prisma } from './prisma'

export interface JwtPayload {
  sub: string
  role: 'CUSTOMER' | 'ADMIN'
  email: string
}

export function signToken(payload: JwtPayload, expiresIn: string = '7d') {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}

export async function comparePassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash)
}

// ---- Middleware ----

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)
  // Also accept cookie-style fallback for SSR-friendly setups
  const cookie = req.headers.cookie
  if (cookie) {
    const m = cookie.match(/(?:^|; )ubobo_token=([^;]+)/)
    if (m) return decodeURIComponent(m[1])
  }
  return null
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) return next()
  try {
    req.user = verifyToken(token)
  } catch {
    // ignore invalid token for optional auth
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req)
  if (!token) return res.status(401).json({ error: 'UNAUTHENTICATED' })
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' })
    next()
  })
}

/**
 * Ensure the single-admin account exists on boot.
 * Idempotent — safe to call repeatedly.
 */
export async function ensureAdminAccount() {
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD)
  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    create: {
      email: env.ADMIN_EMAIL,
      name: 'Administrateur UBOBO',
      passwordHash,
      role: 'ADMIN',
    },
    update: { role: 'ADMIN' },
  })
}
