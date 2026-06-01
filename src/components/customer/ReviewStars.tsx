import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  rating: number
  size?: number
  showValue?: boolean
  count?: number
  className?: string
}

export default function ReviewStars({ rating, size = 14, showValue, count, className }: Props) {
  const safe = Math.max(0, Math.min(5, rating))
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i + 1 <= Math.round(safe)
          return (
            <Star
              key={i}
              size={size}
              className={filled ? 'text-sunset-400' : 'text-line'}
              fill={filled ? 'currentColor' : 'none'}
              strokeWidth={2}
            />
          )
        })}
      </div>
      {showValue && safe > 0 && (
        <span className="text-sm font-bold text-ink">{safe.toFixed(1)}</span>
      )}
      {count != null && count > 0 && (
        <span className="text-sm text-muted">({count})</span>
      )}
    </div>
  )
}
