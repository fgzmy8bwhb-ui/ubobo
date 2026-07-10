import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useRestaurants } from '@/hooks/useRestaurants'
import type { Restaurant } from '@/types'

const CATEGORY_META: Record<string, { name: string; gradient: string; description: string }> = {
  'petit-dejeuner': {
    name: 'Petit Déjeuner',
    gradient: 'from-amber-400 to-orange-500',
    description: 'Viennoiseries & pâtisseries fraîches',
  },
  'apero': {
    name: 'Apéro',
    gradient: 'from-cyan-400 to-blue-600',
    description: 'Huîtres, fruits de mer & alcools pour l\'apéro',
  },
  'courses': {
    name: 'Courses Arrivée',
    gradient: 'from-emerald-400 to-teal-500',
    description: 'Produits essentiels pour votre arrivée',
  },
  'patisserie': {
    name: 'Pâtisserie',
    gradient: 'from-pink-400 to-rose-500',
    description: 'Gâteaux & douceurs sucrées',
  },
  'livres': {
    name: 'Livres & Puzzles',
    gradient: 'from-indigo-400 to-indigo-600',
    description: 'Sélection de livres et puzzles sur le Cap Ferret',
  },
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const { restaurants, loading } = useRestaurants()

  // Courses has its own dedicated page
  if (slug === 'courses') return <Navigate to="/courses" replace />

  const meta = CATEGORY_META[slug ?? '']
  const shops = restaurants.filter((r) => r.category === slug)

  if (!meta) {
    return (
      <main className="container-edge py-16 text-center">
        <p className="text-muted">Catégorie introuvable.</p>
        <Link to="/" className="mt-4 inline-block font-bold text-ink underline">Retour à l'accueil</Link>
      </main>
    )
  }

  return (
    <main className="pb-16">
      {/* Header */}
      <div className={`bg-gradient-to-br ${meta.gradient} px-4 pt-6 pb-8`}>
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
            <ArrowLeft size={15} /> Retour
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow">{meta.name}</h1>
              <p className="mt-1 text-white/80">{meta.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shop list */}
      <section className="container-edge pt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-3xl bg-surface-alt" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line bg-card p-12 text-center">
            <p className="text-4xl mb-4">🚧</p>
            <p className="font-bold text-ink">Bientôt disponible</p>
            <p className="mt-2 text-sm text-muted">Cette catégorie ouvrira très prochainement.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop as unknown as Restaurant} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ShopCard({ shop }: { shop: Restaurant }) {
  const isActive = shop.status === 'active'

  const card = (
    <article className={`group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-card transition-all duration-300 ${isActive ? 'hover:shadow-lift hover:-translate-y-0.5 cursor-pointer' : 'opacity-70 cursor-default'}`}>
      {/* Cover / Visual */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-surface-alt to-line">
        {shop.coverImage ? (
          <img
            src={shop.coverImage}
            alt={shop.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100 dark:from-ocean-950/40 dark:to-ocean-900/40">
            {shop.logo ? (
              <img src={shop.logo} alt={`Logo ${shop.name}`} className="h-20 w-20 object-contain" />
            ) : (
              <span className="text-6xl font-black text-ocean-200/60 select-none">
                {shop.name.charAt(0)}
              </span>
            )}
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-ink shadow-card">
              Bientôt
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-5">
        <h3 className="text-lg font-bold text-ink">{shop.name}</h3>
        {shop.description && (
          <p className="text-sm text-muted leading-relaxed line-clamp-2">{shop.description}</p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {shop.address && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {shop.address}
            </span>
          )}
        </div>
      </div>
    </article>
  )

  if (!isActive) return card

  return (
    <Link to={`/restaurant/${shop.id}`} className="block">
      {card}
    </Link>
  )
}
