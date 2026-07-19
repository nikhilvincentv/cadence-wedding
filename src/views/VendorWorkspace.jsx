import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import VendorProfile from '../components/VendorProfile.jsx'
import { findNearbyVendors } from '../api.js'

const uid = () => Math.random().toString(36).slice(2, 9)
const km = (m) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`)

// ── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  const n = Math.round(Number(rating) || 0)
  return (
    <span className="vendor-rating" aria-label={`Rating: ${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? 'var(--gold)' : 'var(--ink-faint)', fontSize: 14 }}>★</span>
      ))}
    </span>
  )
}

function PaidProgressBar({ vendorId, payments }) {
  const vp = (payments || []).filter((p) => p.vendorId === vendorId)
  const total = vp.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const paid = vp.filter((p) => p.status === 'paid').reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0
  return (
    <div>
      <div className="row between" style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}>
        <span>Paid</span><span>{pct}%</span>
      </div>
      <div className="bar vendor-progress-bar">
        <i style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))' }} />
      </div>
    </div>
  )
}

function nextPaymentDue(vendorId, payments) {
  return (payments || [])
    .filter((p) => p.vendorId === vendorId && p.status !== 'paid' && p.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return isNaN(d) ? dateStr : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadge(status) {
  if (status === 'booked') return 'badge ok'
  if (status === 'active') return 'badge info'
  if (status === 'contract-out') return 'badge warn'
  return 'badge ghost'
}

function statusLabel(status) {
  if (status === 'contract-out') return 'Contract out'
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ── Vendor Card ──────────────────────────────────────────────────────────────

function VendorCard({ vendor, payments, onClick }) {
  const next = nextPaymentDue(vendor.id, payments)
  return (
    <div
      className="vendor-card vendor-card-clickable"
      onClick={() => onClick(vendor)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(vendor)}
      aria-label={`Open profile for ${vendor.name}`}
    >
      <div className="row between" style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor.name || <span className="faint">Unnamed</span>}
        </div>
        <span className={statusBadge(vendor.status)} style={{ fontSize: 10, marginLeft: 6, flexShrink: 0 }}>
          {statusLabel(vendor.status)}
        </span>
      </div>
      <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
        {vendor.category || 'Uncategorized'}{vendor.contact ? ` · ${vendor.contact}` : ''}
      </div>
      {vendor.rating != null && vendor.rating !== '' && (
        <div style={{ marginBottom: 8 }}><StarRating rating={vendor.rating} /></div>
      )}
      <div style={{ marginBottom: 8 }}>
        <PaidProgressBar vendorId={vendor.id} payments={payments} />
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-dim)' }}>
        {next ? (
          <><span style={{ color: 'var(--amber)' }}>Next due: </span>{fmtDate(next.dueDate)}{next.label ? ` · ${next.label}` : ''}</>
        ) : (
          <span className="faint">No upcoming payments</span>
        )}
      </div>
    </div>
  )
}

// ── Find Nearby tab ──────────────────────────────────────────────────────────

function FindNearby({ data, persist }) {
  const venue = data.wedding?.venue || ''
  const cache = data.nearbyCache?.venue === venue ? data.nearbyCache : null
  const [result, setResult] = useState(cache ? { center: cache.center, vendors: cache.vendors } : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mapEl = useRef(null)
  const mapObj = useRef(null)

  async function find() {
    if (!venue) return
    setLoading(true); setError('')
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

  if (!venue) {
    return <div className="card pad-lg"><span className="muted">Add your venue in <b>Edit wedding</b> to find nearby vendors on the map.</span></div>
  }

  return (
    <div>
      <div className="row between mb-sm" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="page-sub" style={{ margin: 0 }}>Around {venue} · Live data from OpenStreetMap.</div>
        <button className="btn primary sm" onClick={find} disabled={loading}>
          {loading ? <><span className="spin" /> Searching...</> : result ? 'Refresh nearby' : 'Find nearby vendors'}
        </button>
      </div>

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
            {result.vendors.length === 0 && (
              <div className="faint" style={{ fontSize: 13 }}>No tagged vendors found nearby. Try a bigger nearby town as the venue.</div>
            )}
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
                      {km(v.distanceM)}{v.phone ? ` · ${v.phone}` : ''}
                      {v.website ? <> · <a href={v.website} target="_blank" rel="noreferrer" className="nearby-link">website</a></> : ''}
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

// ── VendorWorkspace ──────────────────────────────────────────────────────────

export default function VendorWorkspace({ data, persist, setView }) {
  const vendors = data.vendors || []
  const payments = data.payments || []
  const [tab, setTab] = useState('yours')
  const [selectedVendor, setSelectedVendor] = useState(null)

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Vendors</h1>
          <div className="page-sub">
            {tab === 'yours'
              ? 'Click any card to open the full vendor profile.'
              : 'Find real vendors near your venue and add them instantly.'}
          </div>
        </div>
        <div className="row gap-sm">
          <button className={`btn sm ${tab === 'yours' ? 'primary' : 'ghost'}`} onClick={() => setTab('yours')}>
            Your vendors
          </button>
          <button className={`btn sm ${tab === 'find' ? 'primary' : 'ghost'}`} onClick={() => setTab('find')}>
            Find nearby
          </button>
        </div>
      </div>

      {tab === 'yours' && (
        <>
          {vendors.length === 0 ? (
            <div className="card pad-lg" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
              <div className="faint" style={{ fontSize: 14, marginBottom: 16 }}>
                No vendors yet. Add them from the Dashboard or find nearby ones.
              </div>
              <div className="row gap-sm" style={{ justifyContent: 'center' }}>
                <button className="btn sm" onClick={() => setView('home')}>Go to Dashboard</button>
                <button className="btn sm primary" onClick={() => setTab('find')}>Find nearby</button>
              </div>
            </div>
          ) : (
            <div className="vendor-grid">
              {vendors.map((v) => (
                <VendorCard key={v.id} vendor={v} payments={payments} onClick={setSelectedVendor} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'find' && <FindNearby data={data} persist={persist} />}

      {selectedVendor && (
        <VendorProfile
          vendor={selectedVendor}
          data={data}
          persist={persist}
          setView={setView}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  )
}
