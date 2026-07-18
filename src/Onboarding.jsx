import React, { useEffect, useMemo, useRef, useState } from 'react'
import './onboarding.css'

const GUEST_MARKS = [25, 50, 75, 100, 150, 200, 250, 300]
const BUDGET_MARKS = [10000, 20000, 30000, 40000, 50000, 75000, 100000]

const STYLE_OPTIONS = ['Modern', 'Classic', 'Luxury', 'Rustic', 'Garden', 'Beach', 'Minimalist', 'Traditional', 'Boho']
const PRIORITY_OPTIONS = ['Photography', 'Food', 'Venue', 'Decor', 'Guest Experience', 'Entertainment', 'Keeping costs low', 'Luxury experience', 'Family traditions', 'Travel']
const STAGE_OPTIONS = ['Just engaged', 'Researching', 'Booking vendors', 'Planning details', 'Almost ready', 'Wedding this month']
const AI_OPTIONS = ['Budget tracking', 'Vendor management', 'Timeline planning', 'Guest management', 'Contract analysis', 'Scheduling', 'Finding vendors', 'Negotiating prices', 'Reminders', 'Everything']

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida',
  'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
  'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
  'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas',
  'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
]
const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand', 'Ireland', 'France', 'Italy',
  'Spain', 'Germany', 'Mexico', 'India', 'Philippines', 'Japan', 'Other',
]

const STEP_ORDER = ['welcome', 'couple', 'date', 'location', 'guests', 'budget', 'style', 'priorities', 'stage', 'ai']
const QUESTION_STEPS = STEP_ORDER.length - 1 // excludes welcome

function fmtMoney(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return ''
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function isValid(step, ans) {
  switch (step) {
    case 'welcome': return true
    case 'couple': return !!ans.firstName.trim() && !!ans.partnerName.trim()
    case 'date': return ans.weddingDateUnknown || !!ans.weddingDate
    case 'location': return !!ans.location.city.trim() && !!ans.location.country.trim()
    case 'guests': return true
    case 'budget': return true
    case 'style': return ans.styles.length > 0
    case 'priorities': return ans.priorities.length > 0
    case 'stage': return !!ans.planningStage
    case 'ai': return ans.aiPreferences.length > 0
    default: return true
  }
}

function ProgressBar({ index, total, minutesLeft }) {
  const pct = Math.round((index / total) * 100)
  return (
    <div className="ob-progress-wrap">
      <div className="ob-progress-top">
        <span>Step {index} of {total}</span>
        <span>{minutesLeft <= 0 ? 'Almost done' : `~${minutesLeft} min left`}</span>
      </div>
      <div className="ob-progress-track">
        <div className="ob-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function CardGrid({ options, selected, onToggle, multi = true }) {
  const isOn = (o) => (multi ? selected.includes(o) : selected === o)
  return (
    <div className="ob-card-grid">
      {options.map((o) => (
        <button
          type="button"
          key={o}
          className={`ob-option-card ${isOn(o) ? 'on' : ''}`}
          onClick={() => onToggle(o)}
        >
          <span>{o}</span>
          <span className="ob-check">✓</span>
        </button>
      ))}
    </div>
  )
}

function Slider({ marks, value, onChange, format, plusLast = true }) {
  const idx = Math.max(0, marks.indexOf(value) === -1 ? marks.length - 1 : marks.indexOf(value))
  const isLast = idx === marks.length - 1
  return (
    <div className="ob-slider-wrap">
      <div className="ob-slider-display">{format(marks[idx])}{isLast && plusLast ? '+' : ''}</div>
      <input
        type="range"
        className="ob-slider"
        min={0}
        max={marks.length - 1}
        step={1}
        value={idx}
        onChange={(e) => onChange(marks[Number(e.target.value)])}
      />
      <div className="ob-slider-ticks">
        {marks.map((m, i) => (
          <span key={m} className={i <= idx ? 'on' : ''} />
        ))}
      </div>
    </div>
  )
}

export default function Onboarding({ data, persist, onComplete }) {
  const [stepIdx, setStepIdx] = useState(0)
  const [dir, setDir] = useState('fwd')
  const [celebrating, setCelebrating] = useState(false)
  const containerRef = useRef(null)
  const firstFieldRef = useRef(null)

  const [ans, setAns] = useState(() => ({
    firstName: data.firstName || '',
    partnerName: data.partnerName || '',
    weddingDate: data.weddingDate || data.wedding?.date || '',
    weddingDateUnknown: data.weddingDateUnknown || false,
    location: data.location || { city: '', state: '', country: '' },
    guestCount: data.guestCount || 150,
    budget: data.budget || 30000,
    styles: data.styles || [],
    priorities: data.priorities || [],
    planningStage: data.planningStage || '',
    aiPreferences: data.aiPreferences || [],
  }))

  const step = STEP_ORDER[stepIdx]
  const valid = isValid(step, ans)
  const minutesLeft = Math.max(0, Math.round(((QUESTION_STEPS - stepIdx) / QUESTION_STEPS) * 2.5))

  useEffect(() => {
    const el = containerRef.current?.querySelector('input, [data-autofocus]')
    if (el) el.focus()
  }, [stepIdx])

  function set(k, v) {
    setAns((s) => ({ ...s, [k]: v }))
  }
  function toggleIn(k, v) {
    setAns((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }))
  }

  function saveDraft(nextAns) {
    persist({
      ...data,
      ...nextAns,
      completedOnboarding: false,
    })
  }

  function goNext() {
    if (!valid) return
    saveDraft(ans)
    if (stepIdx === STEP_ORDER.length - 1) {
      finishAndCelebrate()
      return
    }
    setDir('fwd')
    setStepIdx((i) => i + 1)
  }

  function goBack() {
    if (stepIdx === 0) return
    setDir('back')
    setStepIdx((i) => i - 1)
  }

  function finishAndCelebrate() {
    const couple = `${ans.firstName.trim()} & ${ans.partnerName.trim()}`
    persist({
      ...data,
      ...ans,
      completedOnboarding: false,
      wedding: {
        ...data.wedding,
        couple,
        date: ans.weddingDateUnknown ? '' : ans.weddingDate,
        dateLabel: ans.weddingDateUnknown ? '' : fmtDateLabel(ans.weddingDate),
        venue: [ans.location.city, ans.location.state].filter(Boolean).join(', '),
        guestCount: ans.guestCount,
        budgetTotal: ans.budget,
      },
      profile: {
        ...(data.profile || {}),
        priorities: ans.priorities,
        style: ans.styles[0] || '',
        styles: ans.styles,
        stage: ans.planningStage,
        aiPreferences: ans.aiPreferences,
        createdAt: new Date().toISOString(),
      },
    })
    setCelebrating(true)
  }

  function goToDashboard() {
    persist({ ...data, ...ans, completedOnboarding: true })
    onComplete?.()
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && valid && !celebrating) {
      e.preventDefault()
      goNext()
    }
  }

  return (
    <div className="onboarding-root" ref={containerRef} onKeyDown={onKeyDown}>
      <div className="ob-shell">
        {!celebrating && step !== 'welcome' && (
          <ProgressBar index={stepIdx + 1} total={STEP_ORDER.length} minutesLeft={minutesLeft} />
        )}

        <div key={celebrating ? 'celebrate' : step} className={`ob-step ob-anim-${dir}`}>
          {celebrating ? (
            <div className="ob-center">
              <div className="ob-confetti" aria-hidden="true">🎉</div>
              <h1 className="ob-h1">Your wedding workspace is ready.</h1>
              <p className="ob-sub">We've personalized your dashboard and AI coordinator.</p>
              <button className="ob-btn ob-btn-primary" onClick={goToDashboard}>Go to Dashboard</button>
            </div>
          ) : step === 'welcome' ? (
            <div className="ob-center">
              <div className="ob-mark">C</div>
              <h1 className="ob-h1">Let's plan your perfect wedding.</h1>
              <p className="ob-sub">We'll personalize everything based on your wedding.</p>
              <button className="ob-btn ob-btn-primary" data-autofocus onClick={goNext}>Get Started</button>
            </div>
          ) : step === 'couple' ? (
            <div>
              <h2 className="ob-title">Tell us about the two of you</h2>
              <p className="ob-desc">First names are enough for now.</p>
              <div className="ob-field-row">
                <label className="ob-label">Your first name</label>
                <input className="ob-input" value={ans.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Cleo" />
              </div>
              <div className="ob-field-row">
                <label className="ob-label">Partner's first name</label>
                <input className="ob-input" value={ans.partnerName} onChange={(e) => set('partnerName', e.target.value)} placeholder="Sarah" />
              </div>
              {(ans.firstName || ans.partnerName) && (
                <div className="ob-preview">{ans.firstName || '—'} <span className="ob-heart">❤️</span> {ans.partnerName || '—'}</div>
              )}
            </div>
          ) : step === 'date' ? (
            <div>
              <h2 className="ob-title">When's the big day?</h2>
              <p className="ob-desc">You can always change this later.</p>
              <div className="ob-field-row">
                <input
                  className="ob-input"
                  type="date"
                  disabled={ans.weddingDateUnknown}
                  value={ans.weddingDate}
                  onChange={(e) => set('weddingDate', e.target.value)}
                />
              </div>
              <label className="ob-checkbox-row">
                <input
                  type="checkbox"
                  checked={ans.weddingDateUnknown}
                  onChange={(e) => set('weddingDateUnknown', e.target.checked)}
                />
                We haven't decided yet.
              </label>
            </div>
          ) : step === 'location' ? (
            <div>
              <h2 className="ob-title">Where are you getting married?</h2>
              <p className="ob-desc">City, state, and country.</p>
              <div className="ob-field-row">
                <label className="ob-label">City</label>
                <input
                  className="ob-input"
                  list="ob-city-list"
                  value={ans.location.city}
                  onChange={(e) => set('location', { ...ans.location, city: e.target.value })}
                  placeholder="Seattle"
                />
                <datalist id="ob-city-list">
                  {['Seattle', 'New York', 'Los Angeles', 'Chicago', 'Austin', 'Denver', 'Nashville', 'Charleston', 'San Francisco', 'Miami', 'Portland', 'Napa'].map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="ob-grid-2">
                <div className="ob-field-row">
                  <label className="ob-label">State / Province</label>
                  <input className="ob-input" list="ob-state-list" value={ans.location.state} onChange={(e) => set('location', { ...ans.location, state: e.target.value })} placeholder="Washington" />
                  <datalist id="ob-state-list">
                    {US_STATES.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="ob-field-row">
                  <label className="ob-label">Country</label>
                  <input className="ob-input" list="ob-country-list" value={ans.location.country} onChange={(e) => set('location', { ...ans.location, country: e.target.value })} placeholder="United States" />
                  <datalist id="ob-country-list">
                    {COUNTRIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
            </div>
          ) : step === 'guests' ? (
            <div>
              <h2 className="ob-title">About how many guests?</h2>
              <p className="ob-desc">A rough estimate is perfect.</p>
              <div className="ob-slider-headline">About {ans.guestCount === GUEST_MARKS[GUEST_MARKS.length - 1] ? `${ans.guestCount}+` : ans.guestCount} guests</div>
              <Slider marks={GUEST_MARKS} value={ans.guestCount} onChange={(v) => set('guestCount', v)} format={(v) => v} />
            </div>
          ) : step === 'budget' ? (
            <div>
              <h2 className="ob-title">What's your estimated budget?</h2>
              <p className="ob-desc">This helps us track spending against reality.</p>
              <div className="ob-slider-headline">
                {ans.budget === BUDGET_MARKS[BUDGET_MARKS.length - 1] ? `${fmtMoney(ans.budget)}+` : fmtMoney(ans.budget)}
              </div>
              <Slider marks={BUDGET_MARKS} value={ans.budget} onChange={(v) => set('budget', v)} format={fmtMoney} plusLast />
            </div>
          ) : step === 'style' ? (
            <div>
              <h2 className="ob-title">What's your wedding style?</h2>
              <p className="ob-desc">Choose as many as you like.</p>
              <CardGrid options={STYLE_OPTIONS} selected={ans.styles} onToggle={(o) => toggleIn('styles', o)} />
            </div>
          ) : step === 'priorities' ? (
            <div>
              <h2 className="ob-title">What's most important to you?</h2>
              <p className="ob-desc">Pick everything that matters.</p>
              <CardGrid options={PRIORITY_OPTIONS} selected={ans.priorities} onToggle={(o) => toggleIn('priorities', o)} />
            </div>
          ) : step === 'stage' ? (
            <div>
              <h2 className="ob-title">Where are you in planning?</h2>
              <p className="ob-desc">Pick the one that fits best.</p>
              <CardGrid options={STAGE_OPTIONS} selected={ans.planningStage} multi={false} onToggle={(o) => set('planningStage', o)} />
            </div>
          ) : step === 'ai' ? (
            <div>
              <h2 className="ob-title">What should your AI coordinator help with?</h2>
              <p className="ob-desc">Choose everything you'd like help managing.</p>
              <CardGrid options={AI_OPTIONS} selected={ans.aiPreferences} onToggle={(o) => toggleIn('aiPreferences', o)} />
            </div>
          ) : null}
        </div>

        {!celebrating && step !== 'welcome' && (
          <div className="ob-actions">
            <button className="ob-btn ob-btn-ghost" onClick={goBack}>Back</button>
            <button className="ob-btn ob-btn-primary" disabled={!valid} onClick={goNext}>
              {stepIdx === STEP_ORDER.length - 1 ? 'Finish' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
