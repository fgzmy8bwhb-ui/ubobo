import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../lib/auth'
// Imports paresseux : Playwright ne peut pas tourner en serverless (Vercel),
// on ne charge le scraper que si un scrape est déclenché

const router = Router()

router.use(requireAdmin)

// GET /api/admin/stats — high-level KPIs for the dashboard
router.get('/stats', async (_req, res) => {
  const now = new Date()
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalOrders,
    todayOrders,
    monthOrders,
    pendingOrders,
    totalRevenueAgg,
    todayRevenueAgg,
    monthRevenueAgg,
    activeRestaurants,
    pendingRestaurants,
    waitlistCount,
    usersCount,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'PAID', 'ACCEPTED', 'PREPARING', 'READY', 'ON_THE_WAY'] } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' }, createdAt: { gte: startOfMonth } } }),
    prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
    prisma.restaurant.count({ where: { status: { in: ['COMING_SOON', 'PARTNER_PENDING'] } } }),
    prisma.waitlist.count(),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ])

  // Revenue series — last 14 days, daily totals
  const days = 14
  const series: Array<{ date: string; orders: number; revenue: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
    const next = new Date(d); next.setDate(next.getDate() + 1)
    const dayOrders = await prisma.order.findMany({
      where: { createdAt: { gte: d, lt: next }, status: { not: 'CANCELLED' } },
      select: { total: true },
    })
    series.push({
      date: d.toISOString().slice(0, 10),
      orders: dayOrders.length,
      revenue: Math.round(dayOrders.reduce((s, o) => s + o.total, 0) * 100) / 100,
    })
  }

  // Top restaurants this month
  const monthOrdersWithResto = await prisma.order.findMany({
    where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    select: { total: true, restaurant: { select: { name: true, slug: true } } },
  })
  const byResto = new Map<string, { name: string; orders: number; revenue: number }>()
  for (const o of monthOrdersWithResto) {
    const key = o.restaurant.slug
    const cur = byResto.get(key) ?? { name: o.restaurant.name, orders: 0, revenue: 0 }
    cur.orders += 1
    cur.revenue += o.total
    byResto.set(key, cur)
  }
  const topRestaurants = Array.from(byResto.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((r) => ({ ...r, revenue: Math.round(r.revenue * 100) / 100 }))

  res.json({
    counts: {
      totalOrders,
      todayOrders,
      monthOrders,
      pendingOrders,
      activeRestaurants,
      pendingRestaurants,
      waitlistCount,
      usersCount,
    },
    revenue: {
      total: Math.round((totalRevenueAgg._sum.total ?? 0) * 100) / 100,
      today: Math.round((todayRevenueAgg._sum.total ?? 0) * 100) / 100,
      month: Math.round((monthRevenueAgg._sum.total ?? 0) * 100) / 100,
    },
    series,
    topRestaurants,
  })
})

// GET /api/admin/customers — list all customer accounts
router.get('/customers', async (_req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      address: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ customers })
})

// POST /api/admin/auchan/scrape-categories — trigger category scraper only
router.post('/auchan/scrape-categories', async (_req, res) => {
  res.json({ ok: true, message: 'Auchan category scrape started' })
  import('../lib/auchan/category-scraper')
    .then(({ scrapeAuchanCategories }) => scrapeAuchanCategories())
    .catch((e) => console.error('[auchan-categories]', e))
})

// POST /api/admin/auchan/scrape — trigger scraper manually
let scrapeRunning = false
router.post('/auchan/scrape', async (_req, res) => {
  if (scrapeRunning) {
    res.status(409).json({ error: 'Scrape already in progress' })
    return
  }
  scrapeRunning = true
  res.json({ ok: true, message: 'Auchan scrape started in background' })
  import('../lib/auchan/scraper')
    .then(({ runAuchanScraper }) => runAuchanScraper())
    .catch((e) => console.error('[auchan-scrape]', e))
    .finally(() => { scrapeRunning = false })
})

// GET /api/admin/auchan/products — paginated list of scraped products
router.get('/auchan/products', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(100, Number(req.query.limit) || 50)
  const category = req.query.category as string | undefined
  const showDisabled = req.query.disabled === 'true'

  const where = {
    ...(category ? { category } : {}),
    ...(showDisabled ? { disabled: true } : {}),
  }
  const [total, withPrice, disabled, products] = await Promise.all([
    prisma.auchanProduct.count({ where: category ? { category } : {} }),
    prisma.auchanProduct.count({ where: { ...(category ? { category } : {}), price: { not: null } } }),
    prisma.auchanProduct.count({ where: { ...(category ? { category } : {}), disabled: true } }),
    prisma.auchanProduct.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
      select: { productId: true, name: true, brand: true, price: true, category: true, imageUrl: true, disabled: true },
    }),
  ])
  res.json({ total, withPrice, disabled, page, limit, products })
})

// PATCH /api/admin/auchan/products/:id/disable — toggle disabled
router.patch('/auchan/products/:id/disable', async (req, res) => {
  const { id } = req.params
  const { disabled } = req.body as { disabled: boolean }
  const updated = await prisma.auchanProduct.update({
    where: { productId: id },
    data: { disabled: !!disabled },
    select: { productId: true, disabled: true },
  })
  res.json(updated)
})

// DELETE /api/admin/auchan/products/:id — permanently remove
router.delete('/auchan/products/:id', async (req, res) => {
  await prisma.auchanProduct.delete({ where: { productId: req.params.id } })
  res.json({ ok: true })
})

export default router
