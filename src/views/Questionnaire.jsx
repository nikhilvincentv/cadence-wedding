import React, { useState } from 'react'

const PRIORITIES = ['Photography', 'Food & drink', 'Music / DJ', 'Florals', 'Venue', 'Attire']
const STYLES = ['Classic', 'Modern', 'Rustic', 'Bohemian', 'Glam', 'Minimalist']
const STAGES = ['Just engaged', 'Booking vendors', 'Final details']

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'w_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export default function Questionnaire({ data, persist }) {
  const [step, setStep] = useState(0)
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

  function finish() {
    const dateLabel = f.date
      ? new Date(f.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : ''
    persist({
      ...data,
      weddingId: newId(),
      wedding: {
        ...data.wedding,
        couple: f.couple.trim(),
        date: f.date,
        dateLabel,
        venue: f.venue.trim(),
        guestCount: Number(f.guestCount) || 0,
        budgetTotal: Number(f.budgetTotal) || 0,
        budgetSpent: 0,
        sunset: '',
      },
      profile: { priorities: f.priorities, style: f.style, stage: f.stage, createdAt: new Date().toISOString() },
    })
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
