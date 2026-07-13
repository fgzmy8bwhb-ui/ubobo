export const DELIVERY_ZONE = {
  name: 'Pointe du Cap Ferret',
  description: "Du village jusqu'à Piraillan",
  operationalCenter: { lat: 44.6435, lng: -1.249 },
  maxDistanceKm: 9,
  bounds: { north: 44.712, south: 44.6328, east: -1.225, west: -1.26 },
  postalCode: '33970',
  commune: 'Lège-Cap-Ferret',
}

/**
 * Frais de service UBOBO selon le montant du panier.
 * Doit rester identique à calculateServiceFee côté serveur (server/lib/delivery.ts).
 */
export function calculatePickingFee(subtotal: number): number {
  const raw = subtotal * 0.12
  const roundedToHalf = Math.round(raw * 2) / 2
  return Math.min(8, Math.max(1, roundedToHalf))
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' €'
}
