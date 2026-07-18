import React, { useEffect, useState } from 'react'
import { UserButton } from '@clerk/clerk-react'
import { getStatus, getWedding, daysUntil } from './api.js'
import CommandCenter from './views/CommandCenter.jsx'
import TimelineView from './views/TimelineView.jsx'
import Contracts from './views/Contracts.jsx'

const NAV = [
  { id: 'home', label: 'Command Center' },
  { id: 'timeline', label: 'Timeline & Cascade' },
  { id: 'contracts', label: 'Contract Intel' },
]

export default function App() {
  const [view, setView] = useState('home')
  const [status, setStatus] = useState(null)
  const [state, setState] = useState(null)
  const [extraPayments, setExtraPayments] = useState([])
  const [timeline, setTimeline] = useState(null)

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus({ enabled: false, model: 'demo', provider: 'built-in' }))
    getWedding().then((s) => {
      setState(s)
      setTimeline(s.timeline)
    })
  }, [])

  if (!state) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <div className="row"><span className="spin" /> <span className="muted">Loading Cadence...</span></div>
      </div>
    )
  }

  const live = status?.enabled
  const days = daysUntil(state.wedding.date)
  const allPayments = [...state.payments, ...extraPayments]

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
          <div className="row between" style={{ marginTop: 12 }}>
            <div className="faint" style={{ fontSize: 11, lineHeight: 1.5 }}>
              {state.wedding.couple} · {days} days out
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </aside>

      <main className="main">
        {view === 'home' && (
          <CommandCenter state={state} payments={allPayments} status={status} goto={setView} days={days} />
        )}
        {view === 'timeline' && (
          <TimelineView
            state={state}
            timeline={timeline}
            setTimeline={setTimeline}
            live={live}
          />
        )}
        {view === 'contracts' && (
          <Contracts
            state={state}
            live={live}
            onExtracted={(pays) => setExtraPayments((p) => [...p, ...pays])}
          />
        )}
      </main>
    </div>
  )
}
