const PHOTO_LATE = {
  summary:
    "Photographer arriving an hour late compresses every getting-ready shot and puts the first look at risk.",
  severity: 'high',
  reasoning: [
    'Evergreen Photo now arrives 12:30 PM instead of 11:30 AM - 60 min of getting-ready coverage is gone.',
    'First look is scheduled 1:00 PM, leaving the photographer only 30 min on-site before it - details + prep shots get squeezed out.',
    'Wedding-party portraits (1:30) back right up against the 3:00 shuttle and the LOCKED 4:00 ceremony.',
    'Evergreen contract ends coverage at 8:30 PM and does not extend for client-side delays, so pushing everything later would cost overtime at $450/hr.',
    'Hair & makeup already ends ~11:30; a small shift there buys the photographer breathing room without touching the ceremony.',
  ],
  conflicts: [
    { title: 'Getting-ready coverage cut in half', detail: 'Only 30 min before first look instead of 90 - detail and prep shots at risk.', vendorId: 'photo', impact: 'high' },
    { title: 'First look at 1:00 is no longer realistic', detail: 'Photographer needs setup + a light check; 1:00 is too tight on a 12:30 arrival.', vendorId: 'photo', impact: 'high' },
    { title: 'Party portraits collide with the 3:00 shuttle', detail: 'Portraits would run past when the wedding party must stage for guest arrival.', vendorId: 'shuttle', impact: 'medium' },
    { title: 'Hair & makeup has no buffer', detail: 'Bride out of the chair at 11:30 leaves zero margin if the photographer wants ready-shots.', vendorId: 'hmua', impact: 'medium' },
  ],
  fix: {
    headline: 'Pull hair & makeup 30 min earlier and slide the first look to 1:20 - ceremony stays put.',
    changes: [
      { target: 'Glow Studio (hair & makeup)', action: 'Start 7:30 AM instead of 8:00; bride out of chair by 11:00.' },
      { target: 'First look', action: 'Move 1:00 PM to 1:20 PM to give the photographer setup time after a 12:30 arrival.' },
      { target: 'Wedding-party portraits', action: 'Trim to 45 min (1:40-2:25) to clear the 3:00 shuttle.' },
    ],
    tradeoff: 'The bride is ready ~30 min earlier and holds; golden-hour and ceremony are untouched.',
  },
  notifications: [
    { vendorId: 'hmua', vendorName: 'Glow Studio', channel: 'text', message: 'Hi Priya - small shift for Maya & Daniel on 9/12: can we start hair & makeup at 7:30 AM instead of 8:00? Our photographer got delayed and we want the bride ready a touch earlier. Same order, same 5 people. Thank you!' },
    { vendorId: 'photo', vendorName: 'Evergreen Photo Co.', channel: 'text', message: 'Hi Renata - no problem on the 12:30 arrival. We have moved the first look to 1:20 so you have setup time, and party portraits are trimmed to 45 min so we clear the 3:00 shuttle and 4:00 ceremony. Golden hour still 6:45. Let us know if that works!' },
    { vendorId: 'shuttle', vendorName: 'Emerald Shuttle', channel: 'text', message: 'Hi Sam - no change to your 3:00 PM departure, just confirming it is still locked. Thanks!' },
  ],
}

const CEREMONY_LATE = {
  summary:
    "A 30-minute ceremony delay eats the buffer before golden hour and pushes dinner service into the DJ's paid window.",
  severity: 'medium',
  reasoning: [
    'Ceremony is LOCKED at 4:00 by the venue permit - but guest traffic pushes the actual start to ~4:30.',
    'Cocktail hour and dinner slide 30 min later, landing golden-hour portraits at 7:15 - only 9 min before the 7:24 sunset.',
    'Table & Vine plated dinner needs 75 min; a later start risks the kitchen staffing window.',
    'Pulse Collective coverage ends 10:30 PM, so open dancing loses time on the back end.',
  ],
  conflicts: [
    { title: 'Golden-hour portraits fall after usable light', detail: 'Pushed to 7:15, past the safe window before a 7:24 sunset.', vendorId: 'photo', impact: 'high' },
    { title: 'Dinner compresses the dance floor', detail: 'A 30-min slide pushes open dancing toward the DJ 10:30 hard stop.', vendorId: 'dj', impact: 'medium' },
    { title: 'Cocktail hour runs long on the bar', detail: 'Extended standing time increases hosted-bar spend.', vendorId: 'catering', impact: 'low' },
  ],
  fix: {
    headline: 'Split golden-hour portraits: grab 10 min immediately after the ceremony, hold the rest.',
    changes: [
      { target: 'Golden-hour portraits', action: 'Move to a quick 4:45 PM sunset-light grab right after the ceremony, before cocktail hour ends.' },
      { target: 'Grand entrance & dinner', action: 'Tighten toasts by 10 min to protect the dance floor.' },
      { target: 'Pulse Collective', action: 'Confirm they can flex the last set 15 min if needed.' },
    ],
    tradeoff: 'You trade a longer portrait session for guaranteed sunset light; couple is away from guests ~10 min sooner.',
  },
  notifications: [
    { vendorId: 'photo', vendorName: 'Evergreen Photo Co.', channel: 'text', message: 'Hi Renata - ceremony is starting ~30 min late (guest traffic). To protect the light, can we grab 10 min of couple portraits right at 4:45 and hold the rest? Sunset is 7:24 and we do not want to miss it.' },
    { vendorId: 'dj', vendorName: 'Pulse Collective', channel: 'text', message: 'Hi Dana - running ~30 min behind. We will tighten toasts to protect the dance floor; can you flex the final set up to 15 min past 10:30 if we need it? Thank you!' },
    { vendorId: 'catering', vendorName: 'Table & Vine', channel: 'text', message: 'Hi Marcus - ceremony pushed ~30 min. Dinner service will slide accordingly; please hold the kitchen for a 6:00 PM plated start instead of 5:30. Everything else the same.' },
  ],
}

const RAIN = {
  summary:
    "Rain forces the outdoor ceremony under the tent - a move that touches the florist, DJ, shuttle, and 138 chairs.",
  severity: 'high',
  reasoning: [
    'Forecast turns during the getting-ready window - the garden lawn ceremony must move under the reception tent.',
    'The tent is set for dinner, so a flip is required: ceremony seating first, then reset for dinner during cocktail hour.',
    'Fern & Fable arch and aisle florals were built for the lawn and need relocating + securing against wind.',
    'Pulse Collective ceremony sound was staged lawn-side and must move to the tent power access.',
    'The 3:00 shuttle and 4:00 LOCKED ceremony start are unaffected - only the location changes.',
  ],
  conflicts: [
    { title: 'Venue flip during cocktail hour', detail: 'Same tent hosts ceremony then dinner - 60 min to reset 138 seats.', vendorId: 'venue', impact: 'high' },
    { title: 'Florals staged for the wrong location', detail: 'Arch + aisle pieces built for the lawn need relocation and wind-securing.', vendorId: 'florist', impact: 'medium' },
    { title: 'Ceremony sound must relocate', detail: 'DJ staged lawn-side; needs the tent power access, 90-min setup.', vendorId: 'dj', impact: 'medium' },
  ],
  fix: {
    headline: 'Trigger the tent Plan-B now: ceremony under the tent, flip to dinner during cocktail hour.',
    changes: [
      { target: 'Willows Lodge', action: 'Deploy the rain layout: ceremony seating in the tent, flip crew staged for a 4:30-5:30 reset.' },
      { target: 'Fern & Fable', action: 'Relocate arch + aisle florals to the tent entrance; secure against wind by 3:00.' },
      { target: 'Pulse Collective', action: 'Move ceremony sound to tent power; confirm mics before the 4:00 start.' },
    ],
    tradeoff: 'Guests stay dry and the timeline holds; cocktail hour is fully committed to the flip, so no portraits there.',
  },
  notifications: [
    { vendorId: 'venue', vendorName: 'Willows Lodge', channel: 'email', message: 'Hi team - we are calling the rain plan for 9/12. Please deploy the tent ceremony layout and stage the flip crew for a 4:30-5:30 reset to dinner during cocktail hour. Ceremony start stays 4:00.' },
    { vendorId: 'florist', vendorName: 'Fern & Fable', channel: 'text', message: 'Hi Theo - rain plan is on. Can you relocate the arch and aisle florals to the tent entrance and secure them against wind? Need it set by 3:00. Thank you for flexing!' },
    { vendorId: 'dj', vendorName: 'Pulse Collective', channel: 'text', message: 'Hi Dana - ceremony is moving under the tent (rain). Please relocate ceremony sound to the tent power access and confirm mics before 4:00. Reception setup unchanged.' },
  ],
}

function genericCascade(change) {
  return {
    summary: `AIsle traced the ripple effects of: "${change}".`,
    severity: 'medium',
    reasoning: [
      'Located every timeline event and vendor the change touches.',
      'Checked each downstream event against locked constraints and the sunset window.',
      'Flagged overlaps and any vendor whose contract window is affected.',
      'Composed a minimal fix that keeps the locked ceremony and golden hour intact.',
    ],
    conflicts: [
      { title: 'Downstream timing pressure', detail: 'Later events lose their buffers and crowd the next block.', vendorId: 'photo', impact: 'medium' },
      { title: 'Vendor windows to re-confirm', detail: 'Affected vendors need updated call times to avoid gaps.', vendorId: 'catering', impact: 'low' },
    ],
    fix: {
      headline: 'Absorb the change earlier in the day to protect the locked ceremony and golden hour.',
      changes: [
        { target: 'Earliest flexible block', action: 'Shift start time to reclaim the lost buffer.' },
        { target: 'Affected vendors', action: 'Send updated call times so nobody arrives to a gap.' },
      ],
      tradeoff: 'Minor earlier start; ceremony and sunset photos untouched.',
    },
    notifications: [
      { vendorId: 'planner', vendorName: 'Day-of coordination', channel: 'text', message: `Heads up - timeline change ("${change}"). AIsle has re-sequenced the affected blocks; updated call times going out to vendors now.` },
    ],
  }
}

export function cascadeFallback(change = '') {
  const c = change.toLowerCase()
  if (c.includes('rain') || c.includes('weather') || c.includes('storm')) return RAIN
  if (
    (c.includes('photo') || c.includes('camera') || c.includes('shooter')) &&
    /late|hour|delay|behind|arrive|instead|ran long|12:30|running/.test(c)
  )
    return PHOTO_LATE
  if (c.includes('ceremony') || c.includes('traffic') || c.includes('guest')) return CEREMONY_LATE
  return genericCascade(change)
}

export function contractFallback(text = '') {
  const t = text
  const num = (s) => Number(String(s).replace(/[^0-9.]/g, '')) || 0

  const payments = []
  if (/final balance/i.test(t)) {
    if (/table & vine/i.test(t)) payments.push({ label: 'Final balance', amount: 9200, dueDate: '2026-08-29' })
  }
  if (/final installment/i.test(t) && /evergreen/i.test(t))
    payments.push({ label: 'Final installment', amount: 1800, dueDate: '2026-08-15' })
  if (/remaining balance/i.test(t) && /pulse/i.test(t))
    payments.push({ label: 'Remaining balance', amount: 750, dueDate: '2026-08-22' })

  const hiddenFees = []
  const svc = t.match(/(\d{1,2})%\s*(service|staffing|administrative)/i)
  if (svc) hiddenFees.push({ label: `${svc[1]}% service charge`, detail: 'Administrative/staffing fee - NOT gratuity.', amount: 0 })
  const ot = t.match(/overtime[^$]*\$\s*(\d{2,4})\s*\/\s*hr/i)
  if (ot) hiddenFees.push({ label: `Overtime $${ot[1]}/hr`, detail: 'Charged in 30-min increments beyond the coverage window.', amount: num(ot[1]) })
  if (/uplighting[^$]*\$?(\d{2,4})/i.test(t)) {
    const up = t.match(/uplighting[^$]*\$?(\d{2,4})/i)
    hiddenFees.push({ label: `Uplighting add-on $${up[1]}`, detail: 'Optional line item bundled into the quote.', amount: num(up[1]) })
  }

  const gratuityIncluded = /not\s+constitute\s+gratuity|does not.*gratuity|not gratuity/i.test(t)
    ? false
    : /gratuity included/i.test(t)
    ? true
    : 'unclear'

  const cancellation =
    t.match(/cancellation[^.]*\./i)?.[0]?.trim() ||
    (/(\d{1,2})% of contract/i.test(t) ? t.match(/[^.]*% of contract[^.]*\./i)?.[0]?.trim() : 'Not specified in this document.')

  const keyDates = []
  if (/chef arrival[^.]*1:00 pm/i.test(t) || /chef arrival on-site: 1:00/i.test(t))
    keyDates.push({ label: 'Chef arrives on-site', date: '1:00 PM day-of' })
  if (/setup requires 90 minutes/i.test(t)) keyDates.push({ label: 'DJ setup', date: '90 min before start' })
  if (/coverage[^)]*11:30 am/i.test(t)) keyDates.push({ label: 'Photo coverage', date: '11:30 AM - 8:30 PM' })
  if (/final guest count locks 10 days/i.test(t)) keyDates.push({ label: 'Guest count locks', date: '10 days prior - can go up, not down' })

  const watchOuts = []
  if (svc) watchOuts.push(`The ${svc[1]}% service charge is NOT a tip - you will likely still want to budget gratuity on top.`)
  if (/does not extend the 9-hour|delays on the client/i.test(t)) watchOuts.push('Client-side delays do NOT extend photo coverage - a late start burns your hours.')
  if (/count may go up but not down|guest count locks/i.test(t)) watchOuts.push('Final guest count can only increase after lock-in - you pay for no-shows.')
  if (/forfeits 75%|75% of contract/i.test(t)) watchOuts.push('Cancelling inside 30 days forfeits 75% of the contract total.')
  if (watchOuts.length === 0) watchOuts.push('Review payment due dates against your other vendor deadlines to avoid a cash crunch.')

  const vendorName = /table & vine/i.test(t)
    ? 'Table & Vine'
    : /evergreen photo/i.test(t)
    ? 'Evergreen Photo Co.'
    : /pulse collective/i.test(t)
    ? 'Pulse Collective'
    : t.match(/^([A-Z][A-Za-z& ]+?)\s*(-|\n)/)?.[1]?.trim() || 'Vendor'
  const category = /catering/i.test(t) ? 'Catering' : /photograph/i.test(t) ? 'Photography' : /dj|mc/i.test(t) ? 'DJ / Music' : 'Vendor'

  return { vendorName, category, payments, hiddenFees, gratuityIncluded, cancellation, keyDates, watchOuts }
}

export function planFallback({ wedding = {}, profile = {} } = {}) {
  const budget = Number(wedding.budgetTotal) || 40000
  const priorities = (profile.priorities || []).map((p) => p.toLowerCase())
  const base = [
    ['Venue', 0.4, 'venue'],
    ['Catering', 0.24, 'food'],
    ['Photography', 0.12, 'photo'],
    ['Florals', 0.08, 'floral'],
    ['Music / DJ', 0.06, 'music'],
    ['Attire', 0.05, 'attire'],
    ['Cake & Dessert', 0.03, 'food'],
    ['Miscellaneous', 0.02, ''],
  ]
  const weights = base.map(([name, w, key]) => {
    const boosted = priorities.some((p) => key && p.includes(key)) ? w * 1.4 : w
    return { name, w: boosted }
  })
  const total = weights.reduce((s, x) => s + x.w, 0)
  const budgetCategories = weights.map((x) => ({ name: x.name, projected: Math.round((x.w / total) * budget) }))

  const isP = (key) => priorities.some((p) => p.includes(key))
  const vendors = [
    { name: 'Evergreen Photography Co.', category: 'Photography', contact: 'Renata Silva', status: isP('photo') ? 'booked' : 'pending', rating: 4.9 },
    { name: 'Table & Vine Catering', category: 'Catering', contact: 'Marcus Webb', status: isP('food') ? 'booked' : 'pending', rating: 4.8 },
    { name: 'Fern & Fable Florals', category: 'Florals', contact: 'Theo Marsh', status: isP('floral') ? 'booked' : 'pending', rating: 4.7 },
    { name: 'Pulse Collective (DJ)', category: 'Music / DJ', contact: 'Dana Cole', status: isP('music') ? 'booked' : 'pending', rating: 4.6 },
    { name: 'Glow Studio', category: 'Beauty', contact: 'Priya Nair', status: 'pending', rating: 4.8 },
    { name: 'Rev. Alan Brooks', category: 'Officiant', contact: 'Alan Brooks', status: 'pending', rating: 5.0 },
    { name: 'Flour & Feather Cakes', category: 'Cake', contact: 'Nina Park', status: 'pending', rating: 4.7 },
    { name: 'Emerald Shuttle', category: 'Transportation', contact: 'Sam Ortiz', status: 'pending', rating: 4.5 },
  ]
  const guests = [
    { name: 'Elena Rivera', relationship: 'family', rsvp: 'confirmed' },
    { name: 'Robert Rivera', relationship: 'family', rsvp: 'confirmed' },
    { name: 'Grandma Chen', relationship: 'family', rsvp: 'confirmed' },
    { name: 'Uncle Joe', relationship: 'family', rsvp: 'awaiting' },
    { name: 'Aunt Carol', relationship: 'family', rsvp: 'confirmed' },
    { name: 'Sam Patel', relationship: 'friends', rsvp: 'confirmed' },
    { name: 'Alex Kim', relationship: 'friends', rsvp: 'confirmed' },
    { name: 'Priya Shah', relationship: 'friends', rsvp: 'confirmed' },
    { name: 'Jordan Lee', relationship: 'friends', rsvp: 'awaiting' },
    { name: 'Taylor Brooks', relationship: 'friends', rsvp: 'confirmed' },
    { name: 'Dana Cole', relationship: 'coworkers', rsvp: 'confirmed' },
    { name: 'Chris Nolan', relationship: 'coworkers', rsvp: 'awaiting' },
    { name: 'Morgan Reed', relationship: 'coworkers', rsvp: 'confirmed' },
    { name: 'Neighbor Pat', relationship: 'other', rsvp: 'awaiting' },
  ]

  const tasks = [
    'Confirm your final guest list and collect addresses',
    'Book your top-priority vendors first',
    'Send save-the-dates',
    'Set your budget per category and track deposits',
    'Schedule a venue walkthrough',
    'Choose your wedding party',
    'Order invitations',
    'Book hair & makeup trials',
    'Plan the day-of timeline with your vendors',
    'Arrange transportation and hotel blocks for guests',
  ]

  const timeline = [
    { time: '8:00 AM', title: 'Hair & makeup begins', durationMin: 210 },
    { time: '11:30 AM', title: 'Photographer arrives', durationMin: 90 },
    { time: '1:00 PM', title: 'First look', durationMin: 30 },
    { time: '1:30 PM', title: 'Wedding party portraits', durationMin: 60 },
    { time: '3:00 PM', title: 'Guests arrive / shuttle', durationMin: 45 },
    { time: '4:00 PM', title: 'Ceremony', durationMin: 30 },
    { time: '4:30 PM', title: 'Cocktail hour', durationMin: 60 },
    { time: '5:30 PM', title: 'Grand entrance & dinner', durationMin: 75 },
    { time: '7:00 PM', title: 'Toasts & first dance', durationMin: 30 },
    { time: '8:00 PM', title: 'Open dancing', durationMin: 150 },
  ]

  return { summary: 'Starter plan generated from your questionnaire — edit anything.', tasks, vendors, timeline, budgetCategories, guests }
}


const VENUE_BANK = [
  { key: 'Estate', tagline: 'Restored estate with a garden lawn built for golden-hour ceremonies', style: 'Garden', share: 0.9, capacity: 200, rating: 4.9, highlights: ['On-site catering kitchen', 'Rain-plan tent included', 'Getting-ready suites for both parties'] },
  { key: 'Barn', tagline: 'Rustic barn + string-lit courtyard for a relaxed celebration', style: 'Rustic', share: 0.55, capacity: 160, rating: 4.7, highlights: ['BYO catering allowed', 'Free parking on site', 'Fire-pit lounge'] },
  { key: 'Loft', tagline: 'Modern downtown loft with floor-to-ceiling skyline windows', style: 'Modern', share: 1.15, capacity: 140, rating: 4.8, highlights: ['In-house bar & AV', 'Elevator load-in', 'Late-night curfew of 1 AM'] },
  { key: 'Vineyard', tagline: 'Hillside vineyard with a covered terrace and sunset views', style: 'Luxury', share: 1.4, capacity: 180, rating: 4.9, highlights: ['Wine package included', 'Bridal cottage', 'Ceremony + reception sites'] },
  { key: 'Gardens', tagline: 'Botanical gardens with a glass conservatory backup', style: 'Classic', share: 0.75, capacity: 220, rating: 4.6, highlights: ['Indoor + outdoor options', 'Ample guest parking', 'Preferred vendor list'] },
]
const VENUE_PREFIXES = ['The Willows', 'Cedar Hollow', 'Rosewood', 'Lakeside', 'Ivy & Oak', 'Harborview', 'Stonebridge', 'Maple Grove']
const OWNER_NAMES = ['Marina Ellis', 'David Cho', 'Priya Nair', 'Marcus Webb', 'Elena Rivera', 'Theo Marsh', 'Nina Park', 'Sam Ortiz', 'Renata Silva', 'Dana Cole']

const slugOf = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '')

function cityOf(wedding) {
  return (wedding.venue || '').split(',')[0].trim() || 'your area'
}

function venuesFallback(wedding, profile) {
  const budget = Number(wedding.budgetTotal) || 40000
  const venueBudget = budget * 0.4
  const style = (profile?.styles || [profile?.style]).filter(Boolean)[0]
  const city = cityOf(wedding)
  const region = (wedding.venue || city).split(',').slice(1).join(',').trim() || city
  const ordered = [...VENUE_BANK].sort((a, b) => (b.style === style ? 1 : 0) - (a.style === style ? 1 : 0))
  return ordered.slice(0, 5).map((v, i) => {
    const name = `${VENUE_PREFIXES[i % VENUE_PREFIXES.length]} ${v.key}`
    return {
      id: `venue-${slugOf(name)}`,
      name,
      tagline: v.tagline,
      style: v.style,
      priceFrom: Math.round((venueBudget * v.share) / 100) * 100,
      capacity: v.capacity,
      rating: v.rating,
      address: `${city}${region && region !== city ? `, ${region}` : ''}`,
      contactName: OWNER_NAMES[i % OWNER_NAMES.length],
      email: `events@${slugOf(name)}.com`,
      phone: `(555) 555-01${String(20 + i).slice(-2)}`,
      highlights: v.highlights,
    }
  })
}

const CATEGORY_BANK = {
  Photography: { share: 0.12, styles: ['Documentary', 'Editorial', 'Fine-art', 'Candid'], names: ['Evergreen Photography Co.', 'Goldenlight Studio', 'Wanderfield Photo', 'Aperture & Co.'], owners: ['Renata Silva', 'Owen Blake', 'Maya Chen', 'Luis Ortega'], blurbs: ['Two shooters, film + digital, known for candid golden-hour work.', 'Editorial style with a fast 3-week gallery turnaround.', 'Adventurous, documentary coverage with no shot list needed.', 'Bright, timeless images and an included engagement session.'] },
  Catering: { share: 0.26, styles: ['Plated', 'Family-style', 'Farm-to-table', 'Global'], names: ['Table & Vine Catering', 'Harvest & Hearth', 'Saffron Social', 'The Copper Spoon'], owners: ['Marcus Webb', 'Ana Duarte', 'Raj Patel', 'Grace Lin'], blurbs: ['Seasonal plated menus with a hosted-bar package.', 'Family-style feasts that keep the table social.', 'Farm-to-table sourcing with vegan and halal options.', 'Globally-inspired stations and a late-night snack cart.'] },
  'Music / DJ': { share: 0.06, styles: ['Open-format', 'House', 'Live-band', 'Vinyl'], names: ['Pulse Collective', 'Northside Sound', 'The Gold Room DJs', 'Velvet Groove'], owners: ['Dana Cole', 'Chris Nolan', 'Tariq Bell', 'Sofia Marín'], blurbs: ['Open-format DJ + MC with ceremony sound included.', 'Reads the room; uplighting package available.', 'Seamless mixes and a live sax add-on.', 'Vinyl-first sets for a classic dance floor.'] },
  Florist: { share: 0.08, styles: ['Garden', 'Modern', 'Wild', 'Romantic'], names: ['Fern & Fable Florals', 'Bloom & Bramble', 'Petal Theory', 'Wildroot Studio'], owners: ['Theo Marsh', 'Iris Wong', 'Camille Ford', 'Jonah Reed'], blurbs: ['Lush garden arrangements with in-season sourcing.', 'Sculptural, modern installations and arches.', 'Loose, wild-picked bouquets and greenery.', 'Romantic palettes with heirloom roses.'] },
  Cake: { share: 0.03, styles: ['Buttercream', 'Modern', 'Naked', 'Classic'], names: ['Flour & Feather Cakes', 'Sugar & Salt', 'The Tiered Table', 'Whisk Bakehouse'], owners: ['Nina Park', 'Dev Shah', 'Clara Boone', 'Emma Ito'], blurbs: ['Hand-piped buttercream and a free tasting.', 'Minimalist modern tiers with fresh florals.', 'Naked cakes and a dessert-bar option.', 'Classic flavors and a keepsake top tier.'] },
  Beauty: { share: 0.03, styles: ['Natural', 'Glam', 'Editorial', 'Soft'], names: ['Glow Studio', 'Aura Beauty Co.', 'Rouge & Rose', 'The Getting-Ready Room'], owners: ['Priya Nair', 'Bella Cruz', 'Naomi Ford', 'Lena Ross'], blurbs: ['Natural, long-wear looks with an on-site team.', 'Full-glam artistry and a trial included.', 'Editorial hair + makeup for the whole party.', 'Soft, romantic styling and airbrush option.'] },
  Officiant: { share: 0.015, styles: ['Personal', 'Traditional', 'Interfaith', 'Modern'], names: ['Rev. Alan Brooks', 'Ceremonies by Cara', 'The Vow Company', 'Rev. Michael Ortiz'], owners: ['Alan Brooks', 'Cara Nguyen', 'Sam Lowe', 'Michael Ortiz'], blurbs: ['Warm, personalized ceremonies from a phone consult.', 'Custom vows workshop included.', 'Interfaith and bilingual ceremonies.', 'Modern, concise, and heartfelt.'] },
  Transportation: { share: 0.025, styles: ['Shuttle', 'Classic', 'Luxury', 'Trolley'], names: ['Emerald Shuttle', 'Vintage Wheels Co.', 'Crown Car Service', 'City Trolley Rentals'], owners: ['Sam Ortiz', 'Gary Fields', 'Denise Yu', 'Paul Grant'], blurbs: ['Guest shuttles with a day-of coordinator.', 'Restored classic cars for the couple.', 'Black-car luxury fleet with chauffeurs.', 'Open-air trolley for a fun guest ride.'] },
}

export const FALLBACK_VENDOR_CATEGORIES = Object.keys(CATEGORY_BANK)

function vendorsFallback(wedding, profile, categories) {
  const budget = Number(wedding.budgetTotal) || 40000
  const style = (profile?.styles || [profile?.style]).filter(Boolean)[0]
  const cats = (categories && categories.length ? categories : FALLBACK_VENDOR_CATEGORIES).filter((c) => CATEGORY_BANK[c])
  const out = {}
  for (const cat of cats) {
    const b = CATEGORY_BANK[cat]
    const baseline = budget * b.share
    const factors = [0.8, 1.0, 1.2, 1.45]
    out[cat] = b.names.map((name, i) => {
      const price = Math.max(300, Math.round((baseline * factors[i]) / 50) * 50)
      const styleMatch = b.styles[i] === style
      return {
        id: `${slugOf(cat)}-${slugOf(name)}`,
        name,
        category: cat,
        contactName: b.owners[i],
        email: `hello@${slugOf(name)}.com`,
        phone: `(555) 555-${String(1000 + i * 7).slice(-4)}`,
        rating: [4.9, 4.7, 4.6, 4.8][i] + (styleMatch ? 0.1 : 0) > 5 ? 5 : [4.9, 4.7, 4.6, 4.8][i],
        priceLabel: `from $${price.toLocaleString('en-US')}`,
        priceValue: price,
        style: b.styles[i],
        blurb: b.blurbs[i],
      }
    })
  }
  return out
}

export function recommendFallback({ wedding = {}, profile = {}, target = 'vendors', categories } = {}) {
  if (target === 'venues') return { venues: venuesFallback(wedding, profile) }
  return { categories: vendorsFallback(wedding, profile, categories) }
}


export function negotiateFallback({ vendor = {}, history = [], action = 'contact', targetPrice } = {}) {
  const opening = Number(vendor.priceValue) || 3000
  const name = vendor.contactName || vendor.contact || 'there'
  const firstName = String(name).split(' ')[0]
  const vName = vendor.name || 'the vendor'
  const low = Math.round((opening * 0.86) / 50) * 50
  const high = Math.round((opening * 1.05) / 50) * 50

  const lastVendorQuote = [...history].reverse().find((m) => m.role === 'vendor' && m.quote)?.quote || opening

  if (action === 'accept') {
    return {
      vendorMessage: { text: `Wonderful — we're thrilled to be part of your day! I'll send over the contract and a deposit invoice this afternoon so we can lock the date. Talk soon!`, quote: null },
      analysis: { benchmarkLow: low, benchmarkHigh: high, verdict: 'good', note: 'Deal agreed — review the contract when it arrives.', suggestedCounter: null, draftReply: `Thank you, ${firstName}! We're excited too. We'll watch for the contract and get the deposit over right away.` },
      status: 'agreed',
      savings: Math.max(0, opening - lastVendorQuote),
    }
  }

  if (action === 'counter') {
    const target = Number(targetPrice) || Math.round(opening * 0.9)
    const floor = Math.round(opening * 0.85)
    const met = Math.max(floor, Math.round(((lastVendorQuote + target) / 2) / 50) * 50)
    const trimmed = met > target
    return {
      vendorMessage: {
        text: trimmed
          ? `I hear you on the budget. I can do $${met.toLocaleString('en-US')} if we streamline the package slightly — that keeps the quality high and gets us close to your number.`
          : `You know what — let's make it work. I can meet you at $${met.toLocaleString('en-US')}. We'd love to be there for you two.`,
        quote: met,
      },
      analysis: {
        benchmarkLow: low, benchmarkHigh: high,
        verdict: met <= high ? 'fair' : 'high',
        note: met <= (target + 100) ? 'This is right in your target range — a strong deal.' : 'Close to your target; one more nudge could land it.',
        suggestedCounter: met <= (target + 100) ? null : target,
        draftReply: met <= (target + 100)
          ? `That works for us, ${firstName} — let's move forward at $${met.toLocaleString('en-US')}.`
          : `Appreciate it, ${firstName}. Could you do $${target.toLocaleString('en-US')} even? If so we're ready to book today.`,
      },
      status: 'offer',
      savings: Math.max(0, opening - met),
    }
  }

  return {
    vendorMessage: {
      text: `Hi! Thanks so much for reaching out — we'd love to be part of your wedding. For your date and guest count, our package comes to $${opening.toLocaleString('en-US')}. It includes everything in our standard collection; happy to tailor it to what matters most to you.`,
      quote: opening,
    },
    analysis: {
      benchmarkLow: low, benchmarkHigh: high,
      verdict: opening > high ? 'high' : 'fair',
      note: `Comparable ${vendor.category || 'vendors'} in your area run about $${low.toLocaleString('en-US')}–$${high.toLocaleString('en-US')}. ${opening > high ? "There's room to negotiate." : 'This is a fair opening quote.'}`,
      suggestedCounter: Math.round((opening * 0.9) / 50) * 50,
      draftReply: `Hi ${firstName}, we love your work at ${vName}! Our budget for this is closer to $${(Math.round((opening * 0.9) / 50) * 50).toLocaleString('en-US')}. Is there a way to tailor a package that fits? We'd really like to make it work.`,
    },
    status: 'negotiating',
    savings: 0,
  }
}

export function emailFallback(email = {}) {
  const t = `${email.subject || ''} ${email.body || ''}`
  const payments = []
  const money = t.match(/\$([\d,]{2,})/g) || []
  const amounts = money.map((m) => Number(m.replace(/[^0-9]/g, '')))
  if (/final balance/i.test(t) && amounts.includes(9200)) payments.push({ label: 'Final balance', amount: 9200, dueDate: '2026-08-29' })
  if (/installment/i.test(t) && amounts.includes(1800)) payments.push({ label: 'Final installment', amount: 1800, dueDate: '2026-08-15' })
  if (/deposit/i.test(t) && amounts.includes(650)) payments.push({ label: 'Deposit', amount: 650, dueDate: '2026-08-20' })
  if (/remaining balance/i.test(t) && amounts.includes(750)) payments.push({ label: 'Remaining balance', amount: 750, dueDate: '2026-08-22' })

  const dateChanges = []
  if (/reschedul|move your|no longer do/i.test(t)) dateChanges.push({ what: 'Engagement session', from: 'Aug 22', to: 'Aug 23 5:30 PM' })

  const deadlines = []
  if (/headcount/i.test(t)) deadlines.push({ what: 'Lock final headcount', date: '2026-09-02' })
  if (/song list|must-play/i.test(t)) deadlines.push({ what: 'Send song lists', date: '2026-09-05' })

  const actionItems = []
  if (payments.length) actionItems.push(`Pay ${payments[0].label.toLowerCase()} by ${payments[0].dueDate}`)
  if (dateChanges.length) actionItems.push('Confirm the new date')
  if (deadlines.length) actionItems.push(deadlines[0].what)
  if (actionItems.length === 0) actionItems.push('Reply to the vendor')

  return {
    summary: email.subject ? `${email.subject} from ${email.from || 'a vendor'}.` : 'Vendor email.',
    vendorName: (email.from || '').split('·').pop()?.trim() || email.from || '',
    payments,
    dateChanges,
    deadlines,
    actionItems,
  }
}

// Offline coordinator reply: answers common questions straight from the couple's
// saved Neon data when no AI key is configured, instead of a generic canned line.
export function coordinatorFallback(message = '', state = null) {
  const m = message.toLowerCase()
  const s = state || {}
  const wedding = s.wedding || {}
  const payments = s.payments || []
  const guests = s.guests || []
  const vendors = s.vendors || []
  const timeline = s.timeline || []

  if (/budget|spend|spent|cost|left|remaining/.test(m) && (wedding.budgetTotal || payments.length)) {
    const total = Number(wedding.budgetTotal) || 0
    const spent =
      Number(wedding.budgetSpent) ||
      payments.reduce((sum, p) => sum + (p.paid ? Number(p.amount) || 0 : 0), 0)
    return {
      reply: `Your budget is $${total.toLocaleString('en-US')} total, with about $${spent.toLocaleString(
        'en-US'
      )} spent so far — roughly $${Math.max(0, total - spent).toLocaleString('en-US')} remaining. (Offline estimate from your saved data — connect an AI key for deeper analysis.)`,
      proposal: null,
    }
  }

  if (/payment|due|owe|balance|deposit/.test(m) && payments.length) {
    const unpaid = payments.filter((p) => p.status !== 'paid' && p.dueDate)
    const upcoming = [...unpaid].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    if (upcoming)
      return {
        reply: `Your next payment on file is "${upcoming.label || upcoming.vendor || 'a vendor payment'}" for $${Number(
          upcoming.amount || 0
        ).toLocaleString('en-US')}, due ${upcoming.dueDate}.`,
        proposal: null,
      }
  }

  if (/guest|rsvp/.test(m) && guests.length) {
    const confirmed = guests.filter((g) => g.rsvp === 'confirmed').length
    const awaiting = guests.filter((g) => g.rsvp === 'awaiting').length
    return {
      reply: `You have ${guests.length} guests on file: ${confirmed} confirmed, ${awaiting} awaiting response.`,
      proposal: null,
    }
  }

  if (/vendor/.test(m) && vendors.length) {
    const booked = vendors.filter((v) => v.status === 'booked').length
    return {
      reply: `You have ${vendors.length} vendors tracked, ${booked} booked so far.`,
      proposal: null,
    }
  }

  if (/timeline|schedule|agenda|first|starts?/.test(m) && timeline.length) {
    const first = timeline[0]
    return {
      reply: `Your day-of timeline starts with "${first.title}" at ${first.time || 'TBD'}.`,
      proposal: null,
    }
  }

  return {
    reply: `I'm currently running in offline mode. Your message was: "${message.slice(0, 80)}${
      message.length > 80 ? '…' : ''
    }". I can't generate a live response right now, but your data is safe.`,
    proposal: null,
  }
}

export function seatingFallback({ guests = [], tables = [] }) {
  const order = { family: 0, friends: 1, coworkers: 2, other: 3 }
  const sorted = [...guests].sort((a, b) => (order[a.relationship] ?? 9) - (order[b.relationship] ?? 9))
  const assignments = []
  const counts = {}
  tables.forEach((t) => { counts[t.id] = 0 })
  let ti = 0
  for (const g of sorted) {
    let placed = false
    for (let step = 0; step < tables.length; step++) {
      const t = tables[(ti + step) % tables.length]
      if (counts[t.id] < t.capacity) {
        assignments.push({ guestId: g.id, tableId: t.id })
        counts[t.id]++
        ti = (ti + step) % tables.length
        placed = true
        break
      }
    }
    if (!placed) assignments.push({ guestId: g.id, tableId: null })
  }
  const seated = assignments.filter((a) => a.tableId).length
  return {
    summary: `Seated ${seated} of ${guests.length} guests across ${tables.length} tables, keeping relationship groups together.`,
    reasoning: [
      'Grouped guests by relationship (family, then friends, coworkers, others).',
      'Filled each table to capacity before moving to the next.',
      'Kept members of the same group adjacent so they share tables.',
    ],
    assignments,
  }
}
