import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { comparePassword, hashPassword, requireAuth, signToken } from '../lib/auth'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  phone: z.string().optional(),
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
  }

  const ok = await comparePassword(parsed.data.password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

  const token = signToken({ sub: user.id, role: user.role, email: user.email })
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale },
  })
})

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return res.status(409).json({ error: 'EMAIL_EXISTS' })

  const passwordHash = await hashPassword(parsed.data.password)
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      phone: parsed.data.phone ?? null,
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  const token = signToken({ sub: user.id, role: user.role, email: user.email })
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale },
  })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { id: true, email: true, name: true, role: true, locale: true, phone: true, address: true },
  })
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json({ user })
})

router.patch('/me', requireAuth, async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    locale: z.enum(['fr', 'en']).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const user = await prisma.user.update({
    where: { id: req.user!.sub },
    data: parsed.data,
    select: { id: true, email: true, name: true, role: true, locale: true, phone: true, address: true },
  })
  res.json({ user })
})

export default router
