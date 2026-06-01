import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { resolved, toggle } = useTheme()
  const isDark = resolved === 'dark'
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-surface-alt"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
