const HOST = process.env.TYPESENSE_HOST
const PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https'
const PORT = process.env.TYPESENSE_PORT || '443'
const ADMIN_KEY = process.env.TYPESENSE_ADMIN_KEY
const COLLECTION = 'cadence'

export const typesenseEnabled = Boolean(HOST && ADMIN_KEY)

const base = () => `${PROTOCOL}://${HOST}:${PORT}`

async function ts(path, { method = 'GET', body, contentType = 'application/json' } = {}) {
  const res = await fetch(base() + path, {
    method,
    headers: { 'X-TYPESENSE-API-KEY': ADMIN_KEY, 'Content-Type': contentType },
    body,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Typesense ${res.status}: ${text.slice(0, 200)}`)
  return text
}

let ready = false
async function ensureCollection() {
  if (ready || !typesenseEnabled) return
  const schema = {
    name: COLLECTION,
    fields: [
      { name: 'userId', type: 'string', facet: true },
      { name: 'type', type: 'string', facet: true },
      { name: 'title', type: 'string' },
      { name: 'subtitle', type: 'string', optional: true },
      { name: 'view', type: 'string', optional: true },
    ],
  }
  try {
    await ts(`/collections/${COLLECTION}`)
  } catch {
    await ts('/collections', { method: 'POST', body: JSON.stringify(schema) })
  }
  ready = true
}

export function buildDocs(userId, data = {}) {
  const docs = []
  const push = (prefix, type, view, id, title, subtitle) => {
    if (!title) return
    docs.push({ id: `${userId}_${prefix}_${id}`, userId, type, view, title: String(title), subtitle: subtitle ? String(subtitle) : '' })
  }
  ;(data.vendors || []).forEach((v) => push('v', 'vendor', 'vendors', v.id, v.name, v.category))
  ;(data.guests || []).forEach((g) => push('g', 'guest', 'guests', g.id, g.name, `${g.relationship || ''} · ${g.rsvp || ''}`))
  ;(data.payments || []).forEach((p) => push('p', 'payment', 'home', p.id, p.label, p.source))
  ;(data.timeline || []).forEach((t) => push('t', 'timeline', 'timeline', t.id, t.title, t.time))
  ;(data.tasks || []).forEach((t) => push('k', 'task', 'home', t.id, t.title || t.text, t.due))
  ;(data.budgetCategories || []).forEach((c) => push('b', 'budget', 'budget', c.id, c.name, `$${c.projected || 0}`))
  return docs
}

export async function reindexUser(userId, docs) {
  if (!typesenseEnabled) return { enabled: false, indexed: 0 }
  await ensureCollection()
  await ts(`/collections/${COLLECTION}/documents?filter_by=${encodeURIComponent(`userId:=\`${userId}\``)}`, { method: 'DELETE' }).catch(() => {})
  if (docs.length === 0) return { enabled: true, indexed: 0 }
  const jsonl = docs.map((d) => JSON.stringify(d)).join('\n')
  await ts(`/collections/${COLLECTION}/documents/import?action=upsert`, { method: 'POST', body: jsonl, contentType: 'text/plain' })
  return { enabled: true, indexed: docs.length }
}

export async function searchUser(userId, q) {
  if (!typesenseEnabled) return { enabled: false, hits: [] }
  await ensureCollection()
  const params = new URLSearchParams({
    q: q || '*',
    query_by: 'title,subtitle',
    filter_by: `userId:=\`${userId}\``,
    per_page: '8',
  })
  const text = await ts(`/collections/${COLLECTION}/documents/search?${params.toString()}`)
  const data = JSON.parse(text)
  const hits = (data.hits || []).map((h) => ({
    id: h.document.id,
    type: h.document.type,
    view: h.document.view,
    title: h.document.title,
    subtitle: h.document.subtitle,
  }))
  return { enabled: true, hits, found: data.found }
}
