import { useState, useEffect, useRef, useMemo } from 'react'
import { useSettings } from '@/hooks/useSettings'

interface Coords { lat: number; lng: number }

export interface DeliveryResult {
  deliveryFee: number | null
  distanceKm: number | null
  durationMin: number | null
  loading: boolean
  error: string | null
}

// Point de départ fixe : Phare du Cap Ferret
const PHARE_CAP_FERRET: Coords = { lat: 44.6358, lng: -1.2510 }

// Bounding box presqu'île jusqu'à Piraillan
const PENINSULA_BBOX = {
  minLat: 44.620,
  maxLat: 44.712,
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
  const [route, setRoute] = useState<{ distanceKm: number | null; durationMin: number | null; loading: boolean; error: string | null }>({
    distanceKm: null, durationMin: null, loading: false, error: null,
  })

  const prevAddress = useRef('')
  const cancelRef = useRef(false)
  const baseFee = useSettings((s) => s.settings?.deliveryBaseFee ?? 3)
  const ratePerMin = useSettings((s) => s.settings?.deliveryPerKmFee ?? 0.5)

  useEffect(() => {
    if (!customerAddress || customerAddress.trim().length < 8) return
    if (prevAddress.current === customerAddress) return
    prevAddress.current = customerAddress
    cancelRef.current = false

    setRoute({ distanceKm: null, durationMin: null, loading: true, error: null })

    ;(async () => {
      try {
        const clientPos = await geocodeClient(customerAddress)
        if (cancelRef.current) return

        if (!isInPeninsula(clientPos)) {
          setRoute({ distanceKm: null, durationMin: null, loading: false, error: 'out_of_zone' })
          return
        }

        const { distanceKm, durationMin } = await routeFromPhare(clientPos)
        if (cancelRef.current) return

        setRoute({ distanceKm, durationMin, loading: false, error: null })
      } catch (err: any) {
        if (!cancelRef.current)
          setRoute({ distanceKm: null, durationMin: null, loading: false, error: err.message })
      }
    })()

    return () => { cancelRef.current = true }
  }, [customerAddress])

  // Recalculé à chaque changement de tarif (ex: offre spéciale activée/désactivée en admin),
  // sans re-géocoder ni recalculer l'itinéraire.
  const deliveryFee = useMemo(() => {
    if (route.durationMin === null) return null
    return Math.round((baseFee + route.durationMin * ratePerMin) * 100) / 100
  }, [route.durationMin, baseFee, ratePerMin])

  return { ...route, deliveryFee }
}
