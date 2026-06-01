import { MapPin, Clock } from 'lucide-react'

interface Props {
  address?: string
  onClick?: () => void
}

export default function AddressBar({ address = 'Cap Ferret · 33970', onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-left transition-colors hover:bg-surface-alt sm:w-auto"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocean-50 text-ocean-500 dark:bg-ocean-900/30 dark:text-ocean-200">
        <MapPin size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Livré à</p>
        <p className="truncate text-sm font-bold text-ink">{address}</p>
      </div>
      <div className="hidden items-center gap-1 text-xs text-muted sm:flex">
        <Clock size={12} /> 30–45 min
      </div>
    </button>
  )
}
