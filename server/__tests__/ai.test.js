import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('chatWithTools agent loop', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('throws when AI is disabled (no API key configured)', async () => {
    vi.stubEnv('AI_API_KEY', '')
    const { chatWithTools } = await import('../ai.js')
    await expect(
      chatWithTools({ system: 's', user: 'u', tools: [], executeTool: async () => ({}) })
    ).rejects.toThrow(/disabled/i)
  })

  it('returns the final content directly when the model makes no tool calls', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Here is your answer.' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { chatWithTools } = await import('../ai.js')

    const result = await chatWithTools({ system: 'sys', user: 'hello', tools: [], executeTool: async () => ({}) })

    expect(result.content).toBe('Here is your answer.')
    expect(result.trace).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('executes a requested tool call and feeds the result back before answering', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    let call = 0
    const fetchMock = vi.fn().mockImplementation(async () => {
      call++
      if (call === 1) {
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: null,
                  tool_calls: [{ id: 'call_1', function: { name: 'get_persisted_state', arguments: '{}' } }],
                },
              },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Your budget is $10,000.' } }] }) }
    })
    vi.stubGlobal('fetch', fetchMock)
    const executeTool = vi.fn().mockResolvedValue({ wedding: { budgetTotal: 10000 } })
    const { chatWithTools } = await import('../ai.js')

    const result = await chatWithTools({
      system: 'sys',
      user: 'what is my budget',
      tools: [{ type: 'function', function: { name: 'get_persisted_state' } }],
      executeTool,
    })

    expect(executeTool).toHaveBeenCalledWith('get_persisted_state', {})
    expect(result.content).toBe('Your budget is $10,000.')
    expect(result.trace).toEqual([{ tool: 'get_persisted_state', args: {} }])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('passes the tool result back to the model as a tool-role message', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    const seenMessages = []
    const fetchMock = vi.fn().mockImplementation(async (_url, opts) => {
      const body = JSON.parse(opts.body)
      seenMessages.push(body.messages)
      if (seenMessages.length === 1) {
        return {
          ok: true,
          json: async () => ({
            choices: [
              {
                message: {
                  content: null,
                  tool_calls: [{ id: 'c1', function: { name: 'search_wedding_data', arguments: '{"query":"florist"}' } }],
                },
              },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Found it.' } }] }) }
    })
    vi.stubGlobal('fetch', fetchMock)
    const { chatWithTools } = await import('../ai.js')

    await chatWithTools({
      system: 'sys',
      user: 'find florist',
      tools: [],
      executeTool: async () => ({ hits: [{ title: 'Fern & Fable' }] }),
    })

    const secondCallMessages = seenMessages[1]
    const toolMsg = secondCallMessages.find((m) => m.role === 'tool')
    expect(toolMsg).toBeDefined()
    expect(toolMsg.tool_call_id).toBe('c1')
    expect(toolMsg.content).toContain('Fern & Fable')
  })

  it('records a tool error instead of throwing when a tool implementation fails', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    let call = 0
    const fetchMock = vi.fn().mockImplementation(async () => {
      call++
      if (call === 1) {
        return {
          ok: true,
          json: async () => ({
            choices: [
              { message: { content: null, tool_calls: [{ id: 'c1', function: { name: 'boom', arguments: '{}' } }] } },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Recovered.' } }] }) }
    })
    vi.stubGlobal('fetch', fetchMock)
    const { chatWithTools } = await import('../ai.js')

    const result = await chatWithTools({
      system: 'sys',
      user: 'trigger a failing tool',
      tools: [],
      executeTool: async () => {
        throw new Error('tool exploded')
      },
    })

    expect(result.content).toBe('Recovered.')
  })

  it('throws if the model loops past maxTurns without a final answer', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          { message: { content: null, tool_calls: [{ id: 'x', function: { name: 'search_wedding_data', arguments: '{}' } }] } },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { chatWithTools } = await import('../ai.js')

    await expect(
      chatWithTools({ system: 's', user: 'u', tools: [], executeTool: async () => ({}), maxTurns: 2 })
    ).rejects.toThrow(/max turns/i)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('surfaces a non-ok HTTP response as an error', async () => {
    vi.stubEnv('AI_API_KEY', 'test-key')
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'Internal error' })
    vi.stubGlobal('fetch', fetchMock)
    const { chatWithTools } = await import('../ai.js')

    await expect(
      chatWithTools({ system: 's', user: 'u', tools: [], executeTool: async () => ({}) })
    ).rejects.toThrow(/AI 500/)
  })
})
