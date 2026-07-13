import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, AlertCircle, ArrowLeft } from 'lucide-react'
import DeliveryCalendar from '@/components/DeliveryCalendar'
import TimeSlotPicker from '@/components/TimeSlotPicker'
import { LogoCB, LogoVisa, LogoMastercard, LogoApplePay, LogoCash } from '@/components/PaymentLogo'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import useAddressStore from '@/store/address.store'
import SumUpPaymentForm from '@/components/SumUpPaymentForm'
import useCartStore from '@/store/cart.store'
import { api } from '@/lib/api'
import Button from '@/components/ui/Button'
import { formatPrice } from '@/lib/format'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'
import { useDeliveryCalculator } from '@/hooks/useDeliveryCalculator'
import { restaurants } from '@/data/restaurants'
import { toast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'


export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const subtotal = useCartStore((s) => s.subtotal())
  const deliveryFee = useCartStore((s) => s.deliveryFee())
  const pickingFee = useCartStore((s) => s.pickingFee())
  const discount = useCartStore((s) => s.discount())
  const total = useCartStore((s) => s.total())
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

  // Sync si Zustand persist rehydrate après le montage du composant
  useEffect(() => {
    if (!address && savedAddress) setAddress(savedAddress)
  }, [savedAddress])
  const [notes, setNotes] = useState('')
  const LOYALTY_FREE_DELIVERY_COST = 200
  const userPoints = user?.loyaltyPoints ?? 0
  const canUsePoints = userPoints >= LOYALTY_FREE_DELIVERY_COST
  const [usePoints, setUsePoints] = useState(false)

  const deliverySlot = useCartStore((s) => s.deliverySlot)
  const deliveryDate = useCartStore((s) => s.deliveryDate)
  const setDeliveryDate = useCartStore((s) => s.setDeliveryDate)
  const setServerFee = useCartStore((s) => s.setServerFee)

  const [takenSlots, setTakenSlots] = useState<string[]>([])
  useEffect(() => {
    if (!deliveryDate) return
    api.orders.takenSlots(deliveryDate)
      .then((r) => setTakenSlots(r.slots))
      .catch(() => setTakenSlots([]))
  }, [deliveryDate])

  const [blockedDates, setBlockedDates] = useState<string[]>([])
  useEffect(() => {
    api.settings.blockedDates()
      .then((r) => setBlockedDates(r.dates.map((d) => d.date)))
      .catch(() => setBlockedDates([]))
  }, [])
  // Si la date déjà sélectionnée vient d'être bloquée (ex: admin ferme le jour pendant que le client est sur la page)
  useEffect(() => {
    if (deliveryDate && blockedDates.includes(deliveryDate)) {
      setDeliveryDate(null)
      useCartStore.getState().setDeliverySlot(null)
    }
  }, [blockedDates, deliveryDate])
  const restaurantId = useCartStore((s) => s.restaurantId)
  const isAuchan = restaurantId === 'auchan-lege'

  // Coordonnées GPS du point de collecte — restaurants.ts ou fallback pour Auchan
  const EXTRA_COORDS: Record<string, { lat: number; lng: number }> = {
    'auchan-lege': { lat: 44.6897, lng: -1.1647 }, // Auchan Lège-Cap-Ferret
  }
  const restaurantCoords =
    restaurants.find((r) => r.id === restaurantId)?.coords ??
    (restaurantId ? EXTRA_COORDS[restaurantId] : undefined)

  // Calcul dynamique : GPS livreur → restaurant → client via OSRM
  const {
    deliveryFee: dynamicFee,
    distanceKm,
    durationMin,
    loading: deliveryLoading,
    error: deliveryError,
  } = useDeliveryCalculator(restaurantCoords, address)

  // Synchronise le résultat du hook dans le store panier
  useEffect(() => {
    if (dynamicFee !== null) setServerFee(dynamicFee)
  }, [dynamicFee, setServerFee])

  const isSpecialOffer = (settings?.deliveryPerKmFee ?? 0.5) === 0

  const CASH_MAX = 30
  const [payment, setPayment] = useState<'card' | 'cash' | 'card_on_delivery'>('card')
  const cashDisabled = total > CASH_MAX
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  useEffect(() => {
    if (cashDisabled && payment === 'cash') {
      setPayment('card')
      setPaymentType('cb')
    }
  }, [cashDisabled, payment])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingOrderNumber, setPendingOrderNumber] = useState<string | null>(null)
  // Le panier est vidé dès la commande créée (avant le paiement carte) — on fige
  // les montants de la commande pour garder un récapitulatif cohérent pendant le paiement.
  const [frozenOrder, setFrozenOrder] = useState<{
    items: typeof items
    subtotal: number
    deliveryFee: number
    serviceFee: number
    discount: number
    total: number
  } | null>(null)
  // Empêche de déclencher plusieurs créations de commande en parallèle
  // pendant que l'utilisateur finit de remplir le formulaire.
  const orderCreationRef = useRef(false)
  // Passe à true dès que la commande est créée avec succès (avant même que le
  // paiement carte soit prêt). Sert à ne JAMAIS afficher "panier vide" une fois
  // la commande passée — le panier se vide dès la création, avant clientSecret.
  const [orderPlaced, setOrderPlaced] = useState(false)
  // submitOrder() réinitialise aussi deliveryDate/deliverySlot dans le store dès
  // la commande créée — on fige ces valeurs pour que le calendrier et le créneau
  // affichés ne redeviennent pas "Requis" pendant l'attente du paiement.
  const [frozenSchedule, setFrozenSchedule] = useState<{ date: string; slot: string } | null>(null)

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

  function handleOrderError(e: any) {
    const code = e?.message
    if (code === 'BELOW_MIN_ORDER') {
      setError(t('checkout.belowMinOrder', { amount: formatPrice(settings?.deliveryMinOrder ?? 0, i18n.language) }))
    } else if (code === 'ORDERS_PAUSED') {
      setError('Les commandes sont temporairement suspendues.')
    } else if (code === 'DATE_BLOCKED') {
      setError('La livraison n\'est pas disponible ce jour-là. Merci de choisir une autre date.')
      setDeliveryDate(null)
      useCartStore.getState().setDeliverySlot(null)
    } else if (code === 'STRIPE_NOT_CONFIGURED' || code === 'SUMUP_NOT_CONFIGURED') {
      setError('Le paiement par carte n\'est pas encore disponible. Veuillez choisir le paiement en espèces.')
    } else if (code === 'NO_RESTAURANT' || code === 'RESTAURANT_NOT_FOUND' || code === 'EMPTY_CART') {
      setError('Votre panier est invalide (ancienne session). Il a été vidé — merci de rajouter vos articles.')
      useCartStore.getState().clearCart()
    } else setError(`${t('common.error')}${code ? ` (${code})` : ''}`)
  }

  const cardFieldsReady = Boolean(
    deliveryDate && deliverySlot && address && name.trim() && phone.trim() && !deliveryLoading && deliveryError !== 'out_of_zone'
  )

  // Carte : dès que le formulaire est complet, on crée la commande en arrière-plan
  // et on ouvre le module de paiement SumUp — sans attendre de clic sur un bouton.
  useEffect(() => {
    if (payment !== 'card') return
    if (!cardFieldsReady) return
    if (clientSecret || orderCreationRef.current) return

    // Capturés maintenant : submitOrder() va réinitialiser deliveryDate/deliverySlot
    // dans le store dès la commande créée avec succès.
    const scheduledDate = deliveryDate
    const scheduledSlot = deliverySlot

    const timer = setTimeout(async () => {
      orderCreationRef.current = true
      setSubmitting(true)
      setError(null)

      // La base de données peut mettre un court instant à répondre après une
      // période d'inactivité (cold start) — on retente une fois en silence
      // avant d'afficher quoi que ce soit à l'utilisateur.
      // IMPORTANT : submitOrder() n'est appelé qu'UNE seule fois — le retenter
      // recréerait une commande en double si l'échec ne survient qu'à l'étape
      // suivante (préparation du paiement SumUp), avec un panier déjà vidé.
      const MAX_ATTEMPTS = 3
      let createdOrder: Awaited<ReturnType<typeof submitOrder>> | null = null

      for (let attempt = 1; attempt <= MAX_ATTEMPTS && !createdOrder; attempt++) {
        try {
          createdOrder = await submitOrder({
            customerName: name,
            customerPhone: phone,
            customerEmail: email || undefined,
            deliveryAddress: address,
            deliveryDistanceKm: distanceKm ?? 2,
            deliveryDurationMin: durationMin ?? 6,
            usePoints: usePoints && canUsePoints,
            paymentMethod: 'card',
            notes: notes || undefined,
            deliveryDate: scheduledDate ?? undefined,
            deliverySlot: scheduledSlot ?? undefined,
          })
        } catch (e: any) {
          const code = e?.message
          const isDefinitive = ['BELOW_MIN_ORDER', 'ORDERS_PAUSED', 'DATE_BLOCKED', 'NO_RESTAURANT', 'RESTAURANT_NOT_FOUND', 'EMPTY_CART'].includes(code)
          if (isDefinitive || attempt === MAX_ATTEMPTS) {
            handleOrderError(e)
            orderCreationRef.current = false
            setSubmitting(false)
            return
          }
          await new Promise((r) => setTimeout(r, 800 * attempt))
        }
      }

      if (!createdOrder) { setSubmitting(false); return }

      setOrderPlaced(true)
      if (scheduledDate && scheduledSlot) setFrozenSchedule({ date: scheduledDate, slot: scheduledSlot })
      if (address) setSavedAddress(address)
      setFrozenOrder({
        items: createdOrder.items as typeof items,
        subtotal: createdOrder.subtotal,
        deliveryFee: createdOrder.deliveryFee,
        serviceFee: createdOrder.serviceFee,
        discount: createdOrder.discount,
        total: createdOrder.total,
      })

      // La commande existe déjà à ce stade : on retente uniquement la préparation
      // du paiement SumUp, sans jamais recréer de commande.
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const { checkoutId } = await api.sumup.checkout(createdOrder.orderNumber)
          setClientSecret(checkoutId)
          setPendingOrderNumber(createdOrder.orderNumber)
          break
        } catch (e: any) {
          const code = e?.message
          const isDefinitive = code === 'SUMUP_NOT_CONFIGURED' || code === 'STRIPE_NOT_CONFIGURED'
          if (isDefinitive || attempt === MAX_ATTEMPTS) {
            // La commande a bien été créée — on informe l'utilisateur sans jamais
            // reparler de panier vide, et on le renvoie vers le suivi de sa commande.
            toast.success(`Commande ${createdOrder.orderNumber} enregistrée !`)
            setError('Le paiement en ligne n\'a pas pu être préparé. Votre commande est bien enregistrée — contactez-nous ou réessayez le paiement depuis le suivi de commande.')
            navigate(`/suivi/${createdOrder.orderNumber}`)
            return
          }
          await new Promise((r) => setTimeout(r, 800 * attempt))
        }
      }
      setSubmitting(false)
    }, 600)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, cardFieldsReady, clientSecret, name, phone, email, address, notes, deliveryDate, deliverySlot])

  // Ne jamais afficher "panier vide" une fois qu'une commande a été passée :
  // submitOrder vide le panier dès la création de la commande, bien avant que
  // clientSecret (paiement carte prêt) ne soit disponible — se fier à clientSecret
  // seul créait une fenêtre où "panier vide" s'affichait par erreur juste après
  // une commande réussie, laissant croire à un échec (et poussant à recommencer,
  // créant des commandes en double pour le même créneau).
  // IMPORTANT : ce contrôle doit rester après TOUS les hooks ci-dessus (règle des Hooks React) —
  // le placer avant provoquait un crash (React error #300) au moment où le panier se vide.
  if (items.length === 0 && !clientSecret && !orderPlaced) {
    return (
      <main className="container-edge py-16 text-center">
        <p className="text-lg font-bold">{t('cart.empty')}</p>
        <Button variant="dark" onClick={() => navigate('/restaurants')} className="mt-4">{t('nav.restaurants')}</Button>
      </main>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Le paiement carte en ligne se déclenche automatiquement (voir useEffect ci-dessus) ;
    // ce bouton ne sert plus qu'aux paiements réglés à la livraison (espèces ou carte).
    if (payment !== 'cash' && payment !== 'card_on_delivery') return
    if (!deliverySlot) {
      setError('Veuillez choisir un créneau horaire.')
      return
    }
    if (!deliveryDate) {
      setError('Veuillez choisir une date de livraison.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const order = await submitOrder({
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        deliveryAddress: address,
        deliveryDistanceKm: distanceKm ?? 2,
        deliveryDurationMin: durationMin ?? 6,
        usePoints: usePoints && canUsePoints,
        paymentMethod: payment,
        notes: notes || undefined,
        deliveryDate: deliveryDate ?? undefined,
        deliverySlot: deliverySlot ?? undefined,
      })

      if (address) setSavedAddress(address)
      toast.success(`Commande ${order.orderNumber} confirmée !`)
      navigate(`/suivi/${order.orderNumber}`)
    } catch (e: any) {
      handleOrderError(e)
    } finally { setSubmitting(false) }
  }

  function onPaymentSuccess() {
    toast.success(`Commande ${pendingOrderNumber} confirmée !`)
    navigate(`/suivi/${pendingOrderNumber}`)
  }

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

          {/* Adresse de livraison */}
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
              {deliveryError === 'out_of_zone' && !deliveryLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0" />
                  Nous ne livrons pas dans ce secteur. Nous livrons sur la presqu'île de Cap Ferret jusqu'à L'Herbe et Le Canon.
                </div>
              )}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('checkout.notes')} rows={2} className="input-flat" />
            </div>
          </div>

          {/* Date de livraison — une fois la commande passée, on affiche la date/heure
              figées : le store les réinitialise dès la création de la commande. */}
          {(() => {
            const effectiveDate = orderPlaced ? (frozenSchedule?.date ?? deliveryDate) : deliveryDate
            const effectiveSlot = orderPlaced ? (frozenSchedule?.slot ?? deliverySlot) : deliverySlot
            return (
              <>
                <div className="card-surface p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Date de livraison</h2>
                    {!effectiveDate && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">Requis</span>
                    )}
                  </div>
                  <DeliveryCalendar
                    selected={effectiveDate}
                    onSelect={(d) => { if (!orderPlaced) { setDeliveryDate(d); useCartStore.getState().setDeliverySlot(null) } }}
                    selectedSlot={effectiveSlot}
                    blockedDates={blockedDates}
                  />
                </div>

                {/* Créneau horaire (visible après avoir choisi une date) */}
                {effectiveDate && (
                  <div className="card-surface p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-bold">Heure de livraison</h2>
                      {!effectiveSlot && (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-950/40 dark:text-red-400">Requis</span>
                      )}
                    </div>
                    <TimeSlotPicker
                      selected={effectiveSlot}
                      onSelect={(s) => { if (!orderPlaced) useCartStore.getState().setDeliverySlot(s) }}
                      deliveryDate={effectiveDate}
                      windowStart={settings?.deliveryWindowStart}
                      windowEnd={settings?.deliveryWindowEnd}
                      intervalMin={settings?.deliverySlotIntervalMin}
                      takenSlots={takenSlots}
                    />
                  </div>
                )}
              </>
            )
          })()}

          {/* Moyen de paiement — placé avant les coordonnées : le paiement carte se
              déclenche automatiquement dès que tous les champs (dont le téléphone)
              sont remplis, il faut donc pouvoir choisir un autre mode avant d'y arriver. */}
          <div className="card-surface overflow-hidden">
            <p className="px-5 pt-5 pb-3 text-lg font-bold">Moyen de paiement</p>

            <button
              type="button"
              disabled={Boolean(clientSecret)}
              onClick={() => { setPayment('card'); setPaymentType(paymentType === 'cash' ? 'cb' : paymentType) }}
              className={cn(
                'flex w-full items-center gap-3 border-t border-line px-5 py-4 text-left transition-colors',
                payment === 'card' ? 'bg-surface-alt' : 'hover:bg-surface-alt/50',
                clientSecret && 'cursor-not-allowed'
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
                <p className="text-xs text-muted">SumUp · sécurisé</p>
              </div>
              {payment === 'card' && !clientSecret && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setPaymentModalOpen(true) }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setPaymentModalOpen(true) } }}
                  className="shrink-0 rounded-xl border border-line bg-card px-4 py-2 text-sm font-bold text-ink hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  Modifier
                </span>
              )}
            </button>

            <button
              type="button"
              disabled={Boolean(clientSecret)}
              onClick={() => { setPayment('card_on_delivery'); setPaymentType('cb') }}
              className={cn(
                'flex w-full items-center gap-3 border-t border-line px-5 py-4 text-left transition-colors',
                clientSecret ? 'opacity-40 cursor-not-allowed' : payment === 'card_on_delivery' ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
              )}
            >
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                payment === 'card_on_delivery' ? 'border-ink bg-ink' : 'border-muted'
              )}>
                {payment === 'card_on_delivery' && <span className="h-2 w-2 rounded-full bg-surface" />}
              </span>
              <LogoCB />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">Carte bancaire à la livraison</p>
                <p className="text-xs text-muted">Le livreur passera le terminal sur place</p>
              </div>
            </button>

            <button
              type="button"
              disabled={cashDisabled || Boolean(clientSecret)}
              onClick={() => { if (!cashDisabled) { setPayment('cash'); setPaymentType('cash') } }}
              className={cn(
                'flex w-full items-center gap-3 border-t border-line px-5 py-4 text-left transition-colors',
                (cashDisabled || clientSecret) ? 'opacity-40 cursor-not-allowed' : payment === 'cash' ? 'bg-surface-alt' : 'hover:bg-surface-alt/50'
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
                <p className="text-xs text-muted">
                  {cashDisabled ? `Non disponible au-delà de ${CASH_MAX} €` : 'Payer la totalité au livreur'}
                </p>
              </div>
            </button>
          </div>

          {/* Coordonnées */}
          <div className="card-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">{t('checkout.contact')}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={t('checkout.name')} className="input-flat" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={t('checkout.phone')} className="input-flat" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={t('checkout.email')} className="input-flat sm:col-span-2" />
            </div>
          </div>

          {/* Carte : le module SumUp est affiché directement, dès que le formulaire
              est complet — pas besoin de cliquer sur un bouton pour le faire apparaître. */}
          {payment === 'card' && (
            <div className="card-surface p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-bold">Paiement sécurisé</h2>
              {clientSecret && pendingOrderNumber ? (
                <SumUpPaymentForm
                  checkoutId={clientSecret}
                  orderNumber={pendingOrderNumber}
                  onSuccess={onPaymentSuccess}
                  onError={(msg) => setError(msg)}
                />
              ) : (
                <div className="flex items-center gap-2 py-6 text-sm text-muted">
                  <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  {cardFieldsReady
                    ? 'Préparation du paiement…'
                    : 'Complétez l\'adresse, la date, le créneau et vos coordonnées pour afficher le paiement par carte.'}
                </div>
              )}
            </div>
          )}

          {/* Paiement à la livraison (espèces ou carte) : validation manuelle par bouton */}
          {(payment === 'cash' || payment === 'card_on_delivery') && (
            <Button
              type="submit"
              variant="dark"
              size="lg"
              fullWidth
              disabled={submitting || deliveryLoading || deliveryError === 'out_of_zone'}
            >
              {submitting
                ? t('checkout.paying')
                : deliveryLoading
                ? 'Calcul des frais de livraison…'
                : `${t('checkout.placeOrder')} · ${formatPrice(total, i18n.language)}`}
            </Button>
          )}

          {/* Modal paiement */}
          {paymentModalOpen && (
            <div className="fixed inset-0 z-50 flex flex-col bg-surface dark:bg-card overflow-hidden">
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
                        <span className="shrink-0 h-[52px] w-[52px] overflow-hidden rounded-xl">{m.logo}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-ink">{m.label}</p>
                          {m.sub && <p className="text-sm text-muted">{m.sub}</p>}
                        </div>
                        <span className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          paymentType === m.id ? 'border-ink bg-ink' : 'border-muted bg-transparent'
                        )}>
                          {paymentType === m.id && <span className="h-2.5 w-2.5 rounded-full bg-surface" />}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <button type="button" className="flex w-full items-center gap-5 px-6 py-5 hover:bg-surface-alt transition-colors border-t border-line">
                  <span className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-surface-alt text-2xl font-light text-ink">+</span>
                  <p className="text-base font-semibold text-ink">Ajoutez un moyen de paiement</p>
                </button>
              </div>

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

        {/* Récapitulatif — une fois la commande créée (étape paiement carte), on fige
            les montants sur ceux de la commande : le panier est déjà vidé à ce stade. */}
        <aside className="lg:sticky lg:top-24 h-fit card-surface p-6">
          <h2 className="text-lg font-bold">{t('order.yourOrder')}</h2>
          <ul className="mt-4 max-h-64 overflow-y-auto divide-y divide-line">
            {(frozenOrder?.items ?? items).map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">{it.quantity} × {it.name}</p>
                </div>
                <p className="font-semibold">{formatPrice(it.price * it.quantity, i18n.language)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            {!isSpecialOffer && (
              <div className="flex justify-between">
                <dt className="text-muted">{t('cart.subtotal')}</dt>
                <dd>{formatPrice(frozenOrder?.subtotal ?? subtotal, i18n.language)}</dd>
              </div>
            )}
            {appliedPromo && (frozenOrder?.discount ?? discount) > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <dt>{t('cart.discount')} ({appliedPromo.code})</dt>
                <dd>− {formatPrice(frozenOrder?.discount ?? discount, i18n.language)}</dd>
              </div>
            )}
            {!frozenOrder && user && canUsePoints && (
              <label className="flex items-center gap-2 rounded-lg bg-surface-alt px-3 py-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="h-4 w-4 accent-ocean"
                />
                <span>Utiliser mes <strong>{userPoints} points</strong> pour la livraison offerte (200 pts)</span>
              </label>
            )}
            {/* ── Livraison détaillée ── */}
            <div className="space-y-1.5">
              {!frozenOrder && deliveryLoading && (
                <div className="flex items-center gap-2 rounded-lg bg-surface-alt px-3 py-2.5 text-xs text-muted">
                  <svg className="h-3.5 w-3.5 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  <span>Calcul du trajet en cours…</span>
                </div>
              )}

              {!frozenOrder && deliveryError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
                  <AlertCircle size={13} className="shrink-0" /> {deliveryError}
                </div>
              )}

              {!frozenOrder && distanceKm !== null && !deliveryLoading && !isSpecialOffer && (
                <div className="rounded-lg bg-surface-alt px-3 py-2.5 text-xs space-y-1 text-muted">
                  <div className="flex justify-between">
                    <span>Distance du trajet</span>
                    <span className="font-medium text-ink">{distanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps estimé</span>
                    <span className="font-medium text-ink">~{durationMin} min</span>
                  </div>
                  <div className="flex justify-between pt-0.5 border-t border-line">
                    <span>Frais de livraison <span className="opacity-70">({formatPrice(settings?.deliveryBaseFee ?? 3, i18n.language)} + {durationMin} min × {formatPrice(settings?.deliveryPerKmFee ?? 0.5, i18n.language)})</span></span>
                    <span className="font-medium text-ink">{formatPrice(deliveryFee, i18n.language)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-muted">
                  Livraison
                  {!frozenOrder && isSpecialOffer && !(usePoints && canUsePoints) && <span className="text-emerald-600 dark:text-emerald-400"> — offre spéciale</span>}
                  {!frozenOrder && usePoints && canUsePoints && <span className="text-emerald-600 dark:text-emerald-400"> (offerte)</span>}
                </dt>
                <dd>
                  {!frozenOrder && deliveryLoading
                    ? <span className="text-muted text-xs">…</span>
                    : formatPrice(frozenOrder?.deliveryFee ?? (usePoints && canUsePoints ? 0 : deliveryFee), i18n.language)}
                </dd>
              </div>
            </div>
            {!isSpecialOffer && (
              <div className="flex justify-between">
                <dt className="text-muted">
                  {isAuchan ? <>Commission <span className="text-[10px]">(15 %)</span></> : 'Frais de service'}
                </dt>
                <dd>{formatPrice(frozenOrder?.serviceFee ?? pickingFee, i18n.language)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
              <dt>{t('cart.total')}</dt>
              <dd>{formatPrice(frozenOrder?.total ?? (usePoints && canUsePoints ? total - deliveryFee : total), i18n.language)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
