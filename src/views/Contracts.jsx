import React, { useState } from 'react'
import { extractContract, fmtMoney } from '../api.js'

export default function Contracts({ state, live, onExtracted }) {
  const { sampleContracts, vendors } = state
  const [text, setText] = useState('')
  const [picked, setPicked] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [addedToPlan, setAddedToPlan] = useState(false)

  function pick(c) {
    setPicked(c.id)
    setText(c.text)
    setResult(null)
    setAddedToPlan(false)
  }

  async function scan() {
    if (!text.trim()) return
    setLoading(true)
    setResult(null)
    setAddedToPlan(false)
    try {
      const r = await extractContract(text)
      setResult(r)
    } catch (e) {
      setResult({ error: String(e.message || e) })
    } finally {
      setLoading(false)
    }
  }

  function addPayments() {
    if (!result?.payments?.length) return
    const pays = result.payments.map((p, i) => ({
      id: `x-${Date.now()}-${i}`,
      vendorId: vendors.find((v) => v.name?.toLowerCase().includes((result.vendorName || '').toLowerCase().split(' ')[0]))?.id || 'catering',
      label: p.label,
      amount: p.amount,
      dueDate: p.dueDate?.match(/^\d{4}-\d{2}-\d{2}$/) ? p.dueDate : '2026-08-30',
      status: 'due',
      source: `${result.vendorName} (scanned)`,
    }))
    onExtracted(pays)
    setAddedToPlan(true)
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="eyebrow">Contract Intelligence</div>
          <h1 className="page">Stop reading the fine print</h1>
          <div className="page-sub">Paste any vendor contract. Cadence pulls the deadlines, hidden fees, and traps - and feeds them into your plan.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '0.85fr 1.15fr', gap: 20 }}>
        <div className="card pad-lg">
          <h2 className="section-title">Drop in a contract</h2>
          <div className="faint" style={{ fontSize: 12.5, marginBottom: 10 }}>Try a sample:</div>
          <div className="stack">
            {sampleContracts.map((c) => (
              <button key={c.id} className={`chip ${picked === c.id ? 'on' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => pick(c)}>
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            className="field mt"
            rows={10}
            placeholder="...or paste the contract text here"
            value={text}
            onChange={(e) => { setText(e.target.value); setPicked(null) }}
            style={{ fontFamily: 'var(--mono)', fontSize: 12 }}
          />
          <div className="row between mt">
            <span className="faint" style={{ fontSize: 12 }}>{live ? 'Live model' : 'Built-in reasoner'}</span>
            <button className="btn primary" onClick={scan} disabled={loading || !text.trim()}>
              {loading ? <><span className="spin" /> Scanning...</> : 'Scan contract'}
            </button>
          </div>
        </div>

        <div className="stack">
          {!result && !loading && (
            <div className="card pad-lg" style={{ display: 'grid', placeItems: 'center', minHeight: 260, textAlign: 'center' }}>
              <div>
                <div className="muted mt-sm">Pick a sample or paste a contract, then hit <b>Scan</b>.</div>
                <div className="faint" style={{ fontSize: 12.5, marginTop: 8 }}>Cadence extracts payments, hidden fees, gratuity, cancellation terms and key dates.</div>
              </div>
            </div>
          )}

          {loading && (
            <div className="card pad-lg">
              <div className="reasoning">
                <div className="step"><b>&gt;</b> Reading the agreement...</div>
                <div className="step" style={{ animationDelay: '0.25s' }}><b>&gt;</b> Isolating payment schedule and fees...</div>
                <div className="step" style={{ animationDelay: '0.5s' }}><b>&gt;</b> Flagging what a couple would miss...</div>
              </div>
            </div>
          )}

          {result && !result.error && (
            <div className="stack fade-in">
              <div className="card pad-lg">
                <div className="row between mb-sm">
                  <div>
                    <h2 className="section-title" style={{ margin: 0 }}>{result.vendorName || 'Vendor'}</h2>
                    <div className="faint" style={{ fontSize: 12.5 }}>{result.category}</div>
                  </div>
                  <span className={`badge ${result.source === 'model' ? 'ok' : 'ghost'}`}>{result.source === 'model' ? 'live model' : 'demo reasoner'}</span>
                </div>

                <div className="extract-grid mt-sm">
                  <div>
                    <div className="faint" style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Payments</div>
                    {(result.payments || []).length === 0 && <div className="faint" style={{ fontSize: 13 }}>None found.</div>}
                    {(result.payments || []).map((p, i) => (
                      <div className="kv" key={i}>
                        <span className="k">{p.label}<br /><span className="faint" style={{ fontSize: 11.5 }}>{p.dueDate}</span></span>
                        <span className="v mono">{fmtMoney(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="faint" style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Fees & terms</div>
                    {(result.hiddenFees || []).map((f, i) => (
                      <div className="kv" key={i}>
                        <span className="k">{f.label}<br /><span className="faint" style={{ fontSize: 11.5 }}>{f.detail}</span></span>
                        <span className="v mono">{f.amount ? fmtMoney(f.amount) : '-'}</span>
                      </div>
                    ))}
                    <div className="kv">
                      <span className="k">Gratuity included?</span>
                      <span className="v">
                        <span className={`badge ${result.gratuityIncluded === false ? 'high' : result.gratuityIncluded === true ? 'ok' : 'med'}`}>
                          {String(result.gratuityIncluded)}
                        </span>
                      </span>
                    </div>
                    <div className="kv">
                      <span className="k">Cancellation</span>
                      <span className="v" style={{ fontSize: 12, maxWidth: 190 }}>{result.cancellation}</span>
                    </div>
                  </div>
                </div>

                {(result.keyDates || []).length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="faint" style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>Key dates</div>
                    <div className="row wrap gap-sm">
                      {result.keyDates.map((k, i) => (
                        <span className="tag" key={i}>{k.label}: <b style={{ color: 'var(--ink)' }}>{k.date}</b></span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {(result.watchOuts || []).length > 0 && (
                <div className="card pad-lg">
                  <h2 className="section-title">What you would have missed</h2>
                  {result.watchOuts.map((w, i) => (
                    <div className="watchout" key={i}><span style={{ color: 'var(--amber)' }}>&bull;</span> {w}</div>
                  ))}
                </div>
              )}

              {(result.payments || []).length > 0 && (
                <div className="card pad-lg row between">
                  <span className="muted" style={{ fontSize: 13.5 }}>Push these {result.payments.length} payment(s) into your Command Center?</span>
                  <button className="btn primary sm" onClick={addPayments} disabled={addedToPlan}>
                    {addedToPlan ? 'Added to plan' : 'Add to plan'}
                  </button>
                </div>
              )}
            </div>
          )}

          {result?.error && (
            <div className="card pad-lg"><span className="badge high">error</span> <span className="muted">{result.error}</span></div>
          )}
        </div>
      </div>
    </div>
  )
}
