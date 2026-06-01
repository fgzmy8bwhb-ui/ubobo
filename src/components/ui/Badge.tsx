import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeVariant = 'default' | 'ocean' | 'sand' | 'sunset' | 'ink' | 'muted' | 'success'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-surface-alt text-ink',
  ocean: 'bg-ocean-50 text-ocean-700 dark:bg-ocean-900/40 dark:text-ocean-200',
  sand: 'bg-sand-50 text-sand-500 dark:bg-sand-500/15 dark:text-sand-200',
  sunset: 'bg-sunset-50 text-sunset-700 dark:bg-sunset-400/15 dark:text-sunset-200',
  ink: 'bg-ink text-surface',
  muted: 'bg-surface-alt text-muted',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const dots: Record<BadgeVariant, string> = {
  default: 'bg-muted',
  ocean: 'bg-ocean-500',
  sand: 'bg-sand-500',
  sunset: 'bg-sunset-400',
  ink: 'bg-surface',
  muted: 'bg-muted',
  success: 'bg-emerald-500',
}

export default function Badge({ children, variant = 'default', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[variant])} />}
      {children}
    </span>
  )
}
