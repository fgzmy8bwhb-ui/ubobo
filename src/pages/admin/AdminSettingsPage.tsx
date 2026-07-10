import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarOff, Save, Truck, X } from 'lucide-react'
import { api, type AppSettings, type BlockedDate } from '@/lib/api'
import { Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import { useSettings } from '@/hooks/useSettings'

export default function AdminSettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const setLocal = useSettings((s) => s.setLocal)

  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [newBlockedDate, setNewBlockedDate] = useState('')
  const [newBlockedReason, setNewBlockedReason] = useState('')

  function loadBlockedDates() {
    api.settings.blockedDates().then(({ dates }) => setBlockedDates(dates))
  }

  async function addBlockedDate() {
    if (!newBlockedDate) return
    try {
      await api.settings.blockDate(newBlockedDate, newBlockedReason || undefined)
      setNewBlockedDate('')
      setNewBlockedReason('')
      loadBlockedDates()
      toast.success('Jour fermé ajouté')
    } catch {
      toast.error(t('common.error'))
    }
  }

  async function removeBlockedDate(date: string) {
    try {
      await api.settings.unblockDate(date)
      loadBlockedDates()
    } catch {
      toast.error(t('common.error'))
    }
  }

  useEffect(() => {
    api.settings.get().then(({ settings }) => setSettings(settings))
    loadBlockedDates()
  }, [])

  if (!settings) return <p className="text-sm text-muted">{t('common.loading')}</p>

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s))
  }

  async function save() {
    if (!settings) return
    setSaving(true)
    try {
      await api.settings.update(settings)
      setLocal(settings)
      toast.success(t('admin.saved'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.settingsTitle')}</h1>
        <p className="mt-1 text-sm text-muted">
          Ces paramètres sont la <strong>source unique de vérité</strong> pour la tarification livraison.
          Aucune valeur n'est codée en dur dans l'application.
        </p>
      </div>

      <section className="card-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Truck size={16} className="text-ocean" />
          <h2 className="text-lg font-bold">{t('admin.deliverySettings')}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('admin.baseFee')} (€)</label>
            <input
              type="number" step="0.5" min="0"
              value={settings.deliveryBaseFee}
              onChange={(e) => update('deliveryBaseFee', Number(e.target.value))}
              className="input-base"
            />
            <p className="mt-1 text-xs text-muted">Tarif de base, quelle que soit la durée du trajet.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Frais par minute de trajet (€)</label>
            <input
              type="number" step="0.1" min="0"
              value={settings.deliveryPerKmFee}
              onChange={(e) => update('deliveryPerKmFee', Number(e.target.value))}
              className="input-base"
            />
            <p className="mt-1 text-xs text-muted">Ajout par minute de trajet estimée.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('admin.freeAbove')} (€)</label>
            <input
              type="number" step="1" min="0"
              value={settings.deliveryFreeAbove ?? ''}
              onChange={(e) => update('deliveryFreeAbove', e.target.value === '' ? null : Number(e.target.value))}
              className="input-base"
              placeholder="Vide = jamais offerte"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('admin.minOrder')} (€)</label>
            <input
              type="number" step="1" min="0"
              value={settings.deliveryMinOrder}
              onChange={(e) => update('deliveryMinOrder', Number(e.target.value))}
              className="input-base"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">{t('admin.maxDistance')}</label>
            <input
              type="number" step="0.5" min="0.5"
              value={settings.deliveryMaxDistanceKm}
              onChange={(e) => update('deliveryMaxDistanceKm', Number(e.target.value))}
              className="input-base"
            />
          </div>
        </div>
      </section>

      <section className="card-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarOff size={16} className="text-ocean" />
          <h2 className="text-lg font-bold">Jours fermés</h2>
        </div>
        <p className="text-xs text-muted">Aucun créneau de livraison ne sera proposé aux clients pour ces dates.</p>

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-semibold">Date</label>
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-semibold">Raison (optionnel)</label>
            <input
              type="text"
              value={newBlockedReason}
              onChange={(e) => setNewBlockedReason(e.target.value)}
              placeholder="Ex: indisponible"
              className="input-base"
            />
          </div>
          <Button onClick={addBlockedDate} disabled={!newBlockedDate}>Fermer ce jour</Button>
        </div>

        {blockedDates.length > 0 && (
          <ul className="mt-4 divide-y divide-line">
            {blockedDates.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-semibold">{new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  {d.reason && <span className="ml-2 text-muted">— {d.reason}</span>}
                </div>
                <button
                  onClick={() => removeBlockedDate(d.date)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-alt hover:text-red-500"
                  aria-label="Réouvrir ce jour"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-surface p-6">
        <h2 className="text-lg font-bold">Comportement de la plateforme</h2>
        <label className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-line p-4">
          <div>
            <p className="font-semibold">{t('admin.acceptingOrders')}</p>
            <p className="text-xs text-muted">Désactive la création de nouvelles commandes (mode maintenance).</p>
          </div>
          <input
            type="checkbox"
            checked={settings.acceptingOrders}
            onChange={(e) => update('acceptingOrders', e.target.checked)}
            className="h-5 w-5 accent-ocean"
          />
        </label>
      </section>

      <section className="card-surface p-6">
        <h2 className="text-lg font-bold">Identité</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold">Nom de l'application</label>
            <input value={settings.appName} onChange={(e) => update('appName', e.target.value)} className="input-base" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Devise</label>
            <input value={settings.currency} onChange={(e) => update('currency', e.target.value)} className="input-base" />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} icon={<Save size={14} />}>
          {saving ? '…' : t('admin.save')}
        </Button>
      </div>
    </div>
  )
}
