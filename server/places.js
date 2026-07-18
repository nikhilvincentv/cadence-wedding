const UA = 'CadenceWeddingApp/1.0 (wedding planner)'

const CATEGORIES = [
  { q: 'node["shop"="florist"]', label: 'Florist' },
  { q: 'node["tourism"="hotel"]', label: 'Hotel' },
  { q: 'node["tourism"="guest_house"]', label: 'Hotel' },
  { q: 'node["shop"="bakery"]', label: 'Bakery / Cake' },
  { q: 'node["shop"="confectionery"]', label: 'Bakery / Cake' },
  { q: 'node["shop"="beauty"]', label: 'Beauty / Spa' },
  { q: 'node["shop"="hairdresser"]', label: 'Hair' },
  { q: 'node["shop"="jewelry"]', label: 'Jewelry' },
  { q: 'node["shop"="bridal"]', label: 'Attire' },
  { q: 'node["shop"="photo"]', label: 'Photography' },
  { q: 'node["craft"="caterer"]', label: 'Catering' },
  { q: 'node["amenity"="events_venue"]', label: 'Event space' },
]

const LABEL_FOR = (tags) => {
  if (tags.shop === 'florist') return 'Florist'
  if (tags.tourism === 'hotel' || tags.tourism === 'guest_house' || tags.tourism === 'motel') return 'Hotel'
  if (tags.shop === 'bakery' || tags.shop === 'confectionery' || tags.shop === 'pastry') return 'Bakery / Cake'
  if (tags.shop === 'beauty') return 'Beauty / Spa'
  if (tags.shop === 'hairdresser') return 'Hair'
  if (tags.shop === 'jewelry') return 'Jewelry'
  if (tags.shop === 'bridal') return 'Attire'
  if (tags.shop === 'photo' || tags.craft === 'photographer') return 'Photography'
  if (tags.craft === 'caterer') return 'Catering'
  if (tags.amenity === 'events_venue') return 'Event space'
  return 'Vendor'
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

async function fetchWithTimeout(url, opts = {}, ms = 25000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

export async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
  const res = await fetchWithTimeout(url, { headers: { 'User-Agent': UA } }, 15000)
  if (!res.ok) throw new Error(`Geocode ${res.status}`)
  const arr = await res.json()
  if (!arr[0]) return null
  return { lat: Number(arr[0].lat), lon: Number(arr[0].lon), label: arr[0].display_name }
}

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

export async function nearby(lat, lon, radius = 10000) {
  const body = `[out:json][timeout:20];(${CATEGORIES.map((c) => `${c.q}(around:${radius},${lat},${lon});`).join('')});out center 80;`
  let elements = null
  let lastErr
  for (const ep of OVERPASS_MIRRORS) {
    try {
      const res = await fetchWithTimeout(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
        body: 'data=' + encodeURIComponent(body),
      }, 28000)
      if (!res.ok) throw new Error(`Overpass ${res.status}`)
      const json = await res.json()
      elements = json.elements || []
      break
    } catch (err) {
      lastErr = err
    }
  }
  if (elements === null) throw lastErr || new Error('Overpass unreachable')

  const seen = new Set()
  const vendors = []
  for (const el of elements) {
    const tags = el.tags || {}
    if (!tags.name) continue
    const plat = el.lat ?? el.center?.lat
    const plon = el.lon ?? el.center?.lon
    if (plat == null || plon == null) continue
    const key = tags.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    vendors.push({
      id: `osm_${el.type}_${el.id}`,
      name: tags.name,
      category: LABEL_FOR(tags),
      lat: plat,
      lon: plon,
      distanceM: haversine(lat, lon, plat, plon),
      website: tags.website || tags['contact:website'] || '',
      phone: tags.phone || tags['contact:phone'] || '',
    })
  }
  vendors.sort((a, b) => a.distanceM - b.distanceM)
  return vendors.slice(0, 40)
}

export async function findNearby(venue) {
  const center = await geocode(venue)
  if (!center) return { error: 'Could not find that venue address.' }
  const vendors = await nearby(center.lat, center.lon)
  return { center, vendors }
}
