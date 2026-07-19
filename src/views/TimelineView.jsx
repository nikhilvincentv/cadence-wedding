import React, { useEffect, useMemo, useRef, useState } from 'react'
import { runCascade, generateDayPlan } from '../api.js'
import { Modal, Field, SelectField } from '../components/Modal.jsx'
import { downloadIcs, googleCalUrl } from '../utils/calendar.js'

const uid = () => Math.random().toString(36).slice(2, 9)

function parseMinutes(time) {
  const m = String(time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  if (!m) return 0
  let h = Number(m[1]) % 12
  if (m[3] && m[3].toUpperCase() === 'PM') h += 12
  return h * 60 + Number(m[2])
}

function minutesToTime(mins) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  let h = Math.floor(m / 60)
  const min = m % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  let h12 = h % 12
  if (h12 === 0) h12 = 12
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`
}

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function parseYmd(s) {
  const [y, m, d] = String(s).split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }
const addYears = (d, n) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x }
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

function monthGridDays(cursor) {
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const first = new Date(year, month, 1)
  const gridStart = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ROW_H = 56

const SCENARIOS = [
  { key: 'photo', label: 'Photographer runs 1 hr late', text: 'Our photographer just texted - she will arrive an hour late.' },
  { key: 'ceremony', label: 'Ceremony delayed 30 min', text: 'Guests are stuck in traffic, so the ceremony will start about 30 minutes late.' },
  { key: 'rain', label: 'Rain - move ceremony indoors', text: 'The forecast just turned to rain. We need to move the outdoor ceremony under cover.' },
]

export default function TimelineView({ data, persist, live }) {
  const { wedding, vendors } = data
  const weddingDateStr = wedding?.date || ''
  const rawTimeline = data.timeline || []
  const eventDateStr = (e) => e.date || weddingDateStr || ymd(new Date())

  const [view, setView] = useState('day')
  const [cursor, setCursor] = useState(() => (weddingDateStr ? parseYmd(weddingDateStr) : new Date()))

  const [text, setText] = useState('')
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(null)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState({})
  const [dragPreview, setDragPreview] = useState(null)
  const dragRef = useRef(null)
  const gridRef = useRef(null)

  const [planDate, setPlanDate] = useState(() => ymd(addDays(weddingDateStr ? parseYmd(weddingDateStr) : new Date(), 1)))
  const [planText, setPlanText] = useState('')
  const [planLoading, setPlanLoading] = useState(false)
  const [planResult, setPlanResult] = useState(null)

  const vName = (id) => vendors.find((v) => v.id === id)?.name || id || 'Unassigned'
  const conflictVendorIds = useMemo(() => new Set((result?.conflicts || []).map((c) => c.vendorId)), [result])

  function openAdd(item, prefill) {
    setDraft(item ? { ...item } : { date: prefill?.date || ymd(cursor), time: prefill?.time || '' })
    setModal(true)
  }
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  function saveEvent() {
    const ev = {
      id: draft.id || uid(),
      time: draft.time || '12:00 PM',
      minutes: parseMinutes(draft.time),
      title: draft.title || 'Untitled',
      vendorId: draft.vendorId || '',
      durationMin: Number(draft.durationMin) || 30,
      locked: !!draft.locked,
      note: draft.note || '',
      date: draft.date || weddingDateStr,
    }
    const next = draft.id ? data.timeline.map((x) => (x.id === ev.id ? ev : x)) : [...data.timeline, ev]
    persist({ ...data, timeline: next })
    setModal(false)
  }
  function removeEvent(id) {
    persist({ ...data, timeline: data.timeline.filter((e) => e.id !== id) })
    setModal(false)
  }

  // --- Day-view drag / resize ---
  function beginDrag(e, ev, mode) {
    if (ev.locked) return
    e.stopPropagation()
    e.preventDefault()
    const info = { id: ev.id, mode, startY: e.clientY, startMinutes: ev.minutes || 0, startDuration: ev.durationMin || 30 }
    dragRef.current = info
    setDragPreview({ id: ev.id, minutes: info.startMinutes, durationMin: info.startDuration, mode })
    window.addEventListener('pointermove', onDragMove)
    window.addEventListener('pointerup', onDragEnd)
  }
  function onDragMove(e) {
    const d = dragRef.current
    if (!d) return
    const deltaMin = Math.round(((e.clientY - d.startY) / ROW_H) * 60 / 5) * 5
    const next = d.mode === 'move'
      ? { id: d.id, minutes: Math.max(0, d.startMinutes + deltaMin), durationMin: d.startDuration, mode: d.mode }
      : { id: d.id, minutes: d.startMinutes, durationMin: Math.max(15, d.startDuration + deltaMin), mode: d.mode }
    dragRef.current = { ...d, preview: next }
    setDragPreview(next)
  }
  function onDragEnd() {
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
    const d = dragRef.current
    dragRef.current = null
    setDragPreview(null)
    if (!d?.preview) return
    const { id, minutes, durationMin } = d.preview
    const next = data.timeline.map((x) => (x.id === id ? { ...x, minutes, time: minutesToTime(minutes), durationMin } : x))
    persist({ ...data, timeline: next })
  }
  useEffect(() => () => {
    window.removeEventListener('pointermove', onDragMove)
    window.removeEventListener('pointerup', onDragEnd)
  }, [])

  function handleGridClick(e) {
    if (dragRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    const minutesFromStart = Math.round((offsetY / ROW_H) * 60 / 15) * 15
    const minutes = Math.max(0, dayStartHour * 60 + minutesFromStart)
    openAdd(null, { date: ymd(cursor), time: minutesToTime(minutes) })
  }

  async function run(payloadText) {
    const change = (payloadText ?? text).trim()
    if (!change) return
    setLoading(true)
    setResult(null)
    try {
      const r = await runCascade({ change, timeline: rawTimeline, vendors, wedding, profile: data.profile })
      setResult(r)
      if (r?.timelineChanges?.length) applyChangesFrom(r)
    } catch (e) {
      setResult({ error: String(e.message || e) })
    } finally {
      setLoading(false)
    }
  }
  function pickScenario(s) {
    setActive(s.key)
    setText(s.text)
    run(s.text)
  }
  function copy(msg, i) {
    navigator.clipboard?.writeText(msg)
    setCopied(i)
    setTimeout(() => setCopied(null), 1400)
  }
  function applyChangesFrom(r) {
    if (!r?.timelineChanges?.length) return
    const changeMap = new Map(r.timelineChanges.map((c) => [c.eventId, c]))
    const next = data.timeline.map((e) => {
      const c = changeMap.get(e.id)
      if (!c || e.locked) return e
      const newTime = c.newTime || e.time
      return { ...e, time: newTime, minutes: parseMinutes(newTime), durationMin: Number(c.newDurationMin) || e.durationMin }
    })
    persist({ ...data, timeline: next })
  }

  async function generateDay() {
    if (!planText.trim() || !planDate) return
    setPlanLoading(true)
    setPlanResult(null)
    try {
      const r = await generateDayPlan(planDate, planText.trim(), wedding)
      if (r.error) {
        setPlanResult({ error: r.error })
        return
      }
      const newEvents = (r.events || []).map((e) => ({
        id: uid(),
        time: e.time || '12:00 PM',
        minutes: parseMinutes(e.time),
        title: e.title || 'Event',
        vendorId: '',
        durationMin: Number(e.durationMin) || 30,
        locked: false,
        note: '',
        date: planDate,
      }))
      persist({ ...data, timeline: [...data.timeline, ...newEvents] })
      setPlanResult({ summary: r.summary, count: newEvents.length })
      setView('day')
      setCursor(parseYmd(planDate))
    } catch (e) {
      setPlanResult({ error: String(e.message || e) })
    } finally {
      setPlanLoading(false)
    }
  }

  const sev = result?.severity
  const sevClass = sev === 'high' ? 'high' : sev === 'medium' ? 'med' : 'low'

  // --- View navigation ---
  function goPrev() { setCursor((c) => (view === 'day' ? addDays(c, -1) : view === 'month' ? addMonths(c, -1) : addYears(c, -1))) }
  function goNext() { setCursor((c) => (view === 'day' ? addDays(c, 1) : view === 'month' ? addMonths(c, 1) : addYears(c, 1))) }
  function goToday() { setCursor(new Date()) }
  function goWeddingDay() { if (weddingDateStr) setCursor(parseYmd(weddingDateStr)) }

  const titleLabel = view === 'day'
    ? cursor.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : view === 'month'
    ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : String(cursor.getFullYear())

  // --- Day view bounds (dynamic so late-night events aren't clipped) ---
  const dayEvents = useMemo(
    () => rawTimeline.filter((e) => eventDateStr(e) === ymd(cursor)).sort((a, b) => (a.minutes || 0) - (b.minutes || 0)),
    [rawTimeline, cursor, weddingDateStr]
  )
  const dayStartHour = Math.max(0, Math.min(6, ...dayEvents.map((e) => Math.floor((e.minutes || 0) / 60)), 6))
  const dayEndHour = Math.min(24, Math.max(23, ...dayEvents.map((e) => Math.ceil(((e.minutes || 0) + (e.durationMin || 30)) / 60)), 23))
  const hours = Array.from({ length: dayEndHour - dayStartHour }, (_, i) => dayStartHour + i)

  const eventsByDate = useMemo(() => {
    const map = new Map()
    for (const e of rawTimeline) {
      const k = eventDateStr(e)
      if (!map.has(k)) map.set(k, [])
      map.get(k).push(e)
    }
    for (const list of map.values()) list.sort((a, b) => (a.minutes || 0) - (b.minutes || 0))
    return map
  }, [rawTimeline, weddingDateStr])

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">The day, and everything it touches</h1>
          <div className="page-sub">Build your wedding calendar, then change one thing and let AIsle trace the ripple.</div>
        </div>
        <button
          className="btn sm"
          onClick={() => downloadIcs(wedding, rawTimeline)}
          disabled={!wedding?.date || rawTimeline.length === 0}
          title={!wedding?.date ? 'Set your wedding date first' : 'Download .ics for Google/Apple/Outlook Calendar'}
        >
          ⬇ Sync to calendar (.ics)
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 20, alignItems: 'start' }}>
        <div className="card pad-lg">
          <div className="cal-toolbar">
            <div className="cal-nav">
              <button className="cal-nav-btn" onClick={goPrev} aria-label="Previous">‹</button>
              <button className="cal-nav-btn" onClick={goNext} aria-label="Next">›</button>
              <div className="cal-title">{titleLabel}</div>
            </div>
            <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
              <button className="btn ghost sm cal-jump-btn" onClick={goToday}>Today</button>
              {weddingDateStr && <button className="btn ghost sm cal-jump-btn" onClick={goWeddingDay}>♥ Wedding day</button>}
              <div className="cal-view-tabs">
                {['day', 'month', 'year'].map((v) => (
                  <button key={v} className={`cal-view-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
              <button className="btn sm primary" onClick={() => openAdd(null, { date: ymd(cursor) })}>+ Add event</button>
            </div>
          </div>

          {view === 'day' && (
            <div className="cal-day">
              <div className="cal-day-grid" ref={gridRef} style={{ height: hours.length * ROW_H, marginLeft: 64 }} onClick={handleGridClick}>
                {hours.map((h, i) => (
                  <div key={h} className="cal-hour-row cal-click-layer" style={{ position: 'absolute', top: i * ROW_H, left: -64, right: 0, height: ROW_H }}>
                    <span className="cal-hour-label">{minutesToTime(h * 60)}</span>
                  </div>
                ))}
                {dayEvents.map((ev) => {
                  const preview = dragPreview?.id === ev.id ? dragPreview : null
                  const minutes = preview ? preview.minutes : (ev.minutes || 0)
                  const duration = preview ? preview.durationMin : (ev.durationMin || 30)
                  const top = ((minutes - dayStartHour * 60) / 60) * ROW_H
                  const height = Math.max(20, (duration / 60) * ROW_H - 2)
                  const conflicted = conflictVendorIds.has(ev.vendorId)
                  return (
                    <div
                      key={ev.id}
                      className={`cal-event ${ev.locked ? 'locked' : ''} ${conflicted ? 'conflict' : ''} ${preview ? 'dragging' : ''}`}
                      style={{ top, height }}
                      onPointerDown={(e) => beginDrag(e, ev, 'move')}
                      onClick={(e) => { e.stopPropagation(); if (!dragPreview) openAdd(ev) }}
                      title={ev.locked ? 'Locked — click to view' : 'Drag to move, click to edit'}
                    >
                      <div className="cal-event-title">{ev.locked && <span className="cal-event-lock-ico">🔒</span>} {ev.title}</div>
                      <div className="cal-event-sub">{minutesToTime(minutes)} · {duration}m{ev.vendorId ? ` · ${vName(ev.vendorId)}` : ''}</div>
                      {!ev.locked && <div className="cal-event-resize" onPointerDown={(e) => beginDrag(e, ev, 'resize')} />}
                    </div>
                  )
                })}
              </div>
              {dayEvents.length === 0 && (
                <div className="faint" style={{ fontSize: 13, padding: '14px 0 0' }}>No events this day. Click anywhere on the grid, or use + Add event.</div>
              )}
            </div>
          )}

          {view === 'month' && (
            <div>
              <div className="cal-month-grid">
                {DOW.map((d) => <div key={d} className="cal-month-dow">{d}</div>)}
                {monthGridDays(cursor).map((d) => {
                  const key = ymd(d)
                  const evs = eventsByDate.get(key) || []
                  const inMonth = d.getMonth() === cursor.getMonth()
                  const today = sameDay(d, new Date())
                  const isWedding = weddingDateStr === key
                  const shown = evs.slice(0, 3)
                  return (
                    <div
                      key={key}
                      className={`cal-month-cell ${inMonth ? '' : 'other-month'} ${today ? 'today' : ''} ${isWedding ? 'wedding-day' : ''}`}
                      onClick={() => { setCursor(d); setView('day') }}
                    >
                      <span className="cal-month-daynum">{d.getDate()}</span>
                      {shown.map((e) => <div key={e.id} className="cal-chip">{e.title}</div>)}
                      {evs.length > 3 && <div className="cal-chip-more">+{evs.length - 3} more</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {view === 'year' && (
            <div className="cal-year-grid">
              {Array.from({ length: 12 }, (_, month) => {
                const monthCursor = new Date(cursor.getFullYear(), month, 1)
                const days = monthGridDays(monthCursor)
                return (
                  <div key={month} className="cal-mini-month">
                    <div className="cal-mini-month-title">{monthCursor.toLocaleDateString(undefined, { month: 'long' })}</div>
                    <div className="cal-mini-grid">
                      {days.map((d) => {
                        const key = ymd(d)
                        const inMonth = d.getMonth() === month
                        const hasEvent = inMonth && eventsByDate.has(key)
                        const isWedding = weddingDateStr === key
                        const today = sameDay(d, new Date())
                        return (
                          <div
                            key={key}
                            className={`cal-mini-cell ${inMonth ? 'in-month' : ''} ${hasEvent ? 'has-event' : ''} ${isWedding ? 'wedding-day' : ''} ${today ? 'today' : ''}`}
                            onClick={() => { if (inMonth) { setCursor(d); setView('day') } }}
                          >
                            {inMonth ? d.getDate() : ''}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card pad-lg">
            <h2 className="section-title">Simulate a disruption</h2>
            <div className="faint" style={{ fontSize: 12, marginTop: -6, marginBottom: 10 }}>AIsle applies its fix straight to your calendar — locked events never move.</div>
            <textarea className="field" rows={2} placeholder="Describe what just changed - e.g. 'the florist cannot deliver until 2pm'..." value={text} onChange={(e) => { setText(e.target.value); setActive(null) }} />
            <div className="scenario-chips">
              {SCENARIOS.map((s) => (
                <button key={s.key} className={`chip ${active === s.key ? 'on' : ''}`} onClick={() => pickScenario(s)}>{s.label}</button>
              ))}
            </div>
            <div className="row between mt">
              <span className="faint" style={{ fontSize: 12 }}>{live ? 'Reasoning with a live model' : 'Built-in reasoner (offline-safe)'}</span>
              <button className="btn primary" onClick={() => run()} disabled={loading || !text.trim()}>
                {loading ? <><span className="spin" /> Tracing...</> : 'Trace the ripple'}
              </button>
            </div>
          </div>

          <div className="card pad-lg">
            <h2 className="section-title">Plan a day</h2>
            <div className="faint" style={{ fontSize: 12, marginTop: -6, marginBottom: 10 }}>Describe a day — rehearsal dinner, welcome brunch, farewell gathering — and AIsle builds it and adds it to your calendar.</div>
            <div className="row gap-sm" style={{ marginBottom: 10 }}>
              <input type="date" className="field" style={{ maxWidth: 190 }} value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
            </div>
            <textarea className="field" rows={2} placeholder="e.g. 'Rehearsal dinner the night before, casual and intimate for about 20 people'..." value={planText} onChange={(e) => setPlanText(e.target.value)} />
            <div className="row between mt">
              <span className="faint" style={{ fontSize: 12 }}>{live ? 'Reasoning with a live model' : 'Built-in reasoner (offline-safe)'}</span>
              <button className="btn primary" onClick={generateDay} disabled={planLoading || !planText.trim() || !planDate}>
                {planLoading ? <><span className="spin" /> Planning...</> : 'Generate day plan'}
              </button>
            </div>
            {planResult && !planResult.error && (
              <div className="mt" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                <div className="muted" style={{ fontSize: 13 }}>{planResult.summary}</div>
                <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>✓ Added {planResult.count} event{planResult.count === 1 ? '' : 's'} to your calendar</div>
              </div>
            )}
            {planResult?.error && (
              <div className="mt" style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                <span className="badge high">error</span> <span className="muted" style={{ fontSize: 13 }}>{planResult.error}</span>
              </div>
            )}
          </div>

          {loading && (
            <div className="card pad-lg">
              <div className="reasoning">
                <div className="step"><b>&gt;</b> Reading the timeline and every vendor it touches...</div>
                <div className="step" style={{ animationDelay: '0.25s' }}><b>&gt;</b> Checking locked constraints and the sunset window...</div>
                <div className="step" style={{ animationDelay: '0.5s' }}><b>&gt;</b> Finding downstream conflicts...</div>
              </div>
            </div>
          )}

          {result && !result.error && (
            <CascadeResult result={result} sevClass={sevClass} copy={copy} copied={copied} />
          )}
          {result?.error && <div className="card pad-lg"><span className="badge high">error</span> <span className="muted">{result.error}</span></div>}
        </div>
      </div>

      {modal && (
        <Modal title={draft.id ? 'Edit event' : 'Add event'} onClose={() => setModal(false)} onSubmit={saveEvent}>
          <Field label="Date" type="date" value={draft.date || weddingDateStr || ''} onChange={(e) => set('date', e.target.value)} />
          <Field label="Time" placeholder="e.g. 4:00 PM" value={draft.time || ''} onChange={(e) => set('time', e.target.value)} />
          <Field label="Title" value={draft.title || ''} onChange={(e) => set('title', e.target.value)} />
          <SelectField label="Vendor" options={[{ value: '', label: '— none —' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]} value={draft.vendorId || ''} onChange={(e) => set('vendorId', e.target.value)} />
          <Field label="Duration (min)" type="number" value={draft.durationMin || ''} onChange={(e) => set('durationMin', e.target.value)} />
          <Field label="Note (optional)" value={draft.note || ''} onChange={(e) => set('note', e.target.value)} />
          <label className="field-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={!!draft.locked} onChange={(e) => set('locked', e.target.checked)} />
            <span className="field-label">Locked (cannot move — permit, ceremony start)</span>
          </label>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 4 }}>
            {wedding?.date && draft.id && <a className="icon-btn" href={googleCalUrl(wedding, draft)} target="_blank" rel="noreferrer">+ Add to Google Calendar</a>}
            {draft.id && <button type="button" className="icon-btn" onClick={() => removeEvent(draft.id)}>Delete event</button>}
          </div>
        </Modal>
      )}
    </div>
  )
}

function CascadeResult({ result, sevClass, copy, copied }) {
  return (
    <div className="stack fade-in">
      <div className="card pad-lg">
        <div className="row between mb-sm">
          <h2 className="section-title" style={{ margin: 0 }}>How AIsle thought about it</h2>
          <div className="row gap-sm">
            <span className={`badge ${sevClass}`}>{result.severity} impact</span>
            <span className={`badge ${result.source === 'model' ? 'ok' : 'ghost'}`}>{result.source === 'model' ? 'live model' : 'demo reasoner'}</span>
          </div>
        </div>
        <div className="muted" style={{ fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>{result.summary}</div>
        <div className="reasoning">
          {result.reasoning?.map((s, i) => (
            <div className="step" key={i} style={{ animationDelay: `${i * 0.12}s` }}><b>{String(i + 1).padStart(2, '0')}</b> {s}</div>
          ))}
        </div>
      </div>

      <div className="card pad-lg">
        <h2 className="section-title">Conflicts detected ({result.conflicts?.length || 0})</h2>
        <div className="stack">
          {result.conflicts?.map((c, i) => (
            <div className="conflict-card" key={i}>
              <div className={`impact-bar ${c.impact || 'medium'}`} />
              <div className="cc-body">
                <div className="cc-title">{c.title}</div>
                <div className="cc-detail">{c.detail}</div>
              </div>
              <span className={`badge ${c.impact === 'high' ? 'high' : c.impact === 'low' ? 'low' : 'med'}`} style={{ height: 'fit-content' }}>{c.impact}</span>
            </div>
          ))}
        </div>
      </div>

      {result.fix && (
        <div className="card pad-lg">
          <h2 className="section-title">Recommended fix</h2>
          <div className="fix-box">
            <div className="fix-headline">{result.fix.headline}</div>
            <div style={{ marginTop: 10 }}>
              {result.fix.changes?.map((ch, i) => (
                <div className="fix-change" key={i}><span style={{ color: 'var(--green)' }}>&rarr;</span><div><b>{ch.target}:</b> {ch.action}</div></div>
              ))}
            </div>
            {result.fix.tradeoff && <div className="faint" style={{ fontSize: 12.5, marginTop: 10, fontStyle: 'italic' }}>Trade-off: {result.fix.tradeoff}</div>}
            {result.timelineChanges?.length > 0 && (
              <div className="cal-apply-box">
                <span className="badge ok">✓ {result.timelineChanges.length} event{result.timelineChanges.length === 1 ? '' : 's'} updated on your calendar</span>
              </div>
            )}
          </div>
        </div>
      )}

      {result.notifications?.length > 0 && (
        <div className="card pad-lg">
          <h2 className="section-title">Drafted for you - {result.notifications.length} vendor messages</h2>
          <div className="stack">
            {result.notifications.map((n, i) => (
              <div className="notif" key={i}>
                <div className="notif-head">
                  <div className="notif-to">To: {n.vendorName} <span className="badge ghost" style={{ fontSize: 10 }}>{n.channel}</span></div>
                  <button className="btn ghost sm" onClick={() => copy(n.message, i)}>{copied === i ? 'Copied' : 'Copy'}</button>
                </div>
                <div className="notif-msg">{n.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
