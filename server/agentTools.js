import { getUserState } from './db.js'
import { searchUser } from './typesense.js'

export function buildTools() {
  return [
    {
      type: 'function',
      function: {
        name: 'get_persisted_state',
        description:
          "Fetch the couple's full saved wedding data straight from the database (Neon): wedding details, vendors, timeline, budget categories, guests, payments, tasks, and recommendations. Use this whenever the conversation context might be stale or incomplete.",
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_contracts',
        description:
          "Get vendor contract documents and any saved AI contract analyses (hidden fees, payment schedules, cancellation terms, watch-outs).",
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_emails',
        description: 'Get vendor email threads and inbox messages relevant to the wedding.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_negotiations',
        description: 'Get in-progress vendor price negotiation history, offers, and outcomes.',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_wedding_data',
        description:
          "Full-text search across the couple's vendors, guests, payments, timeline, and tasks for a keyword or name.",
        parameters: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Search keywords' } },
          required: ['query'],
        },
      },
    },
  ]
}

export function makeToolExecutor(userId) {
  let cached = null
  const state = async () => {
    if (!cached) cached = await getUserState(userId)
    return cached
  }

  return async function executeTool(name, args) {
    switch (name) {
      case 'get_persisted_state': {
        const s = await state()
        const { sampleContracts, sampleEmails, ...rest } = s
        return rest
      }
      case 'get_contracts': {
        const s = await state()
        return { contractAnalyses: s.contractAnalyses || {}, contracts: s.sampleContracts || [] }
      }
      case 'get_emails': {
        const s = await state()
        return { inboxThreads: s.inboxThreads || [], emails: s.sampleEmails || [] }
      }
      case 'get_negotiations': {
        const s = await state()
        return { negotiations: s.negotiations || {} }
      }
      case 'search_wedding_data': {
        const q = String(args?.query || '').trim()
        if (!q) return { hits: [] }
        const res = await searchUser(userId, q)
        if (res.enabled) return res
        const s = await state()
        const needle = q.toLowerCase()
        const hits = []
        for (const v of s.vendors || [])
          if (`${v.name} ${v.category}`.toLowerCase().includes(needle))
            hits.push({ type: 'vendor', title: v.name, subtitle: v.category })
        for (const g of s.guests || [])
          if (`${g.name} ${g.relationship || ''}`.toLowerCase().includes(needle))
            hits.push({ type: 'guest', title: g.name, subtitle: g.relationship })
        for (const p of s.payments || [])
          if (`${p.label || ''} ${p.source || ''}`.toLowerCase().includes(needle))
            hits.push({ type: 'payment', title: p.label, subtitle: p.source })
        for (const t of s.timeline || [])
          if (`${t.title || ''}`.toLowerCase().includes(needle))
            hits.push({ type: 'timeline', title: t.title, subtitle: t.time })
        for (const task of s.tasks || [])
          if (`${task.title || task.text || ''}`.toLowerCase().includes(needle))
            hits.push({ type: 'task', title: task.title || task.text, subtitle: task.due })
        return { enabled: false, hits: hits.slice(0, 15) }
      }
      default:
        return { error: `Unknown tool: ${name}` }
    }
  }
}
