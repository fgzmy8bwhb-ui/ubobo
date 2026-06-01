import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../lib/auth'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.user!.sub },
    include: { restaurant: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({
    favorites: favs.map((f) => ({
      id: f.id,
      restaurantSlug: f.restaurant.slug,
      restaurantName: f.restaurant.name,
      addedAt: f.createdAt,
    })),
  })
})

router.post('/', requireAuth, async (req, res) => {
  const parsed = z.object({ restaurantSlug: z.string() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: parsed.data.restaurantSlug },
  })
  if (!restaurant) return res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' })

  await prisma.favorite.upsert({
    where: { userId_restaurantId: { userId: req.user!.sub, restaurantId: restaurant.id } },
    create: { userId: req.user!.sub, restaurantId: restaurant.id },
    update: {},
  })
  res.status(201).json({ ok: true })
})

router.delete('/:slug', requireAuth, async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: req.params.slug } })
  if (!restaurant) return res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' })

  await prisma.favorite
    .delete({
      where: { userId_restaurantId: { userId: req.user!.sub, restaurantId: restaurant.id } },
    })
    .catch(() => null)
  res.status(204).end()
})

export default router
