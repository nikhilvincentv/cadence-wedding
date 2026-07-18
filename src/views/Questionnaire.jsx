import React, { useState } from 'react'
import { generatePlan } from '../api.js'

const PRIORITIES = ['Photography', 'Food & drink', 'Music / DJ', 'Florals', 'Venue', 'Attire']
const STYLES = ['Classic', 'Modern', 'Rustic', 'Bohemian', 'Glam', 'Minimalist']
const STAGES = ['Just engaged', 'Booking vendors', 'Final details']

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'w_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
const uid = () => Math.random().toString(36).slice(2, 9)
function parseMinutes(time) {
  const m = String(time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return 0
  let h = Number(m[1]) % 12
  if (m[3] && m[3].toUpperCase() === 'PM') h += 12
  return h * 60 + Number(m[2])
}

export default function Questionnaire({ data, persist }) {
  const [step, setStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [f, setF] = useState({ couple: '', date: '', venue: '', guestCount: '', budgetTotal: '', priorities: [], style: '', stage: '' })
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }))
  const togglePriority = (p) => setF((s) => ({ ...s, priorities: s.priorities.includes(p) ? s.priorities.filter((x) => x !== p) : [...s.priorities, p] }))

  const steps = [
    { title: "Who's getting married?", desc: 'The essentials first.', valid: !!f.couple.trim() },
    { title: 'Where & how big?', desc: 'Set the scale of your day.', valid: true },
    { title: "What's your budget?", desc: 'We track every dollar against it.', valid: true },
    { title: 'What matters most?', desc: 'So Cadence knows what to protect.', valid: true },
  ]
  const last = step === steps.length - 1
  const cur = steps[step]

  async function finish() {
    const dateLabel = f.date
      ? new Date(f.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : ''
    const wedding = {
      ...data.wedding,
      couple: f.couple.trim(),
      date: f.date,
      dateLabel,
      venue: f.venue.trim(),
      guestCount: Number(f.guestCount) || 0,
      budgetTotal: Number(f.budgetTotal) || 0,
      budgetSpent: 0,
      sunset: '',
    }
    const profile = { priorities: f.priorities, style: f.style, stage: f.stage, createdAt: new Date().toISOString() }

    setGenerating(true)
    const plan = await generatePlan(wedding, profile)

    const tasks = (plan.tasks || []).map((d) => ({ id: uid(), checked: false, description: typeof d === 'string' ? d : d.description || d.title || '' }))
    const vendors = (plan.vendors || []).map((v) => ({ id: uid(), name: v.name || 'Vendor', category: v.category || '', contact: '', status: 'pending', rating: null }))
    const timeline = (plan.timeline || []).map((e) => ({ id: uid(), time: e.time || '12:00 PM', minutes: parseMinutes(e.time), title: e.title || 'Event', vendorId: '', durationMin: Number(e.durationMin) || 30, locked: false, note: '' }))
    const budgetCategories = (plan.budgetCategories || []).map((c) => ({ id: uid(), name: c.name || 'Category', projected: Number(c.projected) || 0, actual: 0 }))

    persist({ ...data, weddingId: newId(), wedding, profile, tasks, vendors, timeline, budgetCategories })
  }

  if (generating) {
    return (
      <div className="fade-in">
        <div className="topbar">
          <div>
            <h1 className="page">Building your plan…</h1>
            <div className="page-sub">Cadence's AI is setting up your tasks, vendors, timeline, and budget from your answers.</div>
          </div>
        </div>
        <div className="card pad-lg" style={{ display: 'grid', placeItems: 'center', minHeight: 240, textAlign: 'center', gap: 16 }}>
          <span className="spin" style={{ width: 24, height: 24 }} />
          <div className="muted" style={{ fontSize: 15 }}>Generating your starter plan — this takes a few seconds.</div>
          <div className="faint" style={{ fontSize: 12.5 }}>You'll be able to edit everything.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Let's set up your wedding</h1>
          <div className="page-sub">A few quick questions. Everything saves to your account as you go.</div>
        </div>
      </div>

      <div className="card pad-lg quiz-card">
        <div className="quiz-progress">
          {steps.map((_, i) => (
            <span key={i} className={`quiz-dot ${i <= step ? 'on' : ''}`} />
          ))}
          <span className="quiz-count">Step {step + 1} of {steps.length}</span>
        </div>

        <h2 className="quiz-title">{cur.title}</h2>
        <p className="quiz-desc">{cur.desc}</p>

        {step === 0 && (
          <div className="quiz-body">
            <label className="field-row"><span className="field-label">Couple</span>
              <input className="field" placeholder="e.g. Alex & Sam" value={f.couple} onChange={(e) => set('couple', e.target.value)} autoFocus />
            </label>
            <label className="field-row"><span className="field-label">Wedding date</span>
              <input className="field" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="quiz-body">
            <label className="field-row"><span className="field-label">Venue</span>
              <input className="field" placeholder="Venue · City, State" value={f.venue} onChange={(e) => set('venue', e.target.value)} autoFocus />
            </label>
            <label className="field-row"><span className="field-label">Guest count</span>
              <input className="field" type="number" placeholder="120" value={f.guestCount} onChange={(e) => set('guestCount', e.target.value)} />
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="quiz-body">
            <label className="field-row"><span className="field-label">Total budget ($)</span>
              <input className="field" type="number" placeholder="45000" value={f.budgetTotal} onChange={(e) => set('budgetTotal', e.target.value)} autoFocus />
            </label>
            <label className="field-row"><span className="field-label">Where are you in planning?</span>
              <div className="chip-row">
                {STAGES.map((s) => (
                  <button type="button" key={s} className={`chip ${f.stage === s ? 'on' : ''}`} onClick={() => set('stage', s)}>{s}</button>
                ))}
              </div>
            </label>
          </div>
        )}
        {step === 3 && (
          <div className="quiz-body">
            <label className="field-row"><span className="field-label">Top priorities (pick any)</span>
              <div className="chip-row">
                {PRIORITIES.map((p) => (
                  <button type="button" key={p} className={`chip ${f.priorities.includes(p) ? 'on' : ''}`} onClick={() => togglePriority(p)}>{p}</button>
                ))}
              </div>
            </label>
            <label className="field-row"><span className="field-label">Your style</span>
              <div className="chip-row">
                {STYLES.map((s) => (
                  <button type="button" key={s} className={`chip ${f.style === s ? 'on' : ''}`} onClick={() => set('style', s)}>{s}</button>
                ))}
              </div>
            </label>
          </div>
        )}

        <div className="quiz-actions">
          {step > 0 ? <button className="btn ghost sm" onClick={() => setStep(step - 1)}>Back</button> : <span />}
          {last ? (
            <button className="btn primary" onClick={finish}>Create my wedding</button>
          ) : (
            <button className="btn primary" disabled={!cur.valid} onClick={() => setStep(step + 1)}>Continue</button>
          )}
        </div>
      </div>
    </div>
  )
}
