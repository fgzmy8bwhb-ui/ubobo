import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

import { app } from './app'
import { env, IS_DEV } from './lib/env'
import { initSocket } from './lib/socket'
import { ensureAdminAccount } from './lib/auth'

// Serve React frontend in production (non-Vercel, e.g. Render/Railway)
if (!IS_DEV) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const distPath = path.resolve(__dirname, '../dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

if (IS_DEV) {
  app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }))
}

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
