import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { optionalAuth, requireAdmin, requireAuth } from '../lib/auth'
import { computeDeliveryFee, calculateServiceFee } from '../lib/delivery'
import { LOYALTY_FREE_DELIVERY_COST, pointsEarnedFor } from '../lib/loyalty'
import { generateOrderNumber } from '../lib/orderNumber'
import { emitOrderCreated, emitOrderUpdated } from '../lib/socket'
import { notifyAdminNewOrder } from '../lib/sms'
import { sendEmail, orderConfirmationEmail, reviewRequestEmail } from '../lib/email'

const router = Router()

const orderItemSchema = z.object({
  menuItemId: z.string().optional(),
  name: z.string(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  selectedOptions: z.record(z.string(), z.string()).optional(),
})

const createOrderSchema = z.object({
  restaurantSlug: z.string(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().min(1),
  deliveryDistanceKm: z.number().nonnegative(),
  deliveryDurationMin: z.number().nonnegative(),
  paymentMethod: z.enum(['CARD', 'CASH', 'CARD_ON_DELIVERY']),
  promotionCode: z.string().optional(),
  notes: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliverySlot: z.string().optional(),
  usePoints: z.boolean().optional(),
  items: z.array(orderItemSchema).min(1),
})

function serializeOrder(o: any) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    serviceFee: o.serviceFee,
    discount: o.discount,
    total: o.total,
    usedLoyaltyPoints: o.usedLoyaltyPoints,
    earnedLoyaltyPoints: o.earnedLoyaltyPoints,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    deliveryAddress: o.deliveryAddress,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail,
    notes: o.notes,
    deliveryDate: o.deliveryDate,
    deliverySlot: o.deliverySlot,
    restaurant: o.restaurant
      ? { name: o.restaurant.name, slug: o.restaurant.slug, phone: o.restaurant.phone }
      : undefined,
    items: o.items?.map((i: any) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      selectedOptions: i.selectedOptionsJson ? JSON.parse(i.selectedOptionsJson) : undefined,
    })),
    createdAt: o.createdAt,
    acceptedAt: o.acceptedAt,
    preparedAt: o.preparedAt,
    deliveredAt: o.deliveredAt,
  }
}

// POST /api/orders — create order (auth optional, supports guest checkout)
router.post('/', optionalAuth, async (req, res) => {
  const parsed = createOrderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'INVALID_INPUT', issues: parsed.error.issues })
  }
  const data = parsed.data

  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  if (settings && !settings.acceptingOrders) {
    return res.status(503).json({ error: 'ORDERS_PAUSED' })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug: data.restaurantSlug },
  })
  if (!restaurant) return res.status(404).json({ error: 'RESTAURANT_NOT_FOUND' })
  if (restaurant.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'RESTAURANT_NOT_ACCEPTING' })
  }

  const subtotal = data.items.reduce((s, i) => s + i.price * i.quantity, 0)
  if (settings && subtotal < settings.deliveryMinOrder) {
    return res.status(400).json({
      error: 'BELOW_MIN_ORDER',
      minOrder: settings.deliveryMinOrder,
    })
  }

  if (data.deliveryDate) {
    const blocked = await prisma.blockedDate.findUnique({ where: { date: data.deliveryDate } })
    if (blocked) return res.status(400).json({ error: 'DATE_BLOCKED' })
  }

  const fee = await computeDeliveryFee({
    durationMin: data.deliveryDurationMin,
    subtotal,
  })

  // Apply promotion if provided
  let discount = 0
  let appliedDeliveryFee = fee.total
  if (data.promotionCode) {
    const promo = await prisma.promotion.findUnique({ where: { code: data.promotionCode } })
    if (
      promo &&
      promo.isActive &&
      subtotal >= promo.minSubtotal &&
      (!promo.endsAt || promo.endsAt > new Date()) &&
      (!promo.startsAt || promo.startsAt <= new Date()) &&
      (promo.maxUses == null || promo.uses < promo.maxUses) &&
      (!promo.restaurantId || promo.restaurantId === restaurant.id)
    ) {
      if (promo.type === 'PERCENT') discount = Math.round(subtotal * promo.value) / 100
      else if (promo.type === 'AMOUNT') discount = promo.value
      else if (promo.type === 'FREE_DELIVERY') {
        appliedDeliveryFee = 0
      }
      await prisma.promotion.update({
        where: { id: promo.id },
        data: { uses: { increment: 1 } },
      })
    }
  }

  // Utilisation des points de fidélité pour la livraison offerte (nécessite un compte)
  let usedLoyaltyPoints = 0
  if (data.usePoints && req.user?.sub) {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
    if (user && user.loyaltyPoints >= LOYALTY_FREE_DELIVERY_COST) {
      appliedDeliveryFee = 0
      usedLoyaltyPoints = LOYALTY_FREE_DELIVERY_COST
      await prisma.user.update({
        where: { id: user.id },
        data: { loyaltyPoints: { decrement: LOYALTY_FREE_DELIVERY_COST } },
      })
    }
  }

  const serviceFee = calculateServiceFee(restaurant.slug, subtotal)
  const total = Math.max(0, subtotal + appliedDeliveryFee + serviceFee - discount)
  const orderNumber = generateOrderNumber()

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: req.user?.sub ?? null,
      restaurantId: restaurant.id,
      status: 'PENDING',
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: appliedDeliveryFee,
      serviceFee,
      discount,
      total: Math.round(total * 100) / 100,
      promotionCode: data.promotionCode ?? null,
      usedLoyaltyPoints,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail ?? null,
      deliveryAddress: data.deliveryAddress,
      deliveryDistanceKm: data.deliveryDistanceKm,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'CASH' ? 'PENDING' : 'PENDING',
      notes: data.notes ?? null,
      deliveryDate: data.deliveryDate ?? null,
      deliverySlot: data.deliverySlot ?? null,
      items: {
        create: data.items.map((i) => ({
          menuItemId: i.menuItemId ?? null,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          selectedOptionsJson: i.selectedOptions ? JSON.stringify(i.selectedOptions) : null,
        })),
      },
    },
    include: { items: true, restaurant: true },
  })

  emitOrderCreated({ orderNumber: order.orderNumber })

  void notifyAdminNewOrder({
    orderNumber: order.orderNumber,
    restaurantName: order.restaurant.name,
    total: order.total,
    enabled: settings?.notifyAdminOnNewOrder ?? true,
  })

  if (order.customerEmail) {
    const { subject, html } = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      restaurantName: order.restaurant.name,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      total: order.total,
      deliveryDate: order.deliveryDate,
      deliverySlot: order.deliverySlot,
    })
    void sendEmail(order.customerEmail, subject, html)
  }

  res.status(201).json({ order: serializeOrder(order) })
})

// GET /api/slots/taken?date=YYYY-MM-DD
router.get('/slots/taken', async (req, res) => {
  const { date } = req.query as { date?: string }
  if (!date) return res.json({ slots: [] })

  const orders = await prisma.order.findMany({
    where: {
      deliveryDate: date,
      deliverySlot: { not: null },
      status: { notIn: ['CANCELLED'] },
    },
    select: { deliverySlot: true },
  })

  res.json({ slots: orders.map((o) => o.deliverySlot).filter(Boolean) })
})

// GET /api/orders/:orderNumber — public (anyone with order number)
router.get('/:orderNumber', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: req.params.orderNumber },
    include: { items: true, restaurant: true },
  })
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' })
  res.json({ order: serializeOrder(order) })
})

// GET /api/orders — list (admin: all, customer: own)
router.get('/', requireAuth, async (req, res) => {
  const where: any = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.sub }
  const status = req.query.status as string | undefined
  if (status) where.status = status

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { items: true, restaurant: true },
  })
  res.json({ orders: orders.map(serializeOrder) })
})

// PATCH /api/orders/:id/status — admin
const statusSchema = z.object({
  status: z.enum([
    'PENDING', 'PAID', 'ACCEPTED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED',
  ]),
})

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const existing = await prisma.order.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'ORDER_NOT_FOUND' })

  const now = new Date()
  const timestamps: any = {}
  if (parsed.data.status === 'ACCEPTED') timestamps.acceptedAt = now
  if (parsed.data.status === 'READY') timestamps.preparedAt = now
  if (parsed.data.status === 'DELIVERED') timestamps.deliveredAt = now
  if (parsed.data.status === 'CANCELLED') timestamps.cancelledAt = now

  // Crédite les points de fidélité à la livraison (une seule fois).
  let earnedLoyaltyPoints = existing.earnedLoyaltyPoints
  if (parsed.data.status === 'DELIVERED' && existing.status !== 'DELIVERED' && existing.userId) {
    earnedLoyaltyPoints = pointsEarnedFor(existing.subtotal)
    await prisma.user.update({
      where: { id: existing.userId },
      data: { loyaltyPoints: { increment: earnedLoyaltyPoints } },
    })
  }

  // Rembourse les points utilisés si la commande est annulée.
  if (parsed.data.status === 'CANCELLED' && existing.status !== 'CANCELLED' && existing.userId && existing.usedLoyaltyPoints > 0) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { loyaltyPoints: { increment: existing.usedLoyaltyPoints } },
    })
  }

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status, earnedLoyaltyPoints, ...timestamps },
    include: { items: true, restaurant: true },
  })

  emitOrderUpdated({ orderNumber: order.orderNumber, status: order.status })

  if (parsed.data.status === 'DELIVERED' && existing.status !== 'DELIVERED' && order.customerEmail) {
    const { subject, html } = reviewRequestEmail({
      orderNumber: order.orderNumber,
      restaurantName: order.restaurant.name,
    })
    void sendEmail(order.customerEmail, subject, html)
  }

  res.json({ order: serializeOrder(order) })
})

export default router
