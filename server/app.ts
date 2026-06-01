import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env, IS_DEV } from './lib/env'

import authRoutes from './routes/auth.routes'
import restaurantRoutes from './routes/restaurant.routes'
import orderRoutes from './routes/order.routes'
import settingsRoutes from './routes/settings.routes'
import favoriteRoutes from './routes/favorite.routes'
import reviewRoutes from './routes/review.routes'
import promotionRoutes from './routes/promotion.routes'
import waitlistRoutes from './routes/waitlist.routes'
import adminRoutes from './routes/admin.routes'
import stripeRoutes from './routes/stripe.routes'

export const app = express()

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(morgan(IS_DEV ? 'dev' : 'combined'))

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/stripe/webhook', stripeRoutes)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now(), env: env.NODE_ENV })
})

app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/waitlist', waitlistRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/stripe', stripeRoutes)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err)
  res.status(err.status ?? 500).json({ error: err.message ?? 'INTERNAL_ERROR' })
})
