export const DELIVERY_ZONE = {
  name: 'Pointe du Cap Ferret',
  description: "Du village jusqu'au début de la piste cyclable",
  operationalCenter: { lat: 44.6435, lng: -1.249 },
  maxDistanceKm: 4,
  bounds: { north: 44.662, south: 44.6328, east: -1.239, west: -1.26 },
  postalCode: '33970',
  commune: 'Lège-Cap-Ferret',
}

/** Frais fixes de déplacement (trajet) */
export const DELIVERY_FIXED_FEE = 7.90

/** Taux de préparation / picking (% du panier) */
export const PICKING_RATE = 0.10

/**
 * Frais fixes de livraison (trajet).
 * Indépendants du montant du panier.
 */
export function calculateDeliveryFee(_distanceKm?: number): number {
  return DELIVERY_FIXED_FEE
}

/**
 * Frais de préparation / picking = 10 % du sous-total.
 * Rémunère le temps passé à faire les courses dans les rayons.
 */
export function calculatePickingFee(subtotal: number): number {
  return Math.round(subtotal * PICKING_RATE * 100) / 100
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' €'
}
