import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { findNearbyVendors } from '../api.js'

const uid = () => Math.random().toString(36).slice(2, 9)
const km = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`)

export default function Venue({ data, persist }) {
  const venue = data.wedding?.venue || ''
  const cache = data.nearbyCache && data.nearbyCache.venue === venue ? data.nearbyCache : null

  const [result, setResult] = useState(cache ? { center: cache.center, vendors: cache.vendors } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mapEl = useRef(null)
  const mapObj = useRef(null)

  async function find() {
    if (!venue) return
    setLoading(true)
    setError('')
    const r = await findNearbyVendors(venue)
    if (r.error || !r.center) {
      setError(r.error || 'No results.')
    } else {
      setResult({ center: r.center, vendors: r.vendors })
      persist({ ...data, nearbyCache: { venue, center: r.center, vendors: r.vendors } })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!result?.center || !mapEl.current) return
    if (mapObj.current) { mapObj.current.remove(); mapObj.current = null }
    const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView([result.center.lat, result.center.lon], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map)
    L.circleMarker([result.center.lat, result.center.lon], { radius: 11, color: '#c67a68', fillColor: '#e0a89a', fillOpacity: 0.95, weight: 2 })
      .addTo(map).bindPopup('Your venue')
    result.vendors.forEach((v) => {
      L.circleMarker([v.lat, v.lon], { radius: 6, color: '#7fd4d0', fillColor: '#7fd4d0', fillOpacity: 0.75, weight: 1 })
        .addTo(map).bindPopup(`<b>${v.name}</b><br>${v.category} · ${km(v.distanceM)}`)
    })
    mapObj.current = map
    return () => { if (mapObj.current) { mapObj.current.remove(); mapObj.current = null } }
  }, [result])

  const existingNames = new Set((data.vendors || []).map((v) => (v.name || '').toLowerCase()))
  function addVendor(v) {
    const vendor = { id: uid(), name: v.name, category: v.category, contact: v.phone || '', status: 'pending', rating: null, website: v.website || '' }
    persist({ ...data, vendors: [...(data.vendors || []), vendor] })
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Real vendors near your venue</h1>
          <div className="page-sub">{venue ? `Around ${venue}` : 'Set your venue first (Dashboard → Edit wedding).'} · Live data from OpenStreetMap.</div>
        </div>
        {venue && <button className="btn primary" onClick={find} disabled={loading}>{loading ? <><span className="spin" /> Searching...</> : result ? 'Refresh nearby' : 'Find nearby vendors'}</button>}
      </div>

      {!venue && <div className="card pad-lg"><span className="muted">Add your venue in <b>Edit wedding</b> to see florists, hotels, bakeries and more nearby.</span></div>}
      {error && <div className="card pad-lg"><span className="badge high">heads up</span> <span className="muted">{error}</span></div>}

      {result && (
        <div className="grid" style={{ gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div ref={mapEl} className="venue-map" />
          </div>
          <div className="card pad-lg" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <div className="row between mb-sm">
              <h2 className="section-title" style={{ margin: 0 }}>{result.vendors.length} nearby</h2>
              <span className="faint" style={{ fontSize: 12 }}>closest first</span>
            </div>
            {result.vendors.length === 0 && <div className="faint" style={{ fontSize: 13 }}>No tagged vendors found nearby. Try a bigger nearby town as the venue.</div>}
            {result.vendors.map((v) => {
              const added = existingNames.has(v.name.toLowerCase())
              return (
                <div className="nearby-row" key={v.id}>
                  <div style={{ minWidth: 0 }}>
                    <div className="row gap-sm" style={{ alignItems: 'center' }}>
                      <span className="nearby-name">{v.name}</span>
                      <span className="badge ghost" style={{ fontSize: 10 }}>{v.category}</span>
                    </div>
                    <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
                      {km(v.distanceM)}{v.phone ? ` · ${v.phone}` : ''}{v.website ? <> · <a href={v.website} target="_blank" rel="noreferrer" className="nearby-link">website</a></> : ''}
                    </div>
                  </div>
                  <button className="btn sm" onClick={() => addVendor(v)} disabled={added}>{added ? 'Added' : '+ Add'}</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
