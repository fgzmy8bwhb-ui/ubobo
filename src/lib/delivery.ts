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

/**
 * Frais fixes de livraison (trajet).
 * Indépendants du montant du panier.
 */
export function calculateDeliveryFee(_distanceKm?: number): number {
  return DELIVERY_FIXED_FEE
}

/**
 * Frais de service UBOBO selon le montant du panier.
 */
export function calculatePickingFee(subtotal: number): number {
  if (subtotal < 5)    return 3
  if (subtotal <= 10)  return 4
  if (subtotal <= 20)  return 5
  if (subtotal <= 30)  return 8
  if (subtotal <= 50)  return 10
  return 15
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' €'
}
