import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../lib/auth'

const router = Router()

router.post('/', async (req, res) => {
  const parsed = z
    .object({ email: z.string().email(), source: z.string().optional() })
    .safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  await prisma.waitlist.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email, source: parsed.data.source ?? null },
    update: {},
  })
  res.status(201).json({ ok: true })
})

router.get('/', requireAdmin, async (_req, res) => {
  const entries = await prisma.waitlist.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ entries })
})

export default router
