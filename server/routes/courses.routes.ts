import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/courses/nav — all Auchan categories from DB (for the frontend nav)
router.get('/nav', async (_req, res) => {
  const cats = await prisma.auchanCategory.findMany({
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
    select: { slug: true, name: true, iconUrl: true, group: true },
  })
  res.json({ categories: cats })
})

// GET /api/courses/categories — which Auchan category slugs have products
router.get('/categories', async (_req, res) => {
  const grouped = await prisma.auchanProduct.groupBy({ by: ['category'], _count: true })
  const names = grouped.map((r) => r.category).filter((s): s is string => !!s)
  const dbCats = await prisma.auchanCategory.findMany({
    where: { name: { in: names } },
    select: { slug: true },
  })
  res.json({ slugs: dbCats.map((c) => c.slug) })
})

// GET /api/courses/search?q=search&page=1&limit=40 — search across ALL categories
router.get('/search', async (req, res) => {
  const q = (req.query.q as string | undefined)?.trim()
  if (!q) {
    res.json({ total: 0, page: 1, limit: 40, products: [] })
    return
  }

  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Number(req.query.limit) || 40)

  // Recherche insensible à la casse, sur chaque mot du nom OU de la marque
  // (ex: "lait demi ecreme" doit matcher même si le champ est "Lait Demi-Écrémé").
  const words = q.split(/\s+/).filter(Boolean)
  const where = {
    disabled: false,
    AND: words.map((word) => ({
      OR: [
        { name: { contains: word, mode: 'insensitive' as const } },
        { brand: { contains: word, mode: 'insensitive' as const } },
      ],
    })),
  }

  const [total, products] = await Promise.all([
    prisma.auchanProduct.count({ where }),
    prisma.auchanProduct.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        productId: true,
        name: true,
        brand: true,
        price: true,
        weightVolume: true,
        imageUrl: true,
        category: true,
      },
    }),
  ])

  res.json({ total, page, limit, products })
})

// GET /api/courses/:slug?page=1&limit=40&q=search
// :slug is the Auchan category slug stored in DB (e.g. "fruits-legumes")
router.get('/:slug', async (req, res) => {
  const { slug } = req.params

  // Resolve category name(s) from DB
  const dbCat = await prisma.auchanCategory.findUnique({ where: { slug } })
  if (!dbCat) {
    res.status(404).json({ error: 'Unknown category slug' })
    return
  }

  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Number(req.query.limit) || 40)
  const q = (req.query.q as string | undefined)?.trim()

  const words = q ? q.split(/\s+/).filter(Boolean) : []
  const where = {
    category: dbCat.name,
    disabled: false,
    ...(words.length > 0
      ? {
          AND: words.map((word) => ({
            OR: [
              { name: { contains: word, mode: 'insensitive' as const } },
              { brand: { contains: word, mode: 'insensitive' as const } },
            ],
          })),
        }
      : {}),
  }

  const [total, products] = await Promise.all([
    prisma.auchanProduct.count({ where }),
    prisma.auchanProduct.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        productId: true,
        name: true,
        brand: true,
        price: true,
        weightVolume: true,
        imageUrl: true,
        category: true,
      },
    }),
  ])

  res.json({ total, page, limit, products })
})

export default router
