// Vercel serverless entry point — exports the Express app
// Socket.io is not used here (polling replaces real-time on Vercel)
import { app } from '../server/app'
import { ensureAdminAccount } from '../server/lib/auth'

// Bootstrap admin account once per cold start
ensureAdminAccount().catch((e) =>
  console.warn('[vercel] ensureAdminAccount:', (e as Error).message)
)

export default app
