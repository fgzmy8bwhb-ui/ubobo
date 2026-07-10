import * as dotenv from 'dotenv'
dotenv.config()

function req(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  // API_PORT is intentionally separate from PORT so the API server doesn't
  // collide with the Vite dev server (which reads PORT when present).
  PORT: parseInt(process.env.API_PORT ?? process.env.PORT ?? '4000', 10),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  DATABASE_URL: req('DATABASE_URL', 'file:./prisma/dev.db'),
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'admin@ubobo.fr',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'admin123',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  SUMUP_API_KEY: process.env.SUMUP_API_KEY ?? '',
  CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID ?? '',
  CF_R2_ACCESS_KEY_ID: process.env.CF_R2_ACCESS_KEY_ID ?? '',
  CF_R2_SECRET_ACCESS_KEY: process.env.CF_R2_SECRET_ACCESS_KEY ?? '',
  CF_R2_BUCKET: process.env.CF_R2_BUCKET ?? 'ubobo-images',
  CF_R2_PUBLIC_URL: process.env.CF_R2_PUBLIC_URL ?? '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER ?? '',
  ADMIN_NOTIFY_PHONE: process.env.ADMIN_NOTIFY_PHONE ?? '',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  EMAIL_FROM: process.env.EMAIL_FROM ?? 'UBOBO <onboarding@resend.dev>',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'https://ubobo.fr',
}

export const IS_DEV = env.NODE_ENV !== 'production'
