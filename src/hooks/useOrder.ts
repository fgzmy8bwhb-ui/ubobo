import { useEffect, useState } from 'react'
import { api, type ApiOrder } from '@/lib/api'
import { subscribeToOrder } from '@/lib/socket'

/**
 * Fetches an order by orderNumber and subscribes to live status updates via WS.
 */
export function useOrder(orderNumber: string | undefined) {
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderNumber) return
    let cancelled = false
    setLoading(true)
    api.orders.get(orderNumber)
      .then((res) => {
        if (!cancelled) {
          setOrder(res.order)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message ?? 'NETWORK_ERROR')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [orderNumber])

  // Real-time updates
  useEffect(() => {
    if (!orderNumber) return
    const unsubscribe = subscribeToOrder(orderNumber, (data) => {
      setOrder((prev) => (prev ? { ...prev, status: data.status as any } : prev))
    })
    return unsubscribe
  }, [orderNumber])

  return { order, loading, error, refetch: async () => {
    if (!orderNumber) return
    const { order: o } = await api.orders.get(orderNumber)
    setOrder(o)
  } }
}
