import React from 'react'
import { fmtMoney } from '../api.js'
import { nextAction, milestones, bookedVendors, venueSet } from '../journey.js'

export default function CommandCenter({ data, persist, status, goto, days }) {
  const { wedding, tasks = [] } = data
  const action = nextAction(data)
  const steps = milestones(data)
  const booked = bookedVendors(data)
  const committed = booked.reduce((s, v) => s + (Number(v.negotiatedPrice) || Number(v.priceValue) || 0), 0) + (data.venue?.priceFrom || 0)
  const budgetTotal = wedding.budgetTotal || 0
  const usedPct = budgetTotal ? Math.min(100, Math.round((committed / budgetTotal) * 100)) : 0
  const saved = booked.reduce((s, v) => s + (Number(v.savings) || 0), 0)

  const payments = (data.payments || []).filter((p) => p.status !== 'paid')
  const totalDue = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)

  function toggleTask(id) {
    persist({ ...data, tasks: tasks.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)) })
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">{wedding.couple || 'Your wedding'}</h1>
          <div className="page-sub">
            {wedding.dateLabel || 'Date not set'}
            {venueSet(data) ? ` · ${data.venue.name}` : wedding.venue ? ` · ${wedding.venue}` : ''}
            {wedding.guestCount ? ` · ${wedding.guestCount} guests` : ''}
          </div>
        </div>
      </div>

      <div className="card pad-lg" style={{ marginBottom: 20, background: 'linear-gradient(135deg, var(--bg-1), var(--bg-2))' }}>
        <div className="row between wrap" style={{ gap: 16, alignItems: 'center' }}>
          <div className="row gap-sm" style={{ alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 30, lineHeight: 1 }}>{action.icon}</div>
            <div>
              <div className="faint" style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Your next step</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{action.title}</div>
              <div className="faint" style={{ fontSize: 13.5, marginTop: 5, maxWidth: 520 }}>{action.body}</div>
            </div>
          </div>
          <button className="btn primary" onClick={() => goto(action.view)}>{action.cta} →</button>
        </div>
      </div>

      <div className="card pad-lg" style={{ marginBottom: 20 }}>
        <div className="journey-track" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          {steps.map((s, i) => (
            <div key={s.id} style={{ flex: 1, minWidth: 90, textAlign: 'center' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', margin: '0 auto 8px',
                display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                background: s.done ? 'var(--green)' : s.active ? 'var(--rose-deep)' : 'var(--bg-3)',
                color: s.done || s.active ? '#fff' : 'var(--ink-faint)',
                boxShadow: s.active ? '0 0 0 4px rgba(124,84,84,0.18)' : 'none',
              }}>
                {s.done ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 12.5, fontWeight: s.active ? 700 : 500, color: s.active ? 'var(--ink)' : 'var(--ink-dim)' }}>{s.label}</div>
              {s.detail && <div className="faint" style={{ fontSize: 11 }}>{s.detail}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card stat">
          <span className="label">Countdown</span>
          <span className="value">{days != null ? days : '—'}<small> days</small></span>
          <span className="foot">to the ceremony</span>
        </div>
        <div className="card stat">
          <span className="label">Venue</span>
          <span className="value" style={{ fontSize: 18 }}>{venueSet(data) ? '✅' : '—'}</span>
          <span className="foot">{venueSet(data) ? data.venue.name : 'Not set yet'}</span>
        </div>
        <div className="card stat">
          <span className="label">Vendors booked</span>
          <span className="value">{booked.length}</span>
          <span className="foot">{saved > 0 ? `${fmtMoney(saved)} negotiated off` : 'across all categories'}</span>
        </div>
        <div className="card stat">
          <span className="label">Budget committed</span>
          <span className="value">{usedPct}<small>%</small></span>
          <div className="bar"><i style={{ width: `${usedPct}%` }} /></div>
          <span className="foot">{fmtMoney(committed)} of {fmtMoney(budgetTotal)}</span>
        </div>
      </div>

      <div className="grid cols-2 mt">
        {data.profile && (
          <div className="card pad-lg">
            <h2 className="section-title" style={{ margin: '0 0 12px' }}>Your priorities</h2>
            <div className="row wrap gap-sm">
              {(data.profile.priorities || []).length
                ? data.profile.priorities.map((p) => <span key={p} className="badge ok">{p}</span>)
                : <span className="faint" style={{ fontSize: 13 }}>None set</span>}
              {data.profile.style && <span className="badge low">{data.profile.style}</span>}
              {data.profile.stage && <span className="badge ghost">{data.profile.stage}</span>}
            </div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 14 }}>
              AIsle weighs these when recommending vendors and reasoning about your day.
            </div>
            <div className="divider" />
            <div className="row gap-sm wrap">
              <button className="btn sm" onClick={() => goto('vendors')}>Find vendors</button>
              <button className="btn sm" onClick={() => goto('timeline')}>Run a what-if</button>
            </div>
          </div>
        )}

        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Payments due</h2>
            <span className="badge warn">{fmtMoney(totalDue)}</span>
          </div>
          {payments.length === 0 && (
            <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>
              No payments yet. When you book a vendor, deposits and balances show up here.
            </div>
          )}
          {payments.slice(0, 6).map((p) => (
            <div className="pay-row" key={p.id}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.label}</div>
                <div className="faint" style={{ fontSize: 12 }}>{p.source || ''}</div>
              </div>
              <div style={{ fontWeight: 700 }}>{fmtMoney(p.amount)}</div>
            </div>
          ))}
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="card pad-lg mt">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Tasks</h2>
            <span className="badge ghost">{tasks.filter((t) => t.checked).length}/{tasks.length}</span>
          </div>
          {tasks.map((t) => (
            <label key={t.id} className="task-row">
              <input type="checkbox" checked={!!t.checked} onChange={() => toggleTask(t.id)} className="task-check" />
              <span style={{ textDecoration: t.checked ? 'line-through' : 'none', color: t.checked ? 'var(--ink-faint)' : 'var(--ink)' }}>
                {t.description}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
