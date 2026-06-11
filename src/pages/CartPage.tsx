import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react'
import useCartStore from '@/store/cart.store'
import { formatPrice } from '@/lib/format'
import { toast } from '@/hooks/useToast'
import Button from '@/components/ui/Button'

export default function CartPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const closeDrawer = useCartStore((s) => s.closeDrawer)
  useEffect(() => { closeDrawer() }, [closeDrawer])

  const items = useCartStore((s) => s.items)
  const restaurantName = useCartStore((s) => s.restaurantName)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const subtotal = useCartStore((s) => s.subtotal())
  const deliveryFee = useCartStore((s) => s.deliveryFee())
  const pickingFee = useCartStore((s) => s.pickingFee())
  const discount = useCartStore((s) => s.discount())
  const total = useCartStore((s) => s.total())
  const appliedPromo = useCartStore((s) => s.appliedPromo)
  const applyPromo = useCartStore((s) => s.applyPromo)
  const clearPromo = useCartStore((s) => s.clearPromo)

  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)

  async function onApply() {
    if (!code.trim()) return
    setApplying(true)
    const res = await applyPromo(code.trim().toUpperCase())
    setApplying(false)
    if (res.ok) { toast.success('Code appliqué'); setCode('') }
    else toast.error(t('cart.invalidCode'))
  }

  if (items.length === 0) {
    return (
      <main className="container-edge py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-alt">
          <ShoppingBag size={32} className="text-muted" />
        </div>
        <h1 className="mt-6 text-display">{t('cart.empty')}</h1>
        <p className="mt-2 text-muted">Choisissez un restaurant pour commencer.</p>
        <Button variant="dark" className="mt-6" onClick={() => navigate('/restaurants')}>
          {t('nav.restaurants')}
        </Button>
      </main>
    )
  }

  return (
    <main className="container-edge py-8">
      <h1 className="text-display">{t('cart.title')}</h1>
      {restaurantName && (
        <p className="mt-1 text-sm font-semibold text-ocean-500">Commande chez {restaurantName}</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="card-surface flex items-center gap-4 p-4 sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{item.name}</p>
                {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                  <p className="mt-0.5 text-xs text-muted">
                    {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </p>
                )}
                <p className="mt-1 text-sm font-semibold text-ocean-500">{formatPrice(item.price, i18n.language)}</p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface-alt px-1.5 py-1">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink hover:bg-card"
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink hover:bg-card"
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>

              <p className="w-16 shrink-0 text-right text-base font-bold">{formatPrice(item.price * item.quantity, i18n.language)}</p>

              <button onClick={() => removeItem(item.id)} className="shrink-0 text-muted hover:text-red-500" aria-label={t('cart.remove')}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>

        <div className="lg:sticky lg:top-24 h-fit card-surface p-6">
          {/* Promo */}
          <div className="mb-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{t('cart.promoCode')}</p>
            {appliedPromo ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 dark:bg-emerald-900/30">
                <div className="flex items-center gap-2 text-sm">
                  <Tag size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <code className="font-bold text-emerald-700 dark:text-emerald-300">{appliedPromo.code}</code>
                </div>
                <button onClick={() => { clearPromo(); toast.info('Code retiré') }} className="text-emerald-700 hover:opacity-70 dark:text-emerald-300">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CAPFERRET10" className="input-flat flex-1 uppercase" />
                <Button size="sm" variant="dark" onClick={onApply} disabled={applying || !code.trim()}>
                  {t('cart.applyCode')}
                </Button>
              </div>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('cart.subtotal')}</dt>
              <dd className="font-semibold">{formatPrice(subtotal, i18n.language)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <dt>{t('cart.discount')}</dt>
                <dd className="font-semibold">− {formatPrice(discount, i18n.language)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Livraison (trajet)</dt>
              <dd className="font-semibold">{formatPrice(deliveryFee, i18n.language)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Préparation des courses <span className="text-[10px] font-normal">(10 %)</span></dt>
              <dd className="font-semibold">{formatPrice(pickingFee, i18n.language)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold">{t('cart.total')}</dt>
              <dd className="font-bold">{formatPrice(total, i18n.language)}</dd>
            </div>
          </dl>

          <Link to="/commande" className="mt-6 block">
            <Button variant="dark" fullWidth icon={<ArrowRight size={16} />}>{t('cart.checkout')}</Button>
          </Link>
          <Link to="/restaurants" className="mt-2 block text-center">
            <button className="text-sm font-semibold text-muted hover:text-ink">+ Ajouter d'autres plats</button>
          </Link>
        </div>
      </div>
    </main>
  )
}
