import { chatJSON } from '../server/ai.js'
import { PLAN_SYSTEM, planUser } from '../server/prompts.js'
import { planFallback } from '../server/fallback.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { wedding, profile } = body
  if (!wedding) return res.status(400).json({ error: 'Missing wedding.' })
  try {
    const result = await chatJSON({ system: PLAN_SYSTEM, user: planUser({ wedding, profile }), temperature: 0.4, maxTokens: 1800 })
    return res.status(200).json({ ...result, source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...planFallback({ wedding, profile }), source: 'demo' })
  }
}
