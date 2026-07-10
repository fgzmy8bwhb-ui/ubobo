import { useEffect, useState } from 'react'
import { api, type ApiRestaurant } from '@/lib/api'
import { restaurants as staticRestaurants } from '@/data/restaurants'

interface State {
  restaurants: ApiRestaurant[]
  loading: boolean
  error: string | null
}

function toApiRestaurant(r: (typeof staticRestaurants)[0]): ApiRestaurant {
  return {
    id: r.id,
    dbId: r.id,
    name: r.name,
    category: r.category as any,
    status: (r.status ?? 'active') as any,
    logo: r.logo,
    coverImage: r.coverImage,
    distanceFromCenterKm: r.distanceFromCenterKm ?? 0,
    address: r.address ?? '',
    phone: r.phone,
    description: r.description,
    averageRating: 0,
    reviewCount: 0,
    isFeatured: false,
    menu: (r.menu ?? []).map((m) => ({ ...m, available: m.available ?? true })),
  }
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
      .catch(() => {
        if (!cancelled) {
          let fallback = staticRestaurants.map(toApiRestaurant)
          if (params?.category) fallback = fallback.filter((r) => r.category === params.category)
          if (params?.status) fallback = fallback.filter((r) => r.status === params.status)
          if (params?.search) {
            const q = params.search.toLowerCase()
            fallback = fallback.filter((r) => r.name.toLowerCase().includes(q))
          }
          setState({ restaurants: fallback, loading: false, error: null })
        }
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
      .catch(() => {
        if (!cancelled) {
          const found = staticRestaurants.find((r) => r.id === slug)
          setState({ restaurant: found ? toApiRestaurant(found) : null, loading: false, error: null })
        }
      })
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
