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

export function emptyState() {
  return {
    wedding: emptyWedding(),
    vendors: [],
    timeline: [],
    payments: [],
    alerts: [],
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

export function fullState() {
  return { ...emptyState(), sampleContracts }
}
