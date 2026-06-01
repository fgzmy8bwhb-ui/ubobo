import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env, IS_DEV } from './lib/env'
import { initSocket } from './lib/socket'
import { ensureAdminAccount } from './lib/auth'

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

const app = express()

// Security + logging
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }))
app.use(morgan(IS_DEV ? 'dev' : 'combined'))

// Stripe webhook needs raw body — mount BEFORE express.json()
app.use('/api/stripe/webhook', stripeRoutes)

app.use(express.json({ limit: '1mb' }))

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now(), env: env.NODE_ENV })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/waitlist', waitlistRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/stripe', stripeRoutes) // payment-intent only — webhook already mounted above

// Serve React frontend in production (Railway)
if (!IS_DEV) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const distPath = path.resolve(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

// 404 for API routes only (in dev)
if (IS_DEV) app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }))
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err)
  res.status(err.status ?? 500).json({ error: err.message ?? 'INTERNAL_ERROR' })
})

const httpServer = http.createServer(app)
initSocket(httpServer)

async function start() {
  try {
    await ensureAdminAccount()
  } catch (e) {
    console.warn('[warn] ensureAdminAccount failed (DB not ready?):', (e as Error).message)
  }

  httpServer.listen(env.PORT, () => {
    console.log(`\n  🦞 UBOBO API ready`)
    console.log(`  ➜  REST    http://localhost:${env.PORT}/api`)
    console.log(`  ➜  Socket  ws://localhost:${env.PORT}`)
    console.log(`  ➜  Env     ${env.NODE_ENV}\n`)
  })
}

start()
