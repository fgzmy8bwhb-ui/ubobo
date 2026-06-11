import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import useCartStore from '@/store/cart.store'
import { formatPrice } from '@/lib/format'

export default function CartDrawer() {
  const { t, i18n } = useTranslation()
  const isOpen = useCartStore((s) => s.isDrawerOpen)
  const items = useCartStore((s) => s.items)
  const restaurantName = useCartStore((s) => s.restaurantName)
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const subtotal = useCartStore((s) => s.subtotal())
  const deliveryFee = useCartStore((s) => s.deliveryFee())
  const pickingFee = useCartStore((s) => s.pickingFee())
  const discount = useCartStore((s) => s.discount())
  const total = useCartStore((s) => s.total())
  const appliedPromo = useCartStore((s) => s.appliedPromo)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />

          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.85 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col bg-card text-ink shadow-lift border-l border-line"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-bold">{t('cart.title')}</h2>
              <button
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-alt hover:text-ink"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-alt">
                  <ShoppingBag size={32} className="text-muted" />
                </div>
                <div>
                  <p className="text-lg font-bold">{t('cart.empty')}</p>
                  <p className="mt-1 text-sm text-muted">Découvrez nos restaurants partenaires</p>
                </div>
                <Link to="/restaurants" onClick={closeDrawer} className="w-full">
                  <button className="btn-dark w-full">{t('nav.restaurants')}</button>
                </Link>
              </div>
            ) : (
              <>
                {restaurantName && (
                  <div className="border-b border-line bg-surface-alt px-5 py-2.5">
                    <p className="text-xs font-bold text-ink">
                      Commande chez <span className="text-ocean-500">{restaurantName}</span>
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{item.name}</p>
                          {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted hover:bg-surface-alt"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted hover:bg-surface-alt"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatPrice(item.price * item.quantity, i18n.language)}</p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="mt-1 text-muted hover:text-red-500"
                            aria-label={t('cart.remove')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-line px-5 py-4">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">{t('cart.subtotal')}</dt>
                      <dd className="font-semibold">{formatPrice(subtotal, i18n.language)}</dd>
                    </div>
                    {discount > 0 && appliedPromo && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <dt>{t('cart.discount')} ({appliedPromo.code})</dt>
                        <dd className="font-semibold">− {formatPrice(discount, i18n.language)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-muted">Livraison (trajet)</dt>
                      <dd className="font-semibold">{formatPrice(deliveryFee, i18n.language)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Préparation <span className="text-[10px]">(10 %)</span></dt>
                      <dd className="font-semibold">{formatPrice(pickingFee, i18n.language)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-line pt-2 text-base">
                      <dt className="font-bold">{t('cart.total')}</dt>
                      <dd className="font-bold">{formatPrice(total, i18n.language)}</dd>
                    </div>
                  </dl>

                  <Link to="/panier" onClick={closeDrawer} className="mt-4 block">
                    <button className="btn-dark w-full">
                      {t('cart.checkout')}
                    </button>
                  </Link>
                  <p className="mt-2 text-center text-xs text-muted">Paiement sécurisé</p>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
