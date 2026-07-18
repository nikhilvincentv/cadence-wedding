import { fullState } from '../server/data.js'
import { chatJSON } from '../server/ai.js'
import { CASCADE_SYSTEM, cascadeUser } from '../server/prompts.js'
import { cascadeFallback } from '../server/fallback.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { change, timeline, vendors, wedding, profile } = body
  if (!change || typeof change !== 'string')
    return res.status(400).json({ error: 'Missing "change" description.' })

  const state = fullState()
  const payload = {
    wedding: wedding || state.wedding,
    vendors: vendors || state.vendors,
    timeline: timeline || state.timeline,
    profile: profile || null,
    change,
  }

  try {
    const result = await chatJSON({
      system: CASCADE_SYSTEM,
      user: cascadeUser(payload),
      temperature: 0.35,
      maxTokens: 1400,
    })
    return res.status(200).json({ ...result, source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...cascadeFallback(change), source: 'demo' })
  }
}
