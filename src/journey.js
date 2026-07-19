import { VENDOR_CATEGORIES } from '../server/data.js'

export { VENDOR_CATEGORIES }

const uid = () => Math.random().toString(36).slice(2, 9)

export function withId(obj, prefix = 'r') {
  return obj && obj.id ? obj : { ...obj, id: `${prefix}-${uid()}` }
}

export function bookedVendors(data) {
  return (data.vendors || []).filter((v) => v.stage === 'booked' || v.status === 'booked')
}

export function bookedCategories(data) {
  const set = new Set()
  bookedVendors(data).forEach((v) => v.category && set.add(v.category))
  return set
}

export function nextCategory(data) {
  const booked = bookedCategories(data)
  return VENDOR_CATEGORIES.find((c) => !booked.has(c)) || null
}

export function venueSet(data) {
  return !!data.venue && !!data.venue.name
}

export function milestones(data) {
  const venue = venueSet(data)
  const booked = bookedVendors(data).length
  const timeline = (data.timeline || []).length > 0
  return [
    { id: 'vision', label: 'Vision', done: !!data.completedOnboarding, active: false },
    { id: 'venue', label: 'Venue', done: venue, active: !venue },
    { id: 'vendors', label: 'Vendors', done: venue && booked >= 3, active: venue && booked < 3, detail: `${booked} booked` },
    { id: 'coordinate', label: 'Coordinate', done: timeline, active: venue && booked >= 3 && !timeline },
    { id: 'day-of', label: 'Command Center', done: false, active: false },
  ]
}

export function nextAction(data) {
  if (!venueSet(data)) {
    return {
      title: 'Find your venue',
      body: 'Everything else builds from here. Cadence has picked venues that fit your city, style, and budget.',
      cta: 'Browse venues',
      view: 'venue',
      icon: '⌖',
    }
  }
  const booked = bookedVendors(data)
  const cat = nextCategory(data)
  if (booked.length === 0) {
    return {
      title: `Book your ${cat || 'first vendor'}`,
      body: 'With your venue set, your first recommended vendor is ready. Shortlist, contact, and let Cadence negotiate.',
      cta: `Find ${cat || 'vendors'}`,
      view: 'vendors',
      icon: '◈',
    }
  }
  if (cat) {
    return {
      title: `Next up: your ${cat}`,
      body: `You've booked ${booked.length} vendor${booked.length !== 1 ? 's' : ''}. Cadence recommends tackling ${cat} next.`,
      cta: `Find ${cat}`,
      view: 'vendors',
      icon: '◈',
    }
  }
  if ((data.timeline || []).length === 0) {
    return {
      title: 'Build your day-of timeline',
      body: 'All your key vendors are booked. Let Cadence draft a timeline that respects everyone’s call times.',
      cta: 'Build timeline',
      view: 'timeline',
      icon: '◷',
    }
  }
  return {
    title: 'Coordinate the day',
    body: 'Your plan is coming together. Run a what-if to see how Cadence handles changes.',
    cta: 'Open AI Coordinator',
    view: 'ai',
    icon: '◉',
  }
}

const STAGE_META = {
  recommended: { label: 'Recommended', cls: 'ghost', icon: '' },
  shortlisted: { label: 'Shortlisted', cls: 'info', icon: '⭐' },
  contacted: { label: 'Contacted', cls: 'info', icon: '💬' },
  negotiating: { label: 'Negotiating', cls: 'warn', icon: '💬' },
  offer: { label: 'Offer in', cls: 'warn', icon: '💰' },
  'contract-out': { label: 'Contract in', cls: 'warn', icon: '📄' },
  booked: { label: 'Booked', cls: 'ok', icon: '✅' },
}
export function stageMeta(stage) {
  return STAGE_META[stage] || STAGE_META.recommended
}
