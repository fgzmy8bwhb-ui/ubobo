import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, MenuItem } from '@/types'
import { calculateDeliveryFee, calculatePickingFee } from '@/lib/delivery'
import { api, type ApiOrder } from '@/lib/api'

export type PaymentMethod = 'card' | 'cash' | 'card_on_delivery'

export interface LastOrder {
  orderNumber: string
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
  restaurantName: string | null
  paymentMethod: PaymentMethod
  address: string
}

export interface AppliedPromo {
  code: string
  title: string
  discount: number
  freeDelivery: boolean
}

interface CartStore {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
  deliveryAddress: string
  deliveryDistanceKm: number
  isDrawerOpen: boolean
  lastOrder: LastOrder | null
  appliedPromo: AppliedPromo | null
  serverFee: number | null
  deliverySlot: string | null
  setDeliverySlot: (slot: string | null) => void
  deliveryDate: string | null   // ISO date string "YYYY-MM-DD"
  setDeliveryDate: (date: string | null) => void

  addItem: (item: MenuItem, restaurantId: string, restaurantName: string, selectedOptions?: Record<string, string>) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, qty: number) => void
  clearCart: () => void
  openDrawer: () => void
  closeDrawer: () => void
  setDeliveryAddress: (address: string) => void
  setDeliveryDistanceKm: (km: number) => void
  setServerFee: (fee: number | null) => void

  applyPromo: (code: string) => Promise<{ ok: boolean; error?: string }>
  clearPromo: () => void

  placeOrder: (address: string, paymentMethod: PaymentMethod) => void

  submitOrder: (input: {
    customerName: string
    customerPhone: string
    customerEmail?: string
    deliveryAddress: string
    deliveryDistanceKm: number
    deliveryDurationMin: number
    paymentMethod: PaymentMethod
    notes?: string
    deliveryDate?: string
    deliverySlot?: string
    usePoints?: boolean
  }) => Promise<ApiOrder>

  subtotal: () => number
  deliveryFee: () => number
  pickingFee: () => number
  discount: () => number
  total: () => number
  totalItems: () => number
}

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      deliveryAddress: '',
      deliveryDistanceKm: 1,
      isDrawerOpen: false,
      lastOrder: null,
      appliedPromo: null,
      serverFee: null,
      deliverySlot: null,
      setDeliverySlot: (slot) => set({ deliverySlot: slot }),
      deliveryDate: null,
      setDeliveryDate: (date) => set({ deliveryDate: date }),

      addItem: (item, restaurantId, restaurantName, selectedOptions) => {
        set((state) => {
          const optKey =
            selectedOptions && Object.keys(selectedOptions).length > 0
              ? '_' + Object.entries(selectedOptions).map(([k, v]) => `${k}:${v}`).join('_')
              : ''
          const cartId = item.id + optKey
          const existing = state.items.find((i) => i.id === cartId)
          const updatedItems = existing
            ? state.items.map((i) => (i.id === cartId ? { ...i, quantity: i.quantity + 1 } : i))
            : [
                ...state.items,
                { id: cartId, name: item.name, price: item.price, quantity: 1, selectedOptions },
              ]
          return { items: updatedItems, restaurantId, restaurantName, isDrawerOpen: true }
        })
      },

      removeItem: (itemId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== itemId)
          return {
            items: newItems,
            restaurantId: newItems.length === 0 ? null : state.restaurantId,
            restaurantName: newItems.length === 0 ? null : state.restaurantName,
            appliedPromo: newItems.length === 0 ? null : state.appliedPromo,
          }
        })
      },

      updateQuantity: (itemId, qty) => {
        if (qty <= 0) { get().removeItem(itemId); return }
        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)),
        }))
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null, appliedPromo: null, serverFee: null }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
      setDeliveryAddress: (address) => set({ deliveryAddress: address }),
      setDeliveryDistanceKm: (km) => set({ deliveryDistanceKm: km, serverFee: null }),
      setServerFee: (fee) => set({ serverFee: fee }),

      applyPromo: async (code) => {
        const subtotal = get().subtotal()
        try {
          const res = await api.promotions.validate(code, subtotal)
          set({
            appliedPromo: { code: res.code, title: res.title, discount: res.discount, freeDelivery: res.freeDelivery },
          })
          return { ok: true }
        } catch (e: any) {
          return { ok: false, error: e?.message ?? 'INVALID_CODE' }
        }
      },

      clearPromo: () => set({ appliedPromo: null }),

      placeOrder: (address, paymentMethod) => {
        const state = get()
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        const orderNumber = 'UB-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
        set({
          lastOrder: {
            orderNumber,
            items: [...state.items],
            subtotal: state.subtotal(),
            deliveryFee: state.deliveryFee(),
            total: state.total(),
            restaurantName: state.restaurantName,
            paymentMethod,
            address,
          },
          items: [], restaurantId: null, restaurantName: null, isDrawerOpen: false, appliedPromo: null, serverFee: null,
        })
      },

      submitOrder: async (input) => {
        const state = get()
        if (!state.restaurantId) throw new Error('NO_RESTAURANT')
        if (state.items.length === 0) throw new Error('EMPTY_CART')

        const { order } = await api.orders.create({
          restaurantSlug: state.restaurantId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail,
          deliveryAddress: input.deliveryAddress,
          deliveryDistanceKm: input.deliveryDistanceKm,
          deliveryDurationMin: input.deliveryDurationMin,
          paymentMethod: input.paymentMethod === 'card' ? 'CARD' : input.paymentMethod === 'card_on_delivery' ? 'CARD_ON_DELIVERY' : 'CASH',
          promotionCode: state.appliedPromo?.code,
          notes: input.notes,
          deliveryDate: input.deliveryDate,
          deliverySlot: input.deliverySlot,
          usePoints: input.usePoints,
          items: state.items.map((i) => ({
            name: i.name, price: i.price, quantity: i.quantity, selectedOptions: i.selectedOptions,
          })),
        })

        set({
          lastOrder: {
            orderNumber: order.orderNumber,
            items: [...state.items],
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            total: order.total,
            restaurantName: state.restaurantName,
            paymentMethod: input.paymentMethod,
            address: input.deliveryAddress,
          },
          items: [], restaurantId: null, restaurantName: null, isDrawerOpen: false, appliedPromo: null, serverFee: null, deliverySlot: null, deliveryDate: null,
        })

        return order
      },

      subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      deliveryFee: () => {
        const s = get()
        if (s.appliedPromo?.freeDelivery) return 0
        // Utilise le frais calculé dynamiquement par useDeliveryCalculator si disponible
        if (s.serverFee !== null) return s.serverFee
        return calculateDeliveryFee()
      },
      pickingFee: () => {
        const s = get()
        const subtotal = s.subtotal()
        // Commission 15% uniquement sur les courses Auchan
        if (s.restaurantId === 'auchan-lege') {
          return Math.round(subtotal * 0.15 * 100) / 100
        }
        return calculatePickingFee(subtotal)
      },
      discount: () => get().appliedPromo?.discount ?? 0,
      total: () => Math.max(0, get().subtotal() + get().deliveryFee() + get().pickingFee() - get().discount()),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'ubobo_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
        deliveryAddress: state.deliveryAddress,
        deliveryDistanceKm: state.deliveryDistanceKm,
        appliedPromo: state.appliedPromo,
        deliverySlot: state.deliverySlot,
        deliveryDate: state.deliveryDate,
      }),
    }
  )
)

export default useCartStore
