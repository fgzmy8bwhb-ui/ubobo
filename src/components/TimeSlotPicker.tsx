import { cn } from '@/lib/cn'
import { CalendarDays, Clock } from 'lucide-react'

interface Props {
  selected: string | null
  onSelect: (slot: string) => void
  deliveryDate?: string | null
  startHour?: number
  endHour?: number
  intervalMin?: number
  takenSlots?: string[]
}

function generateSlots(startHour: number, endHour: number, intervalMin: number): string[] {
  const slots: string[] = []
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += intervalMin) {
      if (h === endHour && m > 0) break
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
}

// Delivery date = aujourd'hui (ou demain si après 22h)
function getDeliveryDate(): Date {
  const now = new Date()
  const d = new Date(now)
  if (now.getHours() >= 22) d.setDate(d.getDate() + 1)
  return d
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Délai de préparation minimum avant un créneau, quand la livraison est pour aujourd'hui
const PREP_BUFFER_MIN = 45

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

export default function TimeSlotPicker({ selected, onSelect, deliveryDate: deliveryDateProp, startHour = 8, endHour = 13, intervalMin = 10, takenSlots = [] }: Props) {
  // Use the passed date if available, otherwise fall back to computed tomorrow
  const displayDate = deliveryDateProp
    ? new Date(deliveryDateProp + 'T12:00:00')
    : getDeliveryDate()

  // Si la livraison est pour aujourd'hui, on masque les créneaux déjà trop proches
  const now = new Date()
  const isToday = (deliveryDateProp ?? toISO(now)) === toISO(now)
  const minMinutesFromNow = now.getHours() * 60 + now.getMinutes() + PREP_BUFFER_MIN

  const ALL_SLOTS = generateSlots(startHour, endHour, intervalMin).filter((slot) => {
    if (!isToday) return true
    const [h, m] = slot.split(':').map(Number)
    return h * 60 + m >= minMinutesFromNow
  })
  const SLOTS_BY_HOUR = groupByHour(ALL_SLOTS)

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
        {ALL_SLOTS.length === 0 && (
          <p className="text-center text-sm text-muted">
            Plus de créneau disponible aujourd'hui — choisissez un autre jour.
          </p>
        )}
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
                const isTaken = takenSlots.includes(slot)
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isTaken}
                    onClick={() => !isTaken && onSelect(slot)}
                    className={cn(
                      'relative rounded-2xl border-2 px-2 py-2.5 text-center text-sm font-semibold transition-all duration-150 select-none',
                      isTaken
                        ? 'cursor-not-allowed border-line bg-surface-alt/40 text-muted/40 line-through'
                        : isSelected
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
          🚴 Commande possible pour aujourd'hui · Livraison entre <strong>{startHour}h et {endHour}h</strong>
        </p>
      </div>
    </div>
  )
}
