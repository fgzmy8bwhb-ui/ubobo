import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  selected: string | null   // "YYYY-MM-DD"
  onSelect: (date: string) => void
  selectedSlot?: string | null
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// First orderable date: today (commande possible jusqu'à 22h), sinon demain
function getMinDate(): Date {
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (now.getHours() >= 22) d.setDate(d.getDate() + 1)
  return d
}

// Monday-first: returns 0=Mon … 6=Sun
function weekDayMon(d: Date) {
  return (d.getDay() + 6) % 7
}

export default function DeliveryCalendar({ selected, onSelect, selectedSlot }: Props) {
  const minDate = getMinDate()
  const [viewYear, setViewYear] = useState(minDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(minDate.getMonth())

  const today = new Date(); today.setHours(0, 0, 0, 0)

  function prevMonth() {
    const d = new Date(viewYear, viewMonth - 1, 1)
    // Don't go before current month
    if (d < new Date(today.getFullYear(), today.getMonth(), 1)) return
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth())
  }
  function nextMonth() {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth())
  }

  // Build the calendar grid for this month
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startOffset = weekDayMon(firstOfMonth) // how many empty cells at start

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-card">
      {/* Month nav */}
      <div className="flex items-center justify-between bg-ink px-5 py-4">
        <button
          type="button"
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-surface/60 hover:bg-white/15 hover:text-surface transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-base font-bold text-surface capitalize">
          {MONTHS_FR[viewMonth]} {viewYear}
        </p>
        <button
          type="button"
          onClick={nextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full text-surface/60 hover:bg-white/15 hover:text-surface transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-line">
        {DAYS_FR.map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5 p-2">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-9" />

          const cellDate = new Date(viewYear, viewMonth, day)
          cellDate.setHours(0, 0, 0, 0)
          const iso = toISO(cellDate)
          const isPast = cellDate < minDate
          const isSelected = selected === iso
          const isToday = toISO(cellDate) === toISO(today)

          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(iso)}
              className={cn(
                'relative flex h-9 w-full items-center justify-center rounded-xl text-sm font-semibold transition-all duration-150',
                isPast
                  ? 'text-muted/30 cursor-not-allowed'
                  : isSelected
                    ? 'bg-ink text-surface shadow-sm scale-105'
                    : 'hover:bg-surface-alt text-ink active:scale-95',
                isToday && !isSelected && 'ring-2 ring-ocean-400 ring-offset-1'
              )}
            >
              {day}
              {isSelected && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-black text-white">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Footer: selected recap */}
      {(selected) && (
        <div className="border-t border-line px-4 py-2">
          {selected && selectedSlot ? (
            <p className="text-xs font-semibold text-ink">
              Livraison le{' '}
              <strong>
                {new Date(selected + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </strong>{' '}
              à <strong>{selectedSlot}</strong>
            </p>
          ) : (
            <p className="text-xs text-muted">
              {new Date(selected + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' '}— choisissez l'heure ci-dessous
            </p>
          )}
        </div>
      )}
    </div>
  )
}
