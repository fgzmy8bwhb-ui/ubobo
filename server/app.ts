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
import sumupRoutes from './routes/sumup.routes'
import uploadRoutes from './routes/upload.routes'
import coursesRoutes from './routes/courses.routes'
import geocodeRoutes from './routes/geocode.routes'

export const app = express()

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://gateway.sumup.com'],
      frameSrc: ["'self'", 'https://gateway.sumup.com'],
      connectSrc: ["'self'", 'https://gateway.sumup.com', 'https://api.sumup.com'],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}))
app.use(cors({
  origin: (origin, cb) => {
    // Pas d'origin (curl, server-to-server) → autorisé
    if (!origin) return cb(null, true)
    // En dev, autoriser n'importe quel port localhost / 127.0.0.1
    if (IS_DEV && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return cb(null, true)
    }
    // Autorise l'origine configurée ainsi que tout sous-domaine ubobo.fr
    // (le domaine personnalisé cohabite avec l'ancien domaine vercel.app)
    if (origin === env.CLIENT_ORIGIN) return cb(null, true)
    if (/^https:\/\/([a-z0-9-]+\.)*ubobo\.fr$/.test(origin)) return cb(null, true)
    if (/^https:\/\/ubobo02(-[a-z0-9]+)?\.vercel\.app$/.test(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} non autorisé`))
  },
  credentials: true,
}))
app.use(morgan(IS_DEV ? 'dev' : 'combined'))

// Stripe webhook needs raw body — parse it BEFORE express.json()
// (body-parser skips parsers once req._body is set, so express.json below won't touch it)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
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
app.use('/api/sumup', sumupRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/courses', coursesRoutes)
app.use('/api/geocode', geocodeRoutes)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err)
  res.status(err.status ?? 500).json({ error: err.message ?? 'INTERNAL_ERROR' })
})
