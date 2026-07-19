import { chatJSON } from '../server/ai.js'
import { NEGOTIATE_SYSTEM, negotiateUser } from '../server/prompts.js'
import { negotiateFallback } from '../server/fallback.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { vendor, wedding, profile, history, action, targetPrice } = body
  if (!vendor) return res.status(400).json({ error: 'Missing vendor.' })
  try {
    const result = await chatJSON({ system: NEGOTIATE_SYSTEM, user: negotiateUser({ vendor, wedding, profile, history, action, targetPrice }), temperature: 0.5, maxTokens: 900 })
    return res.status(200).json({ ...result, source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...negotiateFallback({ vendor, history, action, targetPrice }), source: 'demo' })
  }
}
