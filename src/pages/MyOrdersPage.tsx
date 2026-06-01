import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Package } from 'lucide-react'
import { api, type ApiOrder } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { formatPrice, formatDate } from '@/lib/format'

export default function MyOrdersPage() {
  const { t, i18n } = useTranslation()
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    api.orders.listMine().then((res) => setOrders(res.orders)).finally(() => setLoading(false))
  }, [user])

  if (!ready) return <main className="container-edge py-16 text-center text-muted">{t('common.loading')}</main>

  if (!user) {
    return (
      <main className="container-edge py-24 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt">
          <Package size={28} className="text-muted" />
        </div>
        <h1 className="mt-6 text-display">{t('nav.orders')}</h1>
        <p className="mt-2 text-muted">{t('favorites.loginRequired')}</p>
        <Link to="/connexion" className="mt-6 inline-block">
          <Button variant="dark">{t('nav.login')}</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className="container-edge py-8">
      <h1 className="text-display">{t('nav.orders')}</h1>

      {loading ? (
        <p className="mt-8 text-muted">{t('common.loading')}</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line bg-card p-10 text-center text-muted">
          Aucune commande passée pour l'instant.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/suivi/${o.orderNumber}`} className="card-surface flex flex-wrap items-center gap-4 p-5 transition-shadow hover:shadow-lift">
                <div>
                  <p className="font-bold">{o.orderNumber}</p>
                  <p className="text-xs text-muted">{formatDate(o.createdAt, i18n.language)}</p>
                </div>
                <div className="flex-1 text-sm">{o.restaurant?.name ?? '—'}</div>
                <span className="rounded-full bg-surface-alt px-3 py-1 text-xs font-bold text-ink">
                  {t(`order.status.${o.status}`)}
                </span>
                <span className="font-bold">{formatPrice(o.total, i18n.language)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
