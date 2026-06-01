import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, MapPin, Phone, ShoppingBag } from 'lucide-react'
import { useOrder } from '@/hooks/useOrder'
import Button from '@/components/ui/Button'
import { formatPrice, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const STATUSES = ['PENDING', 'PAID', 'ACCEPTED', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED'] as const

export default function OrderTrackingPage() {
  const { t, i18n } = useTranslation()
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const { order, loading } = useOrder(orderNumber)

  if (loading) return (
    <main className="container-edge py-24 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-ocean-500 border-t-transparent" />
    </main>
  )
  if (!order) return (
    <main className="container-edge py-24 text-center">
      <p className="text-lg font-bold">Commande introuvable</p>
      <Link to="/" className="mt-6 inline-block"><Button variant="secondary">{t('common.back')}</Button></Link>
    </main>
  )

  const currentIdx = STATUSES.indexOf(order.status as any)
  const isCancelled = order.status === 'CANCELLED'

  return (
    <main className="container-edge py-8">
      <p className="text-sm font-bold text-ocean-500">{t('order.tracking')}</p>
      <h1 className="mt-1 text-display">{t('order.orderNumber', { number: order.orderNumber })}</h1>
      <p className="mt-1 text-sm text-muted">{formatDate(order.createdAt, i18n.language)}</p>

      <div className="mt-6 card-surface p-6">
        {isCancelled ? (
          <p className="text-center font-bold text-red-500">{t('order.status.CANCELLED')}</p>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1">
              {STATUSES.map((s, i) => {
                const passed = currentIdx >= i
                return (
                  <div key={s} className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                        passed ? 'border-ocean-500 bg-ocean-500 text-white' : 'border-line bg-card text-muted'
                      )}
                    >
                      <CheckCircle2 size={16} />
                    </div>
                    <span className={cn('mt-2 text-[10px] font-bold leading-tight', passed ? 'text-ink' : 'text-muted')}>
                      {t(`order.status.${s}`)}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="relative mt-4 h-1 rounded-full bg-line">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-ocean-500 transition-all duration-500"
                style={{ width: `${Math.max(0, (currentIdx / (STATUSES.length - 1)) * 100)}%` }}
              />
            </div>
          </>
        )}
        {order.estimatedDeliveryAt && !isCancelled && (
          <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface-alt p-4">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-ocean-500" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted">{t('order.estimatedTime')}</p>
                <p className="text-base font-bold">{formatDate(order.estimatedDeliveryAt, i18n.language)}</p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-ocean-500 px-3 py-1 text-xs font-bold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-dot" />
              {t('admin.live')}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 card-surface p-6">
          <h2 className="text-lg font-bold">{t('order.yourOrder')}</h2>
          <ul className="mt-4 divide-y divide-line">
            {order.items?.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{it.quantity} × {it.name}</p>
                  {it.selectedOptions && Object.keys(it.selectedOptions).length > 0 && (
                    <p className="text-xs text-muted">
                      {Object.entries(it.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </p>
                  )}
                </div>
                <p className="font-semibold">{formatPrice(it.price * it.quantity, i18n.language)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">{t('cart.subtotal')}</dt><dd>{formatPrice(order.subtotal, i18n.language)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <dt>{t('cart.discount')}</dt><dd>− {formatPrice(order.discount, i18n.language)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt className="text-muted">{t('cart.delivery')}</dt><dd>{formatPrice(order.deliveryFee, i18n.language)}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>{t('cart.total')}</dt><dd>{formatPrice(order.total, i18n.language)}</dd></div>
          </dl>
        </div>

        <aside className="card-surface p-6 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Restaurant</p>
            <p className="mt-1 font-bold">{order.restaurant?.name}</p>
            {order.restaurant?.phone && (
              <a href={`tel:${order.restaurant.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-ocean-500 hover:underline">
                <Phone size={13} /> {t('order.callRestaurant')}
              </a>
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Livraison</p>
            <p className="mt-1 flex items-start gap-1.5 text-sm">
              <MapPin size={14} className="mt-0.5 shrink-0 text-ocean-500" /> {order.deliveryAddress}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Paiement</p>
            <p className="mt-1 text-sm font-bold">
              {order.paymentMethod === 'CARD' ? 'Carte bancaire' : 'Espèces à la livraison'}
              {order.paymentStatus === 'PAID' && <span className="ml-2 text-emerald-500">· Payée</span>}
            </p>
          </div>
          <Link to="/restaurants">
            <Button variant="dark" fullWidth icon={<ShoppingBag size={14} />}>Commander à nouveau</Button>
          </Link>
        </aside>
      </div>
    </main>
  )
}
