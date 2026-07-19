import React, { useMemo, useState } from 'react'
import { fmtMoney } from '../api.js'
import {
  connectGmail, requestSmsCode, verifySms, deriveThreads,
  GMAIL_SCOPES, SMS_SCOPES,
} from '../integrations/comms.js'

function fmtTime(ts) {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Inbox({ data, persist }) {
  const conns = data.connections || { gmail: { connected: false }, sms: { connected: false } }
  const gmailOn = conns.gmail?.connected
  const smsOn = conns.sms?.connected
  const anyOn = gmailOn || smsOn

  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [gmailAddr, setGmailAddr] = useState('')
  const [smsStep, setSmsStep] = useState('number')
  const [smsNumber, setSmsNumber] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeId, setActiveId] = useState(null)

  const allThreads = useMemo(() => deriveThreads(data), [data])
  const threads = allThreads.filter((t) => {
    if (!gmailOn && t.channel === 'email') return false
    if (!smsOn && t.channel === 'sms') return false
    if (filter === 'email') return t.channel === 'email'
    if (filter === 'sms') return t.channel === 'sms'
    return true
  })
  const active = threads.find((t) => t.id === activeId) || threads[0] || null

  function saveConns(next) {
    persist({ ...data, connections: { ...conns, ...next } })
  }

  async function doConnectGmail() {
    setBusy(true)
    const res = await connectGmail(gmailAddr.trim() || undefined)
    setBusy(false)
    if (res.connected) {
      saveConns({ gmail: { connected: true, address: res.address } })
      setModal(null)
    }
  }

  async function doSendCode() {
    setBusy(true)
    await requestSmsCode(smsNumber.trim())
    setBusy(false)
    setSmsStep('code')
  }

  async function doVerifySms() {
    setBusy(true)
    const res = await verifySms(smsNumber.trim(), smsCode.trim())
    setBusy(false)
    if (res.connected) {
      saveConns({ sms: { connected: true, number: res.number } })
      setModal(null)
      setSmsStep('number')
      setSmsCode('')
    }
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Inbox</h1>
          <div className="page-sub">
            Connect your email and phone, then let the AIsle agent reach out, negotiate, and reply to vendors for you.
          </div>
        </div>
        {anyOn && (
          <div className="row gap-sm wrap">
            {gmailOn && <span className="badge ok" style={{ fontSize: 11 }}>✉️ {conns.gmail.address}</span>}
            {smsOn && <span className="badge ok" style={{ fontSize: 11 }}>💬 {conns.sms.number}</span>}
          </div>
        )}
      </div>

      {!anyOn ? (
        <div className="grid cols-2">
          <div className="card pad-lg">
            <div style={{ fontSize: 26, marginBottom: 10 }}>✉️</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Connect Gmail</div>
            <div className="faint" style={{ fontSize: 13, margin: '6px 0 14px' }}>
              Let the agent read vendor emails and send replies from your inbox.
            </div>
            <button className="btn primary" onClick={() => setModal('gmail')}>Connect Gmail</button>
          </div>
          <div className="card pad-lg">
            <div style={{ fontSize: 26, marginBottom: 10 }}>💬</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Link your phone</div>
            <div className="faint" style={{ fontSize: 13, margin: '6px 0 14px' }}>
              Get a dedicated wedding number so the agent can text vendors and you see every reply.
            </div>
            <button className="btn primary" onClick={() => setModal('sms')}>Link phone number</button>
          </div>
        </div>
      ) : (
        <>
          <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
            <div className="row gap-sm wrap">
              <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>All</button>
              {gmailOn && <button className={`chip ${filter === 'email' ? 'on' : ''}`} onClick={() => setFilter('email')}>Email</button>}
              {smsOn && <button className={`chip ${filter === 'sms' ? 'on' : ''}`} onClick={() => setFilter('sms')}>Texts</button>}
            </div>
            <span className="badge low" style={{ fontSize: 11 }}>◉ Agent active · handling replies</span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
            <div className="card" style={{ padding: 6, maxHeight: '68vh', overflowY: 'auto' }}>
              {threads.length === 0 && (
                <div className="faint" style={{ fontSize: 13, padding: 20, textAlign: 'center' }}>No threads yet. When the agent contacts a vendor, it shows up here.</div>
              )}
              {threads.map((t) => {
                const last = t.messages[t.messages.length - 1]
                const isActive = active && active.id === t.id
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    style={{
                      padding: '11px 12px', borderRadius: 12, cursor: 'pointer', marginBottom: 4,
                      background: isActive ? 'var(--bg-2)' : 'transparent',
                    }}
                  >
                    <div className="row between" style={{ gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: t.unread ? 700 : 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.channel === 'sms' ? '💬 ' : '✉️ '}{t.vendorName}
                      </span>
                      <span className="faint" style={{ fontSize: 11, flexShrink: 0 }}>{fmtTime(t.ts)}</span>
                    </div>
                    <div className="faint" style={{ fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {last?.from === 'agent' ? 'Agent: ' : ''}{last?.text}
                    </div>
                    <div className="row gap-sm" style={{ marginTop: 5 }}>
                      {t.status === 'agreed' && <span className="badge ok" style={{ fontSize: 9.5 }}>✅ agreed</span>}
                      {t.unread && <span className="badge warn" style={{ fontSize: 9.5 }}>new reply</span>}
                      {t.savings > 0 && <span className="badge low" style={{ fontSize: 9.5 }}>saved {fmtMoney(t.savings)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="card pad-lg" style={{ minHeight: 360, display: 'flex', flexDirection: 'column' }}>
              {!active ? (
                <div className="faint" style={{ fontSize: 13, margin: 'auto' }}>Select a thread.</div>
              ) : (
                <>
                  <div className="row between" style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{active.vendorName}</div>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {active.channel === 'sms' ? `💬 Text · ${active.contactName}` : `✉️ ${active.subject}`}
                      </div>
                    </div>
                    {active.negotiated > 0 && <span className="badge ok" style={{ fontSize: 11 }}>{fmtMoney(active.negotiated)}</span>}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                    {active.messages.map((m, i) => {
                      const mine = m.from === 'agent'
                      return (
                        <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                          <div className="faint" style={{ fontSize: 10, marginBottom: 3, textAlign: mine ? 'right' : 'left' }}>
                            {mine ? 'AIsle agent' : active.contactName || active.vendorName} · {fmtTime(m.ts)}
                          </div>
                          <div style={{
                            padding: '9px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                            background: mine ? 'var(--rose-deep)' : '#fff',
                            color: mine ? '#fff' : 'var(--ink)',
                            border: mine ? 'none' : '1px solid var(--line)',
                          }}>
                            {m.text}
                            {m.quote != null && <div style={{ marginTop: 5, fontWeight: 700 }}>Quote: {fmtMoney(m.quote)}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="row gap-sm" style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line-soft)', alignItems: 'center' }}>
                    <span className="spin" />
                    <span className="faint" style={{ fontSize: 12.5 }}>
                      {active.status === 'agreed' ? 'Deal agreed — agent is preparing the contract.' : 'AIsle agent is drafting the next reply for you to approve.'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {modal === 'gmail' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <h3>Connect Gmail</h3>
              <button className="modal-x" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="faint" style={{ fontSize: 13, marginBottom: 14 }}>
              AIsle will request permission to:
            </div>
            <div style={{ marginBottom: 16 }}>
              {GMAIL_SCOPES.map((s) => (
                <div key={s.id} className="row gap-sm" style={{ padding: '8px 0', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <span style={{ fontSize: 13 }}>{s.label}</span>
                </div>
              ))}
            </div>
            <input
              className="field"
              placeholder="you@gmail.com"
              value={gmailAddr}
              onChange={(e) => setGmailAddr(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <button className="btn primary" style={{ width: '100%' }} onClick={doConnectGmail} disabled={busy}>
              {busy ? <><span className="spin" /> Authorizing…</> : 'Continue with Google'}
            </button>
            <div className="faint" style={{ fontSize: 11, textAlign: 'center', marginTop: 10 }}>
              You approve access in Google's secure window. AIsle never sees your password.
            </div>
          </div>
        </div>
      )}

      {modal === 'sms' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <h3>Link your phone</h3>
              <button className="modal-x" onClick={() => setModal(null)}>×</button>
            </div>
            {smsStep === 'number' ? (
              <>
                <div className="faint" style={{ fontSize: 13, marginBottom: 14 }}>
                  The agent gets a dedicated wedding number so it can text vendors and thread their replies here.
                </div>
                <div style={{ marginBottom: 16 }}>
                  {SMS_SCOPES.map((s) => (
                    <div key={s.id} className="row gap-sm" style={{ padding: '8px 0', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 16 }}>{s.icon}</span>
                      <span style={{ fontSize: 13 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                <input
                  className="field"
                  placeholder="(555) 555-0123"
                  value={smsNumber}
                  onChange={(e) => setSmsNumber(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <button className="btn primary" style={{ width: '100%' }} onClick={doSendCode} disabled={busy || !smsNumber.trim()}>
                  {busy ? <><span className="spin" /> Sending code…</> : 'Send verification code'}
                </button>
              </>
            ) : (
              <>
                <div className="faint" style={{ fontSize: 13, marginBottom: 14 }}>
                  Enter the 6-digit code we texted to {smsNumber}.
                </div>
                <input
                  className="field"
                  placeholder="123456"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  style={{ marginBottom: 12, letterSpacing: 4, textAlign: 'center', fontSize: 18 }}
                />
                <button className="btn primary" style={{ width: '100%' }} onClick={doVerifySms} disabled={busy || !smsCode.trim()}>
                  {busy ? <><span className="spin" /> Verifying…</> : 'Verify & link'}
                </button>
                <button className="btn ghost sm" style={{ width: '100%', marginTop: 8 }} onClick={() => setSmsStep('number')}>
                  Use a different number
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
