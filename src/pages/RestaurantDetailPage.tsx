import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Info, MapPin, Minus, Plus, ShoppingBag, Star, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui'
import Button from '@/components/ui/Button'
import { categoryLabels } from '@/components/RestaurantCard'
import { useRestaurant, useReviews } from '@/hooks/useRestaurants'
import useCartStore from '@/store/cart.store'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import type { MenuItem } from '@/types'
import FavoriteButton from '@/components/customer/FavoriteButton'
import ReviewStars from '@/components/customer/ReviewStars'
import { cn } from '@/lib/cn'

function ConflictModal({
  currentRestaurantName, newRestaurantName, onConfirm, onCancel,
}: { currentRestaurantName: string; newRestaurantName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-sm rounded-3xl bg-card p-6 shadow-lift"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sunset-50 dark:bg-sunset-400/15">
          <ShoppingBag size={22} className="text-sunset-500" />
        </div>
        <h3 className="text-xl font-bold">Changer de restaurant ?</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Tu as déjà des plats de <span className="font-bold text-ink">{currentRestaurantName}</span> dans
          ton panier. Vider et commander chez <span className="font-bold text-ink">{newRestaurantName}</span> ?
        </p>
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>Annuler</Button>
          <Button variant="dark" fullWidth onClick={onConfirm}>Vider et commander</Button>
        </div>
      </motion.div>
    </div>
  )
}

function OptionsModal({
  item, onConfirm, onCancel,
}: { item: MenuItem; onConfirm: (selected: Record<string, string>) => void; onCancel: () => void }) {
  const { t, i18n } = useTranslation()
  const [selected, setSelected] = useState<Record<string, string>>({})
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-lift"
      >
        <div className="mb-1 flex items-center gap-4">
          {item.image && (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
            <p className="text-sm font-semibold text-ocean-500">{formatPrice(item.price, i18n.language)}</p>
          </div>
        </div>

        <div className="mt-5 space-y-5 max-h-[60vh] overflow-y-auto">
          {item.options?.map((opt) => (
            <div key={opt.name}>
              <p className="mb-2.5 text-sm font-bold">
                {opt.name}
                <span className="ml-2 text-xs font-medium text-muted">
                  {opt.required ? t('restaurant.required') : 'Optionnel'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {opt.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() =>
                      setSelected((s) =>
                        s[opt.name] === choice
                          ? Object.fromEntries(Object.entries(s).filter(([k]) => k !== opt.name))
                          : { ...s, [opt.name]: choice }
                      )
                    }
                    className={cn(
                      'rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all',
                      selected[opt.name] === choice
                        ? 'border-ink bg-ink text-surface'
                        : 'border-line bg-card text-ink hover:border-ink'
                    )}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onCancel}>{t('common.cancel')}</Button>
          <Button variant="dark" fullWidth onClick={() => onConfirm(selected)}>{t('restaurant.addToCart')}</Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function RestaurantDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { restaurant, loading } = useRestaurant(id)
  const { reviews } = useReviews(id)

  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null)
  const [pendingOptions, setPendingOptions] = useState<Record<string, string>>({})
  const [optionItem, setOptionItem] = useState<MenuItem | null>(null)
  const [addedItemId, setAddedItemId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [infoItem, setInfoItem] = useState<MenuItem | null>(null)
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const addItem = useCartStore((s) => s.addItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const cartItems = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const cartRestaurantId = useCartStore((s) => s.restaurantId)
  const cartRestaurantName = useCartStore((s) => s.restaurantName)
  const totalItems = useCartStore((s) => s.totalItems())
  const openDrawer = useCartStore((s) => s.openDrawer)

  useEffect(() => {
    if (restaurant?.menu && restaurant.menu.length > 0) {
      const firstCat = restaurant.menu[0].category
      setActiveCategory(firstCat)
    }
  }, [restaurant])

  if (loading) return (
    <main className="container-edge py-24 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-ocean-500 border-t-transparent" />
    </main>
  )

  if (!restaurant) {
    return (
      <main className="container-edge py-24 text-center">
        <h1 className="text-display">Restaurant introuvable</h1>
        <p className="mt-2 text-muted">Ce restaurant n'existe pas ou a été retiré.</p>
        <Link to="/restaurants" className="mt-8 inline-block">
          <Button variant="secondary">← {t('common.back')}</Button>
        </Link>
      </main>
    )
  }

  if (restaurant.status !== 'active') {
    return (
      <main className="container-edge py-24 text-center">
        <h1 className="text-display">{restaurant.name}</h1>
        <Badge variant="muted" className="mt-3">
          {restaurant.status === 'coming_soon' ? t('restaurant.comingSoon') : t('restaurant.partnerPending')}
        </Badge>
        <p className="mt-5 text-muted">Ce restaurant n'est pas encore disponible à la commande.</p>
        <Link to="/restaurants" className="mt-8 inline-block">
          <Button variant="secondary">← {t('common.back')}</Button>
        </Link>
      </main>
    )
  }

  const grouped = restaurant.menu.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})
  const categories = Object.keys(grouped)

  const doAdd = (item: MenuItem, selectedOptions: Record<string, string>) => {
    if (cartRestaurantId && cartRestaurantId !== restaurant.id) {
      setPendingItem(item)
      setPendingOptions(selectedOptions)
      return
    }
    addItem(item, restaurant.id, restaurant.name, Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined)
    setAddedItemId(item.id)
    setTimeout(() => setAddedItemId(null), 1100)
  }

  const handleAdd = (item: MenuItem) => {
    if (!item.available) return
    if (item.options && item.options.length > 0) {
      setOptionItem(item)
      return
    }
    doAdd(item, {})
  }

  const handleOptionsConfirm = (selectedOptions: Record<string, string>) => {
    if (!optionItem) return
    const item = optionItem
    setOptionItem(null)
    doAdd(item, selectedOptions)
  }

  const handleConfirmConflict = () => {
    if (!pendingItem) return
    clearCart()
    addItem(pendingItem, restaurant.id, restaurant.name, Object.keys(pendingOptions).length > 0 ? pendingOptions : undefined)
    setPendingItem(null); setPendingOptions({})
    setAddedItemId(pendingItem.id)
    setTimeout(() => setAddedItemId(null), 1100)
  }

  const scrollToCategory = (cat: string) => {
    const el = categoryRefs.current[cat]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveCategory(cat)
    }
  }

  return (
    <>
      <main className="pb-24">
        {/* Hero — image + info */}
        <section className="relative">
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-ocean-700 to-ocean-900 sm:h-64">
            {restaurant.coverImage ? (
              <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-ocean-500 via-ocean-700 to-deep" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <Link
              to="/restaurants"
              className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-card backdrop-blur-sm transition-transform hover:scale-105"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="absolute right-4 top-4">
              <FavoriteButton slug={restaurant.id} className="bg-white/95 border-0 shadow-card" size={18} />
            </div>
          </div>

          <div className="container-edge -mt-12 sm:-mt-16">
            <div className="card-surface relative p-5 sm:p-6">
              <div className="flex items-start gap-4">
                {restaurant.logo && (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-line bg-card sm:h-20 sm:w-20">
                    <img src={restaurant.logo} alt={`Logo ${restaurant.name}`} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{restaurant.name}</h1>
                    <Badge variant="success" dot>Ouvert</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{categoryLabels[restaurant.category]}</p>
                  {restaurant.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">{restaurant.description}</p>
                  )}
                  {restaurant.id === 'la-cabane' && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                      <Clock size={12} className="shrink-0" />
                      Pour les huîtres, commandez idéalement 1h avant la livraison souhaitée.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {restaurant.averageRating != null && restaurant.averageRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star size={15} className="text-sunset-400" fill="currentColor" />
                    <span className="font-bold">{restaurant.averageRating!.toFixed(1)}</span>
                    <span className="text-muted">({restaurant.reviewCount} avis)</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-muted">
                  <MapPin size={14} /> {restaurant.distanceFromCenterKm} km
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky category nav */}
        {categories.length > 1 && (
          <div className="sticky top-16 z-20 mt-6 bg-surface/95 backdrop-blur-md">
            <div className="container-edge">
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-3 sm:mx-0 sm:px-0">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => scrollToCategory(c)}
                    className={activeCategory === c ? 'pill-active' : 'pill-default'}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <section className="container-edge mt-6">
          {categories.map((category) => (
            <div
              key={category}
              ref={(el) => { categoryRefs.current[category] = el }}
              className="mb-10 scroll-mt-32"
            >
              <h2 className="mb-4 text-xl font-bold">{category}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {grouped[category].map((item) => (
                  <li
                    key={item.id}
                    className={cn(
                      'group relative flex items-stretch gap-3 overflow-hidden rounded-2xl border border-line bg-card transition-all',
                      item.available ? 'hover:border-ink/30' : 'opacity-50'
                    )}
                  >
                    <div className="flex flex-1 flex-col p-4">
                      <p className="font-bold text-ink">{item.name}</p>
                      <p className="mt-1 text-sm text-muted line-clamp-2">{item.description}</p>
                      <div className="mt-auto pt-3 text-base font-bold text-ink">{formatPrice(item.price, i18n.language)}</div>
                    </div>
                    {item.image && (
                      <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                    )}
                    {item.description && (
                      <button
                        onClick={() => setInfoItem(item)}
                        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt border border-line text-muted hover:text-ink hover:border-ink/30 transition-all"
                        aria-label={`Infos sur ${item.name}`}
                      >
                        <Info size={13} />
                      </button>
                    )}
                    {(() => {
                      const hasOptions = !!item.options && item.options.length > 0
                      const qty = hasOptions ? 0 : cartItems.find((i) => i.id === item.id)?.quantity ?? 0

                      if (!hasOptions && qty > 0) {
                        return (
                          <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-ink px-1 py-1 shadow-lift">
                            <button
                              onClick={() => (qty <= 1 ? removeItem(item.id) : updateQuantity(item.id, qty - 1))}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-surface hover:bg-white/10 active:scale-95"
                              aria-label={`Retirer un ${item.name}`}
                            >
                              <Minus size={14} strokeWidth={2.5} />
                            </button>
                            <span className="min-w-[1.25rem] text-center text-sm font-bold text-surface">{qty}</span>
                            <button
                              onClick={() => handleAdd(item)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-surface hover:bg-white/10 active:scale-95"
                              aria-label={`Ajouter un ${item.name}`}
                            >
                              <Plus size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        )
                      }

                      return (
                        <button
                          onClick={() => handleAdd(item)}
                          disabled={!item.available}
                          className={cn(
                            'absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full shadow-lift transition-all',
                            addedItemId === item.id
                              ? 'bg-emerald-500 text-white scale-110'
                              : item.available
                              ? 'bg-ink text-surface hover:scale-105 active:scale-95'
                              : 'bg-line text-muted cursor-not-allowed'
                          )}
                          aria-label={`${t('restaurant.addToCart')} ${item.name}`}
                        >
                          {addedItemId === item.id ? <Check size={16} strokeWidth={3} /> : <Plus size={18} strokeWidth={2.5} />}
                        </button>
                      )
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {reviews.length > 0 && (
            <div className="mt-14">
              <h2 className="mb-5 text-xl font-bold">Avis clients</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {reviews.slice(0, 10).map((r) => (
                  <li key={r.id} className="card-surface p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ocean-50 text-sm font-bold text-ocean-700 dark:bg-ocean-900/30 dark:text-ocean-200">
                          {r.author.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{r.author}</p>
                          <p className="text-xs text-muted">{formatRelativeTime(r.createdAt, i18n.language)}</p>
                        </div>
                      </div>
                      <ReviewStars rating={r.rating} />
                    </div>
                    {r.comment && <p className="mt-3 text-sm leading-relaxed text-ink">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>

      {/* Sticky cart bar (mobile) */}
      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 px-4 py-3 shadow-lift backdrop-blur-xl pb-safe md:hidden">
          <button onClick={openDrawer} className="btn-dark w-full">
            <ShoppingBag size={16} />
            Voir le panier · {totalItems} article{totalItems > 1 ? 's' : ''}
          </button>
        </div>
      )}

      <AnimatePresence>
        {optionItem && (
          <OptionsModal item={optionItem} onConfirm={handleOptionsConfirm} onCancel={() => setOptionItem(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingItem && !optionItem && (
          <ConflictModal
            currentRestaurantName={cartRestaurantName ?? ''}
            newRestaurantName={restaurant.name}
            onConfirm={handleConfirmConflict}
            onCancel={() => { setPendingItem(null); setPendingOptions({}) }}
          />
        )}
      </AnimatePresence>

      {/* Modal info produit */}
      <AnimatePresence>
        {infoItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setInfoItem(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-3xl bg-card border border-line overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {infoItem.image && (
                <div className="h-48 w-full overflow-hidden">
                  <img src={infoItem.image} alt={infoItem.name} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-ink leading-tight">{infoItem.name}</h3>
                  <button onClick={() => setInfoItem(null)} className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-surface-alt hover:bg-line transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <p className="mt-3 text-sm text-muted leading-relaxed">{infoItem.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-ink">{formatPrice(infoItem.price, i18n.language)}</span>
                  {infoItem.available && (
                    <button
                      onClick={() => { handleAdd(infoItem); setInfoItem(null) }}
                      className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-surface hover:bg-ink/80 transition-colors"
                    >
                      <Plus size={15} /> Ajouter
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
