import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'dark' | 'sun' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
  icon?: ReactNode
  iconLeft?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-ocean-500 text-white hover:bg-ocean-600',
  secondary: 'bg-surface-alt text-ink hover:bg-line',
  dark: 'bg-ink text-surface hover:opacity-90',
  sun: 'bg-sunset-400 text-white hover:bg-sunset-500',
  ghost: 'text-ink hover:bg-surface-alt',
  outline: 'border border-line bg-card text-ink hover:bg-surface-alt',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-6 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconLeft,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {iconLeft && <span className="shrink-0">{iconLeft}</span>}
      {children}
      {icon && <span className="shrink-0">{icon}</span>}
    </button>
  )
}
