import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { fullState } from './data.js'
import { aiStatus, chatJSON } from './ai.js'
import { CASCADE_SYSTEM, cascadeUser, CONTRACT_SYSTEM, contractUser, SEATING_SYSTEM, seatingUser } from './prompts.js'
import { cascadeFallback, contractFallback, seatingFallback } from './fallback.js'
import { getUserState, saveUserState } from './db.js'
import { reindexUser, searchUser, buildDocs, typesenseEnabled } from './typesense.js'
import { findNearby } from './places.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const PORT = process.env.PORT || 8787

app.get('/api/status', (_req, res) => res.json(aiStatus()))

app.get('/api/wedding', (_req, res) => res.json(fullState()))

app.get('/api/state', async (req, res) => {
  const userId = req.header('x-user-id') || 'demo-user'
  try {
    res.json(await getUserState(userId))
  } catch (err) {
    res.status(200).json({ ...fullState(), persisted: false, dbError: String(err.message || err) })
  }
})

app.post('/api/state', async (req, res) => {
  const userId = req.header('x-user-id') || 'demo-user'
  try {
    res.json(await saveUserState(userId, req.body || {}))
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) })
  }
})

app.post('/api/cascade', async (req, res) => {
  const { change, timeline, vendors, wedding, profile } = req.body || {}
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
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...cascadeFallback(change), source: 'demo', note: String(err.message || err) })
  }
})

app.get('/api/places', async (req, res) => {
  const venue = req.query.venue
  if (!venue) return res.status(400).json({ error: 'Missing venue.' })
  try {
    res.json(await findNearby(String(venue)))
  } catch (err) {
    res.status(200).json({ error: 'Map service is busy right now. Try again in a moment.', detail: String(err.message || err) })
  }
})

app.post('/api/search', async (req, res) => {
  const userId = req.header('x-user-id') || 'demo-user'
  try {
    const docs = buildDocs(userId, req.body?.data || {})
    res.json(await reindexUser(userId, docs))
  } catch (err) {
    res.status(200).json({ enabled: typesenseEnabled, indexed: 0, error: String(err.message || err) })
  }
})

app.get('/api/search', async (req, res) => {
  const userId = req.header('x-user-id') || 'demo-user'
  try {
    res.json(await searchUser(userId, req.query.q || ''))
  } catch (err) {
    res.status(200).json({ enabled: typesenseEnabled, hits: [], error: String(err.message || err) })
  }
})

app.post('/api/seating', async (req, res) => {
  const { guests, tables, notes } = req.body || {}
  if (!Array.isArray(guests) || !Array.isArray(tables) || tables.length === 0)
    return res.status(400).json({ error: 'Need guests and at least one table.' })
  try {
    const result = await chatJSON({
      system: SEATING_SYSTEM,
      user: seatingUser({ guests, tables, notes }),
      temperature: 0.3,
      maxTokens: 1500,
    })
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...seatingFallback({ guests, tables }), source: 'demo' })
  }
})

app.post('/api/contract', async (req, res) => {
  const { text } = req.body || {}
  if (!text || typeof text !== 'string')
    return res.status(400).json({ error: 'Missing contract "text".' })

  try {
    const result = await chatJSON({
      system: CONTRACT_SYSTEM,
      user: contractUser(text),
      temperature: 0.1,
      maxTokens: 1000,
    })
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...contractFallback(text), source: 'demo', note: String(err.message || err) })
  }
})

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  const s = aiStatus()
  console.log(`Cadence server on http://localhost:${PORT}`)
  console.log(`AI: ${s.enabled ? `live (${s.model} @ ${s.provider})` : 'demo mode (no key - using built-in reasoner)'}`)
})
