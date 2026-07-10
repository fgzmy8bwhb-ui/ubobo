import { useState, useEffect, useRef } from 'react'

interface Coords { lat: number; lng: number }

export interface DeliveryResult {
  deliveryFee: number | null
  distanceKm: number | null
  durationMin: number | null
  loading: boolean
  error: string | null
}

const BASE_FEE = 3.00
const RATE_PER_MIN = 0.50

// Point de départ fixe : Phare du Cap Ferret
const PHARE_CAP_FERRET: Coords = { lat: 44.6358, lng: -1.2510 }

// Bounding box presqu'île jusqu'à L'Herbe / Le Canon
const PENINSULA_BBOX = {
  minLat: 44.620,
  maxLat: 44.682,
  minLng: -1.300,
  maxLng: -1.200,
}

function isInPeninsula(coords: Coords): boolean {
  return (
    coords.lat >= PENINSULA_BBOX.minLat &&
    coords.lat <= PENINSULA_BBOX.maxLat &&
    coords.lng >= PENINSULA_BBOX.minLng &&
    coords.lng <= PENINSULA_BBOX.maxLng
  )
}

// ─── Géocodage adresse client ─────────────────────────────────────────────────

async function geocodeClient(address: string): Promise<Coords> {
  const hasCity = /lège|cap.ferret|lege|andernos|arcachon/i.test(address)
  const query = hasCity ? address : `${address} Lège-Cap-Ferret`
  const res = await fetch(
    `/api/geocode/address?q=${encodeURIComponent(query)}&lat=${PHARE_CAP_FERRET.lat}&lon=${PHARE_CAP_FERRET.lng}`
  )
  if (!res.ok) throw new Error('Erreur géocodage adresse client.')
  const data = await res.json()
  const feature = data.features?.[0]
  if (!feature) throw new Error(`Adresse introuvable : "${address}". Précisez la rue et la ville.`)
  const [lng, lat] = feature.geometry.coordinates
  return { lat, lng }
}

// ─── Routage OSRM depuis le Phare ─────────────────────────────────────────────

async function routeFromPhare(clientPos: Coords): Promise<{ distanceKm: number; durationMin: number }> {
  const from = PHARE_CAP_FERRET
  const url =
    `/api/geocode/route?fromLng=${from.lng}&fromLat=${from.lat}` +
    `&toLng=${clientPos.lng}&toLat=${clientPos.lat}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erreur calcul itinéraire.')
  const data = await res.json()
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('Itinéraire introuvable.')
  const route = data.routes[0]
  const distanceKm = Math.round(route.distance / 100) / 10   // mètres → km arrondi 1 déc.
  const durationMin = Math.round(route.duration / 60)         // secondes → min
  return { distanceKm, durationMin }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeliveryCalculator(
  _restaurantCoords: Coords | undefined,
  customerAddress: string,
): DeliveryResult {
  const [result, setResult] = useState<DeliveryResult>({
    deliveryFee: null, distanceKm: null, durationMin: null, loading: false, error: null,
  })

  const prevAddress = useRef('')
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!customerAddress || customerAddress.trim().length < 8) return
    if (prevAddress.current === customerAddress) return
    prevAddress.current = customerAddress
    cancelRef.current = false

    setResult({ deliveryFee: null, distanceKm: null, durationMin: null, loading: true, error: null })

    ;(async () => {
      try {
        const clientPos = await geocodeClient(customerAddress)
        if (cancelRef.current) return

        if (!isInPeninsula(clientPos)) {
          setResult({ deliveryFee: null, distanceKm: null, durationMin: null, loading: false, error: 'out_of_zone' })
          return
        }

        const { distanceKm, durationMin } = await routeFromPhare(clientPos)
        if (cancelRef.current) return

        const deliveryFee = Math.round((BASE_FEE + durationMin * RATE_PER_MIN) * 100) / 100

        setResult({ deliveryFee, distanceKm, durationMin, loading: false, error: null })
      } catch (err: any) {
        if (!cancelRef.current)
          setResult({ deliveryFee: null, distanceKm: null, durationMin: null, loading: false, error: err.message })
      }
    })()

    return () => { cancelRef.current = true }
  }, [customerAddress])

  return result
}
