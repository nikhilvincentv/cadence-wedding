import React, { useEffect, useRef, useState } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { getStatus, getState, saveState, daysUntil, recommend } from './api.js'
import { VENDOR_CATEGORIES, withId } from './journey.js'
import Onboarding from './Onboarding.jsx'
import CommandCenter from './views/CommandCenter.jsx'
import TimelineView from './views/TimelineView.jsx'
import Contracts from './views/Contracts.jsx'
import Budget from './views/Budget.jsx'
import Guests from './views/Guests.jsx'
import AICoordinator from './views/AICoordinator.jsx'
import Inbox from './views/Inbox.jsx'
import Vendors from './views/Vendors.jsx'
import Seating from './views/Seating.jsx'
import SearchPalette from './components/SearchPalette.jsx'
import VenueFinder from './views/VenueFinder.jsx'
import Inspiration from './views/Inspiration.jsx'

const NAV = [
  { id: 'home',        label: 'Dashboard',        icon: '⌂' },
  { id: 'venue',       label: 'Find Venue',       icon: '⌖' },
  { id: 'vendors',     label: 'Find Vendors',     icon: '◈' },
  { id: 'timeline',    label: 'Timeline',         icon: '◷' },
  { id: 'budget',      label: 'Budget',           icon: '₿' },
  { id: 'guests',      label: 'Guests',           icon: '♡' },
  { id: 'seating',     label: 'Seating',          icon: '⊞' },
  { id: 'contracts',   label: 'Contracts',        icon: '✦' },
  { id: 'inspiration', label: 'Inspiration',      icon: '✧' },
  { id: 'inbox',       label: 'Inbox',            icon: '✉' },
  { id: 'ai',          label: 'AI Coordinator',   icon: '◉' },
]

export default function App() {
  const { isLoaded, user } = useUser()
  const { signOut } = useClerk()
  const userId = user?.id || (typeof localStorage !== 'undefined' && localStorage.getItem('cadence_dev_bypass') === '1' ? 'demo-user' : null)
  const [view, setView] = useState('home')
  const [status, setStatus] = useState(null)
  const [data, setData] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [buildingPlan, setBuildingPlan] = useState(false)
  const plannedRef = useRef(false)

  useEffect(() => {
    getStatus().then(setStatus).catch(() => setStatus({ enabled: false, model: 'demo', provider: 'built-in' }))
  }, [])

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

  useEffect(() => {
    if (!isLoaded || !userId) return
    getState(userId).then(setData)
  }, [isLoaded, userId])

  useEffect(() => {
    if (!data) return
    if (!data.completedOnboarding || !data.wedding?.couple || plannedRef.current) return
    const recs = data.recommendations || {}
    const hasVenues = recs.venues && recs.venues.length
    const hasVendors = recs.categories && Object.keys(recs.categories).length
    if (hasVenues && hasVendors) return
    plannedRef.current = true
    setBuildingPlan(true)
    Promise.all([
      hasVenues ? Promise.resolve({ venues: recs.venues }) : recommend(data.wedding, data.profile, 'venues'),
      hasVendors ? Promise.resolve({ categories: recs.categories }) : recommend(data.wedding, data.profile, 'vendors', VENDOR_CATEGORIES),
    ])
      .then(([v, c]) => {
        const venues = (v.venues || []).map((x) => withId(x, 'venue'))
        const categories = {}
        for (const [k, arr] of Object.entries(c.categories || {})) {
          categories[k] = (arr || []).map((x) => ({ ...withId(x, 'vend'), category: k }))
        }
        persist({ ...data, recommendations: { venues, categories } })
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
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name"><span className="brand-ai">AI</span>sle</div>
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
            <span className="muted">AIsle is finding venues and vendors that fit your city, style, and budget…</span>
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
          <Vendors data={data} persist={persist} setView={setView} status={status} />
        )}
        {view === 'seating' && (
          <Seating data={data} persist={persist} live={live} />
        )}
        {view === 'inspiration' && (
          <Inspiration data={data} persist={persist} />
        )}
        {view === 'venue' && (
          <VenueFinder data={data} persist={persist} setView={setView} />
        )}
        {view === 'inbox' && (
          <div className="view-placeholder">Inbox — coming soon</div>
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