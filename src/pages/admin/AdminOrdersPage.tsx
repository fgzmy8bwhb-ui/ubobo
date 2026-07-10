import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Phone, MapPin, RefreshCw, Calendar } from 'lucide-react'
import { api, type ApiOrder } from '@/lib/api'
import { formatPrice, formatRelativeTime } from '@/lib/format'
import { toast } from '@/hooks/useToast'

const ALL_STATUSES = [
  'PENDING',
  'PAID',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
] as const

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-sun/15 text-sun',
  PAID: 'bg-ocean-light text-ocean',
  ACCEPTED: 'bg-ocean-light text-ocean',
  PREPARING: 'bg-sun/15 text-sun',
  READY: 'bg-pine-light text-pine',
  ON_THE_WAY: 'bg-pine-light text-pine',
  DELIVERED: 'bg-pine text-white',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const { t, i18n } = useTranslation()
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  async function refresh() {
    setLoading(true)
    try {
      const { orders } = await api.orders.listAll(filter === 'all' ? undefined : filter)
      setOrders(orders)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [filter])

  async function setStatus(id: string, status: string) {
    try {
      await api.orders.setStatus(id, status)
      void refresh()
      toast.success('Statut mis à jour')
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.orders')}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-card px-3 text-xs font-semibold text-ink hover:bg-surface-alt"
          >
            <RefreshCw size={12} /> Actualiser
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', ...ALL_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
              filter === s ? 'bg-ocean text-white' : 'border border-line bg-card text-ink hover:bg-surface-alt',
            ].join(' ')}
          >
            {s === 'all' ? t('search.all') : t(`order.status.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-card p-10 text-center text-sm text-muted">
          {t('admin.noOrders')}
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <article key={o.id} className="card-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{o.orderNumber}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[o.status] ?? ''}`}>
                      {t(`order.status.${o.status}`)}
                    </span>
                    {o.paymentMethod === 'CASH' && (
                      <span className="rounded-full bg-sand text-deep px-2.5 py-0.5 text-xs font-bold">Cash</span>
                    )}
                    {o.paymentMethod === 'CARD_ON_DELIVERY' && (
                      <span className="rounded-full bg-sand text-deep px-2.5 py-0.5 text-xs font-bold">CB à la livraison</span>
                    )}
                    {o.paymentStatus === 'PAID' && (
                      <span className="rounded-full bg-pine text-white px-2.5 py-0.5 text-xs font-bold">Payée</span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formatRelativeTime(o.createdAt, i18n.language)} · {o.restaurant?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-ocean">{formatPrice(o.total, i18n.language)}</p>
                  <p className="text-xs text-muted">{o.items?.reduce((s, i) => s + i.quantity, 0)} articles</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Client</p>
                  <p className="mt-1 font-semibold">{o.customerName}</p>
                  <a href={`tel:${o.customerPhone}`} className="mt-1 inline-flex items-center gap-1 text-xs text-ocean hover:underline">
                    <Phone size={11} /> {o.customerPhone}
                  </a>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Adresse</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-ocean" />
                    {o.deliveryAddress}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Livraison souhaitée</p>
                  <p className="mt-1 flex items-start gap-1.5 text-sm">
                    <Calendar size={13} className="mt-0.5 shrink-0 text-ocean" />
                    {o.deliveryDate
                      ? `${new Date(`${o.deliveryDate}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}${o.deliverySlot ? ` · ${o.deliverySlot}` : ''}`
                      : <span className="text-muted">Non précisé</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Détail</p>
                  <ul className="mt-1 text-xs text-ink">
                    {o.items?.slice(0, 4).map((it) => (
                      <li key={it.id}>{it.quantity} × {it.name}</li>
                    ))}
                    {(o.items?.length ?? 0) > 4 && (
                      <li className="text-muted">+ {(o.items?.length ?? 0) - 4} autres</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {ALL_STATUSES.filter((s) => s !== o.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(o.id, s)}
                    className="rounded-md border border-line bg-card px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-ocean hover:text-white hover:border-ocean"
                  >
                    → {t(`order.status.${s}`)}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
