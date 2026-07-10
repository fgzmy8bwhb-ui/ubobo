import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import AddressBar from '@/components/customer/AddressBar'

interface CategoryTile {
  slug: string
  name: string
  description: string
  sub: string
  gradient: string
  bgLight: string
  textAccent: string
  comingSoon?: boolean
  image?: string
  coverImage?: string
  noOverlay?: boolean
  directTo?: string
}

const TILES: CategoryTile[] = [
  {
    slug: 'petit-dejeuner',
    name: 'Petit Déjeuner',
    description: 'Viennoiseries & pâtisseries fraîches livrées le matin',
    sub: 'La Boulangerie du Cap',
    gradient: 'from-amber-400 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    textAccent: 'text-amber-700 dark:text-amber-300',
    image: '/tiles/viennoiserie.webp',
    directTo: '/restaurant/boulangerie-du-cap',
  },
  {
    slug: 'apero',
    name: 'Apéro',
    description: 'Huîtres, fruits de mer & alcools pour l\'apéro',
    sub: 'La Kabane · Lucine · Alice',
    gradient: 'from-cyan-400 to-blue-600',
    bgLight: 'bg-cyan-50 dark:bg-cyan-950/30',
    textAccent: 'text-cyan-700 dark:text-cyan-300',
    image: '/tiles/huitres.jpg',
  },
  {
    slug: 'courses',
    name: 'Courses',
    description: 'Produits essentiels livrés avant votre arrivée en location',
    sub: 'Auchan',
    gradient: 'from-emerald-400 to-teal-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    textAccent: 'text-emerald-700 dark:text-emerald-300',
    image: '/tiles/course.jpeg',
    noOverlay: true,
  },
  {
    slug: 'patisserie',
    name: 'Pâtisserie',
    description: 'Gâteaux & douceurs sucrées',
    sub: 'Frédélian',
    gradient: 'from-pink-400 to-rose-500',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    textAccent: 'text-pink-700 dark:text-pink-300',
    image: '/tiles/patis.jpg',
    noOverlay: true,
  },
  {
    slug: 'livres',
    name: 'Livres & Puzzles',
    description: 'Sélection de livres et puzzles sur le Cap Ferret',
    sub: 'Alice',
    gradient: 'from-indigo-400 to-indigo-600',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/30',
    textAccent: 'text-indigo-700 dark:text-indigo-300',
    image: '/tiles/librairie.jpg',
    directTo: '/restaurant/alice-livres',
    noOverlay: true,
  },
]

export default function HomePage() {
  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="container-edge pt-6 pb-6 md:pt-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-ocean-50 px-3 py-1 text-xs font-bold text-ocean-700 dark:bg-ocean-900/40 dark:text-ocean-200">
              <Sparkles size={12} /> Cap Ferret · Pointe du Cap
            </p>
            <h1 className="mt-3 text-hero">
              Livraison à domicile<br />
              <span className="text-ocean-500">sur le Cap Ferret.</span>
            </h1>
            <p className="mt-2 text-base text-muted md:max-w-md">
              Petit déjeuner, apéro ou courses — livrés directement chez vous.
            </p>
          </div>
          <div className="md:shrink-0">
            <AddressBar />
          </div>
        </div>
      </section>

      {/* Tiles */}
      <section className="container-edge">
        <h2 className="mb-5 text-display">Que souhaitez-vous ?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile) => (
            <CategoryTileCard key={tile.slug} tile={tile} />
          ))}
        </div>
      </section>

      {/* Info strip */}
      <section className="container-edge mt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: 'Zone de livraison', text: 'Cap Ferret uniquement — Pointe, village, plages océan & bassin' },
            { title: 'Paiement sécurisé', text: 'CB, Apple Pay, Google Pay ou espèces à la livraison' },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
              <div>
                <p className="font-bold text-ink">{item.title}</p>
                <p className="mt-0.5 text-sm text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function CategoryTileCard({ tile }: { tile: CategoryTile }) {
  const inner = (
    <article className={`group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-card transition-all duration-300 ${tile.comingSoon ? 'cursor-default' : 'hover:shadow-lift hover:-translate-y-0.5'}`}>
      {/* Header avec image ou gradient */}
      <div className={`relative flex h-44 items-center justify-center overflow-hidden ${!tile.image ? `bg-gradient-to-br ${tile.gradient}` : ''}`}>
        {tile.image && (
          <>
            <img
              src={tile.image}
              alt={tile.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {!tile.noOverlay && (
              <div className={`absolute inset-0 bg-gradient-to-br ${tile.gradient} opacity-40 mix-blend-multiply`} />
            )}
          </>
        )}

        {tile.comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <span className="rounded-full bg-white/95 px-5 py-2 text-sm font-bold text-ink shadow-card">
              Bientôt disponible
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="text-xl font-bold text-ink">{tile.name}</h3>
          <p className="mt-1 text-sm text-muted leading-relaxed">{tile.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${tile.bgLight} ${tile.textAccent}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {tile.sub}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between pt-1">
          {!tile.comingSoon && (
            <span className="flex items-center gap-1 text-sm font-bold text-ink group-hover:gap-2 transition-all">
              Commander <ArrowRight size={15} />
            </span>
          )}
        </div>
      </div>

      {!tile.comingSoon && (
        <div className={`h-1 w-full bg-gradient-to-r ${tile.gradient} opacity-70`} />
      )}
    </article>
  )

  if (tile.comingSoon) return inner

  const to = tile.directTo ?? `/categorie/${tile.slug}`

  return (
    <Link to={to} className="block">
      {inner}
    </Link>
  )
}
