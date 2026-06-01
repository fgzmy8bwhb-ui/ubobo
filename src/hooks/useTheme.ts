import { useEffect } from 'react'
import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  resolved: 'light' | 'dark'
  set: (t: Theme) => void
  toggle: () => void
  init: () => void
}

const KEY = 'ubobo_theme'

function resolveSystem(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolved: 'light',

  set: (t) => {
    const resolved = t === 'system' ? resolveSystem() : t
    if (typeof window !== 'undefined') localStorage.setItem(KEY, t)
    apply(resolved)
    set({ theme: t, resolved })
  },

  toggle: () => {
    const next = get().resolved === 'dark' ? 'light' : 'dark'
    get().set(next)
  },

  init: () => {
    if (typeof window === 'undefined') return
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? 'system'
    const resolved = saved === 'system' ? resolveSystem() : saved
    apply(resolved)
    set({ theme: saved, resolved })

    // React to system changes when in 'system' mode
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (get().theme === 'system') {
        const r = resolveSystem()
        apply(r)
        set({ resolved: r })
      }
    }
    mq.addEventListener('change', onChange)
  },
}))

export function useInitTheme() {
  useEffect(() => {
    useTheme.getState().init()
  }, [])
}
