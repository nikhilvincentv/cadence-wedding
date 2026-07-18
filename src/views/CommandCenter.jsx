import React, { useState } from 'react'
import { fmtMoney, daysUntil } from '../api.js'
import { Modal, Field, SelectField } from '../components/Modal.jsx'
import Questionnaire from './Questionnaire.jsx'

const uid = () => Math.random().toString(36).slice(2, 9)

function dateLabelFrom(date) {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const VENDOR_STATUS = [
  { value: 'booked', label: 'Booked' },
  { value: 'contract-out', label: 'Contract out' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
]
const PAY_STATUS = [
  { value: 'due', label: 'Due' },
  { value: 'action', label: 'Action needed' },
  { value: 'paid', label: 'Paid' },
]

export default function CommandCenter({ data, persist, status, goto, days }) {
  const { wedding, vendors, payments, tasks = [] } = data
  const [modal, setModal] = useState(null)
  const [draft, setDraft] = useState({})

  const isNewAccount = !wedding.couple

  function open(kind, item) {
    setDraft(item ? { ...item } : {})
    setModal(kind)
  }
  const close = () => setModal(null)
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))

  function saveWedding() {
    persist({ ...data, wedding: { ...wedding, ...draft, dateLabel: dateLabelFrom(draft.date || wedding.date) } })
    close()
  }
  function saveVendor() {
    const v = { id: draft.id || uid(), name: draft.name || 'Untitled vendor', category: draft.category || '', contact: draft.contact || '', status: draft.status || 'booked', rating: draft.rating ? Number(draft.rating) : null }
    const next = draft.id ? vendors.map((x) => (x.id === v.id ? v : x)) : [...vendors, v]
    persist({ ...data, vendors: next })
    close()
  }
  function removeVendor(id) {
    persist({ ...data, vendors: vendors.filter((v) => v.id !== id) })
  }
  function savePayment() {
    const p = { id: draft.id || uid(), vendorId: draft.vendorId || '', label: draft.label || 'Payment', amount: Number(draft.amount) || 0, dueDate: draft.dueDate || '', status: draft.status || 'due', source: draft.source || 'manual' }
    const next = draft.id ? payments.map((x) => (x.id === p.id ? p : x)) : [...payments, p]
    persist({ ...data, payments: next })
    close()
  }
  function removePayment(id) {
    persist({ ...data, payments: payments.filter((p) => p.id !== id) })
  }

  if (isNewAccount) {
    return <Questionnaire data={data} persist={persist} />
  }

  const remaining = (wedding.budgetTotal || 0) - (wedding.budgetSpent || 0)
  const spentPct = wedding.budgetTotal ? Math.round((wedding.budgetSpent / wedding.budgetTotal) * 100) : 0
  const dueSoon = payments.filter((p) => p.status !== 'paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  const totalDue = dueSoon.reduce((s, p) => s + p.amount, 0)

  const alerts = []
  payments.forEach((p) => {
    const d = daysUntil(p.dueDate)
    if (p.status === 'action') {
      alerts.push({ id: p.id, level: 'warn', title: `${p.label} needs action`, detail: `${fmtMoney(p.amount)} — ${vendors.find((v) => v.id === p.vendorId)?.name || p.source}` })
    } else if (p.status !== 'paid' && d != null && d <= 14) {
      alerts.push({ id: p.id, level: 'warn', title: `${p.label} due in ${d} days`, detail: `${fmtMoney(p.amount)} to ${vendors.find((v) => v.id === p.vendorId)?.name || p.source}` })
    }
  })

  function toggleTask(id) {
    const next = tasks.map((t) => t.id === id ? { ...t, checked: !t.checked } : t)
    persist({ ...data, tasks: next })
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="eyebrow">Command Center</div>
          <h1 className="page">{wedding.couple}</h1>
          <div className="page-sub">
            {wedding.dateLabel || 'Date not set'}{wedding.venue ? ` · ${wedding.venue}` : ''}{wedding.guestCount ? ` · ${wedding.guestCount} guests` : ''}
          </div>
        </div>
        <button className="btn sm" onClick={() => open('wedding', wedding)}>Edit wedding</button>
      </div>

      <div className="grid cols-4">
        <div className="card stat">
          <span className="label">Countdown</span>
          <span className="value">{days != null ? days : '—'}<small> days</small></span>
          <span className="foot">to the ceremony</span>
        </div>
        <div className="card stat">
          <span className="label">Vendors</span>
          <span className="value">{vendors.length}</span>
          <span className="foot">{vendors.filter((v) => v.status === 'booked').length} booked</span>
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

      {data.profile && (
        <div className="card pad-lg mt">
          <div className="row between wrap" style={{ gap: 14 }}>
            <div>
              <div className="faint" style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Your priorities</div>
              <div className="row wrap gap-sm">
                {(data.profile.priorities || []).length
                  ? data.profile.priorities.map((p) => <span key={p} className="badge ok">{p}</span>)
                  : <span className="faint" style={{ fontSize: 13 }}>None set</span>}
                {data.profile.style && <span className="badge low">{data.profile.style}</span>}
                {data.profile.stage && <span className="badge ghost">{data.profile.stage}</span>}
              </div>
            </div>
            <div className="faint" style={{ fontSize: 12, maxWidth: 300, textAlign: 'right' }}>
              Cadence weighs these when the AI reasons about your day.
            </div>
          </div>
        </div>
      )}
      <div className="grid cols-2 mt">
        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>What needs you</h2>
            <span className="badge warn">{alerts.length} flags</span>
          </div>
          {alerts.length === 0 && (
            <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>
              Nothing urgent right now. Add payments and vendors to start tracking.
            </div>
          )}
          {alerts.map((a) => (
            <div className="alert-row alert-row-hover" key={a.id}>
              <div className="alert-ico warn">!</div>
              <div style={{ flex: 1 }}>
                <div className="alert-title">{a.title}</div>
                <div className="alert-detail">{a.detail}</div>
              </div>
              <button className="btn sm alert-action-btn" onClick={() => open('payment', payments.find(p => p.id === a.id))}>
                Review
              </button>
            </div>
          ))}
          <div className="divider" />
          <div className="row gap-sm wrap">
            <button className="btn primary sm" onClick={() => goto('timeline')}>Run a what-if</button>
            <button className="btn sm" onClick={() => goto('contracts')}>Scan a contract</button>
          </div>
        </div>

        {/* Right 40% — Tasks */}
        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Daily tasks</h2>
            <span className="badge ghost">{tasks.filter(t => t.checked).length}/{tasks.length}</span>
          </div>
          {tasks.length === 0 && (
            <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>
              No tasks yet. Tasks added here will help you stay on track each day.
            </div>
          )}
          {tasks.map((t) => (
            <label key={t.id} className="task-row">
              <input
                type="checkbox"
                checked={!!t.checked}
                onChange={() => toggleTask(t.id)}
                className="task-check"
              />
              <span style={{ textDecoration: t.checked ? 'line-through' : 'none', color: t.checked ? 'var(--ink-faint)' : 'var(--ink)' }}>
                {t.description}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="card pad-lg mt">
        <div className="row between mb-sm">
          <h2 className="section-title" style={{ margin: 0 }}>Vendors</h2>
          <button className="btn sm" onClick={() => open('vendor', null)}>+ Add vendor</button>
        </div>
        {vendors.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>No vendors yet. Add your photographer, caterer, florist, and the rest.</div>}
        <div className="grid cols-3">
          {vendors.map((v) => (
            <div key={v.id} className="vendor-card">
              <div className="row between">
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{v.name}</div>
                <div className="row gap-sm">
                  <button className="icon-btn" onClick={() => open('vendor', v)}>edit</button>
                  <button className="icon-btn" onClick={() => removeVendor(v.id)}>del</button>
                </div>
              </div>
              <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{v.category}{v.contact ? ` · ${v.contact}` : ''}</div>
              <div style={{ marginTop: 7 }}>
                <span className={`badge ${v.status === 'booked' ? 'ok' : v.status === 'active' ? 'info' : 'warn'}`} style={{ fontSize: 10.5 }}>
                  {v.status === 'contract-out' ? 'contract out' : v.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal === 'wedding' && (
        <Modal title="Edit wedding" onClose={close} onSubmit={saveWedding}>
          <Field label="Couple" value={draft.couple || ''} onChange={(e) => set('couple', e.target.value)} />
          <Field label="Wedding date" type="date" value={draft.date || ''} onChange={(e) => set('date', e.target.value)} />
          <Field label="Venue" value={draft.venue || ''} onChange={(e) => set('venue', e.target.value)} />
          <Field label="Guest count" type="number" value={draft.guestCount || ''} onChange={(e) => set('guestCount', Number(e.target.value))} />
          <Field label="Total budget ($)" type="number" value={draft.budgetTotal || ''} onChange={(e) => set('budgetTotal', Number(e.target.value))} />
          <Field label="Spent so far ($)" type="number" value={draft.budgetSpent || ''} onChange={(e) => set('budgetSpent', Number(e.target.value))} />
          <Field label="Sunset time" value={draft.sunset || ''} onChange={(e) => set('sunset', e.target.value)} />
        </Modal>
      )}
      {modal === 'vendor' && (
        <Modal title={draft.id ? 'Edit vendor' : 'Add vendor'} onClose={close} onSubmit={saveVendor}>
          <Field label="Name" value={draft.name || ''} onChange={(e) => set('name', e.target.value)} />
          <Field label="Category" placeholder="Photography, Catering..." value={draft.category || ''} onChange={(e) => set('category', e.target.value)} />
          <Field label="Contact" value={draft.contact || ''} onChange={(e) => set('contact', e.target.value)} />
          <SelectField label="Status" options={VENDOR_STATUS} value={draft.status || 'booked'} onChange={(e) => set('status', e.target.value)} />
          <Field label="Rating (optional)" type="number" step="0.1" value={draft.rating || ''} onChange={(e) => set('rating', e.target.value)} />
        </Modal>
      )}
      {modal === 'payment' && (
        <Modal title={draft.id ? 'Edit payment' : 'Add payment'} onClose={close} onSubmit={savePayment}>
          <Field label="Label" placeholder="Final balance, deposit..." value={draft.label || ''} onChange={(e) => set('label', e.target.value)} />
          <Field label="Amount ($)" type="number" value={draft.amount || ''} onChange={(e) => set('amount', e.target.value)} />
          <Field label="Due date" type="date" value={draft.dueDate || ''} onChange={(e) => set('dueDate', e.target.value)} />
          <SelectField label="Vendor" options={[{ value: '', label: '— none —' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]} value={draft.vendorId || ''} onChange={(e) => set('vendorId', e.target.value)} />
          <SelectField label="Status" options={PAY_STATUS} value={draft.status || 'due'} onChange={(e) => set('status', e.target.value)} />
        </Modal>
      )}
    </div>
  )
}
