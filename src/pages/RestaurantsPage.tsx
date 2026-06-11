import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRestaurants } from '@/hooks/useRestaurants'
import RestaurantCard from '@/components/RestaurantCard'
import CategoryStrip, { CATEGORIES } from '@/components/customer/CategoryStrip'
import PromoBanner from '@/components/customer/PromoBanner'
import type { Restaurant } from '@/types'

export default function RestaurantsPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const initialCategory = params.get('category') ?? 'all'
  const [category, setCategory] = useState(initialCategory)
  const [openOnly, setOpenOnly] = useState(false)
  const { restaurants, loading } = useRestaurants()

  useEffect(() => {
    if (category === 'all') params.delete('category')
    else params.set('category', category)
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const matchCat = category === 'all' || r.category === category
      const matchOpen = !openOnly || r.status === 'active'
      return matchCat && matchOpen
    })
  }, [restaurants, category, openOnly])

  const active = filtered.filter((r) => r.status === 'active')
  const others = filtered.filter((r) => r.status !== 'active')

  return (
    <main className="pb-12">
      <section className="container-edge pt-6">
        <h1 className="text-display">{t('nav.restaurants')}</h1>
        <p className="mt-1 text-sm text-muted">
          {restaurants.filter((r) => r.status === 'active').length} ouverts à Cap Ferret · 33970
        </p>
      </section>

      <section className="container-edge pt-5">
        <CategoryStrip active={category} onSelect={setCategory} />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setOpenOnly((v) => !v)}
            className={openOnly ? 'pill-active' : 'pill-default'}
          >
            <span className={'h-1.5 w-1.5 rounded-full ' + (openOnly ? 'bg-surface' : 'bg-emerald-500')} />
            Ouverts maintenant
          </button>
          <span className="text-sm text-muted">
            {loading ? '' : `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}`}
          </span>
        </div>
      </section>

      <div className="mt-6">
        <PromoBanner />
      </div>

      <section className="container-edge mt-8">
        {loading ? (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-alt" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-surface-alt" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-card p-10 text-center">
            <p className="text-lg font-bold">{t('search.noResults')}</p>
            <button onClick={() => { setCategory('all'); setOpenOnly(false) }} className="mt-4 btn-secondary">
              {CATEGORIES[0].label}
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((r) => (
                <RestaurantCard key={r.id} restaurant={r as unknown as Restaurant} />
              ))}
            </div>
            {others.length > 0 && (
              <div className="mt-12">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Bientôt</h2>
                <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {others.map((r) => (
                    <RestaurantCard key={r.id} restaurant={r as unknown as Restaurant} />
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
