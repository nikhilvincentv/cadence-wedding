import { chatJSON } from '../server/ai.js'
import { EMAIL_SYSTEM, emailUser } from '../server/prompts.js'
import { emailFallback } from '../server/fallback.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { email } = body
  if (!email || !email.body) return res.status(400).json({ error: 'Missing email.' })
  try {
    const result = await chatJSON({ system: EMAIL_SYSTEM, user: emailUser(email), temperature: 0.1, maxTokens: 900 })
    return res.status(200).json({ ...result, source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...emailFallback(email), source: 'demo' })
  }
}
