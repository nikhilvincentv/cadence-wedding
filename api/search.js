import { reindexUser, searchUser, buildDocs, typesenseEnabled } from '../server/typesense.js'

export default async function handler(req, res) {
  const userId = req.headers['x-user-id'] || 'demo-user'
  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const docs = buildDocs(userId, body.data || {})
      return res.status(200).json(await reindexUser(userId, docs))
    }
    if (req.method === 'GET') {
      return res.status(200).json(await searchUser(userId, req.query.q || ''))
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    if (req.method === 'GET') return res.status(200).json({ enabled: typesenseEnabled, hits: [], error: String(err.message || err) })
    return res.status(200).json({ enabled: typesenseEnabled, indexed: 0, error: String(err.message || err) })
  }
}
