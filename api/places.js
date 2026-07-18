import { findNearby } from '../server/places.js'

export default async function handler(req, res) {
  const venue = req.query.venue
  if (!venue) return res.status(400).json({ error: 'Missing venue.' })
  try {
    return res.status(200).json(await findNearby(String(venue)))
  } catch (err) {
    return res.status(200).json({ error: 'Map service is busy right now. Try again in a moment.', detail: String(err.message || err) })
  }
}
