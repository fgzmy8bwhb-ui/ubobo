// Tiny typed fetch wrapper for the UBOBO REST API.
// Auth: a JWT (if present) is read from localStorage and sent as Bearer header.

// En prod (Vercel), l'API est servie sur la même origine (/api/*) → URL relative
const API_URL = (import.meta.env.VITE_API_URL as string) || (import.meta.env.PROD ? '' : 'http://localhost:4000')
const TOKEN_KEY = 'ubobo_token'

export class ApiError extends Error {
  status: number
  body: any
  constructor(status: number, message: string, body?: any) {
    super(message)
    this.status = status
    this.body = body
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: any
  signal?: AbortSignal
  auth?: boolean // force-add token (default: send if available)
}

export async function request<T = any>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
      credentials: 'include',
    })
  } catch (err) {
    throw new ApiError(0, 'NETWORK_ERROR')
  }

  const text = await res.text()
  const data = text ? safeJson(text) : null

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `HTTP_${res.status}`, data)
  }
  return data as T
}

function safeJson(s: string) {
  try { return JSON.parse(s) } catch { return null }
}

// ---- Endpoint groups (typed surface used by the UI) ----

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),

  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: AuthUser }>('/api/auth/login', { method: 'POST', body: { email, password } }),
    register: (email: string, password: string, name?: string, phone?: string) =>
      request<{ token: string; user: AuthUser }>('/api/auth/register', { method: 'POST', body: { email, password, name, phone } }),
    me: () => request<{ user: AuthUser }>('/api/auth/me'),
    updateMe: (patch: Partial<Pick<AuthUser, 'name' | 'phone' | 'address' | 'locale'>>) =>
      request<{ user: AuthUser }>('/api/auth/me', { method: 'PATCH', body: patch }),
  },

  restaurants: {
    list: (params?: { category?: string; status?: string; search?: string }) =>
      request<{ restaurants: ApiRestaurant[] }>(`/api/restaurants${qs(params)}`),
    get: (slug: string) =>
      request<{ restaurant: ApiRestaurant }>(`/api/restaurants/${slug}`),
    reviews: (slug: string) =>
      request<{ reviews: ApiReview[] }>(`/api/restaurants/${slug}/reviews`),
  },

  orders: {
    create: (body: CreateOrderBody) =>
      request<{ order: ApiOrder }>('/api/orders', { method: 'POST', body }),
    get: (orderNumber: string) =>
      request<{ order: ApiOrder }>(`/api/orders/${orderNumber}`),
    listMine: () =>
      request<{ orders: ApiOrder[] }>('/api/orders'),
    listAll: (status?: string) =>
      request<{ orders: ApiOrder[] }>(`/api/orders${status ? `?status=${status}` : ''}`),
    setStatus: (id: string, status: string) =>
      request<{ order: ApiOrder }>(`/api/orders/${id}/status`, { method: 'PATCH', body: { status } }),
    takenSlots: (date: string) =>
      request<{ slots: string[] }>(`/api/orders/slots/taken?date=${date}`),
  },

  settings: {
    get: () => request<{ settings: AppSettings }>('/api/settings'),
    update: (patch: Partial<AppSettings>) =>
      request<{ settings: AppSettings }>('/api/settings', { method: 'PATCH', body: patch }),
    quote: (distanceKm: number, subtotal: number, postalCode?: string) =>
      request<{ fee: FeeBreakdown }>('/api/settings/quote', { method: 'POST', body: { distanceKm, subtotal, postalCode } }),
    zones: () => request<{ zones: DeliveryZone[] }>('/api/settings/zones'),
    createZone: (z: Omit<DeliveryZone, 'id' | 'createdAt' | 'updatedAt'>) =>
      request<{ zone: DeliveryZone }>('/api/settings/zones', { method: 'POST', body: z }),
    updateZone: (id: string, z: Partial<DeliveryZone>) =>
      request<{ zone: DeliveryZone }>(`/api/settings/zones/${id}`, { method: 'PATCH', body: z }),
    deleteZone: (id: string) =>
      request<void>(`/api/settings/zones/${id}`, { method: 'DELETE' }),
  },

  favorites: {
    list: () => request<{ favorites: { restaurantSlug: string; restaurantName: string }[] }>('/api/favorites'),
    add: (restaurantSlug: string) =>
      request<{ ok: true }>('/api/favorites', { method: 'POST', body: { restaurantSlug } }),
    remove: (slug: string) => request<void>(`/api/favorites/${slug}`, { method: 'DELETE' }),
  },

  reviews: {
    create: (body: { restaurantSlug: string; rating: number; comment?: string; orderId?: string }) =>
      request<{ review: any }>('/api/reviews', { method: 'POST', body }),
  },

  promotions: {
    list: () => request<{ promotions: Promotion[] }>('/api/promotions'),
    validate: (code: string, subtotal: number, restaurantSlug?: string) =>
      request<{ valid: true; code: string; title: string; type: string; discount: number; freeDelivery: boolean }>(
        '/api/promotions/validate',
        { method: 'POST', body: { code, subtotal, restaurantSlug } }
      ),
  },

  waitlist: {
    join: (email: string, source?: string) =>
      request<{ ok: true }>('/api/waitlist', { method: 'POST', body: { email, source } }),
  },

  admin: {
    stats: () => request<AdminStats>('/api/admin/stats'),
    auchanScrape: () => request<{ message: string }>('/api/admin/auchan/scrape', { method: 'POST' }),
    auchanProductCount: () => request<{ total: number; withPrice: number }>('/api/admin/auchan/products?limit=1'),
  },

  stripe: {
    paymentIntent: (orderNumber: string) =>
      request<{ clientSecret: string }>('/api/stripe/payment-intent', { method: 'POST', body: { orderNumber } }),
  },

  sumup: {
    checkout: (orderNumber: string) =>
      request<{ checkoutId: string }>('/api/sumup/checkout', { method: 'POST', body: { orderNumber } }),
    confirm: (orderNumber: string) =>
      request<{ status: string }>('/api/sumup/confirm', { method: 'POST', body: { orderNumber } }),
  },
}

function qs(o?: Record<string, string | undefined>) {
  if (!o) return ''
  const pairs = Object.entries(o).filter(([, v]) => v != null && v !== '')
  if (pairs.length === 0) return ''
  return '?' + new URLSearchParams(pairs as [string, string][]).toString()
}

// ---- Types ----

export interface AuthUser {
  id: string
  email: string
  name?: string | null
  role: 'CUSTOMER' | 'ADMIN'
  locale: 'fr' | 'en' | string
  phone?: string | null
  address?: string | null
}

export interface ApiRestaurant {
  id: string // slug
  dbId: string
  name: string
  category: 'fastfood' | 'pizza' | 'fish' | 'snack' | 'healthy' | 'dessert'
  status: 'active' | 'coming_soon' | 'partner_pending' | 'paused'
  logo?: string
  coverImage?: string
  distanceFromCenterKm: number
  address: string
  phone?: string
  description?: string
  averageRating: number
  reviewCount: number
  isFeatured: boolean
  menu: ApiMenuItem[]
}

export interface ApiMenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
  image?: string
  options?: { name: string; choices: string[]; required?: boolean }[]
}

export interface ApiReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  author: string
}

export interface CreateOrderBody {
  restaurantSlug: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress: string
  deliveryDistanceKm: number
  paymentMethod: 'CARD' | 'CASH' | 'CARD_ON_DELIVERY'
  promotionCode?: string
  notes?: string
  deliveryDate?: string
  deliverySlot?: string
  items: Array<{
    menuItemId?: string
    name: string
    price: number
    quantity: number
    selectedOptions?: Record<string, string>
  }>
}

export interface ApiOrder {
  id: string
  orderNumber: string
  status: 'PENDING' | 'PAID' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'ON_THE_WAY' | 'DELIVERED' | 'CANCELLED'
  subtotal: number
  deliveryFee: number
  serviceFee: number
  discount: number
  total: number
  paymentMethod: 'CARD' | 'CASH' | 'CARD_ON_DELIVERY'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  deliveryAddress: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  notes?: string
  deliveryDate?: string | null
  deliverySlot?: string | null
  restaurant?: { name: string; slug: string; phone?: string | null }
  items?: Array<{ id: string; name: string; price: number; quantity: number; selectedOptions?: Record<string, string> }>
  createdAt: string
  estimatedDeliveryAt?: string
  acceptedAt?: string
  preparedAt?: string
  deliveredAt?: string
}

export interface AppSettings {
  appName: string
  defaultLocale: string
  currency: string
  currencySymbol: string
  deliveryBaseFee: number
  deliveryPerKmFee: number
  deliveryFreeAbove: number | null
  deliveryMinOrder: number
  deliveryMaxDistanceKm: number
  acceptingOrders: boolean
}

export interface FeeBreakdown {
  baseFee: number
  perKmFee: number
  distanceKm: number
  raw: number
  free: boolean
  total: number
  source: 'settings' | 'zone'
}

export interface DeliveryZone {
  id: string
  name: string
  postalCode?: string | null
  baseFee: number
  perKmFee: number
  freeAbove?: number | null
  minOrder: number
  maxDistanceKm: number
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

export interface Promotion {
  code: string
  title: string
  description?: string
  type: 'PERCENT' | 'AMOUNT' | 'FREE_DELIVERY'
  value: number
  minSubtotal: number
  bannerColor?: string
  bannerImage?: string
}

export interface AdminStats {
  counts: {
    totalOrders: number
    todayOrders: number
    monthOrders: number
    pendingOrders: number
    activeRestaurants: number
    pendingRestaurants: number
    waitlistCount: number
    usersCount: number
  }
  revenue: { total: number; today: number; month: number }
  series: Array<{ date: string; orders: number; revenue: number }>
  topRestaurants: Array<{ name: string; orders: number; revenue: number }>
}
