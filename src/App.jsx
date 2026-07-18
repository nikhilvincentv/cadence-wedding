import React, { useEffect, useState } from 'react'
import { UserButton, useUser } from '@clerk/clerk-react'
import { getStatus, getState, saveState, daysUntil } from './api.js'
import CommandCenter from './views/CommandCenter.jsx'
import TimelineView from './views/TimelineView.jsx'
import Contracts from './views/Contracts.jsx'

const NAV = [
  { id: 'home', label: 'Command Center' },
  { id: 'timeline', label: 'Timeline & Cascade' },
  { id: 'contracts', label: 'Contract Intel' },
]

export default function App() {
  const { isLoaded, user } = useUser()
  const userId = user?.id
  const [view, setView] = useState('home')
  const [status, setStatus] = useState(null)
  const [data, setData] = useState(null)

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus({ enabled: false, model: 'demo', provider: 'built-in' }))
  }, [])

  useEffect(() => {
    if (!isLoaded || !userId) return
    getState(userId).then(setData)
  }, [isLoaded, userId])

  if (!data) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div className="row"><span className="spin" /> <span className="muted">Loading your wedding...</span></div>
      </div>
    )
  }

  const live = status?.enabled
  const days = daysUntil(data.wedding.date)

  function persist(next) {
    setData(next)
    saveState(userId, next)
  }

  function addPayments(pays) {
    persist({ ...data, payments: [...data.payments, ...pays] })
  }

  function setTimeline(timeline) {
    persist({ ...data, timeline })
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">Cadence</div>
            <div className="brand-sub">Wedding OS</div>
          </div>
        </div>
        {NAV.map((n) => (
          <div key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => setView(n.id)}>
            {n.label}
          </div>
        ))}
        <div className="nav-spacer" />
        <div className="nav-foot">
          <div className={`aipill ${live ? 'live' : 'demo'}`}>
            <span className="dot" />
            {live ? `Live · ${status.model}` : 'Demo mode · built-in reasoner'}
          </div>
          <div className={`aipill ${data.persisted ? 'live' : 'demo'}`} style={{ marginTop: 8 }}>
            <span className="dot" />
            {data.persisted ? 'Saved to your account' : 'Not saved (offline)'}
          </div>
          <div className="row between" style={{ marginTop: 12 }}>
            <div className="faint" style={{ fontSize: 11, lineHeight: 1.5 }}>
              {data.wedding.couple} · {days} days out
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      <main className="main">
        {view === 'home' && (
          <CommandCenter state={data} payments={data.payments} status={status} goto={setView} days={days} />
        )}
        {view === 'timeline' && (
          <TimelineView state={data} timeline={data.timeline} setTimeline={setTimeline} live={live} />
        )}
        {view === 'contracts' && (
          <Contracts state={data} live={live} onExtracted={addPayments} />
        )}
      </main>
    </div>
  )
}
