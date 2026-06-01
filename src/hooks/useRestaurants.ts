import { useEffect, useState } from 'react'
import { api, type ApiRestaurant } from '@/lib/api'

interface State {
  restaurants: ApiRestaurant[]
  loading: boolean
  error: string | null
}

export function useRestaurants(params?: { category?: string; status?: string; search?: string }) {
  const [state, setState] = useState<State>({ restaurants: [], loading: true, error: null })
  const key = JSON.stringify(params ?? {})

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    api.restaurants.list(params)
      .then((res) => {
        if (!cancelled) setState({ restaurants: res.restaurants, loading: false, error: null })
      })
      .catch((e) => {
        if (!cancelled) setState({ restaurants: [], loading: false, error: e?.message ?? 'NETWORK_ERROR' })
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}

export function useRestaurant(slug: string | undefined) {
  const [state, setState] = useState<{ restaurant: ApiRestaurant | null; loading: boolean; error: string | null }>({
    restaurant: null, loading: true, error: null,
  })

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    api.restaurants.get(slug)
      .then((res) => { if (!cancelled) setState({ restaurant: res.restaurant, loading: false, error: null }) })
      .catch((e) => { if (!cancelled) setState({ restaurant: null, loading: false, error: e?.message ?? 'NETWORK_ERROR' }) })
    return () => { cancelled = true }
  }, [slug])

  return state
}

export function useReviews(slug: string | undefined) {
  const [reviews, setReviews] = useState<Array<{ id: string; rating: number; comment: string | null; createdAt: string; author: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    api.restaurants.reviews(slug)
      .then((res) => { if (!cancelled) { setReviews(res.reviews); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  return { reviews, loading }
}
