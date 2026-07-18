import { fullState } from '../server/data.js'
import { cascadeFallback, contractFallback } from '../server/fallback.js'

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
    .catch(() => ({ ...cascadeFallback(body.change), source: 'demo' }))

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
