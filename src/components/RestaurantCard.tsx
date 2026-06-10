import { Clock, Star, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Restaurant } from '@/types'
import FavoriteButton from '@/components/customer/FavoriteButton'
import { cn } from '@/lib/cn'

export const categoryLabels: Record<Restaurant['category'], string> = {
  'petit-dejeuner': 'Petit Déjeuner',
  'fruits-de-mer': 'Fruits de Mer',
  'huitres': 'Huîtres',
  'courses': 'Courses',
}

const categoryGradients: Record<Restaurant['category'], string> = {
  'petit-dejeuner': 'from-amber-400/30 to-orange-500/30',
  'fruits-de-mer': 'from-cyan-400/30 to-blue-500/30',
  'huitres': 'from-slate-400/30 to-blue-600/30',
  'courses': 'from-emerald-400/30 to-teal-500/30',
}

function RestaurantVisual({ restaurant }: { restaurant: Restaurant }) {
  if (restaurant.coverImage) {
    return (
      <img
        src={restaurant.coverImage}
        alt={restaurant.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
    )
  }
  if (restaurant.logo) {
    return (
      <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', categoryGradients[restaurant.category])}>
        <img src={restaurant.logo} alt={`Logo ${restaurant.name}`} className="h-24 w-24 object-contain" />
      </div>
    )
  }
  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', categoryGradients[restaurant.category])}>
      <span className="text-6xl font-black tracking-tighter text-white/90 select-none">
        {restaurant.name.charAt(0)}
      </span>
    </div>
  )
}

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const isActive = restaurant.status === 'active'
  const showRating = isActive && restaurant.averageRating != null && restaurant.averageRating > 0

  const card = (
    <article className="group relative flex flex-col">
      <div className={cn('relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface-alt', !isActive && 'opacity-60')}>
        <RestaurantVisual restaurant={restaurant} />

        {isActive && (
          <div className="absolute right-3 top-3 z-10">
            <FavoriteButton slug={restaurant.id} size={16} className="bg-white/95 backdrop-blur-sm border-0 shadow-card text-ink hover:text-red-500" />
          </div>
        )}

        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-card/95 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink backdrop-blur-sm">
              {restaurant.status === 'partner_pending' ? 'Bientôt' : 'À venir'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 px-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold leading-tight text-ink">{restaurant.name}</h3>
          {showRating && (
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-ink">
              <Star size={13} className="text-sunset-400" fill="currentColor" />
              {restaurant.averageRating!.toFixed(1)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted">{categoryLabels[restaurant.category]}</p>

        {isActive && (
          <div className="mt-2 flex items-center gap-x-3 text-sm text-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {restaurant.estimatedTimeMin}–{restaurant.estimatedTimeMin + 10} min
            </span>
            <span className="text-line">•</span>
            <span>{restaurant.distanceFromCenterKm} km</span>
            {showRating && (
              <>
                <span className="text-line">•</span>
                <span className="text-muted">{restaurant.reviewCount} avis</span>
              </>
            )}
          </div>
        )}

        {!isActive && (
          <p className="mt-2 text-sm text-muted">
            {restaurant.status === 'partner_pending' ? 'En cours de partenariat' : 'Ouverture prochaine'}
            <ChevronRight size={12} className="ml-0.5 inline" />
          </p>
        )}
      </div>
    </article>
  )

  if (isActive) {
    return (
      <Link to={`/restaurant/${restaurant.id}`} className="block">
        {card}
      </Link>
    )
  }
  return card
}
