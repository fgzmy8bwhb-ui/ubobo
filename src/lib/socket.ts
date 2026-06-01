// Polling-based fallback — replaces Socket.io for Vercel deployment.
// Orders refresh every 5 s; admin dashboard every 5 s.
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000'
const POLL_MS = 5000

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function subscribeToOrder(
  orderNumber: string,
  onUpdate: (data: { status: string }) => void,
) {
  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderNumber}`, {
        headers: authHeaders(),
      })
      if (res.ok) {
        const { order } = await res.json()
        if (order?.status) onUpdate({ status: order.status })
      }
    } catch {
      // ignore network errors during polling
    }
  }, POLL_MS)
  return () => clearInterval(interval)
}

export function joinAdminRoom(
  _onCreated: (o: { orderNumber: string }) => void,
  onUpdated: (o: { orderNumber: string; status: string }) => void,
) {
  // Poll every 5 s — trigger onUpdated so AdminOrdersPage refreshes its list
  const interval = setInterval(() => {
    onUpdated({ orderNumber: '', status: '' })
  }, POLL_MS)
  return () => clearInterval(interval)
}

// No-op kept for compatibility (nothing imports getSocket in prod)
export function getSocket() { return null as any }
