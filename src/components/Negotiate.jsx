import React, { useEffect, useRef, useState } from 'react'
import { negotiate, fmtMoney } from '../api.js'

function verdictBadge(v) {
  if (v === 'high') return { cls: 'warn', label: 'Priced high' }
  if (v === 'good') return { cls: 'ok', label: 'Great deal' }
  return { cls: 'info', label: 'Fair price' }
}

export default function Negotiate({ vendor, data, profile, persist, onBooked, onClose }) {
  const nego = data.negotiations?.[vendor.id] || null
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState('')
  const [editTarget, setEditTarget] = useState(false)
  const scrollRef = useRef(null)

  const messages = nego?.messages || []
  const status = nego?.status || 'new'
  const lastAnalysis = [...messages].reverse().find((m) => m.role === 'ai')?.analysis || null

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, busy])

  function saveNego(next) {
    persist({ ...data, negotiations: { ...(data.negotiations || {}), [vendor.id]: next } })
  }

  function historyForApi(msgs) {
    return msgs.filter((m) => m.role !== 'ai').map((m) => ({ role: m.role === 'vendor' ? 'vendor' : 'you', text: m.text, quote: m.quote }))
  }

  async function run(action, youText, targetPrice) {
    if (busy) return
    setBusy(true)
    setEditTarget(false)
    const base = messages.slice()
    if (youText) base.push({ role: 'you', text: youText })
    if (youText) saveNego({ ...(nego || {}), messages: base, status: nego?.status || 'negotiating' })

    const res = await negotiate({
      vendor,
      wedding: data.wedding,
      profile: profile || data.profile,
      history: historyForApi(base),
      action,
      targetPrice,
    })
    if (res.error) { setBusy(false); return }

    const withVendor = base.slice()
    if (res.vendorMessage?.text) withVendor.push({ role: 'vendor', text: res.vendorMessage.text, quote: res.vendorMessage.quote ?? null })
    withVendor.push({ role: 'ai', analysis: res.analysis })

    const currentQuote = res.vendorMessage?.quote ?? nego?.currentQuote ?? vendor.priceValue
    const next = {
      messages: withVendor,
      status: res.status || 'negotiating',
      currentQuote,
      openingQuote: nego?.openingQuote || vendor.priceValue,
      benchmark: { low: res.analysis?.benchmarkLow, high: res.analysis?.benchmarkHigh },
      savings: res.savings || 0,
      source: res.source,
    }
    saveNego(next)
    setBusy(false)
  }

  function startContact() {
    run('contact', `Hi ${(vendor.contactName || '').split(' ')[0] || 'there'}! We're planning our wedding and love your work — are you available for our date, and what would a package look like?`)
  }
  function sendCounter() {
    const t = target ? Number(target) : lastAnalysis?.suggestedCounter
    run('counter', lastAnalysis?.draftReply || `Would you be able to do ${fmtMoney(t)}?`, t)
    setTarget('')
  }
  function accept() {
    run('accept', `That works for us — we'd love to book at ${fmtMoney(nego?.currentQuote)}. Let's make it official!`)
  }

  function markBooked() {
    onBooked(nego?.currentQuote || vendor.priceValue, nego?.savings || 0)
  }

  const vb = lastAnalysis ? verdictBadge(lastAnalysis.verdict) : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal nego-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620, width: '92vw', padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '86vh', overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{vendor.name}</div>
            <div className="faint" style={{ fontSize: 12 }}>{vendor.category} · {vendor.contactName} · opening {fmtMoney(vendor.priceValue)}</div>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--bg-2)' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 12px' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>💬</div>
              <div className="faint" style={{ fontSize: 13, marginBottom: 16, maxWidth: 360, marginInline: 'auto' }}>
                Cadence will reach out to {vendor.contactName?.split(' ')[0] || vendor.name}, read their quote, and help you negotiate a better price. You approve every message.
              </div>
              <button className="btn primary" onClick={startContact} disabled={busy}>
                {busy ? 'Reaching out…' : `Have Cadence contact ${vendor.name}`}
              </button>
            </div>
          )}

          {messages.map((m, i) => {
            if (m.role === 'ai') {
              const a = m.analysis || {}
              const b = verdictBadge(a.verdict)
              return (
                <div key={i} className="card" style={{ padding: 12, borderLeft: '3px solid var(--rose-deep)', alignSelf: 'stretch' }}>
                  <div className="row gap-sm" style={{ marginBottom: 6, alignItems: 'center' }}>
                    <span className="badge low" style={{ fontSize: 10 }}>◉ Cadence</span>
                    <span className={`badge ${b.cls}`} style={{ fontSize: 10 }}>{b.label}</span>
                    {a.benchmarkLow != null && (
                      <span className="faint" style={{ fontSize: 11 }}>comps {fmtMoney(a.benchmarkLow)}–{fmtMoney(a.benchmarkHigh)}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{a.note}</div>
                </div>
              )
            }
            const mine = m.role === 'you'
            return (
              <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
                <div className="faint" style={{ fontSize: 10.5, marginBottom: 3, textAlign: mine ? 'right' : 'left' }}>
                  {mine ? 'You (drafted by Cadence)' : vendor.name}
                </div>
                <div style={{
                  padding: '9px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                  background: mine ? 'var(--rose-deep)' : '#fff',
                  color: mine ? '#fff' : 'var(--ink)',
                  border: mine ? 'none' : '1px solid var(--line)',
                }}>
                  {m.text}
                  {m.quote != null && (
                    <div style={{ marginTop: 6, fontWeight: 700, fontSize: 14 }}>Quote: {fmtMoney(m.quote)}</div>
                  )}
                </div>
              </div>
            )
          })}

          {busy && messages.length > 0 && (
            <div className="row gap-sm faint" style={{ fontSize: 12 }}><span className="spin" /> working…</div>
          )}
        </div>

        {messages.length > 0 && (
          <div style={{ padding: 14, borderTop: '1px solid var(--line)' }}>
            {status === 'agreed' ? (
              <div className="row between wrap" style={{ gap: 10 }}>
                <div>
                  <span className="badge ok" style={{ fontSize: 11 }}>✅ Agreed at {fmtMoney(nego?.currentQuote)}</span>
                  {nego?.savings > 0 && <span className="badge low" style={{ fontSize: 11, marginLeft: 6 }}>saved {fmtMoney(nego.savings)}</span>}
                </div>
                <button className="btn primary" onClick={markBooked}>Book & add contract →</button>
              </div>
            ) : (
              <>
                {nego?.savings > 0 && (
                  <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
                    Down from {fmtMoney(nego.openingQuote)} → <b style={{ color: 'var(--green)' }}>{fmtMoney(nego.currentQuote)}</b> (saved {fmtMoney(nego.savings)})
                  </div>
                )}
                <div className="row gap-sm wrap">
                  {lastAnalysis?.suggestedCounter && (
                    <button className="btn sm" onClick={sendCounter} disabled={busy}>
                      Send counter ({fmtMoney(target ? Number(target) : lastAnalysis.suggestedCounter)})
                    </button>
                  )}
                  <button className="btn primary sm" onClick={accept} disabled={busy}>
                    Accept {fmtMoney(nego?.currentQuote)}
                  </button>
                  <button className="btn sm" onClick={() => setEditTarget((s) => !s)} disabled={busy}>Set target</button>
                </div>
                {editTarget && (
                  <div className="row gap-sm" style={{ marginTop: 8 }}>
                    <input className="field" type="number" placeholder="Your target $" value={target} onChange={(e) => setTarget(e.target.value)} style={{ maxWidth: 160 }} />
                    <button className="btn sm" onClick={sendCounter} disabled={busy || !target}>Counter at this</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
