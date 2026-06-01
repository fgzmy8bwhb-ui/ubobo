import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'

const langs = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
]

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const current = i18n.language?.startsWith('en') ? 'en' : 'fr'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Langue"
        className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-bold text-ink transition-colors hover:bg-surface-alt"
      >
        <Globe size={14} />
        {current.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-2xl border border-line bg-card shadow-lift">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => { i18n.changeLanguage(l.code); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-alt ${
                current === l.code ? 'text-ink' : 'text-muted'
              }`}
            >
              <span>{l.label}</span>
              {current === l.code && <span className="text-ink">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
