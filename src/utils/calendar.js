function toDateTime(dateStr, timeStr, addMin = 0) {
  const m = String(timeStr || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
  let h = m ? Number(m[1]) % 12 : 12
  const min = m ? Number(m[2]) : 0
  if (m && m[3] && m[3].toUpperCase() === 'PM') h += 12
  const d = new Date(`${dateStr}T00:00:00`)
  d.setHours(h, min + addMin, 0, 0)
  return d
}

const pad = (n) => String(n).padStart(2, '0')

function fmt(d) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

const esc = (s) => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')

export function eventTimes(wedding, ev) {
  if (!wedding?.date) return null
  const start = toDateTime(wedding.date, ev.time, 0)
  const end = toDateTime(wedding.date, ev.time, Number(ev.durationMin) || 30)
  return { start: fmt(start), end: fmt(end) }
}

export function googleCalUrl(wedding, ev) {
  const t = eventTimes(wedding, ev)
  if (!t) return null
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title || 'Wedding event',
    dates: `${t.start}/${t.end}`,
    details: `${wedding.couple || ''} wedding · via AIsle`,
    location: wedding.venue || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function buildIcs(wedding, timeline) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AIsle//Wedding OS//EN', 'CALSCALE:GREGORIAN']
  const stamp = fmt(new Date())
  ;(timeline || []).forEach((ev, i) => {
    const t = eventTimes(wedding, ev)
    if (!t) return
    lines.push(
      'BEGIN:VEVENT',
      `UID:aisle-${i}-${ev.id || i}@aisle.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${t.start}`,
      `DTEND:${t.end}`,
      `SUMMARY:${esc(ev.title)}`,
      `LOCATION:${esc(wedding.venue)}`,
      `DESCRIPTION:${esc((wedding.couple || '') + ' wedding · via AIsle')}`,
      'END:VEVENT'
    )
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(wedding, timeline) {
  const ics = buildIcs(wedding, timeline)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(wedding.couple || 'wedding').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-timeline.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
