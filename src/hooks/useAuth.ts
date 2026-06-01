import { create } from 'zustand'
import { api, setToken, type AuthUser } from '@/lib/api'

interface AuthState {
  user: AuthUser | null
  ready: boolean
  loading: boolean
  error: string | null

  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string, phone?: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  loading: false,
  error: null,

  bootstrap: async () => {
    try {
      const { user } = await api.auth.me()
      set({ user, ready: true })
    } catch {
      set({ user: null, ready: true })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { token, user } = await api.auth.login(email, password)
      setToken(token)
      set({ user, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Erreur de connexion' })
      throw e
    }
  },

  register: async (email, password, name, phone) => {
    set({ loading: true, error: null })
    try {
      const { token, user } = await api.auth.register(email, password, name, phone)
      setToken(token)
      set({ user, loading: false })
    } catch (e: any) {
      set({ loading: false, error: e?.message ?? 'Erreur' })
      throw e
    }
  },

  logout: () => {
    setToken(null)
    set({ user: null })
  },

  refresh: async () => {
    try {
      const { user } = await api.auth.me()
      set({ user })
    } catch {
      setToken(null)
      set({ user: null })
    }
  },
}))
