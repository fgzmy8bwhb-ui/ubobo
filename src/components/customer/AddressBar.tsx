import { useState } from 'react'
import { MapPin, X, ChevronDown } from 'lucide-react'
import useAddressStore from '@/store/address.store'
import AddressAutocomplete from '@/components/AddressAutocomplete'

export default function AddressBar() {
  const savedAddress = useAddressStore((s) => s.savedAddress)
  const setSavedAddress = useAddressStore((s) => s.setSavedAddress)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  function openModal() {
    setDraft(savedAddress)
    setOpen(true)
  }

  function confirm() {
    if (draft.trim()) setSavedAddress(draft.trim())
    setOpen(false)
  }

  const display = savedAddress || 'Cap Ferret · 33970'

  return (
    <>
      {/* Widget */}
      <button
        onClick={openModal}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left transition-colors hover:bg-surface-alt sm:w-auto"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-500 dark:bg-ocean-900/30 dark:text-ocean-200">
          <MapPin size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Livré à</p>
          <p className="truncate text-sm font-bold text-ink">{display}</p>
        </div>
        <ChevronDown size={14} className="opacity-50 text-muted" />
      </button>

      {/* Modale */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card p-6 shadow-lift animate-slide-up">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">Adresse de livraison</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-muted hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Autocomplete */}
            <AddressAutocomplete
              value={draft}
              onChange={setDraft}
              placeholder="Ex : 12 avenue du Phare, Cap Ferret"
            />

            <p className="mt-3 text-xs text-muted">
              Nous livrons sur Cap Ferret.
            </p>

            {/* Bouton confirmer */}
            <button
              onClick={confirm}
              disabled={!draft.trim()}
              className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-center font-bold text-surface transition-opacity disabled:opacity-40"
            >
              Confirmer cette adresse
            </button>
          </div>
        </div>
      )}
    </>
  )
}
