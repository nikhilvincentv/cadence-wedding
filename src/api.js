import { fullState } from '../server/data.js'
import { cascadeFallback, contractFallback, dayPlanFallback } from '../server/fallback.js'

const j = (r) => {
  if (!r.ok) throw new Error(`Request failed: ${r.status}`)
  return r.json()
}

export const getStatus = () =>
  fetch('/api/status')
    .then(j)
    .catch(() => ({ enabled: false, model: 'demo-reasoner (offline)', provider: 'built-in' }))

export const getState = (userId) =>
  fetch('/api/state', { headers: { 'x-user-id': userId || 'demo-user' } })
    .then(j)
    .catch(() => ({ ...fullState(), persisted: false }))

export const saveState = (userId, data) =>
  fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || 'demo-user' },
    body: JSON.stringify(data),
  })
    .then(j)
    .catch(() => ({ ok: false }))

export const runCascade = (body) =>
  fetch('/api/cascade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(j)
    .catch(() => ({ ...cascadeFallback(body.change, body.timeline), source: 'demo' }))

export const generatePlan = (wedding, profile) =>
  fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wedding, profile }),
  })
    .then(j)
    .catch(() => ({ error: 'Could not generate plan.' }))

export const generateDayPlan = (date, description, wedding) =>
  fetch('/api/dayplan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, description, wedding }),
  })
    .then(j)
    .catch(() => ({ ...dayPlanFallback({ date, description }), source: 'demo' }))

export const scanEmail = (email) =>
  fetch('/api/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
    .then(j)
    .catch(() => ({ error: 'Could not scan email.' }))

export const findNearbyVendors = (venue) =>
  fetch(`/api/places?venue=${encodeURIComponent(venue)}`)
    .then(j)
    .catch(() => ({ error: 'Could not reach the map service.' }))

export const reindexSearch = (userId, data) =>
  fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId || 'demo-user' },
    body: JSON.stringify({ data }),
  })
    .then(j)
    .catch(() => ({ enabled: false }))

export const searchQuery = (userId, q) =>
  fetch(`/api/search?q=${encodeURIComponent(q)}`, { headers: { 'x-user-id': userId || 'demo-user' } })
    .then(j)
    .catch(() => ({ enabled: false, hits: [] }))

export const runSeating = (body) =>
  fetch('/api/seating', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(j)

export const extractContract = (text) =>
  fetch('/api/contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
    .then(j)
    .catch(() => ({ ...contractFallback(text), source: 'demo' }))

export const fmtMoney = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

export const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d - now) / 86400000)
}
