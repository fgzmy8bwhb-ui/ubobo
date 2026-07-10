import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { emitOrderUpdated } from '../lib/socket'

const router = Router()

const SUMUP_API = 'https://api.sumup.com'

function sumupConfigured(): boolean {
  return !!env.SUMUP_API_KEY && !env.SUMUP_API_KEY.startsWith('sup_sk_xxx')
}

async function sumupFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${SUMUP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.SUMUP_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    console.error('[sumup]', res.status, JSON.stringify(body))
    throw new Error('SUMUP_API_ERROR')
  }
  return body
}

// Merchant code is fetched once from the API key's profile
let merchantCode: string | null = null
async function getMerchantCode(): Promise<string> {
  if (merchantCode) return merchantCode
  const me = await sumupFetch('/v0.1/me')
  merchantCode = me?.merchant_profile?.merchant_code
  if (!merchantCode) throw new Error('SUMUP_NO_MERCHANT_CODE')
  return merchantCode
}

/**
 * POST /api/sumup/checkout
 * Creates a SumUp checkout for an existing pending order.
 * Returns checkoutId for the frontend card widget.
 */
router.post('/checkout', async (req, res) => {
  const parsed = z.object({ orderNumber: z.string() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  if (!sumupConfigured()) {
    return res.status(503).json({ error: 'SUMUP_NOT_CONFIGURED' })
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } })
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' })
  if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'ALREADY_PAID' })

  const checkout = await sumupFetch('/v0.1/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      checkout_reference: `${order.orderNumber}-${Date.now()}`,
      amount: Math.round(order.total * 100) / 100,
      currency: 'EUR',
      merchant_code: await getMerchantCode(),
      description: `Commande UBOBO ${order.orderNumber}`,
    }),
  })

  await prisma.order.update({
    where: { id: order.id },
    data: { sumupCheckoutId: checkout.id },
  })

  res.json({ checkoutId: checkout.id })
})

/**
 * POST /api/sumup/confirm
 * Called by the frontend after the card widget reports success.
 * The status is verified server-side against the SumUp API — the client
 * response alone is never trusted.
 */
router.post('/confirm', async (req, res) => {
  const parsed = z.object({ orderNumber: z.string() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  if (!sumupConfigured()) return res.status(503).json({ error: 'SUMUP_NOT_CONFIGURED' })

  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } })
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' })
  if (!order.sumupCheckoutId) return res.status(400).json({ error: 'NO_CHECKOUT' })
  if (order.paymentStatus === 'PAID') return res.json({ status: 'PAID' })

  const checkout = await sumupFetch(`/v0.1/checkouts/${order.sumupCheckoutId}`)

  if (checkout.status === 'PAID') {
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID', status: 'PAID' },
    })
    emitOrderUpdated({ orderNumber: updated.orderNumber, status: updated.status })
    return res.json({ status: 'PAID' })
  }
  if (checkout.status === 'FAILED') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'FAILED' },
    })
    return res.json({ status: 'FAILED' })
  }
  res.json({ status: checkout.status ?? 'PENDING' })
})

export default router
