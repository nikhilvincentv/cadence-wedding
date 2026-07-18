import { chatJSON } from '../server/ai.js'
import { COORDINATOR_SYSTEM, coordinatorUser } from '../server/prompts.js'

// Fallback response when AI is unavailable
function coordinatorFallback(message) {
  return {
    reply: `I'm currently running in offline mode. Your message was: "${message.slice(0, 80)}${message.length > 80 ? '…' : ''}". I can't generate a live response right now, but your data is safe.`,
    proposal: null,
  }
}

// Parse a <mutation>...</mutation> block from AI reply text
function extractMutation(text) {
  const match = text.match(/<mutation>([\s\S]*?)<\/mutation>/i)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch {
    return null
  }
}

export async function coordinatorHandler(req, res) {
  const { message, wedding, vendors, timeline, budgetCategories, guests, payments } = req.body || {}

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Missing "message".' })
  }

  const context = { wedding, vendors, timeline, budgetCategories, guests, payments, message }

  try {
    // Use text-mode chat since the reply may contain mixed text + <mutation> XML
    const raw = await chatJSON({
      system: COORDINATOR_SYSTEM,
      user: coordinatorUser(context),
      temperature: 0.55,
      maxTokens: 1200,
      // Return raw text so we can parse the mutation block ourselves
      returnRaw: true,
    })

    // raw may be a string or an object with a text/content field depending on ai.js
    const replyText = typeof raw === 'string' ? raw : (raw?.text || raw?.content || JSON.stringify(raw))

    const proposal = extractMutation(replyText)
    // Strip the <mutation> block from the displayed reply text
    const cleanReply = replyText.replace(/<mutation>[\s\S]*?<\/mutation>/gi, '').trim()

    return res.json({ reply: cleanReply, proposal, source: 'model' })
  } catch (err) {
    return res.json({ ...coordinatorFallback(message), source: 'demo', note: String(err.message || err) })
  }
}
