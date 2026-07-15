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

export async function chatJSON({ system, user, temperature = 0.3, maxTokens = 1200 }) {
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
        response_format: { type: 'json_object' },
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
    return JSON.parse(content)
  } finally {
    clearTimeout(timeout)
  }
}
