import { useMemo, useState } from 'react'
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRestaurants } from '@/hooks/useRestaurants'
import RestaurantCard from '@/components/RestaurantCard'
import CategoryStrip from '@/components/customer/CategoryStrip'
import type { Restaurant } from '@/types'

type Sort = 'popular' | 'nearest' | 'fastest' | 'rating'

export default function SearchPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [openOnly, setOpenOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('popular')
  const { restaurants, loading } = useRestaurants()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    let r = restaurants.filter((it) => {
      const matchCat = category === 'all' || it.category === category
      const matchOpen = !openOnly || it.status === 'active'
      const matchQ = !q || (it.name + ' ' + (it.description ?? '')).toLowerCase().includes(q)
      return matchCat && matchOpen && matchQ
    })
    r = r.slice()
    if (sort === 'nearest') r.sort((a, b) => a.distanceFromCenterKm - b.distanceFromCenterKm)
    if (sort === 'fastest') r.sort((a, b) => a.estimatedTimeMin - b.estimatedTimeMin)
    if (sort === 'rating') r.sort((a, b) => b.averageRating - a.averageRating)
    if (sort === 'popular') r.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    return r
  }, [restaurants, query, category, openOnly, sort])

  const sorts: { value: Sort; key: string }[] = [
    { value: 'popular', key: 'search.sortPopular' },
    { value: 'nearest', key: 'search.sortNearest' },
    { value: 'fastest', key: 'search.sortFastest' },
    { value: 'rating', key: 'search.sortRating' },
  ]

  return (
    <main className="container-edge py-6 pb-12">
      <h1 className="text-display">{t('search.title')}</h1>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3.5 focus-within:border-ink">
        <SearchIcon size={18} className="text-muted" />
        <input
          type="search"
          autoFocus
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-base text-ink placeholder:text-muted outline-none"
        />
      </div>

      <div className="mt-5">
        <CategoryStrip active={category} onSelect={setCategory} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={() => setOpenOnly((v) => !v)} className={openOnly ? 'pill-active' : 'pill-default'}>
          <span className={'h-1.5 w-1.5 rounded-full ' + (openOnly ? 'bg-surface' : 'bg-emerald-500')} />
          {t('search.openNow')}
        </button>

        <div className="ml-auto flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-muted" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-full bg-surface-alt px-3 py-1.5 text-sm font-semibold text-ink"
          >
            {sorts.map((s) => <option key={s.value} value={s.value}>{t(s.key)}</option>)}
          </select>
        </div>
      </div>

      <section className="mt-6">
        {loading ? (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-alt" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">
            {t('search.noResults')}
          </p>
        ) : (
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => <RestaurantCard key={r.id} restaurant={r as unknown as Restaurant} />)}
          </div>
        )}
      </section>
    </main>
  )
}
