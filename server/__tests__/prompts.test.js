import { describe, it, expect } from 'vitest'
import { COORDINATOR_SYSTEM } from '../prompts.js'

// The prompt is hand-wrapped across lines for readability, so match phrases with
// flexible whitespace instead of exact substrings.
const phrase = (words) => new RegExp(words.split(' ').join('\\s+'), 'i')

describe('COORDINATOR_SYSTEM persona', () => {
  it('identifies the assistant as Aisle', () => {
    expect(COORDINATOR_SYSTEM).toMatch(/you are Aisle/i)
  })

  it('explicitly instructs the model never to claim to be an AI language model', () => {
    expect(COORDINATOR_SYSTEM).toMatch(phrase('never mention being an AI language model'))
  })

  it('instructs proactive detection of the key risk categories', () => {
    for (const topic of [
      'timeline conflicts',
      'missing vendors',
      'late payments',
      'contract risks',
      'scheduling issues',
      'budget overruns',
      'missing documents',
      'vendor communication gaps',
    ]) {
      expect(COORDINATOR_SYSTEM).toMatch(phrase(topic))
    }
  })

  it('encodes the five coordination priorities in order', () => {
    const lower = COORDINATOR_SYSTEM.toLowerCase()
    const idxPrevent = lower.indexOf('prevent problems before they happen')
    const idxReduce = lower.indexOf('reduce manual work')
    const idxSync = lower.indexOf('keep every vendor synchronized')
    const idxSave = lower.indexOf('save the couple time and money')
    const idxSmooth = lower.indexOf('ensure the wedding runs smoothly')
    for (const idx of [idxPrevent, idxReduce, idxSync, idxSave, idxSmooth]) expect(idx).toBeGreaterThan(-1)
    expect(idxPrevent).toBeLessThan(idxReduce)
    expect(idxReduce).toBeLessThan(idxSync)
    expect(idxSync).toBeLessThan(idxSave)
    expect(idxSave).toBeLessThan(idxSmooth)
  })

  it('still documents the <mutation> proposal format for data changes', () => {
    expect(COORDINATOR_SYSTEM).toContain('<mutation>')
    expect(COORDINATOR_SYSTEM).toContain('targetCollection')
    expect(COORDINATOR_SYSTEM).toContain('rawPatch')
  })

  it('instructs the model to use its live data-fetching tools rather than guess', () => {
    expect(COORDINATOR_SYSTEM.toLowerCase()).toMatch(/tools that pull directly from the couple's saved database/)
    expect(COORDINATOR_SYSTEM.toLowerCase()).toContain('do not guess')
  })

  it('requires a calm, confident tone and forbids robotic phrasing', () => {
    const lower = COORDINATOR_SYSTEM.toLowerCase()
    expect(lower).toContain('calm, organized, reassuring, and confident')
    expect(lower).toContain('never sound robotic')
  })
})
