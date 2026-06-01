import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/auth'

const router = Router()

const createSchema = z.object({
  restaurantSlug: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  orderId: z.string().optional(),
})

router.post('/', requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: parsed.data.restaurantSlug },
  })
  if (!restaurant) return res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' })

  const review = await prisma.review.create({
    data: {
      userId: req.user!.sub,
      restaurantId: restaurant.id,
      orderId: parsed.data.orderId ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  })

  // Recompute aggregate
  const all = await prisma.review.findMany({ where: { restaurantId: restaurant.id } })
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { averageRating: avg, reviewCount: all.length },
  })

  res.status(201).json({ review })
})

export default router
