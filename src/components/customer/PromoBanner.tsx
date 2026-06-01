import { Tag } from 'lucide-react'
import { usePromotions } from '@/hooks/usePromotions'
import { toast } from '@/hooks/useToast'

export default function PromoBanner() {
  const { promotions } = usePromotions()
  if (!promotions || promotions.length === 0) return null

  return (
    <div className="container-edge">
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {promotions.map((p) => (
          <button
            key={p.code}
            onClick={() => {
              navigator.clipboard?.writeText(p.code).catch(() => {})
              toast.success(`Code ${p.code} copié`)
            }}
            className="group relative flex w-[280px] shrink-0 items-center gap-3 overflow-hidden rounded-2xl border border-line bg-card p-4 text-left transition-shadow hover:shadow-card sm:w-[340px]"
          >
            <div
              className="absolute inset-y-0 left-0 w-1.5"
              style={{ background: p.bannerColor ?? 'rgb(var(--ink))' }}
            />
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: p.bannerColor ?? '#0A6E8A' }}
            >
              <Tag size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{p.title}</p>
              {p.description && <p className="mt-0.5 truncate text-xs text-muted">{p.description}</p>}
            </div>
            <code className="rounded-md bg-surface-alt px-2 py-1 text-xs font-black tracking-wide text-ink">
              {p.code}
            </code>
          </button>
        ))}
      </div>
    </div>
  )
}
