import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp, ShoppingBag, Wallet, Users, Store, Clock, RefreshCw, Package } from 'lucide-react'
import { api, type AdminStats } from '@/lib/api'
import { useTheme } from '@/hooks/useTheme'

function AuchanScrapeCard() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [productCount, setProductCount] = useState<{ total: number; withPrice: number } | null>(null)

  useEffect(() => {
    api.admin.auchanProductCount()
      .then(setProductCount)
      .catch(() => {})
  }, [])

  async function handleScrape() {
    if (status === 'running') return
    setStatus('running')
    try {
      await api.admin.auchanScrape()
      setStatus('done')
      // Refresh count after a short delay
      setTimeout(() => {
        api.admin.auchanProductCount().then(setProductCount).catch(() => {})
        setStatus('idle')
      }, 4000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const btnLabel = {
    idle: 'Lancer le scrape',
    running: 'Scrape en cours…',
    done: 'Scrape lancé ✓',
    error: 'Erreur — réessayer',
  }[status]

  const btnColor = {
    idle: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    running: 'bg-surface-alt text-muted cursor-not-allowed',
    done: 'bg-emerald-100 text-emerald-700 cursor-default',
    error: 'bg-red-100 text-red-600',
  }[status]

  return (
    <div className="card-surface p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">Catalogue Auchan</p>
          <h2 className="text-lg font-bold">Produits courses</h2>
        </div>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
          <Package size={14} />
        </span>
      </div>

      {productCount && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface-alt px-4 py-3">
            <p className="text-2xl font-bold">{productCount.total.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-muted mt-0.5">produits en base</p>
          </div>
          <div className="rounded-xl bg-surface-alt px-4 py-3">
            <p className="text-2xl font-bold text-emerald-600">{productCount.withPrice?.toLocaleString('fr-FR') ?? '—'}</p>
            <p className="text-xs text-muted mt-0.5">avec prix</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted leading-relaxed">
        Scrape les produits Auchan (Lège-Cap-Ferret) et met à jour la base. Le scrape tourne en arrière-plan — compte ~15 min pour toutes les catégories.
      </p>

      <button
        onClick={handleScrape}
        disabled={status === 'running' || status === 'done'}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${btnColor}`}
      >
        <RefreshCw size={14} className={status === 'running' ? 'animate-spin' : ''} />
        {btnLabel}
      </button>

      {status === 'done' && (
        <p className="text-xs text-emerald-600 text-center -mt-2">
          Scrape lancé en arrière-plan. Les produits apparaîtront progressivement.
        </p>
      )}
    </div>
  )
}

function KpiCard({
  label, value, icon: Icon, hint, accent,
}: { label: string; value: string; icon: any; hint?: string; accent?: 'ocean' | 'sun' | 'pine' }) {
  const bg = accent === 'sun' ? 'bg-sun/15 text-sun' : accent === 'pine' ? 'bg-pine-light text-pine' : 'bg-ocean-light text-ocean'
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-md ${bg}`}>
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { resolved } = useTheme()

  useEffect(() => {
    api.admin.stats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg bg-card border border-line" />
        ))}
      </div>
    )
  }

  const currency = (n: number) => new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard')}</h1>
        <p className="mt-1 text-sm text-muted">Vue d'ensemble en temps réel de la plateforme UBOBO.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t('admin.kpis.todayOrders')}
          value={String(stats.counts.todayOrders)}
          icon={ShoppingBag}
          hint={`${stats.counts.pendingOrders} en cours`}
          accent="ocean"
        />
        <KpiCard
          label={t('admin.kpis.todayRevenue')}
          value={currency(stats.revenue.today)}
          icon={Wallet}
          hint={`Mois : ${currency(stats.revenue.month)}`}
          accent="pine"
        />
        <KpiCard
          label={t('admin.kpis.monthRevenue')}
          value={currency(stats.revenue.month)}
          icon={TrendingUp}
          hint={`Total : ${currency(stats.revenue.total)}`}
          accent="sun"
        />
        <KpiCard
          label={t('admin.kpis.users')}
          value={String(stats.counts.usersCount)}
          icon={Users}
          hint={`${stats.counts.waitlistCount} en liste d'attente`}
        />
      </div>

      {/* Chart */}
      <div className="card-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{t('admin.revenueChart')}</h2>
            <p className="text-xs text-muted">Mise à jour automatique à chaque commande</p>
          </div>
          <span className="rounded-full bg-pine/10 px-3 py-1 text-xs font-bold text-pine">
            CA cumulé : {currency(stats.revenue.month)}
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.series}>
              <CartesianGrid strokeDasharray="3 3" stroke={resolved === 'dark' ? '#26384890' : '#E5E7EB'} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: resolved === 'dark' ? '#9CA3AF' : '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: resolved === 'dark' ? '#9CA3AF' : '#6B7280' }} />
              <Tooltip
                cursor={{ fill: resolved === 'dark' ? '#26384850' : '#E0F4F940' }}
                contentStyle={{
                  background: resolved === 'dark' ? '#162432' : 'white',
                  border: '1px solid ' + (resolved === 'dark' ? '#263848' : '#E5E7EB'),
                  borderRadius: 8,
                  color: resolved === 'dark' ? '#F0F0EB' : '#1A1A1A',
                }}
                formatter={(v: any, n: string) => (n === 'revenue' ? currency(Number(v)) : v)}
              />
              <Bar dataKey="revenue" fill="#0A6E8A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Auchan scrape */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AuchanScrapeCard />
        </div>
      </div>

      {/* Top restaurants + secondary KPIs */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">{t('admin.topRestaurants')}</h2>
          {stats.topRestaurants.length === 0 ? (
            <p className="text-sm text-muted">Aucune commande ce mois.</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.topRestaurants.map((r, i) => (
                <li key={i} className="flex items-center gap-4 py-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean-light text-sm font-bold text-ocean">
                    {i + 1}
                  </span>
                  <p className="flex-1 font-semibold">{r.name}</p>
                  <span className="text-xs text-muted">{r.orders} cmd</span>
                  <span className="w-24 text-right font-bold text-ink">{currency(r.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-4">
          <KpiCard
            label={t('admin.kpis.activeRestaurants')}
            value={String(stats.counts.activeRestaurants)}
            icon={Store}
            hint={`${stats.counts.pendingRestaurants} en attente`}
          />
          <KpiCard
            label={t('admin.kpis.pending')}
            value={String(stats.counts.pendingOrders)}
            icon={Clock}
            accent="sun"
            hint="Commandes non livrées"
          />
        </div>
      </div>
    </div>
  )
}
