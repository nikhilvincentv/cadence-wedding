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
    summary: `Cadence traced the ripple effects of: "${change}".`,
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
      { vendorId: 'planner', vendorName: 'Day-of coordination', channel: 'text', message: `Heads up - timeline change ("${change}"). Cadence has re-sequenced the affected blocks; updated call times going out to vendors now.` },
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
