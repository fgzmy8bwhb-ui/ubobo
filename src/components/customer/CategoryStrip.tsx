import { Link } from 'react-router-dom'
import { Sandwich, Pizza, Fish, Salad, IceCreamCone, Beef, ShoppingBasket, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface Category {
  value: string
  label: string
  icon: typeof Sandwich
}

export const CATEGORIES: Category[] = [
  { value: 'all', label: 'Tout', icon: Sparkles },
  { value: 'fastfood', label: 'Fast-food', icon: Beef },
  { value: 'pizza', label: 'Pizza', icon: Pizza },
  { value: 'fish', label: 'Poisson', icon: Fish },
  { value: 'snack', label: 'Snack', icon: Sandwich },
  { value: 'healthy', label: 'Healthy', icon: Salad },
  { value: 'dessert', label: 'Desserts', icon: IceCreamCone },
  { value: 'grocery', label: 'Courses', icon: ShoppingBasket },
]

interface Props {
  active?: string
  onSelect?: (value: string) => void
  asLinks?: boolean
}

export default function CategoryStrip({ active = 'all', onSelect, asLinks = false }: Props) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {CATEGORIES.map((c) => {
        const Icon = c.icon
        const isActive = c.value === active
        const className = cn(
          'flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all duration-150 min-w-[78px]',
          isActive
            ? 'bg-ink text-surface'
            : 'bg-surface-alt text-ink hover:bg-line'
        )
        const inner = (
          <>
            <Icon size={20} strokeWidth={2} />
            <span className="text-xs font-bold">{c.label}</span>
          </>
        )
        if (asLinks) {
          const href = c.value === 'grocery' ? '/courses' : c.value === 'all' ? '/restaurants' : `/restaurants?category=${c.value}`
          return (
            <Link key={c.value} to={href} className={className}>{inner}</Link>
          )
        }
        return (
          <button key={c.value} onClick={() => onSelect?.(c.value)} className={className}>{inner}</button>
        )
      })}
    </div>
  )
}
