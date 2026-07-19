import React, { useState } from 'react'
import { scanEmail, fmtMoney } from '../api.js'

const uid = () => Math.random().toString(36).slice(2, 9)

export default function Inbox({ data, persist, live }) {
  const [connected, setConnected] = useState(false)
  const [results, setResults] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [added, setAdded] = useState({})

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const emails = data.sampleEmails || []
  const inboxThreads = data.inboxThreads || [];
  const activeThread = inboxThreads.find(thread => thread.id === activeThreadId);

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

  const handleSendReply = () => {
    if (!activeThread || !replyText.trim()) return;

    const updatedThreads = inboxThreads.map(thread =>
      thread.id === activeThreadId
        ? { ...thread, replies: [...(thread.replies || []), replyText] }
        : thread
    );
    persist({ ...data, inboxThreads: updatedThreads });
    setReplyText('');
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left Pane: AI Email Scanning */}
      <div className="fade-in" style={{ flex: 1, paddingRight: '20px' }}>
        <div className="topbar">
          <div>
            <h1 className="page">Your inbox, sorted by the AI</h1>
            <div className="page-sub">AIsle reads vendor emails and pulls out payments, date changes, and deadlines automatically.</div>
          </div>
          {!connected && <button className="btn primary" onClick={() => setConnected(true)}>Connect Gmail</button>}
        </div>

        {!connected ? (
          <div className="card pad-lg" style={{ textAlign: 'center', padding: 40 }}>
            <div className="muted" style={{ fontSize: 15, marginBottom: 6 }}>Connect your inbox to let AIsle watch for vendor updates.</div>
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
                          <b style={{ fontSize: 13 }}>What AIsle found</b>
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

      {/* Right Pane: Inbox Threads */}
      <div className="inbox-view" style={{ flex: 1 }}>
        <div className="split-pane left-pane" style={{ flex: '0 0 35%', maxWidth: '35%' }}>
          <h2 className="section-title">Inbox Threads</h2>
          <div className="inbox-thread-list" style={{ overflowY: 'auto', flexGrow: 1 }}>
            {inboxThreads.length === 0 ? (
              <div className="onboarding-prompt" style={{ padding: '20px', textAlign: 'center', color: 'var(--faint)' }}>
                <h3>Your inbox is empty!</h3>
                <p>Looks like you don't have any threads yet. New threads will appear here.</p>
                <p>Try sending a message to the AI Coordinator to generate some activity!</p>
              </div>
            ) : (
              inboxThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={`inbox-thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <div className="row between">
                    <span className="sender">{thread.sender}</span>
                    <span className="timestamp">{new Date(thread.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="tldr">{thread.tldr}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="split-pane right-pane" style={{ flex: '1', maxWidth: '65%', display: 'flex', flexDirection: 'column' }}>
          <h2 className="section-title">Active Thread</h2>
          {activeThread ? (
            <>
              <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
                <h3>From: {activeThread.sender}</h3>
                <p>{activeThread.body}</p>
                {(activeThread.replies || []).map((reply, index) => (
                  <p key={index} style={{ marginTop: '10px', fontStyle: 'italic' }}>
                    You replied: {reply}
                  </p>
                ))}
              </div>
              {/* AI Impact Banner (Task 10.4) */}
              <div className="impact-banner" style={{ padding: '10px', background: 'var(--bg-3)', marginTop: '10px' }}>
                AI Impact: {activeThread.impact || 'None'} <span className="badge low">{activeThread.impactLevel || 'None'}</span>
              </div>
              {/* Smart Reply Area (Task 10.5) */}
              <div className="smart-reply" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <textarea
                  className="field"
                  placeholder="Smart reply draft..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flexGrow: 1, resize: 'none' }}
                />
                <button className="btn primary" onClick={handleSendReply}>Send</button>
              </div>
            </>
          ) : (
            <p className="faint" style={{ padding: '10px' }}>Select a thread to view its content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
