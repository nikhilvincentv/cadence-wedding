import React, { useState } from 'react'
import { runSeating } from '../api.js'
import { Modal, Field } from '../components/Modal.jsx'

const uid = () => Math.random().toString(36).slice(2, 9)

const REL_COLOR = { family: 'var(--rose)', friends: 'var(--cyan)', coworkers: 'var(--gold)', other: 'var(--ink-faint)' }

export default function Seating({ data, persist, live }) {
  const tables = data.seatingTables || []
  const seatable = (data.guests || []).filter((g) => g.rsvp !== 'declined')

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState({})
  const [dragId, setDragId] = useState(null)

  const guestsAt = (tableId) => seatable.filter((g) => g.tableId === tableId)
  const unassigned = seatable.filter((g) => !g.tableId || !tables.some((t) => t.id === g.tableId))

  function saveTable() {
    const t = { id: draft.id || uid(), name: draft.name || `Table ${tables.length + 1}`, capacity: Number(draft.capacity) || 8 }
    const next = draft.id ? tables.map((x) => (x.id === t.id ? t : x)) : [...tables, t]
    persist({ ...data, seatingTables: next })
    setModal(false)
  }
  function removeTable(id) {
    const guests = (data.guests || []).map((g) => (g.tableId === id ? { ...g, tableId: null } : g))
    persist({ ...data, seatingTables: tables.filter((t) => t.id !== id), guests })
  }
  function assign(guestId, tableId) {
    const guests = (data.guests || []).map((g) => (g.id === guestId ? { ...g, tableId } : g))
    persist({ ...data, guests })
  }

  function quickAddTables(n) {
    const extra = Array.from({ length: n }, (_, i) => ({ id: uid(), name: `Table ${tables.length + i + 1}`, capacity: 8 }))
    persist({ ...data, seatingTables: [...tables, ...extra] })
  }

  async function generate() {
    if (tables.length === 0 || seatable.length === 0) return
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        guests: seatable.map((g) => ({ id: g.id, name: g.name, relationship: g.relationship, rsvp: g.rsvp, notes: g.notes })),
        tables: tables.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity })),
        notes,
      }
      const r = await runSeating(payload)
      setResult(r)
      if (Array.isArray(r.assignments)) {
        const map = {}
        r.assignments.forEach((a) => { map[a.guestId] = a.tableId })
        const guests = (data.guests || []).map((g) => (g.id in map ? { ...g, tableId: map[g.id] } : g))
        persist({ ...data, guests })
      }
    } catch (e) {
      setResult({ error: String(e.message || e) })
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (tableId) => (e) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    if (id) assign(id, tableId)
    setDragId(null)
  }
  const allowDrop = (e) => e.preventDefault()

  const GuestChip = ({ g }) => (
    <div
      className="seat-chip"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', g.id); setDragId(g.id) }}
      title={`${g.name} · ${g.relationship} · ${g.rsvp}`}
    >
      <span className="seat-dot" style={{ background: REL_COLOR[g.relationship] || 'var(--ink-faint)' }} />
      {g.name || 'Unnamed'}
    </div>
  )

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Seat everyone in seconds</h1>
          <div className="page-sub">Add your tables, then let AI arrange {seatable.length} guests — keeping families and friends together. Drag to fine-tune.</div>
        </div>
        <div className="row gap-sm wrap">
          <button className="btn sm" onClick={() => { setDraft({}); setModal(true) }}>+ Add table</button>
          <button className="btn primary" onClick={generate} disabled={loading || tables.length === 0 || seatable.length === 0}>
            {loading ? <><span className="spin" /> Arranging...</> : 'Generate with AI'}
          </button>
        </div>
      </div>

      {seatable.length === 0 && (
        <div className="card pad-lg"><span className="muted">No guests to seat yet. Add guests (not declined) in the <b>Guests</b> tab first.</span></div>
      )}

      {seatable.length > 0 && tables.length === 0 && (
        <div className="card pad-lg row between wrap" style={{ gap: 12 }}>
          <span className="muted">You have {seatable.length} guests and no tables yet.</span>
          <div className="row gap-sm">
            <button className="btn sm" onClick={() => quickAddTables(Math.ceil(seatable.length / 8))}>Auto-create {Math.ceil(seatable.length / 8)} tables (8 seats)</button>
            <button className="btn sm" onClick={() => { setDraft({}); setModal(true) }}>+ Add one</button>
          </div>
        </div>
      )}

      <div className="row gap-sm mt" style={{ alignItems: 'center' }}>
        <input className="field" style={{ maxWidth: 420 }} placeholder="Optional: any seating requests (e.g. keep Aunt May away from Uncle Joe)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <span className="faint" style={{ fontSize: 12 }}>{live ? 'Live AI seating' : 'Offline reasoner'}</span>
      </div>

      {result && !result.error && (
        <div className="card pad-lg mt fade-in">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>How AIsle seated them</h2>
            <span className={`badge ${result.source === 'model' ? 'ok' : 'ghost'}`}>{result.source === 'model' ? 'live model' : 'demo reasoner'}</span>
          </div>
          <div className="muted" style={{ fontSize: 14, marginBottom: 10 }}>{result.summary}</div>
          <div className="reasoning">
            {result.reasoning?.map((s, i) => <div className="step" key={i} style={{ animationDelay: `${i * 0.1}s` }}><b>{String(i + 1).padStart(2, '0')}</b> {s}</div>)}
          </div>
        </div>
      )}
      {result?.error && <div className="card pad-lg mt"><span className="badge high">error</span> <span className="muted">{result.error}</span></div>}

      <div className="seat-grid mt">
        <div className="seat-table unassigned" onDrop={onDrop(null)} onDragOver={allowDrop}>
          <div className="seat-head"><b>Unassigned</b><span className="faint mono" style={{ fontSize: 12 }}>{unassigned.length}</span></div>
          <div className="seat-body">
            {unassigned.map((g) => <GuestChip key={g.id} g={g} />)}
            {unassigned.length === 0 && <div className="faint" style={{ fontSize: 12 }}>Everyone is seated.</div>}
          </div>
        </div>

        {tables.map((t) => {
          const seated = guestsAt(t.id)
          const over = seated.length > t.capacity
          return (
            <div key={t.id} className="seat-table" onDrop={onDrop(t.id)} onDragOver={allowDrop}>
              <div className="seat-head">
                <b>{t.name}</b>
                <div className="row gap-sm">
                  <span className={`badge ${over ? 'high' : 'ghost'}`} style={{ fontSize: 10.5 }}>{seated.length}/{t.capacity}</span>
                  <button className="icon-btn" onClick={() => { setDraft(t); setModal(true) }}>edit</button>
                  <button className="icon-btn" onClick={() => removeTable(t.id)}>del</button>
                </div>
              </div>
              <div className="seat-body">
                {seated.map((g) => <GuestChip key={g.id} g={g} />)}
                {seated.length === 0 && <div className="faint" style={{ fontSize: 12 }}>Drop guests here</div>}
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={draft.id ? 'Edit table' : 'Add table'} onClose={() => setModal(false)} onSubmit={saveTable}>
          <Field label="Table name" placeholder="e.g. Head Table" value={draft.name || ''} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <Field label="Capacity" type="number" value={draft.capacity || ''} onChange={(e) => setDraft((d) => ({ ...d, capacity: e.target.value }))} />
        </Modal>
      )}
    </div>
  )
}
