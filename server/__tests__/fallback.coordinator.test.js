import { describe, it, expect } from 'vitest'
import { coordinatorFallback } from '../fallback.js'

describe('coordinatorFallback (offline agentic answers)', () => {
  const state = {
    wedding: { budgetTotal: 40000, budgetSpent: 12000 },
    payments: [
      { label: 'Florist deposit', amount: 650, dueDate: '2026-08-20', status: 'pending' },
      { label: 'Catering balance', amount: 9200, dueDate: '2026-08-29', status: 'pending' },
    ],
    guests: [{ rsvp: 'confirmed' }, { rsvp: 'confirmed' }, { rsvp: 'awaiting' }],
    vendors: [{ status: 'booked' }, { status: 'pending' }],
    timeline: [{ title: 'Hair & makeup begins', time: '8:00 AM' }],
  }

  it('answers budget questions from saved data', () => {
    const { reply, proposal } = coordinatorFallback('how much budget do I have left?', state)
    expect(reply).toContain('$40,000')
    expect(reply).toContain('$12,000')
    expect(reply).toContain('$28,000')
    expect(proposal).toBeNull()
  })

  it('answers payment questions with the soonest due date', () => {
    const { reply } = coordinatorFallback('what payment is due next?', state)
    expect(reply).toContain('Florist deposit')
    expect(reply).toContain('$650')
    expect(reply).toContain('2026-08-20')
  })

  it('answers guest / RSVP questions', () => {
    const { reply } = coordinatorFallback('how many guests have RSVPd?', state)
    expect(reply).toContain('3 guests')
    expect(reply).toContain('2 confirmed')
    expect(reply).toContain('1 awaiting')
  })

  it('answers vendor status questions', () => {
    const { reply } = coordinatorFallback('how are my vendors doing?', state)
    expect(reply).toContain('2 vendors')
    expect(reply).toContain('1 booked')
  })

  it('answers timeline questions', () => {
    const { reply } = coordinatorFallback('what does my schedule start with?', state)
    expect(reply).toContain('Hair & makeup begins')
    expect(reply).toContain('8:00 AM')
  })

  it('falls back to a generic offline message when nothing matches', () => {
    const { reply, proposal } = coordinatorFallback('tell me a joke', null)
    expect(reply).toMatch(/offline mode/i)
    expect(proposal).toBeNull()
  })

  it('never throws when state is missing entirely', () => {
    expect(() => coordinatorFallback('how much is left in my budget?')).not.toThrow()
  })
})
