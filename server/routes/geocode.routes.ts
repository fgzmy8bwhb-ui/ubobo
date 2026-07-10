import { Router } from 'express'
import { z } from 'zod'

const router = Router()

const ADRESSE_URL = 'https://api-adresse.data.gouv.fr/search/'
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving'

// Autocomplétion via la Base Adresse Nationale (conçue pour la recherche partielle),
// centrée sur Lège-Cap-Ferret. Résultats remis au format Nominatim attendu par le front.
router.get('/search', async (req, res) => {
  const parsed = z.object({ q: z.string().min(3) }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const params = new URLSearchParams({
    q: parsed.data.q,
    limit: '8',
    lat: '44.6358',
    lon: '-1.2510',
    citycode: '33236', // Lège-Cap-Ferret
  })

  const upstream = await fetch(`${ADRESSE_URL}?${params}`)
  if (!upstream.ok) {
    console.error('[geocode]', upstream.status, await upstream.text().catch(() => ''))
    return res.status(502).json({ error: 'GEOCODE_UPSTREAM_ERROR' })
  }

  const data = await upstream.json()
  const suggestions = (data.features ?? []).map((f: any, i: number) => ({
    place_id: f.properties.id ?? i,
    display_name: f.properties.label,
    address: {
      house_number: f.properties.housenumber,
      road: f.properties.street ?? f.properties.name,
      postcode: f.properties.postcode,
      city: f.properties.city,
    },
  }))
  res.json(suggestions)
})

router.get('/address', async (req, res) => {
  const parsed = z.object({
    q: z.string().min(1),
    lat: z.string().optional(),
    lon: z.string().optional(),
  }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const params = new URLSearchParams({ q: parsed.data.q, limit: '1' })
  if (parsed.data.lat) params.set('lat', parsed.data.lat)
  if (parsed.data.lon) params.set('lon', parsed.data.lon)

  const upstream = await fetch(`${ADRESSE_URL}?${params}`)
  if (!upstream.ok) {
    console.error('[geocode/address]', upstream.status, await upstream.text().catch(() => ''))
    return res.status(502).json({ error: 'GEOCODE_UPSTREAM_ERROR' })
  }
  res.json(await upstream.json())
})

router.get('/route', async (req, res) => {
  const parsed = z.object({
    fromLng: z.string(), fromLat: z.string(),
    toLng: z.string(), toLat: z.string(),
  }).safeParse(req.query)
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_INPUT' })

  const { fromLng, fromLat, toLng, toLat } = parsed.data
  const upstream = await fetch(
    `${OSRM_URL}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
  )
  if (!upstream.ok) {
    console.error('[geocode/route]', upstream.status, await upstream.text().catch(() => ''))
    return res.status(502).json({ error: 'ROUTE_UPSTREAM_ERROR' })
  }
  res.json(await upstream.json())
})

export default router
