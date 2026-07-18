import { getUserState, saveUserState } from '../server/db.js'
import { fullState } from '../server/data.js'

export default async function handler(req, res) {
  const userId = req.headers['x-user-id'] || 'demo-user'
  try {
    if (req.method === 'GET') {
      return res.status(200).json(await getUserState(userId))
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      return res.status(200).json(await saveUserState(userId, body))
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    if (req.method === 'GET')
      return res.status(200).json({ ...fullState(), persisted: false, dbError: String(err.message || err) })
    return res.status(500).json({ ok: false, error: String(err.message || err) })
  }
}
