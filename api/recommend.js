import { chatJSON } from '../server/ai.js'
import { RECOMMEND_SYSTEM, recommendUser } from '../server/prompts.js'
import { recommendFallback } from '../server/fallback.js'

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
  const { wedding, profile, target, categories } = body
  if (!wedding) return res.status(400).json({ error: 'Missing wedding.' })
  try {
    const result = await chatJSON({ system: RECOMMEND_SYSTEM, user: recommendUser({ wedding, profile, target, categories }), temperature: 0.6, maxTokens: 3600 })
    return res.status(200).json({ ...completeRecommendation(result, { wedding, profile, target, categories }), source: 'model' })
  } catch (err) {
    return res.status(200).json({ ...recommendFallback({ wedding, profile, target, categories }), source: 'demo' })
  }
}
