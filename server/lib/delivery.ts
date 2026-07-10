import { prisma } from './prisma'

export interface FeeBreakdown {
  baseFee: number
  perKmFee: number
  distanceKm: number
  raw: number
  free: boolean
  total: number
  source: 'settings' | 'zone'
}

/**
 * Compute delivery fee from AppSettings (or matching DeliveryZone).
 * Formula: base + perKm × max(0, ceil(distance - 1))
 * If subtotal >= freeAbove (and set), fee = 0.
 *
 * This is the single source of truth for delivery pricing.
 * Admin can change values from /admin/settings — no code changes required.
 */
export async function computeDeliveryFee(opts: {
  distanceKm: number
  subtotal: number
  postalCode?: string
}): Promise<FeeBreakdown> {
  const settings = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })

  // Find a matching active zone (priority desc); fallback to settings
  let base = settings?.deliveryBaseFee ?? 5
  let perKm = settings?.deliveryPerKmFee ?? 1
  let freeAbove = settings?.deliveryFreeAbove ?? null
  let source: 'settings' | 'zone' = 'settings'

  if (opts.postalCode) {
    const zone = await prisma.deliveryZone.findFirst({
      where: { isActive: true, postalCode: opts.postalCode },
      orderBy: { priority: 'desc' },
    })
    if (zone) {
      base = zone.baseFee
      perKm = zone.perKmFee
      freeAbove = zone.freeAbove ?? null
      source = 'zone'
    }
  }

  const distance = Math.max(0, opts.distanceKm)
  const extraKm = Math.max(0, Math.floor(distance) - 1)
  const raw = base + extraKm * perKm

  const free = freeAbove != null && opts.subtotal >= freeAbove
  const total = free ? 0 : Math.round(raw * 100) / 100

  return {
    baseFee: base,
    perKmFee: perKm,
    distanceKm: distance,
    raw: Math.round(raw * 100) / 100,
    free,
    total,
    source,
  }
}

/** Slug du commerce Auchan — seul commerce facturé à la commission (15 %). */
export const AUCHAN_RESTAURANT_SLUG = 'auchan-lege'

/**
 * Frais de service facturé au client — source de vérité côté serveur.
 * Auchan : commission de 15 % du sous-total. Les autres commerces : barème fixe.
 */
export function calculateServiceFee(restaurantSlug: string, subtotal: number): number {
  if (restaurantSlug === AUCHAN_RESTAURANT_SLUG) {
    return Math.round(subtotal * 0.15 * 100) / 100
  }
  const raw = subtotal * 0.12
  const roundedToHalf = Math.round(raw * 2) / 2
  return Math.min(8, Math.max(1, roundedToHalf))
}
