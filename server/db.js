import { neon } from '@neondatabase/serverless'
import { emptyState, sampleContracts } from './data.js'

const url = process.env.DATABASE_URL
const sql = url ? neon(url) : null

export const dbEnabled = Boolean(sql)

let schemaReady = false
async function ensureSchema() {
  if (schemaReady || !sql) return
  await sql`CREATE TABLE IF NOT EXISTS user_weddings (
    user_id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`
  schemaReady = true
}

function template() {
  return emptyState()
}

export async function getUserState(userId) {
  if (!sql) return { ...template(), sampleContracts, persisted: false }
  await ensureSchema()
  const rows = await sql`SELECT data FROM user_weddings WHERE user_id = ${userId}`
  if (rows.length === 0) {
    const seed = template()
    await sql`INSERT INTO user_weddings (user_id, data)
      VALUES (${userId}, ${JSON.stringify(seed)}::jsonb)
      ON CONFLICT (user_id) DO NOTHING`
    return { ...seed, sampleContracts, persisted: true }
  }
  return { ...rows[0].data, sampleContracts, persisted: true }
}

export async function saveUserState(userId, data) {
  if (!sql) return { ok: false, reason: 'no database configured' }
  await ensureSchema()
  const clean = {
    wedding: data.wedding,
    vendors: data.vendors,
    timeline: data.timeline,
    payments: data.payments,
    alerts: data.alerts,
  }
  await sql`INSERT INTO user_weddings (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(clean)}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = ${JSON.stringify(clean)}::jsonb, updated_at = now()`
  return { ok: true }
}
