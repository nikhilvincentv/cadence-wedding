import React, { useMemo, useState } from 'react'
import { runCascade } from '../api.js'

const SCENARIOS = [
  { key: 'photo', label: 'Photographer runs 1 hr late', text: 'Our photographer just texted - her earlier wedding ran long and she will arrive at 12:30 PM instead of 11:30 AM.' },
  { key: 'ceremony', label: 'Ceremony delayed 30 min (guest traffic)', text: 'Heavy traffic into Woodinville - guests are still arriving, so the ceremony will start ~30 minutes late.' },
  { key: 'rain', label: 'Rain - move ceremony under the tent', text: 'The forecast just turned to rain during setup. We need to move the outdoor garden ceremony under the reception tent.' },
]

export default function TimelineView({ state, timeline, setTimeline, live }) {
  const { wedding, vendors } = state
  const [text, setText] = useState('')
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [applied, setApplied] = useState(false)
  const [copied, setCopied] = useState(null)

  const vName = (id) => vendors.find((v) => v.id === id)?.name || id
  const conflictVendorIds = useMemo(
    () => new Set((result?.conflicts || []).map((c) => c.vendorId)),
    [result]
  )

  async function run(payloadText) {
    const change = (payloadText ?? text).trim()
    if (!change) return
    setLoading(true)
    setResult(null)
    setApplied(false)
    try {
      const r = await runCascade({
        change,
        timeline,
        vendors,
        wedding,
      })
      setResult(r)
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
          <div className="eyebrow">Timeline & Cascade Engine</div>
          <h1 className="page">The day, and everything it touches</h1>
          <div className="page-sub">Change one thing. Cadence traces the ripple across all {vendors.length} vendors and fixes it.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '0.9fr 1.1fr', gap: 20 }}>
        <div className="card pad-lg">
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Day-of timeline</h2>
            <span className="faint" style={{ fontSize: 12 }}>Sunset {wedding.sunset}</span>
          </div>
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
            <textarea
              className="field"
              rows={2}
              placeholder="Describe what just changed - e.g. 'the florist cannot deliver until 2pm'..."
              value={text}
              onChange={(e) => { setText(e.target.value); setActive(null) }}
            />
            <div className="scenario-chips">
              {SCENARIOS.map((s) => (
                <button key={s.key} className={`chip ${active === s.key ? 'on' : ''}`} onClick={() => pickScenario(s)}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="row between mt">
              <span className="faint" style={{ fontSize: 12 }}>
                {live ? 'Reasoning with a live model' : 'Built-in reasoner (offline-safe)'}
              </span>
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

          {result && !result.error && (
            <CascadeResult
              result={result}
              sevClass={sevClass}
              applied={applied}
              onApply={() => setApplied(true)}
              copy={copy}
              copied={copied}
            />
          )}

          {result?.error && (
            <div className="card pad-lg"><span className="badge high">error</span> <span className="muted">{result.error}</span></div>
          )}
        </div>
      </div>
    </div>
  )
}

function CascadeResult({ result, sevClass, applied, onApply, copy, copied }) {
  return (
    <div className="stack fade-in">
      <div className="card pad-lg">
        <div className="row between mb-sm">
          <h2 className="section-title" style={{ margin: 0 }}>How Cadence thought about it</h2>
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
          <div className="row between mb-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Recommended fix</h2>
            <button className="btn primary sm" onClick={onApply} disabled={applied}>
              {applied ? 'Applied to plan' : 'Apply fix'}
            </button>
          </div>
          <div className="fix-box">
            <div className="fix-headline">{result.fix.headline}</div>
            <div style={{ marginTop: 10 }}>
              {result.fix.changes?.map((ch, i) => (
                <div className="fix-change" key={i}>
                  <span style={{ color: 'var(--green)' }}>&rarr;</span>
                  <div><b>{ch.target}:</b> {ch.action}</div>
                </div>
              ))}
            </div>
            {result.fix.tradeoff && (
              <div className="faint" style={{ fontSize: 12.5, marginTop: 10, fontStyle: 'italic' }}>Trade-off: {result.fix.tradeoff}</div>
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
