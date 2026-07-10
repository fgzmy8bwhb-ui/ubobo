import { useEffect, useRef, useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Suggestion {
  place_id: number
  display_name: string
  address: {
    road?: string
    house_number?: string
    postcode?: string
    city?: string
    town?: string
    village?: string
    municipality?: string
  }
}

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

// Format a Nominatim result into a clean short label
function formatAddress(s: Suggestion): string {
  const a = s.address
  const street = [a.house_number, a.road].filter(Boolean).join(' ')
  const city = a.city ?? a.town ?? a.village ?? a.municipality ?? ''
  const post = a.postcode ?? ''
  return [street, post, city].filter(Boolean).join(', ')
}

export default function AddressAutocomplete({ value, onChange, placeholder, required, className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(v: string) {
    onChange(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (v.length < 3) { setSuggestions([]); setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(v)}`)
        const data: Suggestion[] = await res.json()
        const filtered = data.filter((s) => !s.address.postcode || s.address.postcode === '33970')
        setSuggestions(filtered)
        setOpen(filtered.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  function pickSuggestion(s: Suggestion) {
    onChange(formatAddress(s) || s.display_name)
    setOpen(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={cn('input-flat pr-10', className)}
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-line bg-card shadow-lift animate-fade-in">
          {suggestions.map((s) => {
            const label = formatAddress(s) || s.display_name
            return (
              <li key={s.place_id}>
                <button
                  type="button"
                  onMouseDown={() => pickSuggestion(s)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm hover:bg-surface-alt transition-colors border-b border-line last:border-0"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-ocean-500" />
                  <span className="min-w-0 text-ink">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
