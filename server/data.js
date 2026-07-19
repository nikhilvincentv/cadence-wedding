export const VENDOR_CATEGORIES = [
  'Photography',
  'Catering',
  'Music / DJ',
  'Florist',
  'Cake',
  'Beauty',
  'Officiant',
  'Transportation',
]

export const VENDOR_STAGES = ['recommended', 'shortlisted', 'contacted', 'negotiating', 'offer', 'booked']

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

const hoursAgo = (n) => new Date(Date.now() - n * 3600000).toISOString()
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString()

export function emptyDocuments() {
  return [
    {
      id: 'doc-catering',
      name: 'Catering_Services_Agreement_V2.pdf',
      vendorId: 'v2',
      vendorName: 'Table & Vine Catering',
      category: 'Catering',
      sizeLabel: '1.4 MB',
      source: 'ai-drafted',
      status: 'action_required',
      modifiedAt: hoursAgo(2),
      executedAt: null,
      paymentsAdded: false,
      text: `TABLE & VINE CATERING - SERVICE AGREEMENT (DRAFT)
Category: Catering

PRICING
Total contract price: $18,216

PAYMENT SCHEDULE
- Deposit: $6,000 due on signing
- Balance: $12,216 due 14 days before the event

CANCELLATION POLICY
Cancellation within 30 days of the event forfeits 75% of the contract total.

NOTES
Drafted by AIsle from your vendor details. Review the terms below, then sign to send to Table & Vine Catering for countersignature.`,
      analysis: {
        vendorName: 'Table & Vine Catering',
        category: 'Catering',
        payments: [
          { label: 'Deposit', amount: 6000, dueDate: 'On signing' },
          { label: 'Balance', amount: 12216, dueDate: '14 days before event' },
        ],
        hiddenFees: [],
        gratuityIncluded: null,
        cancellation: 'Cancellation within 30 days forfeits 75% of the contract total.',
        keyDates: [{ label: 'Balance due', date: '14 days before event' }],
        watchOuts: [],
      },
    },
    {
      id: 'doc-floral',
      name: 'Floral_Design_Contract_Final.pdf',
      vendorId: 'v-floral',
      vendorName: 'Fern & Fable Florals',
      category: 'Florist',
      sizeLabel: '842 KB',
      source: 'uploaded',
      status: 'awaiting_vendor',
      modifiedAt: daysAgo(1),
      executedAt: null,
      paymentsAdded: false,
      lastRemindedAt: null,
      text: `FERN & FABLE FLORALS - SERVICE AGREEMENT
Category: Florist

PRICING
Total contract price: $2,650

PAYMENT SCHEDULE
- Deposit (paid): $650 due on booking
- Balance: $2,000 + $50 delivery fee due September 1

CANCELLATION POLICY
Deposit is non-refundable within 60 days of the event.

NOTES
Signed by the couple - awaiting the florist's countersignature.`,
      analysis: {
        vendorName: 'Fern & Fable Florals',
        category: 'Florist',
        payments: [
          { label: 'Deposit', amount: 650, dueDate: 'Paid' },
          { label: 'Balance + delivery', amount: 2050, dueDate: 'September 1' },
        ],
        hiddenFees: [{ label: 'Delivery fee', amount: 50, detail: 'Added to final balance' }],
        gratuityIncluded: null,
        cancellation: 'Deposit is non-refundable within 60 days of the event.',
        keyDates: [{ label: 'Balance due', date: 'September 1' }],
        watchOuts: ['Peonies are out of season in September - garden roses substituted for a similar look.'],
      },
    },
    {
      id: 'doc-venue',
      name: 'Venue_Hire_Agreement_WillowsLodge.pdf',
      vendorId: 'v1',
      vendorName: 'Willows Lodge',
      category: 'Venue',
      sizeLabel: '2.3 MB',
      source: 'uploaded',
      status: 'signed',
      modifiedAt: daysAgo(70),
      executedAt: daysAgo(70),
      paymentsAdded: false,
      text: `WILLOWS LODGE - VENUE HIRE AGREEMENT
Category: Venue

PRICING
Total contract price: $12,000

PAYMENT SCHEDULE
- Deposit (paid): $4,000 due on signing
- Balance (paid): $8,000 due 30 days before the event

CANCELLATION POLICY
Full forfeiture of deposit if cancelled within 90 days of the event.

NOTES
Rain-plan tent included. Getting-ready suites for both parties.`,
      analysis: {
        vendorName: 'Willows Lodge',
        category: 'Venue',
        payments: [
          { label: 'Deposit', amount: 4000, dueDate: 'Paid' },
          { label: 'Balance', amount: 8000, dueDate: 'Paid' },
        ],
        hiddenFees: [],
        gratuityIncluded: null,
        cancellation: 'Full forfeiture of deposit if cancelled within 90 days of the event.',
        keyDates: [],
        watchOuts: [],
      },
    },
    {
      id: 'doc-photo',
      name: 'Photography_Services_Agreement.pdf',
      vendorId: 'v3',
      vendorName: 'Evergreen Photo Co.',
      category: 'Photography',
      sizeLabel: '1.1 MB',
      source: 'uploaded',
      status: 'signed',
      modifiedAt: daysAgo(55),
      executedAt: daysAgo(55),
      paymentsAdded: false,
      text: `EVERGREEN PHOTO CO. - WEDDING PHOTOGRAPHY CONTRACT
Category: Photography

PRICING
Total contract price: $5,400

PAYMENT SCHEDULE
- Retainer (paid): $1,800 due on signing
- Second payment (paid): $1,800 due 90 days prior
- Final installment (paid): $1,800 due 30 days before the event

CANCELLATION POLICY
Retainer is non-refundable.

NOTES
Overtime billed at $450/hr in 30-min increments beyond the coverage window.`,
      analysis: {
        vendorName: 'Evergreen Photo Co.',
        category: 'Photography',
        payments: [
          { label: 'Retainer', amount: 1800, dueDate: 'Paid' },
          { label: 'Second payment', amount: 1800, dueDate: 'Paid' },
          { label: 'Final installment', amount: 1800, dueDate: 'Paid' },
        ],
        hiddenFees: [{ label: 'Overtime', amount: 450, detail: 'Per hour beyond the coverage window' }],
        gratuityIncluded: null,
        cancellation: 'Retainer is non-refundable.',
        keyDates: [],
        watchOuts: [],
      },
    },
  ]
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
    vendors: [
      { id: 'v1', name: 'The Vineyard Estate', category: 'Venue', status: 'contacted', quote: 12000 },
      { id: 'v2', name: 'Table & Vine Catering', category: 'Catering', status: 'shortlisted', quote: 18216 },
      { id: 'v3', name: 'Evergreen Photo Co.', category: 'Photography', status: 'booked', quote: 5400 }
    ],
    timeline: [
      { id: 't1', time: '10:00 AM', title: 'Hair and Makeup starts' },
      { id: 't2', time: '02:00 PM', title: 'Photographer arrives' },
      { id: 't3', time: '04:00 PM', title: 'Ceremony starts' },
      { id: 't4', time: '05:30 PM', title: 'Dinner service' }
    ],
    payments: [
      { id: 'p1', label: 'Venue Deposit', amount: 6000, date: '2026-05-01', status: 'paid', source: 'Bank' },
      { id: 'p2', label: 'Catering Deposit', amount: 6000, date: '2026-06-01', status: 'paid', source: 'Credit Card' },
      { id: 'p3', label: 'Catering Final', amount: 9200, date: '2026-08-29', status: 'pending', source: 'Bank' }
    ],
    alerts: [],
    guests: [
      { id: 'g1', name: 'Sarah Jenkins', relationship: 'Friend', rsvp: 'attending', dietary: 'Vegan' },
      { id: 'g2', name: 'Michael Jenkins', relationship: 'Friend', rsvp: 'attending', dietary: 'None' },
      { id: 'g3', name: 'Aunt Carol', relationship: 'Family', rsvp: 'attending', dietary: 'Gluten-Free' }
    ],
    budgetCategories: [
      { id: 'b1', name: 'Venue', projected: 15000, spent: 6000 },
      { id: 'b2', name: 'Catering', projected: 20000, spent: 6000 },
      { id: 'b3', name: 'Photography', projected: 6000, spent: 1800 }
    ],
    seatingTables: [],
    inboxThreads: [],
    tasks: [
      { id: 'tk1', text: 'Book the venue', completed: true },
      { id: 'tk2', text: 'Send save the dates', completed: true },
      { id: 'tk3', text: 'Finalize guest list', completed: false, due: '2026-08-01' },
      { id: 'tk4', text: 'Pay final catering balance', completed: false, due: '2026-08-29' }
    ],
    inspirationBoard: [],
    documents: emptyDocuments(),
    contractAnalyses: {},
    recommendations: { venues: [], categories: {} },
    negotiations: {},
    connections: { gmail: { connected: false, address: '' }, sms: { connected: false, number: '' } },
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
