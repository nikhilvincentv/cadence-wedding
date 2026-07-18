import { chatJSON } from '../server/ai.js'
import { CONTRACT_SYSTEM, contractUser } from '../server/prompts.js'
import { contractFallback } from '../server/fallback.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { text } = body
  if (!text || typeof text !== 'string')
    return res.status(400).json({ error: 'Missing contract "text".' })

  try {
    const result = await chatJSON({
      system: CONTRACT_SYSTEM,
      user: contractUser(text),
      temperature: 0.1,
      maxTokens: 1000,
    })
    return res.status(200).json({ ...result, source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...contractFallback(text), source: 'demo' })
  }
}
