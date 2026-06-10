import { cn } from '@/lib/cn'
import { CalendarDays, Clock } from 'lucide-react'

interface Props {
  selected: string | null
  onSelect: (slot: string) => void
  deliveryDate?: string | null  // "YYYY-MM-DD" passée depuis le checkout
}

// Generate slots every 10 min from 08:00 to 13:00
function generateSlots(): string[] {
  const slots: string[] = []
  for (let h = 8; h <= 13; h++) {
    for (let m = 0; m < 60; m += 10) {
      if (h === 13 && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

// Delivery date = tomorrow (or day after if past 23h)
function getDeliveryDate(): Date {
  const now = new Date()
  const d = new Date(now)
  d.setDate(d.getDate() + (now.getHours() >= 23 ? 2 : 1))
  return d
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Group slots by hour
function groupByHour(slots: string[]): Record<string, string[]> {
  return slots.reduce<Record<string, string[]>>((acc, slot) => {
    const h = slot.split(':')[0]
    if (!acc[h]) acc[h] = []
    acc[h].push(slot)
    return acc
  }, {})
}

const ALL_SLOTS = generateSlots()
const SLOTS_BY_HOUR = groupByHour(ALL_SLOTS)

export default function TimeSlotPicker({ selected, onSelect, deliveryDate: deliveryDateProp }: Props) {
  // Use the passed date if available, otherwise fall back to computed tomorrow
  const displayDate = deliveryDateProp
    ? new Date(deliveryDateProp + 'T12:00:00')
    : getDeliveryDate()

  return (
    <div className="rounded-3xl border border-line bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-ink px-5 py-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={18} className="text-surface/70" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-surface/50">Livraison le</p>
            <p className="text-base font-bold text-surface capitalize">{formatDate(displayDate)}</p>
          </div>
        </div>
        {selected && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
            <Clock size={13} className="text-surface" />
            <span className="text-sm font-bold text-surface">{selected}</span>
          </div>
        )}
      </div>

      {/* Slots */}
      <div className="p-5 space-y-5">
        {Object.entries(SLOTS_BY_HOUR).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([hour, slots]) => (
          <div key={hour}>
            {/* Hour label */}
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-muted">{hour}h</span>
              <div className="flex-1 h-px bg-line" />
            </div>
            {/* Slot grid */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {slots.map((slot) => {
                const isSelected = selected === slot
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelect(slot)}
                    className={cn(
                      'relative rounded-2xl border-2 px-2 py-2.5 text-center text-sm font-semibold transition-all duration-150 select-none',
                      isSelected
                        ? 'border-ink bg-ink text-surface shadow-sm scale-[1.04]'
                        : 'border-line bg-surface-alt text-ink hover:border-ink/40 hover:bg-card active:scale-95'
                    )}
                  >
                    {slot}
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-black">
                        ✓
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-line bg-surface-alt/50 px-5 py-3">
        <p className="text-xs text-muted">
          🌙 Commande à passer avant <strong>23h</strong> la veille · Livraison entre <strong>8h et 13h</strong>
        </p>
      </div>
    </div>
  )
}
