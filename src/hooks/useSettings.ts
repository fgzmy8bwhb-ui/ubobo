import { create } from 'zustand'
import { api, type AppSettings } from '@/lib/api'

interface SettingsState {
  settings: AppSettings | null
  ready: boolean
  loading: boolean
  load: () => Promise<void>
  setLocal: (patch: Partial<AppSettings>) => void
}

const FALLBACK: AppSettings = {
  appName: 'UBOBO',
  defaultLocale: 'fr',
  currency: 'EUR',
  currencySymbol: '€',
  deliveryBaseFee: 5,
  deliveryPerKmFee: 1,
  deliveryFreeAbove: null,
  deliveryMinOrder: 0,
  deliveryMaxDistanceKm: 4,
  acceptingOrders: true,
  deliverySlotIntervalMin: 20,
  deliveryWindowStart: '08:30',
  deliveryWindowEnd: '20:30',
}

export const useSettings = create<SettingsState>((set) => ({
  settings: null,
  ready: false,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const { settings } = await api.settings.get()
      set({ settings, ready: true, loading: false })
    } catch {
      set({ settings: FALLBACK, ready: true, loading: false })
    }
  },

  setLocal: (patch) =>
    set((state) => ({ settings: state.settings ? { ...state.settings, ...patch } : null })),
}))
