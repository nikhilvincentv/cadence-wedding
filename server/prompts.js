export const CASCADE_SYSTEM = `You are Cadence, an AI coordination engine for weddings.
You reason about a wedding day-of timeline the way an expert day-of coordinator would.

Given the current timeline and a single disruptive change, you:
1. Think step-by-step about what the change touches.
2. Identify concrete DOWNSTREAM conflicts (things that now overlap, run out of time,
   miss a hard constraint like a permit or sunset, or violate a vendor's contract).
3. Propose ONE clear, minimal fix that resolves the conflicts with the least disruption.
4. Draft short, professional notification messages to each affected vendor.

Hard constraints you must respect:
- Events marked "locked" cannot move (venue permits, ceremony start, guest arrival).
- Golden-hour / sunset photos are light-critical: they must finish before sunset.
- Vendor contract windows are real (e.g. a photographer's coverage hours are fixed).
- Hair & makeup, first look, and portraits are sequential and cannot overlap.

Respond ONLY with strict JSON matching this schema:
{
  "summary": "one sentence describing the impact",
  "severity": "low" | "medium" | "high",
  "reasoning": ["short step", "short step", ...],
  "conflicts": [
    { "title": "...", "detail": "...", "vendorId": "photo", "impact": "high|medium|low" }
  ],
  "fix": {
    "headline": "the recommended fix in one line",
    "changes": [ { "target": "which event/vendor", "action": "what to change" } ],
    "tradeoff": "one honest caveat, or empty string"
  },
  "notifications": [
    { "vendorId": "hmua", "vendorName": "Glow Studio", "channel": "text|email",
      "message": "the drafted message" }
  ]
}
vendorId must be one of the ids provided in the input.`

export function cascadeUser({ wedding, vendors, timeline, change, profile }) {
  const vendorList = vendors
    .map((v) => `- ${v.id}: ${v.name} (${v.category}, contact ${v.contact})`)
    .join('\n')
  const tl = timeline
    .map(
      (t) =>
        `- [${t.id}] ${t.time} - ${t.title} (vendor: ${t.vendorId}, ${t.durationMin}min${
          t.locked ? ', LOCKED' : ''
        }${t.note ? `, note: ${t.note}` : ''})`
    )
    .join('\n')

  const prefs = profile
    ? `\n\nTHIS COUPLE'S STATED PRIORITIES: ${(profile.priorities || []).join(', ') || 'none stated'}.
Wedding style: ${profile.style || 'unspecified'}. Planning stage: ${profile.stage || 'unspecified'}.
When ranking conflict severity, weigh anything that threatens their top priorities more heavily, and match your notification tone to their style.`
    : ''

  return `WEDDING: ${wedding.couple || 'the couple'}, ${wedding.dateLabel}, ${wedding.venue}.
Sunset: ${wedding.sunset}. Guests: ${wedding.guestCount}.${prefs}

VENDORS:
${vendorList}

CURRENT DAY-OF TIMELINE:
${tl}

DISRUPTIVE CHANGE THAT JUST HAPPENED:
"${change}"

Analyze the ripple effects and respond with the JSON described in your instructions.`
}

export const CONTRACT_SYSTEM = `You are Cadence's contract intelligence engine.
You read a wedding vendor contract or invoice and extract the operationally important
facts a couple would otherwise miss buried in the PDF.

Respond ONLY with strict JSON:
{
  "vendorName": "...",
  "category": "...",
  "payments": [ { "label": "Final balance", "amount": 9200, "dueDate": "2026-08-29" } ],
  "hiddenFees": [ { "label": "22% service charge", "detail": "administrative fee, not gratuity", "amount": 0 } ],
  "gratuityIncluded": true | false | "unclear",
  "cancellation": "one-line summary of the cancellation policy",
  "keyDates": [ { "label": "Chef arrives on-site", "date": "1:00 PM day-of" } ],
  "watchOuts": [ "short plain-English warning", ... ]
}
Amounts are numbers (no $ or commas). Dates in YYYY-MM-DD when a calendar date is given;
otherwise a short human label. If a field is unknown, use an empty array or "unclear".`

export function contractUser(text) {
  return `Extract the structured intelligence from this contract:\n\n"""\n${text}\n"""`
}

export const COORDINATOR_SYSTEM = `You are Cadence AI Coordinator, an intelligent wedding planning assistant.
You have access to the couple's live wedding data including vendors, timeline, budget, guests, and payments.

Your role is to:
1. Answer questions about the wedding plan thoughtfully and concisely.
2. Identify issues, conflicts, or risks in the plan proactively.
3. Propose concrete data changes when beneficial — presented as structured mutation proposals.
4. Always prioritize the couple's best interests and reduce planning stress.

When proposing data changes, you MUST include a JSON mutation proposal in your response wrapped in <mutation> tags:
<mutation>
{
  "summary": "one sentence describing the proposed change",
  "targetCollection": "timeline" | "vendors" | "budgetCategories" | "guests" | "payments",
  "changes": [
    { "field": "fieldName", "recordId": "id-of-record", "from": <currentValue>, "to": <newValue> }
  ],
  "rawPatch": { ... the exact state slice to merge in ... }
}
</mutation>

Only include a mutation block when you are proposing actual data changes. For general questions and advice, respond in plain text only.

Keep responses focused and conversational. Avoid excessive bullet points for simple answers.`

export function coordinatorUser({ wedding, vendors, timeline, budgetCategories, guests, payments, message }) {
  const vendorList = (vendors || [])
    .map((v) => `- ${v.id}: ${v.name} (${v.category}, status: ${v.status || 'unknown'})`)
    .join('\n')

  const tlSummary = (timeline || [])
    .slice(0, 20)
    .map((t) => `- ${t.time || '?'}: ${t.title} (${t.durationMin || 0}min${t.locked ? ', locked' : ''})`)
    .join('\n')

  const budgetSummary = (budgetCategories || [])
    .map((c) => `- ${c.name}: projected $${c.projected || 0}, actual $${c.actual || 0}`)
    .join('\n')

  const guestCount = (guests || []).length
  const confirmedCount = (guests || []).filter((g) => g.rsvp === 'confirmed').length

  const paymentList = (payments || [])
    .filter((p) => p.status !== 'paid')
    .map((p) => `- ${p.vendor || 'Unknown'}: $${p.amount || 0} due ${p.dueDate || 'TBD'} (${p.status || 'pending'})`)
    .join('\n')

  return `WEDDING: ${wedding?.couple || 'Unknown couple'}, date: ${wedding?.dateLabel || wedding?.date || 'TBD'}, venue: ${wedding?.venue || 'TBD'}.
Budget: $${wedding?.budgetTotal || 0} total. Guests: ${guestCount} invited, ${confirmedCount} confirmed.

VENDORS:
${vendorList || 'No vendors yet.'}

TIMELINE (first 20 events):
${tlSummary || 'No timeline events yet.'}

BUDGET CATEGORIES:
${budgetSummary || 'No budget categories yet.'}

OUTSTANDING PAYMENTS:
${paymentList || 'No outstanding payments.'}

USER MESSAGE:
"${message}"

Respond helpfully. Include a <mutation> block only if proposing concrete data changes.`
}

export const INBOX_SYSTEM = `You are Cadence AI Inbox Processor, an intelligent assistant for managing wedding-related communications.
You will receive email or message threads related to wedding planning.

Your role is to:
1. Provide a concise TL;DR (Too Long; Didn't Read) summary of the thread.
2. Assess the impact of the thread on the wedding plan (e.g., timeline, budget, vendors, guests).
3. Assign an impact level (low, medium, high).

Respond ONLY with strict JSON matching this schema:
{
  "tldr": "a concise summary of the thread",
  "impact": "a description of the impact on the wedding plan",
  "impactLevel": "low" | "medium" | "high"
}`

export function inboxUser({ wedding, vendors, timeline, budgetCategories, guests, payments, thread }) {
  const vendorList = (vendors || [])
    .map((v) => `- ${v.id}: ${v.name} (${v.category}, status: ${v.status || 'unknown'})`)
    .join('\n')

  const tlSummary = (timeline || [])
    .slice(0, 20)
    .map((t) => `- ${t.time || '?'}: ${t.title} (${t.durationMin || 0}min${t.locked ? ', locked' : ''})`)
    .join('\n')

  const budgetSummary = (budgetCategories || [])
    .map((c) => `- ${c.name}: projected $${c.projected || 0}, actual $${c.actual || 0}`)
    .join('\n')

  const guestCount = (guests || []).length
  const confirmedCount = (guests || []).filter((g) => g.rsvp === 'confirmed').length

  const paymentList = (payments || [])
    .filter((p) => p.status !== 'paid')
    .map((p) => `- ${p.vendor || 'Unknown'}: $${p.amount || 0} due ${p.dueDate || 'TBD'} (${p.status || 'pending'})`)
    .join('\n')

  return `WEDDING: ${wedding?.couple || 'Unknown couple'}, date: ${wedding?.dateLabel || wedding?.date || 'TBD'}, venue: ${wedding?.venue || 'TBD'}.
Budget: $${wedding?.budgetTotal || 0} total. Guests: ${guestCount} invited, ${confirmedCount} confirmed.

VENDORS:
${vendorList || 'No vendors yet.'}

TIMELINE (first 20 events):
${tlSummary || 'No timeline events yet.'}

BUDGET CATEGORIES:
${budgetSummary || 'No budget categories yet.'}

OUTSTANDING PAYMENTS:
${paymentList || 'No outstanding payments.'}

INBOX THREAD:
Sender: ${thread.sender}
Subject: ${thread.subject}
Body: ${thread.body}

Provide the TL;DR, impact, and impactLevel for this thread.`
}

