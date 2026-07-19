const uid = () => Math.random().toString(36).slice(2, 9)

const LIVE = { gmail: false, sms: false }

export const GMAIL_SCOPES = [
  { id: 'read', icon: '', label: 'Read incoming vendor emails', scope: 'gmail.readonly' },
  { id: 'send', icon: '', label: 'Send and reply to vendors on your behalf', scope: 'gmail.send' },
  { id: 'label', icon: '', label: 'Organize and label your wedding threads', scope: 'gmail.labels' },
]

export const SMS_SCOPES = [
  { id: 'send', icon: '', label: 'Text vendors from a dedicated wedding number', scope: 'sms.send' },
  { id: 'read', icon: '', label: 'Receive vendor replies as threads', scope: 'sms.receive' },
]

async function gmailAuthorizeLive() {
  throw new Error('gmailAuthorizeLive not implemented — wire Google OAuth here')
}
async function gmailSendLive() {
  throw new Error('gmailSendLive not implemented — wire gmail.users.messages.send here')
}
async function smsRequestCodeLive() {
  throw new Error('smsRequestCodeLive not implemented — wire Twilio Verify start here')
}
async function smsVerifyLive() {
  throw new Error('smsVerifyLive not implemented — wire Twilio Verify check here')
}
async function smsSendLive() {
  throw new Error('smsSendLive not implemented — wire Twilio messages.create here')
}

export async function connectGmail(address) {
  if (LIVE.gmail) return gmailAuthorizeLive()
  await wait(900)
  return { connected: true, address: address || 'you@gmail.com', at: Date.now() }
}

export async function sendEmail(message) {
  if (LIVE.gmail) return gmailSendLive(message)
  return { id: uid(), channel: 'email', from: 'agent', ts: Date.now(), ...message }
}

export async function requestSmsCode(number) {
  if (LIVE.sms) return smsRequestCodeLive(number)
  await wait(700)
  return { sent: true, number }
}

export async function verifySms(number, code) {
  if (LIVE.sms) return smsVerifyLive(number, code)
  await wait(700)
  return { connected: Boolean(code && String(code).length >= 4), number, at: Date.now() }
}

export async function sendSms(message) {
  if (LIVE.sms) return smsSendLive(message)
  return { id: uid(), channel: 'sms', from: 'agent', ts: Date.now(), ...message }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

const HOUR = 3600 * 1000

function seedThreads(data) {
  const now = Date.now()
  const couple = data.wedding?.couple || 'the couple'
  const venue = data.venue?.name || data.wedding?.venue || 'your venue'
  return [
    {
      id: 'seed-venue',
      channel: 'email',
      vendorName: data.venue?.name || 'The Vineyard Estate',
      contactName: data.venue?.contactName || 'Marina Ellis',
      subject: `Availability + tour — ${couple}`,
      status: 'active',
      unread: true,
      ts: now - 2 * HOUR,
      messages: [
        { from: 'agent', ts: now - 5 * HOUR, text: `Hi Marina, this is the AIsle assistant reaching out for ${couple}. Are you available on their date, and could we book a tour this week?` },
        { from: 'vendor', ts: now - 2 * HOUR, text: `Hi! Yes, the date is open. We have tour slots Thursday at 2pm or Saturday at 11am — happy to hold one for you.` },
      ],
    },
    {
      id: 'seed-florist',
      channel: 'sms',
      vendorName: 'Fern & Fable Florals',
      contactName: 'Theo Marsh',
      subject: '',
      status: 'active',
      unread: false,
      ts: now - 30 * 60 * 1000,
      messages: [
        { from: 'agent', ts: now - 90 * 60 * 1000, text: `Hi Theo — AIsle here for ${couple}. What delivery window works for setup at ${venue}?` },
        { from: 'vendor', ts: now - 30 * 60 * 1000, text: `Hey! We can be on-site by 1pm to install before guests arrive. I'll send the final proposal tonight.` },
      ],
    },
    {
      id: 'seed-shuttle',
      channel: 'sms',
      vendorName: 'Emerald Shuttle',
      contactName: 'Sam Ortiz',
      subject: '',
      status: 'awaiting',
      unread: true,
      ts: now - 10 * 60 * 1000,
      messages: [
        { from: 'agent', ts: now - 20 * 60 * 1000, text: `Hi Sam, confirming the 3:00pm guest pickup for ${couple}. Can you do two runs?` },
        { from: 'vendor', ts: now - 10 * 60 * 1000, text: `Two runs works. I'll send the contract with the final rate shortly.` },
      ],
    },
  ]
}

function negotiationThreads(data) {
  const negos = data.negotiations || {}
  const vendors = data.vendors || []
  return Object.entries(negos).map(([vendorId, nego]) => {
    const vendor = vendors.find((v) => v.id === vendorId) || {}
    const msgs = (nego.messages || [])
      .filter((m) => m.role !== 'ai')
      .map((m) => ({
        from: m.role === 'vendor' ? 'vendor' : 'agent',
        text: m.text,
        quote: m.quote,
        ts: m.ts || Date.now(),
      }))
    const last = msgs[msgs.length - 1]
    return {
      id: `nego-${vendorId}`,
      channel: 'email',
      vendorName: vendor.name || 'Vendor',
      contactName: vendor.contactName || vendor.contact || '',
      subject: `${vendor.category || 'Vendor'} inquiry — ${data.wedding?.couple || 'wedding'}`,
      status: nego.status === 'agreed' ? 'agreed' : 'active',
      unread: last?.from === 'vendor',
      ts: last?.ts || Date.now(),
      messages: msgs,
      negotiated: nego.currentQuote,
      savings: nego.savings,
    }
  })
}

export function deriveThreads(data) {
  const threads = [...negotiationThreads(data), ...seedThreads(data)]
  return threads.sort((a, b) => b.ts - a.ts)
}
