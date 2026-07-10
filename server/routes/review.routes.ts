import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/auth'

const router = Router()

async function recomputeRestaurantRating(restaurantId: string) {
  const all = await prisma.review.findMany({ where: { restaurantId } })
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0
  await prisma.restaurant.update({
    where: { id: restaurantId },
    data: { averageRating: avg, reviewCount: all.length },
  })
}

// GET /api/reviews/guest/:orderNumber — infos nécessaires pour afficher le formulaire d'avis
router.get('/guest/:orderNumber', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { restaurant: true, reviews: true },
  })
  if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND' })
  if (order.status !== 'DELIVERED') return res.status(400).json({ error: 'ORDER_NOT_DELIVERED' })

  res.json({
    restaurantName: order.restaurant.name,
    restaurantSlug: order.restaurant.slug,
    alreadyReviewed: order.reviews.length > 0,
    existingReview: order.reviews[0] ?? null,
  })
})

const guestReviewSchema = z.object({
  orderNumber: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

// POST /api/reviews/guest — laisser un avis via le n° de commande, sans compte
router.post('/guest', async (req, res) => {
  const parsed = guestReviewSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const order = await prisma.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    include: { reviews: true },
  })
  if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND' })
  if (order.status !== 'DELIVERED') return res.status(400).json({ error: 'ORDER_NOT_DELIVERED' })
  if (order.reviews.length > 0) return res.status(409).json({ error: 'ALREADY_REVIEWED' })

  const review = await prisma.review.create({
    data: {
      userId: order.userId,
      restaurantId: order.restaurantId,
      orderId: order.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  })

  await recomputeRestaurantRating(order.restaurantId)

  res.status(201).json({ review })
})

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

  await recomputeRestaurantRating(restaurant.id)

  res.status(201).json({ review })
})

export default router
