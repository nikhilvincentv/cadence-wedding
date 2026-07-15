export const wedding = {
  couple: 'Maya & Daniel',
  date: '2026-09-12',
  dateLabel: 'Saturday, September 12, 2026',
  venue: 'Willows Lodge · Woodinville, WA',
  guestCount: 138,
  budgetTotal: 61000,
  budgetSpent: 43850,
  sunset: '7:24 PM',
}

export const vendors = [
  { id: 'photo', name: 'Evergreen Photo Co.', category: 'Photography', contact: 'Renata Silva', status: 'booked', rating: 4.9 },
  { id: 'hmua', name: 'Glow Studio', category: 'Hair & Makeup', contact: 'Priya Nair', status: 'booked', rating: 4.8 },
  { id: 'florist', name: 'Fern & Fable', category: 'Florals', contact: 'Theo Marsh', status: 'booked', rating: 4.7 },
  { id: 'catering', name: 'Table & Vine', category: 'Catering', contact: 'Marcus Webb', status: 'booked', rating: 4.9 },
  { id: 'dj', name: 'Pulse Collective', category: 'DJ / Music', contact: 'Dana Cole', status: 'booked', rating: 4.6 },
  { id: 'shuttle', name: 'Emerald Shuttle', category: 'Transportation', contact: 'Sam Ortiz', status: 'booked', rating: 4.5 },
  { id: 'officiant', name: 'Rev. Alan Brooks', category: 'Officiant', contact: 'Alan Brooks', status: 'booked', rating: 5.0 },
  { id: 'venue', name: 'Willows Lodge', category: 'Venue', contact: 'Events Team', status: 'booked', rating: 4.8 },
  { id: 'cake', name: 'Flour & Feather', category: 'Cake', contact: 'Nina Park', status: 'booked', rating: 4.7 },
  { id: 'video', name: 'Northlight Films', category: 'Videography', contact: 'Jesse Kwan', status: 'contract-out', rating: 4.8 },
  { id: 'planner', name: 'Day-of: You', category: 'Coordination', contact: 'Maya & Daniel', status: 'active', rating: null },
]

export const timeline = [
  { id: 't1', time: '8:00 AM', minutes: 480, title: 'Hair & makeup begins', vendorId: 'hmua', durationMin: 210, locked: false, note: '5 people in chair · bride last' },
  { id: 't2', time: '11:30 AM', minutes: 690, title: 'Photographer arrives - getting ready', vendorId: 'photo', durationMin: 90, locked: false },
  { id: 't3', time: '1:00 PM', minutes: 780, title: 'First look', vendorId: 'photo', durationMin: 30, locked: false, note: 'Private, before the garden' },
  { id: 't4', time: '1:30 PM', minutes: 810, title: 'Wedding party portraits', vendorId: 'photo', durationMin: 60, locked: false },
  { id: 't5', time: '3:00 PM', minutes: 900, title: 'Guest shuttle departs hotel', vendorId: 'shuttle', durationMin: 40, locked: false, note: '2 runs · 138 guests' },
  { id: 't6', time: '4:00 PM', minutes: 960, title: 'Ceremony', vendorId: 'officiant', durationMin: 30, locked: true, note: 'Fixed - venue permit + guests' },
  { id: 't7', time: '4:30 PM', minutes: 990, title: 'Cocktail hour', vendorId: 'catering', durationMin: 60, locked: false },
  { id: 't8', time: '5:30 PM', minutes: 1050, title: 'Grand entrance & dinner', vendorId: 'catering', durationMin: 75, locked: false },
  { id: 't9', time: '6:45 PM', minutes: 1125, title: 'Golden-hour couple portraits', vendorId: 'photo', durationMin: 25, locked: false, note: 'Sunset 7:24 PM - light-critical' },
  { id: 't10', time: '8:00 PM', minutes: 1200, title: 'Open dancing', vendorId: 'dj', durationMin: 150, locked: false },
]

export const payments = [
  { id: 'p1', vendorId: 'catering', label: 'Final balance', amount: 9200, dueDate: '2026-08-29', status: 'due', source: 'Table & Vine agreement §4' },
  { id: 'p2', vendorId: 'photo', label: 'Final installment', amount: 1800, dueDate: '2026-08-15', status: 'due', source: 'Evergreen Photo contract' },
  { id: 'p3', vendorId: 'florist', label: 'Balance + delivery fee', amount: 2650, dueDate: '2026-09-01', status: 'due', source: 'Fern & Fable proposal' },
  { id: 'p4', vendorId: 'dj', label: 'Remaining balance', amount: 750, dueDate: '2026-08-22', status: 'due', source: 'Pulse Collective invoice' },
  { id: 'p5', vendorId: 'video', label: 'Deposit (to book)', amount: 1200, dueDate: '2026-07-25', status: 'action', source: 'Northlight Films - unsigned' },
]

export const alerts = [
  { id: 'a1', level: 'warn', title: 'Videographer contract still unsigned', detail: 'Northlight Films held your date until Jul 25. Deposit + signature needed to lock it.', vendorId: 'video' },
  { id: 'a2', level: 'info', title: 'Golden-hour window is tight', detail: 'Portraits at 6:45 PM leave 39 min before sunset (7:24). Any ceremony delay eats this first.', vendorId: 'photo' },
  { id: 'a3', level: 'warn', title: 'Catering final balance due in 12 days', detail: '$9,200 to Table & Vine on Aug 29 - largest single payment remaining.', vendorId: 'catering' },
]

export const sampleContracts = [
  {
    id: 'c-catering',
    label: 'Table & Vine - Catering Agreement',
    vendorId: 'catering',
    text: `TABLE & VINE CATERING - SERVICE AGREEMENT
Client: Maya Rivera & Daniel Chen
Event date: September 12, 2026 - Willows Lodge, Woodinville WA
Guest count: 138 (plated dinner + cocktail hour passed apps)

PRICING
Per-guest plated dinner: $132 x 138 = $18,216
Passed appetizers (cocktail hour): $14/guest
Bar service (5 hrs, hosted): $4,100
Service & staffing charge: 22% of food & beverage subtotal
Sales tax: 10.1% applied to total

PAYMENT SCHEDULE
- Non-refundable deposit (paid): $6,000
- Second installment: $8,000 due June 1, 2026
- FINAL BALANCE: remaining amount due 14 days before event (August 29, 2026)

NOTES
- The 22% service charge is an administrative/staffing fee and does NOT constitute gratuity.
- Final guest count locks 10 days prior; count may go up but not down.
- Chef arrival on-site: 1:00 PM for a 5:30 PM dinner service.
- Cancellation within 30 days forfeits 75% of contract total.`,
  },
  {
    id: 'c-photo',
    label: 'Evergreen Photo - Contract',
    vendorId: 'photo',
    text: `EVERGREEN PHOTO CO. - WEDDING PHOTOGRAPHY CONTRACT
Couple: Maya & Daniel · Date: 9/12/2026
Coverage: 9 hours (11:30 AM - 8:30 PM)

INVESTMENT
Package: Signature Collection - $5,400
Second shooter included. Engagement session included.
Travel: venue within 30 mi of Seattle - no travel fee.
Add-on: leather album (later) - $650, optional.

PAYMENT
- Retainer to reserve date (paid): $1,800
- Second payment: $1,800 due 90 days prior
- Final installment: $1,800 due 30 days before wedding (Aug 15, 2026)

TERMS
- Overtime billed at $450/hr in 30-min increments beyond 8:30 PM.
- Photographer's arrival time is a firm start of coverage; delays on the client
  side do not extend the 9-hour coverage window.
- Galleries delivered within 8 weeks. Rush delivery available for $400.`,
  },
  {
    id: 'c-dj',
    label: 'Pulse Collective - DJ Invoice',
    vendorId: 'dj',
    text: `PULSE COLLECTIVE - DJ / MC SERVICES
Event: Maya & Daniel wedding, 9/12/26, Willows Lodge
Hours: 4:00 PM ceremony sound through 10:30 PM reception

QUOTE
Base DJ + MC package: $2,150
Ceremony sound system + wireless mics: add $350
Uplighting (12 fixtures): add $500
Dance-floor lighting: included

TOTAL: $3,000
Paid to date: $2,250 (deposit + mid-payment)
Remaining balance: $750 due Aug 22, 2026

NOTE: Setup requires 90 minutes and power access near the ceremony lawn.
Idle/standby time between ceremony and reception is not charged.`,
  },
]

export function fullState() {
  return { wedding, vendors, timeline, payments, alerts, sampleContracts }
}
