export interface MenuItemOption {
  name: string
  choices: string[]
  required?: boolean
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
  image?: string
  options?: MenuItemOption[]
}

export interface Restaurant {
  id: string
  name: string
  category: 'fastfood' | 'pizza' | 'fish' | 'snack' | 'healthy' | 'dessert'
  logo?: string
  coverImage?: string
  estimatedTimeMin: number
  status: 'active' | 'coming_soon' | 'partner_pending' | 'paused'
  menu: MenuItem[]
  distanceFromCenterKm: number
  address: string
  phone?: string
  description?: string
  // Optional fields filled by the API
  averageRating?: number
  reviewCount?: number
  isFeatured?: boolean
  dbId?: string
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  selectedOptions?: Record<string, string>
}
