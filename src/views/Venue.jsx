import React, { useState } from 'react'

export default function Venue({ data, persist }) {
  const wedding = data.wedding || {}
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({})

  function startEdit() {
    setDraft({
      venue: wedding.venue || '',
      date: wedding.date || '',
      dateLabel: wedding.dateLabel || '',
      sunset: wedding.sunset || '',
      guestCount: wedding.guestCount || '',
    })
    setEditing(true)
  }

  function save() {
    persist({
      ...data,
      wedding: {
        ...wedding,
        venue: draft.venue,
        date: draft.date,
        dateLabel: draft.dateLabel || draft.date,
        sunset: draft.sunset,
        guestCount: Number(draft.guestCount) || wedding.guestCount,
      },
    })
    setEditing(false)
  }

  const rows = [
    { label: 'Venue', value: wedding.venue },
    { label: 'Date', value: wedding.dateLabel || wedding.date },
    { label: 'Sunset', value: wedding.sunset },
    { label: 'Guest count', value: wedding.guestCount },
    { label: 'Couple', value: wedding.couple },
  ]

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Your venue</h1>
          <div className="page-sub">Key details about your wedding day location.</div>
        </div>
        {!editing && (
          <button className="btn sm" onClick={startEdit}>Edit</button>
        )}
      </div>

      {!editing ? (
        <div className="card pad-lg" style={{ maxWidth: 520 }}>
          {rows.map(({ label, value }) => (
            <div key={label} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span className="faint" style={{ fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{value || <span className="faint">—</span>}</span>
            </div>
          ))}
          <button className="btn sm" style={{ marginTop: 18 }} onClick={startEdit}>Edit details</button>
        </div>
      ) : (
        <div className="card pad-lg" style={{ maxWidth: 520 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label>
              <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Venue name</div>
              <input className="field" value={draft.venue} onChange={(e) => setDraft((d) => ({ ...d, venue: e.target.value }))} placeholder="e.g. Willows Lodge, Woodinville WA" />
            </label>
            <label>
              <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Date (YYYY-MM-DD)</div>
              <input className="field" type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
            </label>
            <label>
              <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Date label (displayed)</div>
              <input className="field" value={draft.dateLabel} onChange={(e) => setDraft((d) => ({ ...d, dateLabel: e.target.value }))} placeholder="e.g. September 12, 2026" />
            </label>
            <label>
              <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Sunset time</div>
              <input className="field" value={draft.sunset} onChange={(e) => setDraft((d) => ({ ...d, sunset: e.target.value }))} placeholder="e.g. 7:48 PM" />
            </label>
            <label>
              <div className="faint" style={{ fontSize: 12, marginBottom: 4 }}>Guest count</div>
              <input className="field" type="number" value={draft.guestCount} onChange={(e) => setDraft((d) => ({ ...d, guestCount: e.target.value }))} />
            </label>
          </div>
          <div className="row gap-sm" style={{ marginTop: 18 }}>
            <button className="btn primary sm" onClick={save}>Save</button>
            <button className="btn sm ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
