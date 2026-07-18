import React, { useState } from 'react'

const uid = () => Math.random().toString(36).slice(2, 9)

const RSVP_OPTIONS = ['confirmed', 'declined', 'awaiting']
const MEAL_OPTIONS = ['', 'chicken', 'fish', 'vegan', 'kids']
const RELATIONSHIP_OPTIONS = ['family', 'friends', 'coworkers', 'other']
const LODGING_OPTIONS = ['none', 'needed', 'arranged']

function defaultGuest() {
  return {
    id: uid(),
    name: '',
    rsvp: 'awaiting',
    meal: '',
    gift: '',
    relationship: 'friends',
    lodging: 'none',
    transport: false,
    notes: '',
    tableId: null,
  }
}

export default function Guests({ data, persist }) {
  const guests = data.guests || []

  // ── Editing state ──────────────────────────────────────────────
  // editing: { guestId, field } | null
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [nameError, setNameError] = useState(null) // guestId with error

  // ── Selection state ────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState(new Set())

  // ── Filter state ───────────────────────────────────────────────
  const [filterRsvp, setFilterRsvp] = useState('') // '' = all
  const [filterRelationship, setFilterRelationship] = useState('') // '' = all

  // ── Bulk action state ──────────────────────────────────────────
  const [bulkRsvp, setBulkRsvp] = useState('')
  const [bulkMeal, setBulkMeal] = useState('')

  // ── Derived / filtered rows ────────────────────────────────────
  const filteredGuests = guests.filter((g) => {
    if (filterRsvp && g.rsvp !== filterRsvp) return false
    if (filterRelationship && g.relationship !== filterRelationship) return false
    return true
  })

  // ── Aggregate counts ───────────────────────────────────────────
  const totalCount = guests.length
  const confirmedCount = guests.filter((g) => g.rsvp === 'confirmed').length
  const declinedCount = guests.filter((g) => g.rsvp === 'declined').length
  const awaitingCount = guests.filter((g) => g.rsvp === 'awaiting').length

  // ── Editing helpers ────────────────────────────────────────────
  function startEdit(guestId, field, currentValue) {
    // Commit any in-progress edit first
    if (editing) commitEdit()
    setEditing({ guestId, field })
    setEditVal(String(currentValue ?? ''))
  }

  function commitEdit() {
    if (!editing) return
    const { guestId, field } = editing

    // Validate name
    if (field === 'name') {
      if (!editVal.trim()) {
        setNameError(guestId)
        setEditing(null)
        setEditVal('')
        return
      }
      setNameError(null)
    }

    const updated = guests.map((g) => {
      if (g.id !== guestId) return g
      return { ...g, [field]: editVal }
    })
    persist({ ...data, guests: updated })
    setEditing(null)
    setEditVal('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      setEditing(null)
      setEditVal('')
      setNameError(null)
    }
  }

  // Inline select change (for enum fields — commit immediately)
  function commitSelectEdit(guestId, field, value) {
    const updated = guests.map((g) => {
      if (g.id !== guestId) return g
      return { ...g, [field]: value }
    })
    persist({ ...data, guests: updated })
    setEditing(null)
  }

  // Transport toggle
  function toggleTransport(guestId) {
    const updated = guests.map((g) =>
      g.id === guestId ? { ...g, transport: !g.transport } : g
    )
    persist({ ...data, guests: updated })
  }

  // ── Add new guest ──────────────────────────────────────────────
  function addGuest() {
    const newGuest = defaultGuest()
    const updated = [...guests, newGuest]
    persist({ ...data, guests: updated })
    setTimeout(() => startEdit(newGuest.id, 'name', ''), 50)
  }

  // ── Delete guest ───────────────────────────────────────────────
  function deleteGuest(id) {
    const updated = guests.filter((g) => g.id !== id)
    persist({ ...data, guests: updated })
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // ── Selection helpers ──────────────────────────────────────────
  const allFilteredSelected =
    filteredGuests.length > 0 && filteredGuests.every((g) => selectedIds.has(g.id))

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredGuests.map((g) => g.id)))
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Bulk actions ───────────────────────────────────────────────
  function applyBulkRsvp() {
    if (!bulkRsvp || selectedIds.size === 0) return
    const updated = guests.map((g) =>
      selectedIds.has(g.id) ? { ...g, rsvp: bulkRsvp } : g
    )
    persist({ ...data, guests: updated })
    setBulkRsvp('')
  }

  function applyBulkMeal() {
    if (!bulkMeal || selectedIds.size === 0) return
    const updated = guests.map((g) =>
      selectedIds.has(g.id) ? { ...g, meal: bulkMeal } : g
    )
    persist({ ...data, guests: updated })
    setBulkMeal('')
  }

  // ── RSVP badge style ───────────────────────────────────────────
  function rsvpClass(rsvp) {
    if (rsvp === 'confirmed') return 'badge ok'
    if (rsvp === 'declined') return 'badge high'
    return 'badge ghost'
  }

  function rsvpLabel(rsvp) {
    if (rsvp === 'confirmed') return '✓ Confirmed'
    if (rsvp === 'declined') return '✕ Declined'
    return '⋯ Awaiting'
  }

  return (
    <div className="fade-in">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <h1 className="page">Your guest list</h1>
          <div className="page-sub">
            Track RSVPs, meals, gifts, lodging, and transport for every guest.
          </div>
        </div>
        <button className="btn primary sm" onClick={addGuest}>+ Add guest</button>
      </div>

      {/* ── Aggregate count bar ──────────────────────────────────── */}
      <div className="guest-count-bar">
        <div className="guest-count-item">
          <span className="guest-count-num">{totalCount}</span>
          <span className="guest-count-label">Total</span>
        </div>
        <div className="guest-count-divider" />
        <div className="guest-count-item">
          <span className="guest-count-num" style={{ color: 'var(--green)' }}>{confirmedCount}</span>
          <span className="guest-count-label">Confirmed</span>
        </div>
        <div className="guest-count-divider" />
        <div className="guest-count-item">
          <span className="guest-count-num" style={{ color: 'var(--red)' }}>{declinedCount}</span>
          <span className="guest-count-label">Declined</span>
        </div>
        <div className="guest-count-divider" />
        <div className="guest-count-item">
          <span className="guest-count-num" style={{ color: 'var(--ink-dim)' }}>{awaitingCount}</span>
          <span className="guest-count-label">Awaiting</span>
        </div>
        {totalCount > 0 && (
          <>
            <div className="guest-count-divider" />
            <div style={{ flex: 1, padding: '0 4px' }}>
              <div className="bar" style={{ marginTop: 0 }}>
                <i
                  style={{
                    width: `${Math.round((confirmedCount / totalCount) * 100)}%`,
                    background: 'linear-gradient(90deg, var(--green), var(--cyan))',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                {Math.round((confirmedCount / totalCount) * 100)}% confirmed
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Filter bar ───────────────────────────────────────────── */}
      <div className="filter-bar">
        <span className="filter-bar-label">Filter:</span>
        <select
          className="filter-select"
          value={filterRsvp}
          onChange={(e) => setFilterRsvp(e.target.value)}
          title="Filter by RSVP Status"
        >
          <option value="">All RSVPs</option>
          {RSVP_OPTIONS.map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={filterRelationship}
          onChange={(e) => setFilterRelationship(e.target.value)}
          title="Filter by Relationship"
        >
          <option value="">All Relationships</option>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
        {(filterRsvp || filterRelationship) && (
          <button
            className="btn sm ghost"
            onClick={() => { setFilterRsvp(''); setFilterRelationship('') }}
          >
            Clear filters
          </button>
        )}
        {(filterRsvp || filterRelationship) && (
          <span className="faint" style={{ fontSize: 12 }}>
            Showing {filteredGuests.length} of {totalCount}
          </span>
        )}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar-count">{selectedIds.size} selected</span>
          <div className="bulk-bar-action">
            <span className="bulk-bar-label">Set RSVP:</span>
            <select
              className="filter-select"
              value={bulkRsvp}
              onChange={(e) => setBulkRsvp(e.target.value)}
            >
              <option value="">— choose —</option>
              {RSVP_OPTIONS.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <button
              className="btn sm"
              disabled={!bulkRsvp}
              onClick={applyBulkRsvp}
            >
              Apply
            </button>
          </div>
          <div className="bulk-bar-action">
            <span className="bulk-bar-label">Set Meal:</span>
            <select
              className="filter-select"
              value={bulkMeal}
              onChange={(e) => setBulkMeal(e.target.value)}
            >
              <option value="">— choose —</option>
              {MEAL_OPTIONS.filter(Boolean).map((m) => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
            <button
              className="btn sm"
              disabled={!bulkMeal}
              onClick={applyBulkMeal}
            >
              Apply
            </button>
          </div>
          <button
            className="btn sm ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Deselect all
          </button>
        </div>
      )}

      {/* ── Guest grid ───────────────────────────────────────────── */}
      <div className="card pad-lg">
        {guests.length === 0 ? (
          <div className="faint" style={{ fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            No guests yet. Add your first guest to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="guest-grid">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      className="guest-checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th style={{ minWidth: 160, textAlign: 'left' }}>Name</th>
                  <th style={{ minWidth: 110, textAlign: 'left' }}>RSVP</th>
                  <th style={{ minWidth: 100, textAlign: 'left' }}>Meal</th>
                  <th style={{ minWidth: 120, textAlign: 'left' }}>Gift</th>
                  <th style={{ minWidth: 110, textAlign: 'left' }}>Relationship</th>
                  <th style={{ minWidth: 100, textAlign: 'left' }}>Lodging</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Transport</th>
                  <th style={{ minWidth: 150, textAlign: 'left' }}>Notes</th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className={`guest-row${selectedIds.has(guest.id) ? ' guest-row-selected' : ''}`}
                  >
                    {/* Checkbox */}
                    <td>
                      <input
                        type="checkbox"
                        className="guest-checkbox"
                        checked={selectedIds.has(guest.id)}
                        onChange={() => toggleSelectOne(guest.id)}
                      />
                    </td>

                    {/* Name */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'name' ? (
                        <div>
                          <input
                            className="guest-cell-edit"
                            value={editVal}
                            autoFocus
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                            placeholder="Guest name"
                          />
                        </div>
                      ) : (
                        <div>
                          <span
                            className="guest-cell-display"
                            onClick={() => startEdit(guest.id, 'name', guest.name)}
                            title="Click to edit"
                          >
                            {guest.name || <span className="faint">Unnamed</span>}
                          </span>
                          {nameError === guest.id && (
                            <div className="guest-validation-error">Name cannot be empty</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* RSVP */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'rsvp' ? (
                        <select
                          className="guest-cell-select"
                          value={editVal}
                          autoFocus
                          onChange={(e) => commitSelectEdit(guest.id, 'rsvp', e.target.value)}
                          onBlur={() => setEditing(null)}
                        >
                          {RSVP_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`${rsvpClass(guest.rsvp)} guest-cell-display`}
                          onClick={() => startEdit(guest.id, 'rsvp', guest.rsvp)}
                          title="Click to edit"
                          style={{ cursor: 'pointer' }}
                        >
                          {rsvpLabel(guest.rsvp)}
                        </span>
                      )}
                    </td>

                    {/* Meal */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'meal' ? (
                        <select
                          className="guest-cell-select"
                          value={editVal}
                          autoFocus
                          onChange={(e) => commitSelectEdit(guest.id, 'meal', e.target.value)}
                          onBlur={() => setEditing(null)}
                        >
                          {MEAL_OPTIONS.map((m) => (
                            <option key={m} value={m}>{m || '—'}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="guest-cell-display"
                          onClick={() => startEdit(guest.id, 'meal', guest.meal)}
                          title="Click to edit"
                        >
                          {guest.meal
                            ? guest.meal.charAt(0).toUpperCase() + guest.meal.slice(1)
                            : <span className="faint">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Gift */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'gift' ? (
                        <input
                          className="guest-cell-edit"
                          value={editVal}
                          autoFocus
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleKeyDown}
                          placeholder="Gift description"
                        />
                      ) : (
                        <span
                          className="guest-cell-display"
                          onClick={() => startEdit(guest.id, 'gift', guest.gift)}
                          title="Click to edit"
                        >
                          {guest.gift || <span className="faint">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Relationship */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'relationship' ? (
                        <select
                          className="guest-cell-select"
                          value={editVal}
                          autoFocus
                          onChange={(e) => commitSelectEdit(guest.id, 'relationship', e.target.value)}
                          onBlur={() => setEditing(null)}
                        >
                          {RELATIONSHIP_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="guest-cell-display"
                          onClick={() => startEdit(guest.id, 'relationship', guest.relationship)}
                          title="Click to edit"
                        >
                          {guest.relationship
                            ? guest.relationship.charAt(0).toUpperCase() + guest.relationship.slice(1)
                            : <span className="faint">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Lodging */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'lodging' ? (
                        <select
                          className="guest-cell-select"
                          value={editVal}
                          autoFocus
                          onChange={(e) => commitSelectEdit(guest.id, 'lodging', e.target.value)}
                          onBlur={() => setEditing(null)}
                        >
                          {LODGING_OPTIONS.map((l) => (
                            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className="guest-cell-display"
                          onClick={() => startEdit(guest.id, 'lodging', guest.lodging)}
                          title="Click to edit"
                        >
                          {guest.lodging
                            ? guest.lodging.charAt(0).toUpperCase() + guest.lodging.slice(1)
                            : <span className="faint">None</span>}
                        </span>
                      )}
                    </td>

                    {/* Transport toggle */}
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        className="guest-checkbox"
                        checked={guest.transport}
                        onChange={() => toggleTransport(guest.id)}
                        title={guest.transport ? 'Transport needed' : 'No transport needed'}
                      />
                    </td>

                    {/* Notes */}
                    <td>
                      {editing?.guestId === guest.id && editing?.field === 'notes' ? (
                        <input
                          className="guest-cell-edit"
                          value={editVal}
                          autoFocus
                          onChange={(e) => setEditVal(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={handleKeyDown}
                          placeholder="Notes"
                        />
                      ) : (
                        <span
                          className="guest-cell-display"
                          onClick={() => startEdit(guest.id, 'notes', guest.notes)}
                          title="Click to edit"
                        >
                          {guest.notes || <span className="faint">—</span>}
                        </span>
                      )}
                    </td>

                    {/* Delete */}
                    <td>
                      <button
                        className="icon-btn"
                        onClick={() => deleteGuest(guest.id)}
                        title="Remove guest"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* No results from filter */}
        {guests.length > 0 && filteredGuests.length === 0 && (
          <div className="faint" style={{ fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            No guests match the current filters.
          </div>
        )}
      </div>
    </div>
  )
}
