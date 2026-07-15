import React from 'react'
import { fmtMoney, daysUntil } from '../api.js'

export default function CommandCenter({ state, payments, status, goto, days }) {
  const { wedding, vendors, alerts } = state
  const remaining = wedding.budgetTotal - wedding.budgetSpent
  const spentPct = Math.round((wedding.budgetSpent / wedding.budgetTotal) * 100)
  const dueSoon = payments
    .filter((p) => p.status !== 'paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const totalDue = dueSoon.reduce((s, p) => s + p.amount, 0)
  const openAlerts = alerts.length

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="eyebrow">Command Center</div>
          <h1 className="page">{wedding.couple}</h1>
          <div className="page-sub">{wedding.dateLabel} · {wedding.venue} · {wedding.guestCount} guests</div>
        </div>
        <div className={`aipill ${status?.enabled ? 'live' : 'demo'}`}>
          <span className="dot" />
          {status?.enabled ? `AI live · ${status.model}` : 'Demo reasoner active'}
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card stat">
          <span className="label">Countdown</span>
          <span className="value">{days}<small> days</small></span>
          <span className="foot">to the ceremony</span>
        </div>
        <div className="card stat">
          <span className="label">Vendors in play</span>
          <span className="value">{vendors.length}</span>
          <span className="foot">{vendors.filter((v) => v.status === 'booked').length} booked · {vendors.filter((v) => v.status !== 'booked' && v.status !== 'active').length} pending</span>
        </div>
        <div className="card stat">
          <span className="label">Budget used</span>
          <span className="value">{spentPct}<small>%</small></span>
          <div className="bar"><i style={{ width: `${spentPct}%` }} /></div>
          <span className="foot">{fmtMoney(remaining)} of {fmtMoney(wedding.budgetTotal)} left</span>
        </div>
        <div className="card stat">
          <span className="label">Payments due</span>
          <span className="value" style={{ color: 'var(--gold)' }}>{fmtMoney(totalDue)}</span>
          <span className="foot">{dueSoon.length} upcoming</span>
        </div>
      </div>

      <div className="grid cols-2 mt">
        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>What needs you</h2>
            <span className="badge warn">{openAlerts} flags</span>
          </div>
          <div>
            {alerts.map((a) => (
              <div className="alert-row" key={a.id}>
                <div className={`alert-ico ${a.level}`}>{a.level === 'warn' ? '!' : 'i'}</div>
                <div>
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-detail">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row gap-sm wrap">
            <button className="btn primary sm" onClick={() => goto('timeline')}>Run a what-if</button>
            <button className="btn sm" onClick={() => goto('contracts')}>Scan a contract</button>
          </div>
        </div>

        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Upcoming payments</h2>
            <span className="faint" style={{ fontSize: 12 }}>auto-extracted from contracts</span>
          </div>
          {dueSoon.map((p) => {
            const v = vendors.find((x) => x.id === p.vendorId)
            const d = daysUntil(p.dueDate)
            return (
              <div className="pay-row" key={p.id}>
                <div className="pay-left">
                  <span className="dot-cat" style={{ background: p.status === 'action' ? 'var(--red)' : 'var(--rose)' }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v?.name || 'Vendor'}</div>
                    <div className="faint" style={{ fontSize: 12 }}>{p.label} · {p.source}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="pay-amt">{fmtMoney(p.amount)}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>
                    {p.status === 'action' ? <span className="badge high" style={{ padding: '1px 7px' }}>action</span> : `in ${d} days`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card pad-lg mt">
        <h2 className="section-title">Vendor roster</h2>
        <div className="grid cols-4">
          {vendors.map((v) => (
            <div key={v.id} style={{ padding: '12px 0' }}>
              <div className="row between">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v.name}</div>
                {v.rating && <span className="faint mono" style={{ fontSize: 12 }}>{v.rating}</span>}
              </div>
              <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{v.category}</div>
              <div style={{ marginTop: 7 }}>
                <span className={`badge ${v.status === 'booked' ? 'ok' : v.status === 'active' ? 'info' : 'warn'}`} style={{ fontSize: 10.5 }}>
                  {v.status === 'contract-out' ? 'contract out' : v.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="faint" style={{ fontSize: 12, marginTop: 26, textAlign: 'center' }}>
        Cadence reads across all {vendors.length} vendors continuously - every change you make ripples through the whole plan.
      </div>
    </div>
  )
}
