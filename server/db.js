import { neon } from '@neondatabase/serverless'
import { emptyState, sampleContracts, sampleEmails } from './data.js'

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
  await sql`CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`
  schemaReady = true
}

export async function getUserState(userId) {
  if (!sql) return { ...emptyState(), sampleContracts, sampleEmails, profile: null, persisted: false }
  await ensureSchema()
  const [wRows, pRows] = await Promise.all([
    sql`SELECT data FROM user_weddings WHERE user_id = ${userId}`,
    sql`SELECT data FROM user_profiles WHERE user_id = ${userId}`,
  ])
  const profile = pRows.length ? pRows[0].data : null
  if (wRows.length === 0) {
    const seed = emptyState()
    await sql`INSERT INTO user_weddings (user_id, data)
      VALUES (${userId}, ${JSON.stringify(seed)}::jsonb)
      ON CONFLICT (user_id) DO NOTHING`
    return { ...seed, sampleContracts, sampleEmails, profile, persisted: true }
  }
  return { ...wRows[0].data, sampleContracts, sampleEmails, profile, persisted: true }
}

export async function saveUserState(userId, data) {
  if (!sql) return { ok: false, reason: 'no database configured' }
  await ensureSchema()
  const { sampleContracts: _s, sampleEmails: _e, persisted: _p, profile, ...rest } = data
  await sql`INSERT INTO user_weddings (user_id, data, updated_at)
    VALUES (${userId}, ${JSON.stringify(rest)}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = ${JSON.stringify(rest)}::jsonb, updated_at = now()`
  if (profile !== undefined && profile !== null) {
    await sql`INSERT INTO user_profiles (user_id, data, updated_at)
      VALUES (${userId}, ${JSON.stringify(profile)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET data = ${JSON.stringify(profile)}::jsonb, updated_at = now()`
  }
  return { ok: true }
}
