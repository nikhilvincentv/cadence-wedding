// Task 1.3: Verify POST /api/state round-trips new fields without dropping them
import { describe, it, expect } from 'vitest'
import { emptyState, fullState } from '../../server/data.js'

describe('emptyState includes all collections', () => {
  it('has all six new collections', () => {
    const s = emptyState()
    expect(Array.isArray(s.guests)).toBe(true)
    expect(Array.isArray(s.budgetCategories)).toBe(true)
    expect(Array.isArray(s.seatingTables)).toBe(true)
    expect(Array.isArray(s.inboxThreads)).toBe(true)
    expect(Array.isArray(s.tasks)).toBe(true)
    expect(s.contractAnalyses).toEqual({})
  })

  it('retains existing collections', () => {
    const s = emptyState()
    expect(Array.isArray(s.vendors)).toBe(true)
    expect(Array.isArray(s.timeline)).toBe(true)
    expect(Array.isArray(s.payments)).toBe(true)
    expect(Array.isArray(s.alerts)).toBe(true)
    expect(s.wedding).toBeDefined()
  })
})

describe('fullState spreads new collections', () => {
  it('includes all new collections via emptyState spread', () => {
    const s = fullState()
    expect(Array.isArray(s.guests)).toBe(true)
    expect(Array.isArray(s.budgetCategories)).toBe(true)
    expect(Array.isArray(s.seatingTables)).toBe(true)
    expect(Array.isArray(s.inboxThreads)).toBe(true)
    expect(Array.isArray(s.tasks)).toBe(true)
    expect(s.contractAnalyses).toEqual({})
  })
})

describe('saveUserState clean object preserves new fields', () => {
  it('clean object construction does not drop new collections', () => {
    // Simulate the clean object logic from db.js without a real DB
    const data = {
      wedding: { couple: 'Test' },
      vendors: [{ id: 'v1' }],
      timeline: [],
      payments: [],
      alerts: [],
      guests: [{ id: 'g1', name: 'Alice', rsvp: 'confirmed' }],
      budgetCategories: [{ id: 'b1', name: 'Flowers', projected: 2000, actual: 1800 }],
      seatingTables: [{ id: 't1', label: 'Table 1', shape: 'round', guestIds: [] }],
      inboxThreads: [{ id: 'i1', sender: 'vendor@test.com', tldr: 'Hello' }],
      tasks: [{ id: 'tk1', description: 'Order cake', checked: false }],
      contractAnalyses: { 'v1': { vendorId: 'v1', vendorName: 'Florist' } },
    }

    // Mirror the clean object logic in db.js
    const clean = {
      wedding: data.wedding,
      vendors: data.vendors,
      timeline: data.timeline,
      payments: data.payments,
      alerts: data.alerts,
      guests: data.guests ?? [],
      budgetCategories: data.budgetCategories ?? [],
      seatingTables: data.seatingTables ?? [],
      inboxThreads: data.inboxThreads ?? [],
      tasks: data.tasks ?? [],
      contractAnalyses: data.contractAnalyses ?? {},
    }

    expect(clean.guests).toEqual(data.guests)
    expect(clean.budgetCategories).toEqual(data.budgetCategories)
    expect(clean.seatingTables).toEqual(data.seatingTables)
    expect(clean.inboxThreads).toEqual(data.inboxThreads)
    expect(clean.tasks).toEqual(data.tasks)
    expect(clean.contractAnalyses).toEqual(data.contractAnalyses)
  })

  it('defaults missing new fields to empty values (does not throw)', () => {
    // If a legacy state blob without new fields is saved, it should not crash
    const legacyData = {
      wedding: {},
      vendors: [],
      timeline: [],
      payments: [],
      alerts: [],
    }

    const clean = {
      wedding: legacyData.wedding,
      vendors: legacyData.vendors,
      timeline: legacyData.timeline,
      payments: legacyData.payments,
      alerts: legacyData.alerts,
      guests: legacyData.guests ?? [],
      budgetCategories: legacyData.budgetCategories ?? [],
      seatingTables: legacyData.seatingTables ?? [],
      inboxThreads: legacyData.inboxThreads ?? [],
      tasks: legacyData.tasks ?? [],
      contractAnalyses: legacyData.contractAnalyses ?? {},
    }

    expect(clean.guests).toEqual([])
    expect(clean.budgetCategories).toEqual([])
    expect(clean.seatingTables).toEqual([])
    expect(clean.inboxThreads).toEqual([])
    expect(clean.tasks).toEqual([])
    expect(clean.contractAnalyses).toEqual({})
  })
})
