import { chatWithTools } from '../server/ai.js'
import { COORDINATOR_SYSTEM, coordinatorUser } from '../server/prompts.js'
import { buildTools, makeToolExecutor } from '../server/agentTools.js'
import { getUserState } from '../server/db.js'
import { coordinatorFallback } from '../server/fallback.js'

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
  const userId = req.header('x-user-id') || 'demo-user'

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Missing "message".' })
  }

  const context = { wedding, vendors, timeline, budgetCategories, guests, payments, message }

  try {
    // Agentic loop: the model can call tools to pull contracts, emails, negotiations,
    // or the authoritative Neon-persisted state before answering.
    const result = await chatWithTools({
      system: COORDINATOR_SYSTEM,
      user: coordinatorUser(context),
      tools: buildTools(),
      executeTool: makeToolExecutor(userId),
      temperature: 0.55,
      maxTokens: 1200,
    })

    const replyText = result.content || ''
    const proposal = extractMutation(replyText)
    // Strip the <mutation> block from the displayed reply text
    const cleanReply = replyText.replace(/<mutation>[\s\S]*?<\/mutation>/gi, '').trim()

    return res.json({ reply: cleanReply, proposal, source: 'model', toolsUsed: result.trace.map((t) => t.tool) })
  } catch (err) {
    let persisted = null
    try {
      persisted = await getUserState(userId)
    } catch {
      // no database configured either — fall through to generic offline reply
    }
    return res.json({ ...coordinatorFallback(message, persisted), source: 'demo', note: String(err.message || err) })
  }
}
