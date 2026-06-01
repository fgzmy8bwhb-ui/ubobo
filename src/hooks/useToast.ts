import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info'
  duration: number
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  push: ({ message, variant, duration }) => {
    const id = Math.random().toString(36).slice(2)
    set({ toasts: [...get().toasts, { id, message, variant, duration }] })
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration)
    }
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = {
  success: (message: string, duration = 3000) =>
    useToast.getState().push({ message, variant: 'success', duration }),
  error: (message: string, duration = 4000) =>
    useToast.getState().push({ message, variant: 'error', duration }),
  info: (message: string, duration = 3000) =>
    useToast.getState().push({ message, variant: 'info', duration }),
}
