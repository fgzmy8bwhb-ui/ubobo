import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../lib/auth'

const router = Router()

// Map enum -> lowercase string the frontend expects (matches existing types)
function serializeRestaurant(r: any) {
  return {
    id: r.slug, // frontend uses slug as ID
    dbId: r.id,
    name: r.name,
    category: r.category.toLowerCase().replace('_', '-'),
    status:
      r.status === 'ACTIVE' ? 'active' :
      r.status === 'COMING_SOON' ? 'coming_soon' :
      r.status === 'PARTNER_PENDING' ? 'partner_pending' : 'paused',
    logo: r.logo ?? undefined,
    coverImage: r.coverImage ?? undefined,
    distanceFromCenterKm: r.distanceFromCenterKm,
    address: r.address,
    phone: r.phone ?? undefined,
    description: r.description ?? undefined,
    averageRating: r.averageRating,
    reviewCount: r.reviewCount,
    isFeatured: r.isFeatured,
    menu: (r.menu ?? []).map(serializeMenuItem),
  }
}

function serializeMenuItem(m: any) {
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    price: m.price,
    category: m.category,
    available: m.available,
    image: m.image ?? undefined,
    options: m.optionsJson ? JSON.parse(m.optionsJson) : undefined,
  }
}

// GET /api/restaurants — list (with optional filters)
router.get('/', async (req, res) => {
  const { category, status, search } = req.query as Record<string, string | undefined>

  const where: any = {}
  if (category) where.category = category.toUpperCase().replace('-', '_')
  if (status) where.status = status.toUpperCase()
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { distanceFromCenterKm: 'asc' }],
    include: { menu: { orderBy: { position: 'asc' } } },
  })
  res.json({ restaurants: restaurants.map(serializeRestaurant) })
})

// GET /api/restaurants/:slug — detail
router.get('/:slug', async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: req.params.slug },
    include: { menu: { orderBy: { position: 'asc' } } },
  })
  if (!restaurant) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json({ restaurant: serializeRestaurant(restaurant) })
})

// GET /api/restaurants/:slug/reviews
router.get('/:slug/reviews', async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: req.params.slug } })
  if (!restaurant) return res.status(404).json({ error: 'NOT_FOUND' })

  const reviews = await prisma.review.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { user: { select: { name: true } } },
  })
  res.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: r.user?.name ?? 'Anonyme',
    })),
  })
})

// ============== ADMIN ==============

const upsertRestaurantSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['PETIT_DEJEUNER', 'APERO', 'COURSES', 'PATISSERIE', 'LIVRES']),
  status: z.enum(['ACTIVE', 'COMING_SOON', 'PARTNER_PENDING', 'PAUSED']),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  distanceFromCenterKm: z.number().nonnegative(),
  address: z.string().min(1),
  phone: z.string().optional(),
  isFeatured: z.boolean().optional(),
})

router.post('/', requireAdmin, async (req, res) => {
  const parsed = upsertRestaurantSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT', issues: parsed.error.issues })

  const r = await prisma.restaurant.create({ data: parsed.data })
  res.status(201).json({ restaurant: serializeRestaurant({ ...r, menu: [] }) })
})

router.patch('/:slug', requireAdmin, async (req, res) => {
  const parsed = upsertRestaurantSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const r = await prisma.restaurant.update({
    where: { slug: req.params.slug },
    data: parsed.data,
    include: { menu: { orderBy: { position: 'asc' } } },
  })
  res.json({ restaurant: serializeRestaurant(r) })
})

router.delete('/:slug', requireAdmin, async (req, res) => {
  await prisma.restaurant.delete({ where: { slug: req.params.slug } })
  res.status(204).end()
})

// ============== MENU ITEMS ==============

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  category: z.string().min(1),
  available: z.boolean().optional(),
  image: z.string().optional(),
  options: z
    .array(
      z.object({
        name: z.string(),
        choices: z.array(z.string()),
        required: z.boolean().optional(),
      })
    )
    .optional(),
})

router.post('/:slug/menu', requireAdmin, async (req, res) => {
  const parsed = menuItemSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const restaurant = await prisma.restaurant.findUnique({ where: { slug: req.params.slug } })
  if (!restaurant) return res.status(404).json({ error: 'NOT_FOUND' })

  const count = await prisma.menuItem.count({ where: { restaurantId: restaurant.id } })
  const item = await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name: parsed.data.name,
      description: parsed.data.description ?? '',
      price: parsed.data.price,
      category: parsed.data.category,
      available: parsed.data.available ?? true,
      image: parsed.data.image ?? null,
      optionsJson: parsed.data.options ? JSON.stringify(parsed.data.options) : null,
      position: count,
    },
  })
  res.status(201).json({ item: serializeMenuItem(item) })
})

router.patch('/:slug/menu/:itemId', requireAdmin, async (req, res) => {
  const parsed = menuItemSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const data: any = { ...parsed.data }
  if (parsed.data.options !== undefined) {
    data.optionsJson = parsed.data.options ? JSON.stringify(parsed.data.options) : null
    delete data.options
  }

  const item = await prisma.menuItem.update({
    where: { id: req.params.itemId },
    data,
  })
  res.json({ item: serializeMenuItem(item) })
})

router.delete('/:slug/menu/:itemId', requireAdmin, async (req, res) => {
  await prisma.menuItem.delete({ where: { id: req.params.itemId } })
  res.status(204).end()
})

export default router
