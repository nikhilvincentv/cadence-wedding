import { chatJSON } from '../server/ai.js'
import { SEATING_SYSTEM, seatingUser } from '../server/prompts.js'
import { seatingFallback } from '../server/fallback.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { guests, tables, notes } = body
  if (!Array.isArray(guests) || !Array.isArray(tables) || tables.length === 0)
    return res.status(400).json({ error: 'Need guests and at least one table.' })

  try {
    const result = await chatJSON({
      system: SEATING_SYSTEM,
      user: seatingUser({ guests, tables, notes }),
      temperature: 0.3,
      maxTokens: 1500,
    })
    return res.status(200).json({ ...result, source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...seatingFallback({ guests, tables }), source: 'demo' })
  }
}
