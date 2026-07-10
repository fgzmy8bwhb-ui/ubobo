/** 1 point gagné par euro de sous-total (hors frais), crédité à la livraison. */
export const LOYALTY_POINTS_PER_EURO = 1

/** Coût en points d'une livraison offerte. */
export const LOYALTY_FREE_DELIVERY_COST = 200

export function pointsEarnedFor(subtotal: number): number {
  return Math.floor(subtotal * LOYALTY_POINTS_PER_EURO)
}
