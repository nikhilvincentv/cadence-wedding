import React, { useState, useEffect } from 'react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtMoney(n) {
  const num = Number(n) || 0
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return iso
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function StarRating({ rating, onChange }) {
  const n = Math.round(Number(rating) || 0)
  if (onChange) {
    // editable stars
    return (
      <span className="vendor-rating">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            style={{
              color: i < n ? 'var(--gold)' : 'var(--ink-faint)',
              fontSize: 20,
              cursor: 'pointer',
              padding: '0 2px',
            }}
            onClick={() => onChange(i + 1)}
            role="button"
            aria-label={`Rate ${i + 1} star${i !== 0 ? 's' : ''}`}
          >
            ★
          </span>
        ))}
      </span>
    )
  }
  return (
    <span className="vendor-rating">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? 'var(--gold)' : 'var(--ink-faint)', fontSize: 16 }}>★</span>
      ))}
    </span>
  )
}

const VENDOR_STATUS_OPTIONS = [
  { value: 'booked', label: 'Booked' },
  { value: 'contract-out', label: 'Contract out' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
]

// ── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab({ vendor, data, persist }) {
  const [draft, setDraft] = useState({ ...vendor })
  const [saved, setSaved] = useState(false)

  // Reset draft when vendor changes
  useEffect(() => {
    setDraft({ ...vendor })
    setSaved(false)
  }, [vendor.id])

  function set(k, v) {
    setDraft((d) => ({ ...d, [k]: v }))
    setSaved(false)
  }

  function save() {
    const updated = {
      ...vendor,
      name: draft.name,
      category: draft.category,
      contact: draft.contact,
      status: draft.status,
      rating: draft.rating != null ? Number(draft.rating) : null,
    }
    const vendors = (data.vendors || []).map((v) => (v.id === vendor.id ? updated : v))
    persist({ ...data, vendors })
    setSaved(true)
  }

  return (
    <div className="vendor-tab-content">
      <div className="field-row" style={{ marginBottom: 14 }}>
        <label className="field-label">Vendor Name</label>
        <input
          className="field"
          value={draft.name || ''}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Vendor name"
        />
      </div>

      <div className="field-row" style={{ marginBottom: 14 }}>
        <label className="field-label">Category</label>
        <input
          className="field"
          value={draft.category || ''}
          onChange={(e) => set('category', e.target.value)}
          placeholder="Photography, Catering, DJ…"
        />
      </div>

      <div className="field-row" style={{ marginBottom: 14 }}>
        <label className="field-label">Contact</label>
        <input
          className="field"
          value={draft.contact || ''}
          onChange={(e) => set('contact', e.target.value)}
          placeholder="Email or phone"
        />
      </div>

      <div className="field-row" style={{ marginBottom: 14 }}>
        <label className="field-label">Booking Status</label>
        <select
          className="field"
          value={draft.status || 'booked'}
          onChange={(e) => set('status', e.target.value)}
          style={{ appearance: 'none' }}
        >
          {VENDOR_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="field-row" style={{ marginBottom: 20 }}>
        <label className="field-label">Rating</label>
        <div style={{ marginTop: 4 }}>
          <StarRating rating={draft.rating} onChange={(v) => set('rating', v)} />
        </div>
      </div>

      <div className="row gap-sm">
        <button className="btn primary sm" onClick={save}>Save changes</button>
        {saved && (
          <span style={{ fontSize: 12, color: 'var(--green)', alignSelf: 'center' }}>✓ Saved</span>
        )}
      </div>
    </div>
  )
}

// ── Tab: Contract ─────────────────────────────────────────────────────────────

function ContractTab({ vendor, data, setView }) {
  const analysis = (data.contractAnalyses || {})[vendor.id]

  if (!analysis) {
    return (
      <div className="vendor-tab-content" style={{ textAlign: 'center', padding: '36px 16px' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
        <div style={{ fontSize: 14, color: 'var(--ink-dim)', marginBottom: 16 }}>
          No contract analysis for this vendor yet.
        </div>
        <button className="btn sm primary" onClick={() => setView('contracts')}>
          Scan a contract
        </button>
      </div>
    )
  }

  return (
    <div className="vendor-tab-content">
      <div className="row between" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{analysis.vendorName || vendor.name}</div>
        {analysis.scannedAt && (
          <span className="faint" style={{ fontSize: 11 }}>
            Scanned {fmtDateTime(analysis.scannedAt)}
          </span>
        )}
      </div>

      {/* Payment schedule */}
      {analysis.payments && analysis.payments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
            Payment Schedule
          </div>
          {analysis.payments.map((p, i) => (
            <div key={i} className="kv">
              <span className="k">{p.label}</span>
              <span className="v">{fmtMoney(p.amount)}{p.dueDate ? ` · ${fmtDate(p.dueDate)}` : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden fees */}
      {analysis.hiddenFees && analysis.hiddenFees.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
            Hidden / Extra Fees
          </div>
          {analysis.hiddenFees.map((f, i) => (
            <div key={i} className="watchout">
              <span style={{ color: 'var(--amber)' }}>⚠</span>
              <span><b>{f.label}</b>{f.detail ? ` — ${f.detail}` : ''}{f.amount ? ` (${fmtMoney(f.amount)})` : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation */}
      {analysis.cancellation && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>
            Cancellation Policy
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.6 }}>{analysis.cancellation}</div>
        </div>
      )}

      {/* Key dates */}
      {analysis.keyDates && analysis.keyDates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
            Key Dates
          </div>
          {analysis.keyDates.map((kd, i) => (
            <div key={i} className="kv">
              <span className="k">{kd.label}</span>
              <span className="v">{fmtDate(kd.date)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Watch-outs */}
      {analysis.watchOuts && analysis.watchOuts.length > 0 && (
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
            Watch-outs
          </div>
          {analysis.watchOuts.map((w, i) => (
            <div key={i} className="watchout">
              <span style={{ color: 'var(--red)' }}>!</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab: Emails ───────────────────────────────────────────────────────────────

function EmailsTab({ vendor, data }) {
  const threads = (data.inboxThreads || []).filter((t) => t.vendorId === vendor.id)
  const [activeId, setActiveId] = useState(null)
  const active = threads.find((t) => t.id === activeId) || null

  function impactClass(level) {
    if (level === 'high') return 'badge high'
    if (level === 'medium') return 'badge med'
    if (level === 'low') return 'badge low'
    return 'badge ghost'
  }

  if (threads.length === 0) {
    return (
      <div className="vendor-tab-content" style={{ textAlign: 'center', padding: '36px 16px' }}>
        <div className="faint" style={{ fontSize: 14 }}>No emails linked to this vendor yet.</div>
      </div>
    )
  }

  return (
    <div className="vendor-tab-content" style={{ padding: 0 }}>
      {!active ? (
        <div>
          {threads.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--line-soft)',
                cursor: 'pointer',
              }}
              onClick={() => setActiveId(t.id)}
            >
              <div className="row between">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.sender}</div>
                <span className="faint" style={{ fontSize: 11 }}>{t.receivedAt ? new Date(t.receivedAt).toLocaleDateString() : ''}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-dim)', marginTop: 2 }}>{t.subject}</div>
              {t.tldr && (
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 4, lineHeight: 1.5 }}>{t.tldr}</div>
              )}
              {t.impactLevel && t.impactLevel !== 'none' && (
                <span className={impactClass(t.impactLevel)} style={{ fontSize: 10.5, marginTop: 5, display: 'inline-flex' }}>
                  {t.impactLevel} impact
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '14px 18px' }}>
          <button className="btn sm ghost" style={{ marginBottom: 14 }} onClick={() => setActiveId(null)}>
            ← Back
          </button>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{active.subject}</div>
          <div className="row" style={{ gap: 8, marginBottom: 12 }}>
            <span className="faint" style={{ fontSize: 12 }}>From: {active.sender}</span>
            {active.receivedAt && (
              <span className="faint" style={{ fontSize: 12 }}>· {new Date(active.receivedAt).toLocaleString()}</span>
            )}
          </div>
          {active.impact && (
            <div style={{
              background: 'rgba(240,179,107,0.08)',
              border: '1px solid rgba(240,179,107,0.2)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--ink-dim)',
              lineHeight: 1.5,
            }}>
              <span className={impactClass(active.impactLevel)} style={{ fontSize: 10, marginRight: 8 }}>
                {active.impactLevel}
              </span>
              {active.impact}
            </div>
          )}
          <div style={{ fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {active.body}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab: Timeline ─────────────────────────────────────────────────────────────

function TimelineTab({ vendor, data }) {
  const events = (data.timeline || []).filter((e) => e.vendorId === vendor.id)

  function fmtMinutes(m) {
    const h = Math.floor(m / 60)
    const min = m % 60
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hr = h % 12 || 12
    return `${hr}:${String(min).padStart(2, '0')} ${ampm}`
  }

  if (events.length === 0) {
    return (
      <div className="vendor-tab-content" style={{ textAlign: 'center', padding: '36px 16px' }}>
        <div className="faint" style={{ fontSize: 14 }}>No timeline events linked to this vendor.</div>
      </div>
    )
  }

  return (
    <div className="vendor-tab-content">
      <div className="tl" style={{ paddingLeft: 26 }}>
        {events
          .slice()
          .sort((a, b) => (a.minutes || 0) - (b.minutes || 0))
          .map((ev) => (
            <div key={ev.id} className={`tl-item${ev.locked ? ' locked' : ''}`}>
              <div className="tl-time">
                {ev.minutes != null ? fmtMinutes(ev.minutes) : ev.time || ''}
              </div>
              <div className="tl-body">
                <div className="tl-title">
                  {ev.title}
                  {ev.locked && (
                    <span className="badge ghost" style={{ fontSize: 10 }}>🔒 locked</span>
                  )}
                </div>
                {ev.durationMin && (
                  <div className="tl-note">{ev.durationMin} min</div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

// ── Tab: AI Summary ───────────────────────────────────────────────────────────

function AISummaryTab({ vendor, data }) {
  const analysis = (data.contractAnalyses || {})[vendor.id]

  if (!analysis) {
    return (
      <div className="vendor-tab-content" style={{ textAlign: 'center', padding: '36px 16px' }}>
        <div className="faint" style={{ fontSize: 14, marginBottom: 8 }}>No contract analysis available.</div>
        <div className="faint" style={{ fontSize: 12 }}>Scan a contract on the Contract tab to populate this summary.</div>
      </div>
    )
  }

  return (
    <div className="vendor-tab-content">
      <div className="extract-grid">
        {/* Left column: Payment Schedule + Arrivals/Deliverables */}
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10 }}>
            Payment Schedule
          </div>
          {analysis.payments && analysis.payments.length > 0 ? (
            analysis.payments.map((p, i) => (
              <div key={i} className="kv">
                <span className="k">{p.label}</span>
                <span className="v mono" style={{ fontSize: 12 }}>
                  {fmtMoney(p.amount)}
                  {p.dueDate ? (
                    <span style={{ color: 'var(--ink-faint)', marginLeft: 6, fontFamily: 'var(--sans)' }}>
                      {fmtDate(p.dueDate)}
                    </span>
                  ) : null}
                </span>
              </div>
            ))
          ) : (
            <div className="faint" style={{ fontSize: 12 }}>No payment schedule extracted.</div>
          )}

          {/* Key dates / Arrival Times */}
          {analysis.keyDates && analysis.keyDates.length > 0 && (
            <>
              <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: '18px 0 10px' }}>
                Arrival Times &amp; Deliverables
              </div>
              {analysis.keyDates.map((kd, i) => (
                <div key={i} className="kv">
                  <span className="k">{kd.label}</span>
                  <span className="v" style={{ fontSize: 12 }}>{fmtDate(kd.date)}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right column: Cancellation Policy + Overtime Rates */}
        <div>
          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10 }}>
            Cancellation Policy
          </div>
          {analysis.cancellation ? (
            <div style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.65, marginBottom: 18 }}>
              {analysis.cancellation}
            </div>
          ) : (
            <div className="faint" style={{ fontSize: 12, marginBottom: 18 }}>Not specified.</div>
          )}

          <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10 }}>
            Overtime Rates
          </div>
          {analysis.hiddenFees && analysis.hiddenFees.filter((f) =>
            /overtime|overage|extra hour|hourly|per hour/i.test(f.label + ' ' + (f.detail || ''))
          ).length > 0 ? (
            analysis.hiddenFees
              .filter((f) => /overtime|overage|extra hour|hourly|per hour/i.test(f.label + ' ' + (f.detail || '')))
              .map((f, i) => (
                <div key={i} className="kv">
                  <span className="k">{f.label}</span>
                  <span className="v">{f.detail}{f.amount ? ` · ${fmtMoney(f.amount)}` : ''}</span>
                </div>
              ))
          ) : (
            <div className="faint" style={{ fontSize: 12 }}>Not specified in contract.</div>
          )}

          {/* Gratuity note */}
          {analysis.gratuityIncluded != null && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>
                Gratuity
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
                {analysis.gratuityIncluded === true
                  ? 'Gratuity included in contract'
                  : analysis.gratuityIncluded === false
                  ? 'Gratuity NOT included'
                  : 'Gratuity unclear — verify with vendor'}
              </div>
            </div>
          )}

          {/* Watch-outs */}
          {analysis.watchOuts && analysis.watchOuts.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>
                Watch-outs
              </div>
              {analysis.watchOuts.map((w, i) => (
                <div key={i} className="watchout">
                  <span style={{ color: 'var(--amber)' }}>!</span>
                  <span style={{ fontSize: 12 }}>{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Open Tasks ───────────────────────────────────────────────────────────

function OpenTasksTab({ vendor, data, persist }) {
  const tasks = (data.tasks || []).filter((t) => t.vendorId === vendor.id)

  function toggleTask(id) {
    const next = (data.tasks || []).map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    persist({ ...data, tasks: next })
  }

  if (tasks.length === 0) {
    return (
      <div className="vendor-tab-content" style={{ textAlign: 'center', padding: '36px 16px' }}>
        <div className="faint" style={{ fontSize: 14 }}>No tasks linked to this vendor.</div>
      </div>
    )
  }

  return (
    <div className="vendor-tab-content">
      {tasks.map((t) => (
        <label key={t.id} className="task-row" style={{ cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!t.checked}
            onChange={() => toggleTask(t.id)}
            className="task-check"
          />
          <div style={{ flex: 1 }}>
            <span
              style={{
                textDecoration: t.checked ? 'line-through' : 'none',
                color: t.checked ? 'var(--ink-faint)' : 'var(--ink)',
                fontSize: 14,
              }}
            >
              {t.description}
            </span>
            {t.dueDate && (
              <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                Due {t.dueDate}
              </div>
            )}
          </div>
        </label>
      ))}
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--ink-faint)' }}>
        {tasks.filter((t) => t.checked).length}/{tasks.length} completed
      </div>
    </div>
  )
}

// ── VendorProfile Panel ───────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',   label: 'Profile' },
  { id: 'contract',  label: 'Contract' },
  { id: 'emails',    label: 'Emails' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'ai',        label: 'AI Summary' },
  { id: 'tasks',     label: 'Open Tasks' },
]

export default function VendorProfile({ vendor, data, persist, setView, onClose }) {
  const [activeTab, setActiveTab] = useState('profile')

  // Reset to profile tab when vendor changes
  useEffect(() => {
    setActiveTab('profile')
  }, [vendor.id])

  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="vendor-panel-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="vendor-panel" role="dialog" aria-label={`Vendor profile: ${vendor.name}`}>
        {/* Panel header */}
        <div className="vendor-panel-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow" style={{ marginBottom: 2 }}>{vendor.category || 'Vendor'}</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {vendor.name || 'Unnamed Vendor'}
            </div>
          </div>
          <button
            className="modal-x"
            onClick={onClose}
            aria-label="Close vendor profile"
            style={{ marginLeft: 12, flexShrink: 0 }}
          >
            ×
          </button>
        </div>

        {/* Tab navigation */}
        <div className="vendor-panel-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`vendor-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="vendor-panel-body">
          {activeTab === 'profile' && (
            <ProfileTab vendor={vendor} data={data} persist={persist} />
          )}
          {activeTab === 'contract' && (
            <ContractTab vendor={vendor} data={data} setView={setView} />
          )}
          {activeTab === 'emails' && (
            <EmailsTab vendor={vendor} data={data} />
          )}
          {activeTab === 'timeline' && (
            <TimelineTab vendor={vendor} data={data} />
          )}
          {activeTab === 'ai' && (
            <AISummaryTab vendor={vendor} data={data} />
          )}
          {activeTab === 'tasks' && (
            <OpenTasksTab vendor={vendor} data={data} persist={persist} />
          )}
        </div>
      </div>
    </>
  )
}
