import React, { useEffect, useRef, useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { getStatus, getState, saveState, daysUntil, generatePlan } from './api.js'
import Onboarding from './Onboarding.jsx'
import CommandCenter from './views/CommandCenter.jsx'
import TimelineView from './views/TimelineView.jsx'
import Contracts from './views/Contracts.jsx'
import Budget from './views/Budget.jsx'
import Guests from './views/Guests.jsx'
import AICoordinator from './views/AICoordinator.jsx'
import Vendors from './views/Vendors.jsx'
import Seating from './views/Seating.jsx'
import SearchPalette from './components/SearchPalette.jsx'
import Venue from './views/Venue.jsx'
import Inbox from './views/Inbox.jsx'

const NAV = [
  { id: 'home',        label: 'Dashboard',       icon: '⌂' },
  { id: 'timeline',    label: 'Timeline',         icon: '◷' },
  { id: 'budget',      label: 'Budget',           icon: '₿' },
  { id: 'guests',      label: 'Guests',           icon: '♡' },
  { id: 'vendors',     label: 'Vendors',          icon: '◈' },
  { id: 'contracts',   label: 'Contracts',        icon: '✦' },
  { id: 'seating',     label: 'Seating',          icon: '⊞' },
  { id: 'venue',       label: 'Venue & Nearby',   icon: '⌖' },
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [buildingPlan, setBuildingPlan] = useState(false)
  const plannedRef = useRef(false)

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus({ enabled: false, model: 'demo', provider: 'built-in' }))
  }, [])

  // Listen for ⌘K / Ctrl+K global search palette trigger
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Fetch wedding state once authentication details are fully loaded
  useEffect(() => {
    if (!isLoaded || !userId) return
    getState(userId).then(setData)
  }, [isLoaded, userId])

  // After onboarding, auto-build a starter plan (tasks, vendors, timeline, budget) with AI
  useEffect(() => {
    if (!data) return
    const planEmpty = !(data.tasks && data.tasks.length) && !(data.vendors && data.vendors.length) && !(data.budgetCategories && data.budgetCategories.length)
    if (!data.completedOnboarding || !data.wedding?.couple || !planEmpty || plannedRef.current) return
    plannedRef.current = true
    setBuildingPlan(true)
    const uid = () => Math.random().toString(36).slice(2, 9)
    const pm = (t) => {
      const m = String(t || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
      if (!m) return 0
      let h = Number(m[1]) % 12
      if (m[3] && m[3].toUpperCase() === 'PM') h += 12
      return h * 60 + Number(m[2])
    }
    generatePlan(data.wedding, data.profile)
      .then((plan) => {
        const tasks = (plan.tasks || []).map((d) => ({ id: uid(), checked: false, description: typeof d === 'string' ? d : d.description || d.title || '' }))
        const vendors = (plan.vendors || []).map((v) => ({ id: uid(), name: v.name || 'Vendor', category: v.category || '', contact: '', status: 'pending', rating: null }))
        const timeline = (plan.timeline || []).map((e) => ({ id: uid(), time: e.time || '12:00 PM', minutes: pm(e.time), title: e.title || 'Event', vendorId: '', durationMin: Number(e.durationMin) || 30, locked: false, note: '' }))
        const budgetCategories = (plan.budgetCategories || []).map((c) => ({ id: uid(), name: c.name || 'Category', projected: Number(c.projected) || 0, actual: 0 }))
        persist({ ...data, tasks, vendors, timeline, budgetCategories })
        setBuildingPlan(false)
      })
      .catch(() => setBuildingPlan(false))
  }, [data])

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

  const legacyAlreadyOnboarded = data.completedOnboarding === undefined && !!data.wedding?.couple
  const needsOnboarding = !data.completedOnboarding && !legacyAlreadyOnboarded
  if (needsOnboarding) {
    return <Onboarding data={data} persist={persist} onComplete={() => {}} />
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
        <div className="nav-item search-trigger" onClick={() => setSearchOpen(true)}>
          <span className="nav-ico">⌕</span>
          Search
          <span className="kbd-hint">⌘K</span>
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
            <button
              className="icon-btn"
              onClick={() => {
                localStorage.removeItem('cadence_dev_bypass')
                if (user) signOut()
                else window.location.reload()
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        {buildingPlan && (
          <div className="card pad-lg" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="spin" />
            <span className="muted">Cadence is building your starter plan — tasks, vendors, timeline, and budget…</span>
          </div>
        )}
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
        {view === 'venue' && (
          <Venue data={data} persist={persist} />
        )}
        {view === 'inspiration' && (
          <div className="view-placeholder">Inspiration — coming soon</div>
        )}
        {view === 'inbox' && (
          <Inbox data={data} persist={persist} live={live} />
        )}
        {view === 'ai' && (
          <AICoordinator data={data} persist={persist} status={status} />
        )}
      </main>

      {searchOpen && (
        <SearchPalette userId={userId} data={data} goto={setView} onClose={() => setSearchOpen(false)} />
      )}
    </div>
  )
}