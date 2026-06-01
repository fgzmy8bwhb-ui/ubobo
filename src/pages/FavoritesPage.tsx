import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Heart, MapPin } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'

interface FavWithDetail {
  restaurantSlug: string
  restaurantName: string
}

export default function FavoritesPage() {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  const [favorites, setFavorites] = useState<FavWithDetail[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.favorites.list()
      .then((res) => setFavorites(res.favorites))
      .finally(() => setLoading(false))
  }, [user])

  if (!ready) return <main className="container-edge py-16 text-center text-muted">{t('common.loading')}</main>

  if (!user) {
    return (
      <main className="container-edge py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <Heart size={28} className="text-muted" />
        </div>
        <h1 className="mt-6 text-display">{t('favorites.title')}</h1>
        <p className="mt-2 text-muted">{t('favorites.loginRequired')}</p>
        <Link to="/connexion" className="mt-6 inline-block">
          <Button variant="dark">{t('nav.login')}</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="container-edge py-8">
      <h1 className="text-display">{t('favorites.title')}</h1>

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-alt" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">{t('favorites.empty')}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <Link
              key={f.restaurantSlug}
              to={`/restaurant/${f.restaurantSlug}`}
              className="card-surface flex items-center gap-4 p-5 transition-shadow hover:shadow-lift"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-300">
                <Heart size={20} fill="currentColor" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{f.restaurantName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                  <MapPin size={12} /> Cap Ferret
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
