import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, AlertCircle, ArrowLeft, Zap, Package } from 'lucide-react'
import DeliveryCalendar from '@/components/DeliveryCalendar'
import TimeSlotPicker from '@/components/TimeSlotPicker'
import { LogoCB, LogoVisa, LogoMastercard, LogoApplePay, LogoCash } from '@/components/PaymentLogo'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import useAddressStore from '@/store/address.store'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import useCartStore from '@/store/cart.store'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import StripePaymentForm from '@/components/StripePaymentForm'
import { formatPrice } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'

const PRIORITY_SURCHARGE = 4.99
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string)

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

  // Fix distance to 2 km on mount — slider removed
  useEffect(() => { setDeliveryDistanceKm(2) }, [])
  const submitOrder = useCartStore((s) => s.submitOrder)
  const appliedPromo = useCartStore((s) => s.appliedPromo)

  const user = useAuth((s) => s.user)
  const settings = useSettings((s) => s.settings)
  const savedAddress = useAddressStore((s) => s.savedAddress)
  const setSavedAddress = useAddressStore((s) => s.setSavedAddress)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [address, setAddress] = useState(savedAddress || (user?.address ?? ''))
  const [notes, setNotes] = useState('')
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'priority'>('standard')

  const deliverySlot = useCartStore((s) => s.deliverySlot)
  const deliveryDate = useCartStore((s) => s.deliveryDate)
  const setDeliveryDate = useCartStore((s) => s.setDeliveryDate)
  const restaurantId = useCartStore((s) => s.restaurantId)
  const hasBakeryItems = restaurantId === 'boulangerie-du-cap'
  const [payment, setPayment] = useState<'card' | 'cash'>('card')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null)

  type PaymentType = 'cb' | 'visa' | 'mastercard' | 'applepay' | 'cash'
  const [paymentType, setPaymentType] = useState<PaymentType>('cb')

  const PAYMENT_METHODS: { id: PaymentType; logo: ReactNode; label: string; sub?: string }[] = [
    { id: 'cb',         logo: <LogoCB />,         label: 'Cartes bancaires',  sub: 'CB' },
    { id: 'visa',       logo: <LogoVisa />,        label: 'Visa' },
    { id: 'mastercard', logo: <LogoMastercard />,  label: 'Mastercard' },
    { id: 'applepay',   logo: <LogoApplePay />,    label: 'Apple Pay' },
  ]

  const summaryLogoMap: Record<PaymentType, ReactNode> = {
    cb: <LogoCB />, visa: <LogoVisa />, mastercard: <LogoMastercard />,
    applepay: <LogoApplePay />, cash: <LogoCash />,
  }
  const summaryLabelMap: Record<PaymentType, string> = {
    cb: 'Cartes bancaires', visa: 'Visa', mastercard: 'Mastercard',
    applepay: 'Apple Pay', cash: 'Espèces à la livraison',
  }

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
    if (hasBakeryItems && !deliverySlot) {
      setError('Veuillez choisir un créneau horaire dans le panier.')
      return
    }
    if (hasBakeryItems && !deliveryDate) {
      setError('Veuillez choisir une date de livraison.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const priorityNote = !hasBakeryItems && deliveryOption === 'priority' ? '[LIVRAISON PRIORITAIRE +4,99€] ' : ''
      const bakeryNote = hasBakeryItems && deliveryDate && deliverySlot
        ? `[PETIT-DEJ : ${new Date(deliveryDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${deliverySlot}] `
        : ''
      const order = await submitOrder({
        customerName: name, customerPhone: phone, customerEmail: email || undefined,
        deliveryAddress: address, deliveryDistanceKm, paymentMethod: payment,
        notes: priorityNote + bakeryNote + (notes || '') || undefined,
      })

      // Mémoriser l'adresse pour la prochaine commande
      if (address) setSavedAddress(address)

      if (payment === 'cash') {
        toast.success(`Commande ${order.orderNumber} confirmée !`)
        navigate(`/suivi/${order.orderNumber}`)
        return
      }

      // Card → create Stripe payment intent and show payment form
      const { clientSecret: cs } = await api.stripe.paymentIntent(order.orderNumber)
      setClientSecret(cs)
      setPendingOrderNumber(order.orderNumber)
    } catch (e: any) {
      const code = e?.message
      if (code === 'BELOW_MIN_ORDER') {
        setError(t('checkout.belowMinOrder', { amount: formatPrice(settings?.deliveryMinOrder ?? 0, i18n.language) }))
      } else if (code === 'ORDERS_PAUSED') {
        setError('Les commandes sont temporairement suspendues.')
      } else setError(t('common.error'))
    } finally { setSubmitting(false) }
  }

  function onPaymentSuccess() {
    toast.success(`Commande ${pendingOrderNumber} confirmée !`)
    navigate(`/suivi/${pendingOrderNumber}`)
  }

  const prioritySurcharge = deliveryOption === 'priority' ? PRIORITY_SURCHARGE : 0
  const grandTotal = total + prioritySurcharge

  // Estimated delivery window based on restaurant time + distance
  const baseMin = 25 + Math.round(deliveryDistanceKm * 3)
  const stdEta = `${baseMin}–${baseMin + 15} min`
  const prioEta = `${Math.round(baseMin * 0.75)}–${Math.round(baseMin * 0.75) + 8} min`

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
              <AddressAutocomplete
                required
                value={address}
                onChange={setAddress}
                placeholder={t('checkout.addressPlaceholder')}
              />
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('checkout.notes')} rows={2} className="input-flat" />
            </div>
          </div>

          {/* Calendrier + créneaux — Boulangerie uniquement */}
          {hasBakeryItems ? (
            <>
              {/* Étape 1 : date */}
              <div className="card-surface p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">📅 Date de livraison</h2>
                  {!deliveryDate && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">Requis</span>
                  )}
                </div>
                <DeliveryCalendar
                  selected={deliveryDate}
                  onSelect={(d) => { setDeliveryDate(d); useCartStore.getState().setDeliverySlot(null) }}
                  selectedSlot={deliverySlot}
                />
              </div>

              {/* Étape 2 : heure (visible uniquement après avoir choisi une date) */}
              {deliveryDate && (
                <div className="card-surface p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">⏰ Heure de livraison</h2>
                    {!deliverySlot && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">Requis</span>
                    )}
                  </div>
                  <TimeSlotPicker selected={deliverySlot} onSelect={useCartStore.getState().setDeliverySlot} deliveryDate={deliveryDate} />
                </div>
              )}
            </>
          ) : (
          /* Options de livraison — autres commandes */
          <div className="card-surface p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Options de livraison</h2>
            <div className="space-y-2.5">
              {/* Priorité */}
              <button
                type="button"
                onClick={() => setDeliveryOption('priority')}
                className={cn(
                  'w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                  deliveryOption === 'priority' ? 'border-ink bg-surface-alt' : 'border-line bg-card hover:border-ink/30'
                )}
              >
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  deliveryOption === 'priority' ? 'bg-ocean-500 text-white' : 'bg-surface-alt text-ocean-500'
                )}>
                  <Zap size={18} strokeWidth={2.5} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Priorité</p>
                  <p className="text-sm text-muted">{prioEta} · Livré chez vous en premier</p>
                </div>
                <span className="shrink-0 text-sm font-bold">
                  +{formatPrice(PRIORITY_SURCHARGE, i18n.language)}
                </span>
              </button>

              {/* Standard */}
              <button
                type="button"
                onClick={() => setDeliveryOption('standard')}
                className={cn(
                  'w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                  deliveryOption === 'standard' ? 'border-ink bg-surface-alt' : 'border-line bg-card hover:border-ink/30'
                )}
              >
                <span className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  deliveryOption === 'standard' ? 'bg-ink text-surface' : 'bg-surface-alt text-muted'
                )}>
                  <Package size={18} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Standard</p>
                  <p className="text-sm text-muted">{stdEta}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-muted">Inclus</span>
              </button>
            </div>
          </div>
          )}

          <div className="card-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">{t('checkout.contact')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('checkout.name')} className="input-flat" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={t('checkout.phone')} className="input-flat" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t('checkout.email')} className="input-flat sm:col-span-2" />
            </div>
          </div>

          {/* Stripe payment form (after order created) */}
          {clientSecret ? (
            <div className="card-surface p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-bold">Paiement sécurisé</h2>
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#0A6E8A' } } }}>
                <StripePaymentForm onSuccess={onPaymentSuccess} onError={(msg) => setError(msg)} totalLabel={formatPrice(grandTotal, i18n.language)} />
              </Elements>
            </div>
          ) : (
            <>
              {/* Moyen de paiement */}
              <div className="card-surface overflow-hidden">
                <p className="px-5 pt-5 pb-3 text-lg font-bold">Moyen de paiement</p>

                {/* Option carte */}
                <button
                  type="button"
                  onClick={() => { setPayment('card'); setPaymentType(paymentType === 'cash' ? 'cb' : paymentType) }}
                  className={cn(
                    'flex w-full items-center gap-3 border-t border-line px-5 py-4 text-left transition-colors',
                    payment === 'card' ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
                  )}
                >
                  <span className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    payment === 'card' ? 'border-ink bg-ink' : 'border-muted'
                  )}>
                    {payment === 'card' && <span className="h-2 w-2 rounded-full bg-surface" />}
                  </span>
                  {summaryLogoMap[paymentType === 'cash' ? 'cb' : paymentType]}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink">
                      {summaryLabelMap[paymentType === 'cash' ? 'cb' : paymentType]}
                    </p>
                    <p className="text-xs text-muted">Stripe · sécurisé</p>
                  </div>
                  {payment === 'card' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPaymentModalOpen(true) }}
                      className="shrink-0 rounded-xl border border-line bg-card px-4 py-2 text-sm font-bold text-ink hover:bg-surface-alt transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </button>

                {/* Option espèces */}
                <button
                  type="button"
                  onClick={() => { setPayment('cash'); setPaymentType('cash') }}
                  className={cn(
                    'flex w-full items-center gap-3 border-t border-line px-5 py-4 text-left transition-colors',
                    payment === 'cash' ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
                  )}
                >
                  <span className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    payment === 'cash' ? 'border-ink bg-ink' : 'border-muted'
                  )}>
                    {payment === 'cash' && <span className="h-2 w-2 rounded-full bg-surface" />}
                  </span>
                  <LogoCash />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink">Espèces</p>
                    <p className="text-xs text-muted">Payer la totalité au livreur</p>
                  </div>
                </button>
              </div>

              <Button type="submit" variant="dark" size="lg" fullWidth disabled={submitting}>
                {submitting ? t('checkout.paying') : `${t('checkout.placeOrder')} · ${formatPrice(grandTotal, i18n.language)}`}
              </Button>
            </>
          )}

          {/* Modal plein écran — style Uber Eats */}
          {paymentModalOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-surface dark:bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-4 border-b border-line px-5 py-4">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-surface-alt transition-colors text-xl font-light"
                >
                  ✕
                </button>
                <h2 className="text-2xl font-bold">Options de paiement</h2>
              </div>

              {/* Body scrollable */}
              <div className="flex-1 overflow-y-auto">
                <p className="px-6 pb-2 pt-5 text-sm font-semibold text-muted">Moyen de paiement</p>
                <ul>
                  {PAYMENT_METHODS.map((m) => (
                    <li key={m.id} className="border-b border-line last:border-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentType(m.id)
                          setPayment(m.id === 'cash' ? 'cash' : 'card')
                        }}
                        className="flex w-full items-center gap-5 px-6 py-5 text-left hover:bg-surface-alt transition-colors"
                      >
                        {/* Logo 52×52 */}
                        <span className="shrink-0 h-[52px] w-[52px] overflow-hidden rounded-xl">{m.logo}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-ink">{m.label}</p>
                          {m.sub && <p className="text-sm text-muted">{m.sub}</p>}
                        </div>
                        {/* Radio */}
                        <span className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          paymentType === m.id
                            ? 'border-ink bg-ink'
                            : 'border-muted bg-transparent'
                        )}>
                          {paymentType === m.id && (
                            <span className="h-2.5 w-2.5 rounded-full bg-surface" />
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                {/* + Ajoutez un moyen */}
                <button type="button" className="flex w-full items-center gap-5 px-6 py-5 hover:bg-surface-alt transition-colors border-t border-line">
                  <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface-alt text-2xl font-light text-ink">+</span>
                  <p className="text-base font-semibold text-ink">Ajoutez un moyen de paiement</p>
                </button>
              </div>

              {/* Bouton sticky en bas */}
              <div className="border-t border-line bg-surface dark:bg-card p-5">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="w-full rounded-2xl bg-ink py-4 text-center text-base font-bold text-surface"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          )}
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
            {deliveryOption === 'priority' && (
              <div className="flex justify-between text-ocean-500">
                <dt className="flex items-center gap-1"><Zap size={12} />Livraison prioritaire</dt>
                <dd>+{formatPrice(PRIORITY_SURCHARGE, i18n.language)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>{t('cart.total')}</dt>
              <dd>{formatPrice(grandTotal, i18n.language)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
