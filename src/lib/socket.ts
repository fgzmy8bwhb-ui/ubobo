import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:4000'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })
  }
  return socket
}

export function subscribeToOrder(orderNumber: string, onUpdate: (data: { status: string }) => void) {
  const s = getSocket()
  s.emit('order:subscribe', orderNumber)
  const handler = (payload: { orderNumber: string; status: string }) => {
    if (payload.orderNumber === orderNumber) onUpdate(payload)
  }
  s.on('order:updated', handler)
  return () => {
    s.emit('order:unsubscribe', orderNumber)
    s.off('order:updated', handler)
  }
}

export function joinAdminRoom(onCreated: (o: { orderNumber: string }) => void, onUpdated: (o: { orderNumber: string; status: string }) => void) {
  const s = getSocket()
  s.emit('admin:join')
  s.on('order:created', onCreated)
  s.on('order:updated', onUpdated)
  return () => {
    s.off('order:created', onCreated)
    s.off('order:updated', onUpdated)
  }
}
