import { useEffect, useState } from 'react'
import { api, type Promotion } from '@/lib/api'

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.promotions.list()
      .then((res) => { if (!cancelled) { setPromotions(res.promotions); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { promotions, loading }
}
