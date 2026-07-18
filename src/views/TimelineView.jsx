import React, { useMemo, useState } from 'react'
import { runCascade } from '../api.js'
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

const SCENARIOS = [
  { key: 'photo', label: 'Photographer runs 1 hr late', text: 'Our photographer just texted - she will arrive an hour late.' },
  { key: 'ceremony', label: 'Ceremony delayed 30 min', text: 'Guests are stuck in traffic, so the ceremony will start about 30 minutes late.' },
  { key: 'rain', label: 'Rain - move ceremony indoors', text: 'The forecast just turned to rain. We need to move the outdoor ceremony under cover.' },
]

export default function TimelineView({ data, persist, live }) {
  const { wedding, vendors } = data
  const timeline = [...(data.timeline || [])].sort((a, b) => (a.minutes || 0) - (b.minutes || 0))

  const [text, setText] = useState('')
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(null)
  const [modal, setModal] = useState(false)
  const [draft, setDraft] = useState({})

  const vName = (id) => vendors.find((v) => v.id === id)?.name || id || 'Unassigned'
  const conflictVendorIds = useMemo(() => new Set((result?.conflicts || []).map((c) => c.vendorId)), [result])

  function openAdd(item) {
    setDraft(item ? { ...item } : {})
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
    }
    const next = draft.id ? data.timeline.map((x) => (x.id === ev.id ? ev : x)) : [...data.timeline, ev]
    persist({ ...data, timeline: next })
    setModal(false)
  }
  function removeEvent(id) {
    persist({ ...data, timeline: data.timeline.filter((e) => e.id !== id) })
  }

  async function run(payloadText) {
    const change = (payloadText ?? text).trim()
    if (!change) return
    setLoading(true)
    setResult(null)
    try {
      setResult(await runCascade({ change, timeline, vendors, wedding, profile: data.profile }))
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

  const sev = result?.severity
  const sevClass = sev === 'high' ? 'high' : sev === 'medium' ? 'med' : 'low'

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">The day, and everything it touches</h1>
          <div className="page-sub">Build your day-of timeline, then change one thing and let AIsle trace the ripple.</div>
        </div>
        <button
          className="btn sm"
          onClick={() => downloadIcs(wedding, timeline)}
          disabled={!wedding?.date || timeline.length === 0}
          title={!wedding?.date ? 'Set your wedding date first' : 'Download .ics for Google/Apple/Outlook Calendar'}
        >
          ⬇ Sync to calendar (.ics)
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '0.9fr 1.1fr', gap: 20 }}>
        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Day-of timeline</h2>
            <button className="btn sm" onClick={() => openAdd(null)}>+ Add event</button>
          </div>
          {timeline.length === 0 && <div className="faint" style={{ fontSize: 13, padding: '14px 0' }}>No events yet. Add your hair & makeup, first look, ceremony, and the rest.</div>}
          <div className="tl">
            {timeline.map((t) => {
              const conflicted = conflictVendorIds.has(t.vendorId)
              return (
                <div key={t.id} className={`tl-item ${t.locked ? 'locked' : ''} ${conflicted ? 'conflict' : ''}`}>
                  <div className="tl-time">{t.time}</div>
                  <div className="tl-body">
                    <div className="tl-title">
                      {t.title}
                      {t.locked && <span className="badge ghost" style={{ fontSize: 10 }}>locked</span>}
                      {conflicted && <span className="badge high" style={{ fontSize: 10 }}>affected</span>}
                    </div>
                    <div className="row gap-sm wrap" style={{ marginTop: 5 }}>
                      <span className="tag">{vName(t.vendorId)}</span>
                      <span className="faint mono" style={{ fontSize: 11 }}>{t.durationMin}m</span>
                      <button className="icon-btn" onClick={() => openAdd(t)}>edit</button>
                      <button className="icon-btn" onClick={() => removeEvent(t.id)}>del</button>
                      {wedding?.date && <a className="icon-btn" href={googleCalUrl(wedding, t)} target="_blank" rel="noreferrer" title="Add to Google Calendar">+ cal</a>}
                    </div>
                    {t.note && <div className="tl-note">{t.note}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stack">
          <div className="card pad-lg">
            <h2 className="section-title">Simulate a disruption</h2>
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

          {loading && (
            <div className="card pad-lg">
              <div className="reasoning">
                <div className="step"><b>&gt;</b> Reading the timeline and every vendor it touches...</div>
                <div className="step" style={{ animationDelay: '0.25s' }}><b>&gt;</b> Checking locked constraints and the sunset window...</div>
                <div className="step" style={{ animationDelay: '0.5s' }}><b>&gt;</b> Finding downstream conflicts...</div>
              </div>
            </div>
          )}

          {result && !result.error && <CascadeResult result={result} sevClass={sevClass} copy={copy} copied={copied} />}
          {result?.error && <div className="card pad-lg"><span className="badge high">error</span> <span className="muted">{result.error}</span></div>}
        </div>
      </div>

      {modal && (
        <Modal title={draft.id ? 'Edit event' : 'Add event'} onClose={() => setModal(false)} onSubmit={saveEvent}>
          <Field label="Time" placeholder="e.g. 4:00 PM" value={draft.time || ''} onChange={(e) => set('time', e.target.value)} />
          <Field label="Title" value={draft.title || ''} onChange={(e) => set('title', e.target.value)} />
          <SelectField label="Vendor" options={[{ value: '', label: '— none —' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]} value={draft.vendorId || ''} onChange={(e) => set('vendorId', e.target.value)} />
          <Field label="Duration (min)" type="number" value={draft.durationMin || ''} onChange={(e) => set('durationMin', e.target.value)} />
          <Field label="Note (optional)" value={draft.note || ''} onChange={(e) => set('note', e.target.value)} />
          <label className="field-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" checked={!!draft.locked} onChange={(e) => set('locked', e.target.checked)} />
            <span className="field-label">Locked (cannot move — permit, ceremony start)</span>
          </label>
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
