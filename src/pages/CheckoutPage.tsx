import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreditCard, Banknote, MapPin, AlertCircle, ArrowLeft } from 'lucide-react'
import useCartStore from '@/store/cart.store'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const deliveryFee = useCartStore((s) => s.deliveryFee())
  const discount = useCartStore((s) => s.discount())
  const total = useCartStore((s) => s.total())
  const setServerFee = useCartStore((s) => s.setServerFee)
  const setDeliveryDistanceKm = useCartStore((s) => s.setDeliveryDistanceKm)
  const deliveryDistanceKm = useCartStore((s) => s.deliveryDistanceKm)
  const submitOrder = useCartStore((s) => s.submitOrder)
  const appliedPromo = useCartStore((s) => s.appliedPromo)

  const user = useAuth((s) => s.user)
  const settings = useSettings((s) => s.settings)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState<'card' | 'cash'>('card')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (subtotal === 0) return
    let cancelled = false
    api.settings.quote(deliveryDistanceKm, subtotal)
      .then(({ fee }) => { if (!cancelled) setServerFee(fee.total) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [deliveryDistanceKm, subtotal, setServerFee])

  if (items.length === 0) {
    return (
      <main className="container-edge py-16 text-center">
        <p className="text-lg font-bold">{t('cart.empty')}</p>
        <Button variant="dark" onClick={() => navigate('/restaurants')} className="mt-4">{t('nav.restaurants')}</Button>
      </main>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const order = await submitOrder({
        customerName: name, customerPhone: phone, customerEmail: email || undefined,
        deliveryAddress: address, deliveryDistanceKm, paymentMethod: payment, notes: notes || undefined,
      })
      if (payment === 'card') {
        try { await api.stripe.paymentIntent(order.orderNumber) } catch {}
      }
      toast.success(`Commande ${order.orderNumber} confirmée !`)
      navigate(`/suivi/${order.orderNumber}`)
    } catch (e: any) {
      const code = e?.message
      if (code === 'BELOW_MIN_ORDER') {
        setError(t('checkout.belowMinOrder', { amount: formatPrice(settings?.deliveryMinOrder ?? 0, i18n.language) }))
      } else if (code === 'ORDERS_PAUSED') {
        setError('Les commandes sont temporairement suspendues.')
      } else setError(t('common.error'))
    } finally { setSubmitting(false) }
  }

  const maxDist = settings?.deliveryMaxDistanceKm ?? 4
  const valPct = (deliveryDistanceKm / maxDist) * 100

  return (
    <main className="container-edge py-8">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft size={14} /> {t('common.back')}
      </button>
      <h1 className="text-display">{t('checkout.title')}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="card-surface p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin size={18} className="text-ocean-500" /> {t('checkout.delivery')}
            </h2>
            <div className="mt-4 space-y-3">
              <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('checkout.addressPlaceholder')} className="input-flat" />
              <div>
                <label className="mb-1 block text-xs font-bold text-muted">Distance estimée</label>
                <input
                  type="range" min={0.5} max={maxDist} step={0.5}
                  value={deliveryDistanceKm}
                  onChange={(e) => setDeliveryDistanceKm(Number(e.target.value))}
                  className="slider w-full"
                  style={{ ['--val' as any]: `${valPct}%` }}
                />
                <p className="mt-1 text-xs text-muted">{deliveryDistanceKm} km — {formatPrice(deliveryFee, i18n.language)}</p>
              </div>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('checkout.notes')} rows={2} className="input-flat" />
            </div>
          </div>

          <div className="card-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">{t('checkout.contact')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('checkout.name')} className="input-flat" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={t('checkout.phone')} className="input-flat" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t('checkout.email')} className="input-flat sm:col-span-2" />
            </div>
          </div>

          <div className="card-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">{t('checkout.payment')}</h2>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPayment('card')}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all',
                  payment === 'card' ? 'border-ink bg-surface-alt' : 'border-line bg-card hover:border-ink/30'
                )}
              >
                <CreditCard size={22} className="text-ocean-500" />
                <div>
                  <p className="font-bold">{t('checkout.card')}</p>
                  <p className="text-xs text-muted">Stripe · sécurisé</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPayment('cash')}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all',
                  payment === 'cash' ? 'border-ink bg-surface-alt' : 'border-line bg-card hover:border-ink/30'
                )}
              >
                <Banknote size={22} className="text-emerald-500" />
                <div>
                  <p className="font-bold">{t('checkout.cash')}</p>
                  <p className="text-xs text-muted">Au livreur</p>
                </div>
              </button>
            </div>
          </div>

          <Button type="submit" variant="dark" size="lg" fullWidth disabled={submitting}>
            {submitting ? t('checkout.paying') : `${t('checkout.placeOrder')} · ${formatPrice(total, i18n.language)}`}
          </Button>
        </form>

        <aside className="lg:sticky lg:top-24 h-fit card-surface p-6">
          <h2 className="text-lg font-bold">{t('order.yourOrder')}</h2>
          <ul className="mt-4 max-h-64 overflow-y-auto divide-y divide-line">
            {items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{it.quantity} × {it.name}</p>
                </div>
                <p className="font-semibold">{formatPrice(it.price * it.quantity, i18n.language)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('cart.subtotal')}</dt>
              <dd>{formatPrice(subtotal, i18n.language)}</dd>
            </div>
            {appliedPromo && discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <dt>{t('cart.discount')} ({appliedPromo.code})</dt>
                <dd>− {formatPrice(discount, i18n.language)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">{t('cart.delivery')}</dt>
              <dd>{formatPrice(deliveryFee, i18n.language)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>{t('cart.total')}</dt>
              <dd>{formatPrice(total, i18n.language)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
