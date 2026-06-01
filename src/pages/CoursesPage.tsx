import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Banknote, CheckCircle2, CreditCard, ShoppingBasket, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'

const SUGGESTIONS = [
  { label: 'Fruits & Légumes', items: 'pommes, salade, tomates' },
  { label: 'Boulangerie', items: 'baguette, croissants' },
  { label: 'Boissons & Apéro', items: 'rosé, chips, olives' },
  { label: 'Viandes & Poissons', items: 'poulet, saumon, jambon' },
  { label: 'Produits frais', items: 'lait, beurre, fromage' },
  { label: 'Épicerie', items: 'pâtes, riz, conserves' },
]

const FLAT_FEE = 40

export default function CoursesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [list, setList] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [payment, setPayment] = useState<'card' | 'cash'>('card')
  const [confirmed, setConfirmed] = useState(false)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!list.trim() || !address.trim() || !phone.trim()) return
    const store = (() => {
      try { return JSON.parse(localStorage.getItem('ubobo_courses') ?? '[]') } catch { return [] }
    })()
    store.unshift({ list, address, phone, payment, date: new Date().toISOString() })
    localStorage.setItem('ubobo_courses', JSON.stringify(store.slice(0, 500)))
    setConfirmed(true)
  }

  function addSuggestion(label: string, items: string) {
    setList((cur) => (cur ? cur + `\n` : '') + `${label}: ${items}`)
  }

  if (confirmed) {
    return (
      <main className="container-edge py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 size={36} />
        </div>
        <h1 className="mt-6 text-display">Liste reçue !</h1>
        <p className="mt-2 max-w-md mx-auto text-muted">
          Notre équipe va vous appeler dans les 15 minutes au {phone} pour confirmer.
        </p>
        <Button variant="dark" className="mt-6" onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </main>
    )
  }

  return (
    <main className="container-edge py-8">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
        <Sparkles size={12} /> Service courses
      </div>
      <h1 className="text-display">Faites vos courses</h1>
      <p className="mt-1 text-sm text-muted max-w-xl">
        On fait vos courses dans les commerces du Cap Ferret et on vous livre. Frais de service fixe : {FLAT_FEE.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="card-surface p-5 sm:p-6">
            <label className="block text-sm font-bold">Votre liste de courses</label>
            <p className="mt-0.5 text-xs text-muted">Écrivez librement ce que vous voulez. On adapte.</p>
            <textarea
              value={list}
              onChange={(e) => setList(e.target.value)}
              rows={8}
              required
              placeholder="Ex:&#10;- 1 baguette tradition&#10;- 6 yaourts nature&#10;- 1 bouteille de rosé bien frais"
              className="input-flat mt-3 font-mono text-sm"
            />

            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Suggestions</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => addSuggestion(s.label, s.items)}
                    className="pill-default text-xs"
                  >
                    <ShoppingBasket size={12} /> {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-surface p-5 sm:p-6">
            <h2 className="text-lg font-bold">Livraison & contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse" className="input-flat sm:col-span-2" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Téléphone" className="input-flat sm:col-span-2" />
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
                  <p className="text-xs text-muted">Au moment de la livraison</p>
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

          <Button type="submit" variant="dark" size="lg" fullWidth disabled={!list.trim() || !address.trim() || !phone.trim()}>
            Envoyer ma liste
          </Button>
        </form>

        <aside className="lg:sticky lg:top-24 h-fit card-surface p-6">
          <h2 className="text-lg font-bold">Comment ça marche</h2>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-surface">1</span>
              <span>Vous écrivez votre liste librement.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-surface">2</span>
              <span>On vous appelle dans les 15 minutes pour valider et estimer le total.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-surface">3</span>
              <span>On fait vos courses et on vous livre.</span>
            </li>
          </ol>
          <div className="mt-6 rounded-2xl bg-surface-alt p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Frais de service</p>
            <p className="mt-1 text-xl font-bold">
              {FLAT_FEE.toLocaleString(i18n.language === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="mt-0.5 text-xs text-muted">Hors prix des produits</p>
          </div>
        </aside>
      </div>
    </main>
  )
}
