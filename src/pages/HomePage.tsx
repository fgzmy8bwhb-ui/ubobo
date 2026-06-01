import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Sparkles, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRestaurants } from '@/hooks/useRestaurants'
import RestaurantCard from '@/components/RestaurantCard'
import CategoryStrip, { CATEGORIES } from '@/components/customer/CategoryStrip'
import AddressBar from '@/components/customer/AddressBar'
import PromoBanner from '@/components/customer/PromoBanner'
import type { Restaurant } from '@/types'

export default function HomePage() {
  const { t } = useTranslation()
  const { restaurants, loading } = useRestaurants()
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    if (category === 'all') return restaurants
    if (category === 'grocery') return [] // courses redirect handled by strip
    return restaurants.filter((r) => r.category === category)
  }, [restaurants, category])

  const featured = restaurants.filter((r) => r.status === 'active' && r.isFeatured)
  const active = filtered.filter((r) => r.status === 'active')
  const others = filtered.filter((r) => r.status !== 'active')

  return (
    <main className="pb-12">
      {/* Hero — compact welcome */}
      <section className="container-edge pt-6 pb-4 md:pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 px-3 py-1 text-xs font-bold text-ocean-700 dark:bg-ocean-900/40 dark:text-ocean-200">
              <Sparkles size={12} /> Cap Ferret · Pointe
            </p>
            <h1 className="mt-3 text-hero">
              Faim ? <span className="text-ocean-500">On livre.</span>
            </h1>
            <p className="mt-2 text-base text-muted md:max-w-md">
              {t('home.heroSubtitle', { defaultValue: 'Restaurants locaux et courses, livrés sur la Pointe en 30 minutes.' })}
            </p>
          </div>

          <AddressBar />
        </div>

        {/* Search */}
        <Link to="/recherche" className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 transition-colors hover:bg-surface-alt">
          <Search size={18} className="text-muted" />
          <span className="text-sm text-muted">Restaurant, plat, cuisine…</span>
        </Link>
      </section>

      {/* Categories */}
      <section className="container-edge pb-4 pt-2">
        <CategoryStrip active={category} onSelect={setCategory} />
      </section>

      {/* Promotions */}
      <div className="mt-2 mb-6">
        <PromoBanner />
      </div>

      {/* Featured */}
      {featured.length > 0 && category === 'all' && (
        <section className="container-edge pb-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-display">À la une</h2>
              <p className="mt-1 text-sm text-muted">Nos coups de cœur du moment</p>
            </div>
            <Link to="/restaurants" className="hidden items-center gap-1 text-sm font-bold text-ink hover:underline sm:flex">
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r) => (
              <RestaurantCard key={r.id} restaurant={r as Restaurant} />
            ))}
          </div>
        </section>
      )}

      {/* All restaurants */}
      <section className="container-edge">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-display">
              {category === 'all' ? 'Tous les restaurants' : CATEGORIES.find((c) => c.value === category)?.label}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {loading ? 'Chargement…' : `${active.length} ouvert${active.length > 1 ? 's' : ''} maintenant`}
            </p>
          </div>
          <Link to="/restaurants" className="hidden items-center gap-1 text-sm font-bold text-ink hover:underline sm:flex">
            Voir plus <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-alt" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-surface-alt" />
                <div className="h-3 w-1/3 animate-pulse rounded-md bg-surface-alt" />
              </div>
            ))}
          </div>
        ) : active.length === 0 && others.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">
            Aucun restaurant dans cette catégorie pour l'instant.
          </p>
        ) : (
          <>
            <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((r) => (
                <RestaurantCard key={r.id} restaurant={r as Restaurant} />
              ))}
            </div>

            {others.length > 0 && (
              <div className="mt-12">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Bientôt sur UBOBO</h3>
                <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r as Restaurant} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  )
}
