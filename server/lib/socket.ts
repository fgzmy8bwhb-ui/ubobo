import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import { env } from './env'

let io: Server | null = null

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: env.CLIENT_ORIGIN, credentials: true },
  })

  io.on('connection', (socket) => {
    // Customer: join their order room for live updates
    socket.on('order:subscribe', (orderNumber: string) => {
      if (typeof orderNumber === 'string' && orderNumber.length > 0) {
        socket.join(`order:${orderNumber}`)
      }
    })
    socket.on('order:unsubscribe', (orderNumber: string) => {
      socket.leave(`order:${orderNumber}`)
    })

    // Admin dashboard: join admin room to receive every new/updated order
    socket.on('admin:join', () => {
      socket.join('admin')
    })
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.')
  return io
}

// Convenience emitters used from routes
export function emitOrderCreated(order: { orderNumber: string }) {
  io?.to('admin').emit('order:created', order)
}

export function emitOrderUpdated(order: { orderNumber: string; status: string }) {
  io?.to(`order:${order.orderNumber}`).emit('order:updated', order)
  io?.to('admin').emit('order:updated', order)
}
