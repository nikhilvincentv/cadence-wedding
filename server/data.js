export function emptyWedding() {
  return {
    couple: '',
    date: '',
    dateLabel: '',
    venue: '',
    guestCount: 0,
    budgetTotal: 0,
    budgetSpent: 0,
    sunset: '',
  }
}

export function emptyOnboarding() {
  return {
    firstName: '',
    partnerName: '',
    weddingDate: '',
    weddingDateUnknown: false,
    location: { city: '', state: '', country: '' },
    guestCount: null,
    budget: null,
    styles: [],
    priorities: [],
    planningStage: '',
    aiPreferences: [],
  }
}

export function emptyState() {
  return {
    wedding: emptyWedding(),
    vendors: [],
    timeline: [],
    payments: [],
    alerts: [],
    guests: [],
    budgetCategories: [],
    seatingTables: [],
    inboxThreads: [],
    tasks: [],
    inspirationBoard: [],
    contractAnalyses: {},
    ...emptyOnboarding(),
    completedOnboarding: false,
  }
}

export const sampleContracts = [
  {
    id: 'c-catering',
    label: 'Example: Catering Agreement',
    text: `TABLE & VINE CATERING - SERVICE AGREEMENT
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
    label: 'Example: Photography Contract',
    text: `EVERGREEN PHOTO CO. - WEDDING PHOTOGRAPHY CONTRACT
Date: 9/12/2026
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
    label: 'Example: DJ Invoice',
    text: `PULSE COLLECTIVE - DJ / MC SERVICES
Date: 9/12/26, Willows Lodge
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

export const sampleEmails = [
  {
    id: 'e1',
    from: 'Marcus Webb · Table & Vine Catering',
    subject: 'Final balance + headcount deadline',
    date: '2026-08-14',
    body: `Hi! We're getting excited for your day. Two quick things:
1) Your FINAL BALANCE of $9,200 is due on August 29, 2026 (14 days before the event).
2) We need your final guest headcount locked in by September 2. It can go up but not down after that.
Also a heads up — our chef will arrive on-site at 1:00 PM for the 5:30 PM dinner service.
Thanks so much!`,
  },
  {
    id: 'e2',
    from: 'Renata Silva · Evergreen Photo Co.',
    subject: 'Need to move your engagement session',
    date: '2026-08-10',
    body: `Hey! Unfortunately I have to reschedule your engagement session — I can no longer do Saturday Aug 22.
Could we move it to Sunday Aug 23 at 5:30 PM instead? The light is actually better then.
Separately, your final photography installment of $1,800 is due Aug 15. Let me know on the date change!`,
  },
  {
    id: 'e3',
    from: 'Theo Marsh · Fern & Fable Florals',
    subject: 'Your proposal is ready',
    date: '2026-08-05',
    body: `Attached is your floral proposal. To reserve your date we need the deposit of $650 by August 20.
The remaining balance ($2,000) plus a $50 delivery fee will be due September 1.
Quick note: peonies are out of season in September, so I've swapped in garden roses for a similar look.`,
  },
  {
    id: 'e4',
    from: 'Dana Cole · Pulse Collective DJ',
    subject: 'Song list + remaining balance',
    date: '2026-08-18',
    body: `Loved chatting today! Please send your must-play and do-not-play lists by Sept 5.
Your remaining balance of $750 is due August 22. Setup takes about 90 minutes so we'll arrive around 2:30 PM.`,
  },
]

export function fullState() {
  return { ...emptyState(), sampleContracts, sampleEmails }
}
