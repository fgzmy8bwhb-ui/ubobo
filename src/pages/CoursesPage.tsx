import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { request } from '@/lib/api'
import { AUCHAN_ICON_BY_SLUG } from '@/data/courses-categories'
import Seo from '@/components/shared/Seo'

interface AuchanNavCategory {
  slug: string
  name: string
  iconUrl: string | null
  group: string
}

// "Les halles" has a static sub-category page (no Auchan product list)
const HALLES_SLUG = 'les-halles-d-auchan'

export default function CoursesPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cats, setCats] = useState<AuchanNavCategory[]>([])
  const [availableSlugs, setAvailableSlugs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/courses/recherche?q=${encodeURIComponent(q.trim())}`)
  }

  useEffect(() => {
    Promise.all([
      request<{ categories: AuchanNavCategory[] }>('/api/courses/nav'),
      request<{ slugs: string[] }>('/api/courses/categories'),
    ])
      .then(([nav, avail]) => {
        setCats(nav.categories.filter((c) => c.group === 'Mes courses'))
        setAvailableSlugs(new Set(avail.slugs))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="pb-16">
      <Seo
        title="Courses Auchan — Livraison Cap Ferret | UBOBO"
        description="Faites vos courses à l'Auchan de Lège et faites-vous livrer sur la Pointe du Cap Ferret."
        path="/courses"
      />
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 px-4 pt-6 pb-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={15} /> Retour
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-6xl drop-shadow-md">🛒</span>
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow">Courses Arrivée</h1>
              <p className="mt-1 text-white/80">On fait vos courses à l'Auchan de Lège · livré chez vous</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories grid */}
      <section className="container-edge pt-6">
        <h2 className="mb-5 text-display">Nos rayons</h2>
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-surface-alt animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cats.map((cat) => {
              // Les halles → static sub-categories page, always available
              const isHalles = cat.slug === HALLES_SLUG
              const available = isHalles || availableSlugs.has(cat.slug) || cats.length === 0
              const href = isHalles ? '/courses/categorie/halles' : `/courses/categorie/${cat.slug}`
              return (
                <CategoryCard
                  key={cat.slug}
                  slug={cat.slug}
                  label={cat.name}
                  iconUrl={AUCHAN_ICON_BY_SLUG[cat.slug] ?? cat.iconUrl ?? null}
                  available={available}
                  href={href}
                />
              )
            })}
          </div>
        )}
      </section>

      {/* Search across all categories */}
      <div className="container-edge pt-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un produit dans tous les rayons…"
              className="w-full rounded-xl border border-line bg-card pl-9 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-80 transition-opacity">
            Chercher
          </button>
        </form>
      </div>
    </main>
  )
}

function CategoryCard({
  label, iconUrl, available, href,
}: {
  slug: string
  label: string
  iconUrl: string | null
  available: boolean
  href: string
}) {
  const inner = (
    <div className={`group relative flex flex-col items-center gap-3 rounded-2xl border border-line p-4 text-center transition-all duration-200 ${available ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer bg-card' : 'cursor-default bg-card opacity-60'}`}>
      <div className={`h-16 w-16 overflow-hidden rounded-2xl bg-surface-alt transition-transform duration-200 ${available ? 'group-hover:scale-105' : ''}`}>
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={label}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl">🛒</div>
        )}
      </div>
      <p className="text-xs font-semibold leading-tight text-ink line-clamp-2">{label}</p>
      {!available && (
        <span className="absolute top-2 right-2 rounded-full bg-surface-alt px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted">
          Bientôt
        </span>
      )}
    </div>
  )

  if (!available) return inner
  return <Link to={href} className="block">{inner}</Link>
}
