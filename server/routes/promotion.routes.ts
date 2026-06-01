import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../lib/auth'

const router = Router()

// GET /api/promotions — active banners (public)
router.get('/', async (_req, res) => {
  const now = new Date()
  const promos = await prisma.promotion.findMany({
    where: {
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    promotions: promos.map((p) => ({
      code: p.code,
      title: p.title,
      description: p.description,
      type: p.type,
      value: p.value,
      minSubtotal: p.minSubtotal,
      bannerImage: p.bannerImage,
      bannerColor: p.bannerColor,
    })),
  })
})

// POST /api/promotions/validate — check if a code can be applied
router.post('/validate', async (req, res) => {
  const parsed = z
    .object({ code: z.string(), subtotal: z.number().nonnegative(), restaurantSlug: z.string().optional() })
    .safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const promo = await prisma.promotion.findUnique({ where: { code: parsed.data.code } })
  if (!promo || !promo.isActive) return res.status(404).json({ error: 'INVALID_CODE' })
  if (promo.maxUses != null && promo.uses >= promo.maxUses) {
    return res.status(400).json({ error: 'CODE_EXHAUSTED' })
  }
  if (promo.startsAt && promo.startsAt > new Date()) {
    return res.status(400).json({ error: 'CODE_NOT_STARTED' })
  }
  if (promo.endsAt && promo.endsAt <= new Date()) {
    return res.status(400).json({ error: 'CODE_EXPIRED' })
  }
  if (parsed.data.subtotal < promo.minSubtotal) {
    return res.status(400).json({ error: 'BELOW_MIN_SUBTOTAL', minSubtotal: promo.minSubtotal })
  }

  let discount = 0
  let freeDelivery = false
  if (promo.type === 'PERCENT') discount = Math.round(parsed.data.subtotal * promo.value) / 100
  else if (promo.type === 'AMOUNT') discount = promo.value
  else if (promo.type === 'FREE_DELIVERY') freeDelivery = true

  res.json({
    valid: true,
    code: promo.code,
    title: promo.title,
    type: promo.type,
    discount,
    freeDelivery,
  })
})

// ---- Admin CRUD ----
router.get('/admin', requireAdmin, async (_req, res) => {
  const promos = await prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } })
  res.json({ promotions: promos })
})

const upsertSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['PERCENT', 'AMOUNT', 'FREE_DELIVERY']),
  value: z.number().nonnegative(),
  minSubtotal: z.number().nonnegative().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
  bannerColor: z.string().optional(),
})

router.post('/', requireAdmin, async (req, res) => {
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })
  const data: any = { ...parsed.data }
  if (data.startsAt) data.startsAt = new Date(data.startsAt)
  if (data.endsAt) data.endsAt = new Date(data.endsAt)
  const promo = await prisma.promotion.create({ data })
  res.status(201).json({ promotion: promo })
})

router.patch('/:id', requireAdmin, async (req, res) => {
  const parsed = upsertSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })
  const data: any = { ...parsed.data }
  if (data.startsAt) data.startsAt = new Date(data.startsAt)
  if (data.endsAt) data.endsAt = new Date(data.endsAt)
  const promo = await prisma.promotion.update({ where: { id: req.params.id }, data })
  res.json({ promotion: promo })
})

router.delete('/:id', requireAdmin, async (req, res) => {
  await prisma.promotion.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

export default router
