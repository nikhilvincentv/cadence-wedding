import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db.js', () => ({
  getUserState: vi.fn(),
}))
vi.mock('../typesense.js', () => ({
  searchUser: vi.fn(),
}))

import { getUserState } from '../db.js'
import { searchUser } from '../typesense.js'
import { buildTools, makeToolExecutor } from '../agentTools.js'

const sampleState = {
  wedding: { couple: 'Alex & Sam', budgetTotal: 40000 },
  vendors: [{ id: 'v1', name: 'Fern & Fable Florals', category: 'Florist' }],
  guests: [{ id: 'g1', name: 'Jordan Lee', relationship: 'friends' }],
  payments: [{ id: 'p1', label: 'Deposit', source: 'Florist' }],
  timeline: [{ id: 't1', title: 'Ceremony', time: '4:00 PM' }],
  tasks: [{ id: 'tk1', title: 'Book florist' }],
  contractAnalyses: { v1: { vendorName: 'Fern & Fable' } },
  sampleContracts: [{ id: 'c1', label: 'Example' }],
  inboxThreads: [{ id: 'i1' }],
  sampleEmails: [{ id: 'e1' }],
  negotiations: { v1: { status: 'negotiating' } },
}

describe('agentTools', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserState.mockResolvedValue(sampleState)
  })

  it('declares all five expected tool names for the model', () => {
    const names = buildTools().map((t) => t.function.name)
    expect(names).toEqual([
      'get_persisted_state',
      'get_contracts',
      'get_emails',
      'get_negotiations',
      'search_wedding_data',
    ])
  })

  it('get_persisted_state returns live Neon data without the sample fixtures', async () => {
    const exec = makeToolExecutor('user-1')
    const result = await exec('get_persisted_state', {})
    expect(getUserState).toHaveBeenCalledWith('user-1')
    expect(result.wedding.couple).toBe('Alex & Sam')
    expect(result.sampleContracts).toBeUndefined()
    expect(result.sampleEmails).toBeUndefined()
  })

  it('caches the Neon fetch across multiple tool calls within one conversation', async () => {
    const exec = makeToolExecutor('user-1')
    await exec('get_persisted_state', {})
    await exec('get_contracts', {})
    await exec('get_negotiations', {})
    expect(getUserState).toHaveBeenCalledTimes(1)
  })

  it('scopes the cache per user — a new executor re-fetches', async () => {
    const execA = makeToolExecutor('user-a')
    const execB = makeToolExecutor('user-b')
    await execA('get_persisted_state', {})
    await execB('get_persisted_state', {})
    expect(getUserState).toHaveBeenCalledTimes(2)
    expect(getUserState).toHaveBeenNthCalledWith(1, 'user-a')
    expect(getUserState).toHaveBeenNthCalledWith(2, 'user-b')
  })

  it('get_contracts returns saved analyses plus contract text', async () => {
    const exec = makeToolExecutor('user-1')
    const result = await exec('get_contracts', {})
    expect(result.contractAnalyses.v1.vendorName).toBe('Fern & Fable')
    expect(result.contracts).toEqual(sampleState.sampleContracts)
  })

  it('get_emails returns inbox threads and sample emails', async () => {
    const exec = makeToolExecutor('user-1')
    const result = await exec('get_emails', {})
    expect(result.inboxThreads).toEqual(sampleState.inboxThreads)
    expect(result.emails).toEqual(sampleState.sampleEmails)
  })

  it('get_negotiations returns negotiation history', async () => {
    const exec = makeToolExecutor('user-1')
    const result = await exec('get_negotiations', {})
    expect(result.negotiations.v1.status).toBe('negotiating')
  })

  it('search_wedding_data defers to Typesense when it is enabled', async () => {
    searchUser.mockResolvedValue({ enabled: true, hits: [{ title: 'Fern & Fable Florals' }] })
    const exec = makeToolExecutor('user-1')
    const result = await exec('search_wedding_data', { query: 'florist' })
    expect(searchUser).toHaveBeenCalledWith('user-1', 'florist')
    expect(result.hits[0].title).toBe('Fern & Fable Florals')
  })

  it('search_wedding_data falls back to scanning Neon data when Typesense is disabled', async () => {
    searchUser.mockResolvedValue({ enabled: false, hits: [] })
    const exec = makeToolExecutor('user-1')
    const result = await exec('search_wedding_data', { query: 'florals' })
    expect(result.enabled).toBe(false)
    expect(result.hits.some((h) => h.type === 'vendor' && h.title === 'Fern & Fable Florals')).toBe(true)
  })

  it('search_wedding_data returns no hits for a blank query without calling search', async () => {
    const exec = makeToolExecutor('user-1')
    const result = await exec('search_wedding_data', { query: '   ' })
    expect(result.hits).toEqual([])
    expect(searchUser).not.toHaveBeenCalled()
  })

  it('returns an error payload for an unknown tool name instead of throwing', async () => {
    const exec = makeToolExecutor('user-1')
    const result = await exec('delete_everything', {})
    expect(result.error).toMatch(/unknown tool/i)
  })
})
