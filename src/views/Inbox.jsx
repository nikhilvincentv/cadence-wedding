import React, { useState } from 'react'
import { scanEmail, fmtMoney } from '../api.js'

const uid = () => Math.random().toString(36).slice(2, 9)

export default function Inbox({ data, persist, live }) {
  const emails = data.sampleEmails || []
  const [connected, setConnected] = useState(false)
  const [results, setResults] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [added, setAdded] = useState({})

  async function scan(email) {
    setBusyId(email.id)
    const r = await scanEmail(email)
    setResults((m) => ({ ...m, [email.id]: r }))
    setBusyId(null)
  }

  function addToPlan(email) {
    const r = results[email.id]
    if (!r) return
    const pays = (r.payments || []).map((p) => ({
      id: uid(), vendorId: '', label: p.label, amount: Number(p.amount) || 0,
      dueDate: /^\d{4}-\d{2}-\d{2}$/.test(p.dueDate || '') ? p.dueDate : '', status: 'due',
      source: `${r.vendorName || 'Email'} (inbox)`,
    }))
    const taskDescs = [...(r.actionItems || []), ...(r.deadlines || []).map((d) => `${d.what}${d.date ? ` (by ${d.date})` : ''}`)]
    const tasks = taskDescs.map((d) => ({ id: uid(), checked: false, description: d }))
    persist({
      ...data,
      payments: [...(data.payments || []), ...pays],
      tasks: [...(data.tasks || []), ...tasks],
    })
    setAdded((m) => ({ ...m, [email.id]: true }))
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <div className="eyebrow">Inbox Intelligence</div>
          <h1 className="page">Your inbox, sorted by the AI</h1>
          <div className="page-sub">Cadence reads vendor emails and pulls out payments, date changes, and deadlines automatically.</div>
        </div>
        {!connected && <button className="btn primary" onClick={() => setConnected(true)}>Connect Gmail</button>}
      </div>

      {!connected ? (
        <div className="card pad-lg" style={{ textAlign: 'center', padding: 40 }}>
          <div className="muted" style={{ fontSize: 15, marginBottom: 6 }}>Connect your inbox to let Cadence watch for vendor updates.</div>
          <div className="faint" style={{ fontSize: 12.5 }}>Demo mode loads a sample vendor inbox — the AI extraction below is live.</div>
          <button className="btn primary mt" onClick={() => setConnected(true)}>Connect Gmail (demo)</button>
        </div>
      ) : (
        <>
          <div className="row between mb-sm">
            <span className="badge ok">Connected · demo inbox</span>
            <span className="faint" style={{ fontSize: 12 }}>{live ? 'Live AI extraction' : 'Offline reasoner'}</span>
          </div>
          <div className="stack">
            {emails.map((e) => {
              const r = results[e.id]
              return (
                <div className="card pad-lg" key={e.id}>
                  <div className="row between wrap" style={{ gap: 10 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600 }}>{e.subject}</div>
                      <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>{e.from} · {e.date}</div>
                    </div>
                    {!r && <button className="btn sm" onClick={() => scan(e)} disabled={busyId === e.id}>{busyId === e.id ? <><span className="spin" /> Reading...</> : 'Scan with AI'}</button>}
                  </div>
                  <div className="email-body">{e.body}</div>

                  {r && !r.error && (
                    <div className="email-extract fade-in">
                      <div className="row between mb-sm">
                        <b style={{ fontSize: 13 }}>What Cadence found</b>
                        <span className={`badge ${r.source === 'model' ? 'ok' : 'ghost'}`}>{r.source === 'model' ? 'live model' : 'demo reasoner'}</span>
                      </div>
                      <div className="muted" style={{ fontSize: 13, marginBottom: 8 }}>{r.summary}</div>
                      {(r.payments || []).map((p, i) => (
                        <div className="extract-line" key={'p' + i}><span className="badge med">payment</span> {p.label} — <b>{fmtMoney(p.amount)}</b>{p.dueDate ? ` · due ${p.dueDate}` : ''}</div>
                      ))}
                      {(r.dateChanges || []).map((d, i) => (
                        <div className="extract-line" key={'d' + i}><span className="badge warn">date change</span> {d.what}: {d.from} → <b>{d.to}</b></div>
                      ))}
                      {(r.deadlines || []).map((d, i) => (
                        <div className="extract-line" key={'l' + i}><span className="badge low">deadline</span> {d.what}{d.date ? ` · ${d.date}` : ''}</div>
                      ))}
                      {(r.actionItems || []).map((a, i) => (
                        <div className="extract-line" key={'a' + i}><span className="badge ghost">to-do</span> {a}</div>
                      ))}
                      <div className="row" style={{ marginTop: 10 }}>
                        <button className="btn primary sm" onClick={() => addToPlan(e)} disabled={added[e.id]}>{added[e.id] ? '✓ Added to plan' : 'Add to plan'}</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
