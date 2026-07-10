import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../lib/auth'
import { computeDeliveryFee } from '../lib/delivery'

const router = Router()

async function getOrCreateSettings() {
  let s = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (!s) {
    s = await prisma.appSettings.create({ data: { id: 'singleton' } })
  }
  return s
}

// GET /api/settings — public read of "safe" settings (used by frontend)
router.get('/', async (_req, res) => {
  const s = await getOrCreateSettings()
  res.json({
    settings: {
      appName: s.appName,
      defaultLocale: s.defaultLocale,
      currency: s.currency,
      currencySymbol: s.currencySymbol,
      deliveryBaseFee: s.deliveryBaseFee,
      deliveryPerKmFee: s.deliveryPerKmFee,
      deliveryFreeAbove: s.deliveryFreeAbove,
      deliveryMinOrder: s.deliveryMinOrder,
      deliveryMaxDistanceKm: s.deliveryMaxDistanceKm,
      acceptingOrders: s.acceptingOrders,
    },
  })
})

const updateSchema = z.object({
  appName: z.string().optional(),
  defaultLocale: z.enum(['fr', 'en']).optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  deliveryBaseFee: z.number().nonnegative().optional(),
  deliveryPerKmFee: z.number().nonnegative().optional(),
  deliveryFreeAbove: z.number().nullable().optional(),
  deliveryMinOrder: z.number().nonnegative().optional(),
  deliveryMaxDistanceKm: z.number().positive().optional(),
  serviceFeeRate: z.number().min(0).max(1).optional(),
  acceptingOrders: z.boolean().optional(),
  notifyAdminOnNewOrder: z.boolean().optional(),
})

// PATCH /api/settings — admin only
router.patch('/', requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  await getOrCreateSettings()
  const updated = await prisma.appSettings.update({
    where: { id: 'singleton' },
    data: parsed.data,
  })
  res.json({ settings: updated })
})

// POST /api/settings/quote — compute delivery fee for a given distance + subtotal
// (used by checkout to show the fee live)
router.post('/quote', async (req, res) => {
  const schema = z.object({
    durationMin: z.number().nonnegative(),
    subtotal: z.number().nonnegative(),
    postalCode: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const fee = await computeDeliveryFee(parsed.data)
  res.json({ fee })
})

// ---- DeliveryZone CRUD (admin) ----
router.get('/zones', requireAdmin, async (_req, res) => {
  const zones = await prisma.deliveryZone.findMany({ orderBy: { priority: 'desc' } })
  res.json({ zones })
})

const zoneSchema = z.object({
  name: z.string().min(1),
  postalCode: z.string().optional(),
  baseFee: z.number().nonnegative(),
  perKmFee: z.number().nonnegative(),
  freeAbove: z.number().nullable().optional(),
  minOrder: z.number().nonnegative().optional(),
  maxDistanceKm: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  priority: z.number().int().optional(),
})

router.post('/zones', requireAdmin, async (req, res) => {
  const parsed = zoneSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })
  const zone = await prisma.deliveryZone.create({ data: parsed.data as any })
  res.status(201).json({ zone })
})

router.patch('/zones/:id', requireAdmin, async (req, res) => {
  const parsed = zoneSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })
  const zone = await prisma.deliveryZone.update({
    where: { id: req.params.id },
    data: parsed.data as any,
  })
  res.json({ zone })
})

router.delete('/zones/:id', requireAdmin, async (req, res) => {
  await prisma.deliveryZone.delete({ where: { id: req.params.id } })
  res.status(204).end()
})

// ---- BlockedDate CRUD ----
// GET public (checkout needs to know which dates to disable)
router.get('/blocked-dates', async (_req, res) => {
  const dates = await prisma.blockedDate.findMany({ orderBy: { date: 'asc' } })
  res.json({ dates })
})

const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
})

router.post('/blocked-dates', requireAdmin, async (req, res) => {
  const parsed = blockedDateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })
  const date = await prisma.blockedDate.upsert({
    where: { date: parsed.data.date },
    create: parsed.data,
    update: { reason: parsed.data.reason ?? null },
  })
  res.status(201).json({ date })
})

router.delete('/blocked-dates/:date', requireAdmin, async (req, res) => {
  await prisma.blockedDate.deleteMany({ where: { date: req.params.date } })
  res.status(204).end()
})

export default router
