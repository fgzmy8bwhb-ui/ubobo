import { Router, raw } from 'express'
import Stripe from 'stripe'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { emitOrderUpdated } from '../lib/socket'

const router = Router()

// Lazy-init so the server can run without Stripe configured (e.g. fresh clone)
let stripe: Stripe | null = null
function getStripe(): Stripe | null {
  if (stripe) return stripe
  if (!env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY.startsWith('sk_test_xxx')) return null
  stripe = new Stripe(env.STRIPE_SECRET_KEY)
  return stripe
}

/**
 * POST /api/stripe/payment-intent
 * Creates a Stripe PaymentIntent for an existing pending order.
 * Returns clientSecret for the frontend to confirm payment.
 */
router.post('/payment-intent', async (req, res) => {
  const parsed = z.object({ orderNumber: z.string() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const s = getStripe()
  if (!s) {
    return res.status(503).json({ error: 'STRIPE_NOT_CONFIGURED' })
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } })
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' })
  if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'ALREADY_PAID' })

  const intent = await s.paymentIntents.create({
    amount: Math.round(order.total * 100),
    currency: 'eur',
    metadata: { orderNumber: order.orderNumber, orderId: order.id },
    automatic_payment_methods: { enabled: true },
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: intent.id },
  })

  res.json({ clientSecret: intent.client_secret })
})

/**
 * POST /api/stripe/webhook
 * Stripe will POST event notifications here.
 * IMPORTANT: this route uses raw body (set in server/index.ts).
 */
router.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
  const s = getStripe()
  if (!s) return res.status(503).end()
  if (!env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_xxx')) {
    return res.status(503).end()
  }

  const sig = req.headers['stripe-signature'] as string | undefined
  if (!sig) return res.status(400).send('Missing signature')

  let event: Stripe.Event
  try {
    event = s.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderNumber = pi.metadata?.orderNumber
    if (orderNumber) {
      const order = await prisma.order.update({
        where: { orderNumber },
        data: { paymentStatus: 'PAID', status: 'PAID' },
      })
      emitOrderUpdated({ orderNumber: order.orderNumber, status: order.status })
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderNumber = pi.metadata?.orderNumber
    if (orderNumber) {
      await prisma.order.update({
        where: { orderNumber },
        data: { paymentStatus: 'FAILED' },
      })
    }
  }

  res.json({ received: true })
})

export default router
