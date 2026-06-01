export const DELIVERY_ZONE = {
  name: 'Pointe du Cap Ferret',
  description: "Du village jusqu'au début de la piste cyclable",
  operationalCenter: { lat: 44.6435, lng: -1.249 },
  maxDistanceKm: 4,
  bounds: { north: 44.662, south: 44.6328, east: -1.239, west: -1.26 },
  postalCode: '33970',
  commune: 'Lège-Cap-Ferret',
}

export function calculateDeliveryFee(distanceKm: number): number {
  const BASE_FEE = 5.0
  const PER_KM = 1.0
  const extraKm = Math.max(0, Math.floor(distanceKm) - 1)
  return BASE_FEE + extraKm * PER_KM
}

export function formatPrice(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' €'
}
