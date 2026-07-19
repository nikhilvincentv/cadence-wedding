const API_KEY = process.env.AI_API_KEY?.trim()
const BASE_URL = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const MODEL = process.env.AI_MODEL || 'gpt-4o-mini'

export const aiEnabled = Boolean(API_KEY)

export function aiStatus() {
  return {
    enabled: aiEnabled,
    model: aiEnabled ? MODEL : 'demo-reasoner (offline)',
    provider: aiEnabled ? new URL(BASE_URL).host : 'built-in',
  }
}

export async function chatJSON({ system, user, temperature = 0.3, maxTokens = 1200, returnRaw = false }) {
  if (!aiEnabled) throw new Error('AI disabled - no API key configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25000)

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'api-key': API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        max_tokens: maxTokens,
        // Don't force json_object mode when caller wants raw text (may contain mixed content)
        ...(returnRaw ? {} : { response_format: { type: 'json_object' } }),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`AI ${res.status}: ${body.slice(0, 200)}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('AI returned empty content')
    return returnRaw ? content : JSON.parse(content)
  } finally {
    clearTimeout(timeout)
  }
}

// Agentic chat loop: the model can call tools (fetch data from Neon, search, etc.)
// over several turns before producing a final text answer.
export async function chatWithTools({ system, user, tools, executeTool, temperature = 0.4, maxTokens = 1200, maxTurns = 5 }) {
  if (!aiEnabled) throw new Error('AI disabled - no API key configured')

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
  const trace = []

  for (let turn = 0; turn < maxTurns; turn++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    let data
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'api-key': API_KEY,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature,
          max_tokens: maxTokens,
          tools,
          tool_choice: 'auto',
          messages,
        }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`AI ${res.status}: ${body.slice(0, 200)}`)
      }
      data = await res.json()
    } finally {
      clearTimeout(timeout)
    }

    const msg = data.choices?.[0]?.message
    if (!msg) throw new Error('AI returned no message')

    const toolCalls = msg.tool_calls
    if (!toolCalls || toolCalls.length === 0) {
      return { content: msg.content || '', trace }
    }

    messages.push({ role: 'assistant', content: msg.content || null, tool_calls: toolCalls })

    for (const call of toolCalls) {
      const name = call.function?.name
      let args = {}
      try {
        args = JSON.parse(call.function?.arguments || '{}')
      } catch {
        args = {}
      }
      let result
      try {
        result = await executeTool(name, args)
      } catch (err) {
        result = { error: String(err.message || err) }
      }
      trace.push({ tool: name, args })
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result ?? null).slice(0, 8000) })
    }
  }

  throw new Error('AI tool loop exceeded max turns without a final answer')
}
