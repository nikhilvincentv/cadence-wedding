const j = (r) => {
  if (!r.ok) throw new Error(`Request failed: ${r.status}`)
  return r.json()
}

export const getStatus = () => fetch('/api/status').then(j)
export const getWedding = () => fetch('/api/wedding').then(j)

export const runCascade = (body) =>
  fetch('/api/cascade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(j)

export const extractContract = (text) =>
  fetch('/api/contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).then(j)

export const fmtMoney = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })

export const daysUntil = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date('2026-07-17T00:00:00')
  return Math.round((d - now) / 86400000)
}
