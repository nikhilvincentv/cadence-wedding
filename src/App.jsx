import React, { useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { getStatus, getState, saveState, daysUntil } from './api.js'
import CommandCenter from './views/CommandCenter.jsx'
import TimelineView from './views/TimelineView.jsx'
import Contracts from './views/Contracts.jsx'
import Budget from './views/Budget.jsx'
import Guests from './views/Guests.jsx'
import AICoordinator from './views/AICoordinator.jsx'
import Vendors from './views/Vendors.jsx'
import Seating from './views/Seating.jsx'

const NAV = [
  { id: 'home',        label: 'Dashboard',       icon: '⌂' },
  { id: 'timeline',    label: 'Timeline',         icon: '◷' },
  { id: 'budget',      label: 'Budget',           icon: '₿' },
  { id: 'guests',      label: 'Guests',           icon: '♡' },
  { id: 'vendors',     label: 'Vendors',          icon: '◈' },
  { id: 'contracts',   label: 'Contracts',        icon: '✦' },
  { id: 'seating',     label: 'Seating',          icon: '⊞' },
  { id: 'inspiration', label: 'Inspiration',      icon: '✧' },
  { id: 'inbox',       label: 'Inbox',            icon: '✉' },
  { id: 'ai',          label: 'AI Coordinator',   icon: '◉' },
]

export default function App() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
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
        <div className="row"><span className="spin" /> <span className="muted">Loading your account...</span></div>
      </div>
    )
  }

  const live = status?.enabled
  const days = daysUntil(data.wedding.date)

  function persist(next) {
    setData(next)
    saveState(userId, next)
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
            <span className="nav-ico">{n.icon}</span>
            {n.label}
          </div>
        ))}
        <div className="nav-spacer" />
        <div className="nav-foot">
          <div className={`aipill ${live ? 'live' : 'demo'}`}>
            <span className="dot" />
            {live ? `AI live · ${status.model}` : 'AI offline · built-in reasoner'}
          </div>
          <div className={`aipill ${data.persisted ? 'live' : 'demo'}`} style={{ marginTop: 8 }}>
            <span className="dot" />
            {data.persisted ? 'Saved to your account' : 'Not saved (offline)'}
          </div>
          <div className="row between" style={{ marginTop: 12 }}>
            <div className="faint" style={{ fontSize: 11, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.primaryEmailAddress?.emailAddress || data.wedding.couple || 'Signed in'}
            </div>
            <button className="icon-btn" onClick={() => signOut()}>Sign out</button>
          </div>
        </div>
      </aside>

      <main className="main">
        {view === 'home' && (
          <CommandCenter data={data} persist={persist} status={status} goto={setView} days={days} />
        )}
        {view === 'timeline' && (
          <TimelineView data={data} persist={persist} live={live} />
        )}
        {view === 'contracts' && (
          <Contracts data={data} persist={persist} live={live} />
        )}
        {view === 'budget' && (
          <Budget data={data} persist={persist} />
        )}
        {view === 'guests' && (
          <Guests data={data} persist={persist} />
        )}
        {view === 'vendors' && (
          <Vendors data={data} persist={persist} setView={setView} />
        )}
        {view === 'seating' && (
          <Seating data={data} persist={persist} live={live} />
        )}
        {view === 'inspiration' && (
          <div className="view-placeholder">Inspiration — coming soon</div>
        )}
        {view === 'inbox' && (
          <div className="view-placeholder">Inbox — coming soon</div>
        )}
        {view === 'ai' && (
          <AICoordinator data={data} persist={persist} status={status} />
        )}
      </main>
    </div>
  )
}
