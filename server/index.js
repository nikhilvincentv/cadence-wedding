import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { fullState } from './data.js'
import { aiStatus, chatJSON } from './ai.js'
import { CASCADE_SYSTEM, cascadeUser, CONTRACT_SYSTEM, contractUser, SEATING_SYSTEM, seatingUser, EMAIL_SYSTEM, emailUser, PLAN_SYSTEM, planUser, RECOMMEND_SYSTEM, recommendUser, NEGOTIATE_SYSTEM, negotiateUser, DAY_PLAN_SYSTEM, dayPlanUser } from './prompts.js'
import { cascadeFallback, contractFallback, seatingFallback, emailFallback, planFallback, recommendFallback, negotiateFallback, dayPlanFallback } from './fallback.js'
import { coordinatorHandler } from '../api/coordinator.js'
import { getUserState, saveUserState } from './db.js'
import { typesenseEnabled, searchUser, buildDocs, reindexUser } from './typesense.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

function completeRecommendation(result, { wedding, profile, target, categories }) {
  if (target === 'venues') {
    if (result?.venues?.length >= 3) return result
    return recommendFallback({ wedding, profile, target })
  }
  const modelCats = result?.categories || {}
  const fb = recommendFallback({ wedding, profile, target: 'vendors', categories }).categories
  const out = {}
  for (const cat of categories || Object.keys(fb)) {
    const got = Array.isArray(modelCats[cat]) ? modelCats[cat].filter((v) => v && v.name) : []
    out[cat] = got.length >= 2 ? got : (fb[cat] || got)
  }
  return { categories: out }
}

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
    const saved = await saveUserState(userId, req.body || {})
    if (typesenseEnabled) {
      const docs = buildDocs(userId, req.body || {})
      await reindexUser(userId, docs).catch(e => console.error('Typesense reindex failed:', e))
    }
    res.json(saved)
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
    return res.json({ ...cascadeFallback(change, payload.timeline), source: 'demo', note: String(err.message || err) })
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

app.post('/api/plan', async (req, res) => {
  const { wedding, profile } = req.body || {}
  if (!wedding) return res.status(400).json({ error: 'Missing wedding.' })
  try {
    const result = await chatJSON({ system: PLAN_SYSTEM, user: planUser({ wedding, profile }), temperature: 0.4, maxTokens: 2600 })
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...planFallback({ wedding, profile }), source: 'demo' })
  }
})

app.post('/api/recommend', async (req, res) => {
  const { wedding, profile, target, categories } = req.body || {}
  if (!wedding) return res.status(400).json({ error: 'Missing wedding.' })
  try {
    const result = await chatJSON({ system: RECOMMEND_SYSTEM, user: recommendUser({ wedding, profile, target, categories }), temperature: 0.6, maxTokens: 3600 })
    return res.json({ ...completeRecommendation(result, { wedding, profile, target, categories }), source: 'model' })
  } catch (err) {
    return res.json({ ...recommendFallback({ wedding, profile, target, categories }), source: 'demo' })
  }
})

app.post('/api/negotiate', async (req, res) => {
  const { vendor, wedding, profile, history, action, targetPrice } = req.body || {}
  if (!vendor) return res.status(400).json({ error: 'Missing vendor.' })
  try {
    const result = await chatJSON({ system: NEGOTIATE_SYSTEM, user: negotiateUser({ vendor, wedding, profile, history, action, targetPrice }), temperature: 0.5, maxTokens: 900 })
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...negotiateFallback({ vendor, history, action, targetPrice }), source: 'demo' })
  }
})

app.post('/api/dayplan', async (req, res) => {
  const { date, description, wedding } = req.body || {}
  if (!date || !description) return res.status(400).json({ error: 'Missing date or description.' })
  try {
    const result = await chatJSON({ system: DAY_PLAN_SYSTEM, user: dayPlanUser({ date, description, wedding }), temperature: 0.4, maxTokens: 900 })
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...dayPlanFallback({ date, description }), source: 'demo', note: String(err.message || err) })
  }
})

app.post('/api/email', async (req, res) => {
  const { email } = req.body || {}
  if (!email || !email.body) return res.status(400).json({ error: 'Missing email.' })
  try {
    const result = await chatJSON({ system: EMAIL_SYSTEM, user: emailUser(email), temperature: 0.1, maxTokens: 900 })
    return res.json({ ...result, source: 'model' })
  } catch (err) {
    return res.json({ ...emailFallback(email), source: 'demo' })
  }
})

app.post('/api/coordinator', coordinatorHandler)

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
  console.log(`AIsle server on http://localhost:${PORT}`)
  console.log(`AI: ${s.enabled ? `live (${s.model} @ ${s.provider})` : 'demo mode (no key - using built-in reasoner)'}`)
})
