import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { request } from '@/lib/api'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'

interface Promo {
  id: string
  code: string
  title: string
  description?: string
  type: 'PERCENT' | 'AMOUNT' | 'FREE_DELIVERY'
  value: number
  minSubtotal: number
  isActive: boolean
  uses: number
  maxUses?: number | null
}

export default function AdminPromotionsPage() {
  const { t } = useTranslation()
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ code: '', title: '', type: 'PERCENT' as const, value: 10, minSubtotal: 0 })

  async function refresh() {
    setLoading(true)
    const data = await request<{ promotions: Promo[] }>('/api/promotions/admin')
    setPromos(data.promotions)
    setLoading(false)
  }

  useEffect(() => { void refresh() }, [])

  async function create() {
    try {
      await request('/api/promotions', { method: 'POST', body: form })
      toast.success('Promotion créée')
      setForm({ code: '', title: '', type: 'PERCENT', value: 10, minSubtotal: 0 })
      setCreating(false)
      void refresh()
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette promotion ?')) return
    await request(`/api/promotions/${id}`, { method: 'DELETE' })
    void refresh()
  }

  async function toggle(p: Promo) {
    await request(`/api/promotions/${p.id}`, { method: 'PATCH', body: { isActive: !p.isActive } })
    void refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.promotions')}</h1>
          <p className="mt-1 text-sm text-muted">Codes promo et bannières affichées en haut des restaurants.</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setCreating((v) => !v)}>
          Nouvelle promo
        </Button>
      </div>

      {creating && (
        <div className="card-surface p-6 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold">Code</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Titre</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="input-base">
                <option value="PERCENT">Pourcentage</option>
                <option value="AMOUNT">Montant fixe</option>
                <option value="FREE_DELIVERY">Livraison offerte</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Valeur</label>
              <input type="number" min="0" step="0.5" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="input-base" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Sous-total minimum (€)</label>
              <input type="number" min="0" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: Number(e.target.value) })} className="input-base" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Annuler</Button>
            <Button size="sm" onClick={create} disabled={!form.code || !form.title}>Créer</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">{t('common.loading')}</p>
      ) : (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-left text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Valeur</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Actif</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-surface-alt/40">
                  <td className="px-4 py-3"><code className="rounded bg-ocean-light px-2 py-0.5 font-bold text-ocean">{p.code}</code></td>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 text-muted">{p.type}</td>
                  <td className="px-4 py-3">{p.type === 'PERCENT' ? `${p.value}%` : p.type === 'AMOUNT' ? `${p.value}€` : '—'}</td>
                  <td className="px-4 py-3 text-muted">{p.uses}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={p.isActive} onChange={() => toggle(p)} className="h-4 w-4 accent-ocean" />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </button>
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
