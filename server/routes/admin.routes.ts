import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAdmin } from '../lib/auth'

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

export default router
