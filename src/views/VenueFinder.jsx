import React from 'react'
import { fmtMoney } from '../api.js'
import { venueSet } from '../journey.js'

const uid = () => Math.random().toString(36).slice(2, 9)

function Stars({ rating }) {
  const n = Math.round(Number(rating) || 0)
  return (
    <span aria-label={`Rating ${rating}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? 'var(--gold)' : 'var(--ink-faint)', fontSize: 13 }}>★</span>
      ))}
      <span className="faint" style={{ fontSize: 12, marginLeft: 4 }}>{Number(rating).toFixed(1)}</span>
    </span>
  )
}

export default function VenueFinder({ data, persist, setView }) {
  const venues = data.recommendations?.venues || []
  const chosen = data.venue || null

  function toggleSave(id) {
    const next = venues.map((v) => (v.id === id ? { ...v, saved: !v.saved } : v))
    persist({ ...data, recommendations: { ...data.recommendations, venues: next } })
  }

  function setVenue(v) {
    const budgetCategories = data.budgetCategories || []
    const hasVenueCat = budgetCategories.some((c) => /venue/i.test(c.name))
    const nextBudget = hasVenueCat
      ? budgetCategories.map((c) => (/venue/i.test(c.name) ? { ...c, projected: c.projected || v.priceFrom || 0 } : c))
      : [{ id: uid(), name: 'Venue', projected: v.priceFrom || 0, actual: 0 }, ...budgetCategories]
    persist({
      ...data,
      venue: v,
      wedding: { ...data.wedding, venue: v.name, venueAddress: v.address, guestCount: data.wedding.guestCount || v.capacity },
      budgetCategories: nextBudget,
    })
  }

  function changeVenue() {
    persist({ ...data, venue: null })
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">{venueSet(data) ? 'Your venue' : 'Find your venue'}</h1>
          <div className="page-sub">
            {venueSet(data)
              ? 'This anchors your whole plan — date, capacity, and location.'
              : `Cadence picked these for ${data.wedding?.venue || 'your area'} based on your style, guest count, and budget.`}
          </div>
        </div>
        {!venueSet(data) && <span className="badge ghost" style={{ fontSize: 12 }}>{venues.length} venues</span>}
      </div>

      {venueSet(data) && (
        <div className="card pad-lg" style={{ marginBottom: 18, borderLeft: '3px solid var(--green)' }}>
          <div className="row between wrap" style={{ gap: 14 }}>
            <div>
              <div className="row gap-sm" style={{ alignItems: 'center', marginBottom: 4 }}>
                <span className="badge ok">✅ Venue set</span>
                <span className="badge low">{chosen.style}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{chosen.name}</div>
              <div className="faint" style={{ fontSize: 13, marginTop: 2 }}>
                {chosen.address} · up to {chosen.capacity} guests · {fmtMoney(chosen.priceFrom)}+
              </div>
              <div className="faint" style={{ fontSize: 13, marginTop: 6 }}>
                Contact: {chosen.contactName} · {chosen.email} · {chosen.phone}
              </div>
            </div>
            <div className="row gap-sm">
              <button className="btn sm" onClick={changeVenue}>Change venue</button>
              <button className="btn primary sm" onClick={() => setView('vendors')}>Find vendors →</button>
            </div>
          </div>
        </div>
      )}

      {!venueSet(data) && venues.length === 0 && (
        <div className="card pad-lg" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⌖</div>
          <div className="faint" style={{ fontSize: 14 }}>Cadence is still finding venues for you…</div>
        </div>
      )}

      <div className="vendor-grid">
        {venues.map((v) => {
          const isChosen = chosen && chosen.id === v.id
          return (
            <div key={v.id} className="vendor-card" style={isChosen ? { borderColor: 'var(--green)' } : undefined}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{v.name}</div>
                <button className="icon-btn" onClick={() => toggleSave(v.id)} title="Save" style={{ fontSize: 16 }}>
                  {v.saved ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>{v.tagline}</div>
              <div className="row gap-sm wrap" style={{ marginBottom: 8 }}>
                <span className="badge low">{v.style}</span>
                <span className="badge ghost">up to {v.capacity}</span>
                <Stars rating={v.rating} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
                {fmtMoney(v.priceFrom)}<span className="faint" style={{ fontSize: 12, fontWeight: 400 }}> starting</span>
              </div>
              <ul style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
                {(v.highlights || []).map((h, i) => (
                  <li key={i} className="faint" style={{ fontSize: 12, marginBottom: 3 }}>· {h}</li>
                ))}
              </ul>
              <div className="faint" style={{ fontSize: 11.5, marginBottom: 10 }}>{v.address}</div>
              <div className="row gap-sm">
                {isChosen ? (
                  <span className="badge ok" style={{ fontSize: 11 }}>✅ Your venue</span>
                ) : (
                  <button className="btn primary sm" style={{ flex: 1 }} onClick={() => setVenue(v)}>Set as venue</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
