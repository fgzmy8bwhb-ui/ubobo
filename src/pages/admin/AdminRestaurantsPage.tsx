import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { api, request, type ApiRestaurant } from '@/lib/api'
import { toast } from '@/hooks/useToast'

const STATUSES = ['ACTIVE', 'COMING_SOON', 'PARTNER_PENDING', 'PAUSED'] as const

export default function AdminRestaurantsPage() {
  const { t } = useTranslation()
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    const { restaurants } = await api.restaurants.list()
    setRestaurants(restaurants)
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  async function updateStatus(slug: string, status: string) {
    try {
      await request<{ restaurant: ApiRestaurant }>(`/api/restaurants/${slug}`, {
        method: 'PATCH',
        body: { status },
      })
      toast.success('Restaurant mis à jour')
      void refresh()
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.restaurants')}</h1>
        <p className="mt-1 text-sm text-muted">Gérez l'état et la disponibilité des restaurants partenaires.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3">Restaurant</th>
                <th className="px-5 py-3">Catégorie</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Note</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {restaurants.map((r) => (
                <tr key={r.id} className="hover:bg-surface-alt/40">
                  <td className="px-5 py-3">
                    <p className="font-bold">{r.name}</p>
                    <p className="text-xs text-muted">{r.address}</p>
                  </td>
                  <td className="px-5 py-3 text-muted capitalize">{r.category}</td>
                  <td className="px-5 py-3">
                    <select
                      value={r.status.toUpperCase()}
                      onChange={(e) => updateStatus(r.id, e.target.value)}
                      className="rounded-md border border-line bg-card px-2 py-1 text-xs font-semibold"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {r.averageRating ? `${r.averageRating.toFixed(1)} (${r.reviewCount})` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <a
                      href={`/restaurant/${r.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ocean hover:underline"
                    >
                      <Pencil size={12} /> Voir
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
