import React, { useState } from 'react'
import { fmtMoney } from '../api.js'
import { VENDOR_CATEGORIES, nextCategory, venueSet } from '../journey.js'
import Negotiate from '../components/Negotiate.jsx'

const uid = () => Math.random().toString(36).slice(2, 9)

function chipFor(stage) {
  switch (stage) {
    case 'booked': return { cls: 'ok', label: '✅ Booked' }
    case 'agreed': return { cls: 'warn', label: '💰 Ready to book' }
    case 'offer': return { cls: 'warn', label: '💰 Offer in' }
    case 'negotiating': return { cls: 'warn', label: '💬 Negotiating' }
    case 'contacted': return { cls: 'info', label: '💬 Contacted' }
    case 'shortlisted': return { cls: 'info', label: '⭐ Shortlisted' }
    default: return { cls: 'ghost', label: 'Recommended' }
  }
}

function effStage(v, data) {
  if (v.stage === 'booked' || v.status === 'booked') return 'booked'
  const n = data.negotiations?.[v.id]
  if (n) {
    if (n.status === 'agreed') return 'agreed'
    if (n.status === 'offer') return 'offer'
    return 'negotiating'
  }
  return v.stage || 'shortlisted'
}

function Stars({ rating }) {
  const n = Math.round(Number(rating) || 0)
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? 'var(--gold)' : 'var(--ink-faint)', fontSize: 12 }}>★</span>
      ))}
      <span className="faint" style={{ fontSize: 11.5, marginLeft: 4 }}>{Number(rating).toFixed(1)}</span>
    </span>
  )
}

export default function Vendors({ data, persist, setView, status }) {
  const vendors = data.vendors || []
  const recs = data.recommendations?.categories || {}
  const [tab, setTab] = useState('discover')
  const [cat, setCat] = useState(() => nextCategory(data) || VENDOR_CATEGORIES[0])
  const [negoVendor, setNegoVendor] = useState(null)
  const [compare, setCompare] = useState([])

  const byId = (id) => vendors.find((v) => v.id === id)
  const shortlistedIds = new Set(vendors.map((v) => v.id))

  function buildVendor(c, stage) {
    return {
      id: c.id, name: c.name, category: c.category || cat, contact: c.contactName || '',
      contactName: c.contactName || '', email: c.email || '', phone: c.phone || '',
      rating: c.rating, priceValue: c.priceValue, priceLabel: c.priceLabel, style: c.style,
      blurb: c.blurb, stage, status: 'pending', favorite: false,
    }
  }

  function shortlist(c) {
    if (shortlistedIds.has(c.id)) return byId(c.id)
    const v = buildVendor(c, 'shortlisted')
    persist({ ...data, vendors: [...vendors, v] })
    return v
  }

  function openNegotiate(c) {
    let v = byId(c.id)
    let nextVendors
    if (!v) {
      v = buildVendor(c, 'contacted')
      nextVendors = [...vendors, v]
    } else {
      nextVendors = vendors.map((x) => (x.id === v.id && (!x.stage || x.stage === 'shortlisted') ? { ...x, stage: 'contacted' } : x))
      v = nextVendors.find((x) => x.id === c.id)
    }
    persist({ ...data, vendors: nextVendors })
    setNegoVendor(v)
  }

  function removeShortlist(id) {
    const { [id]: _drop, ...restNego } = data.negotiations || {}
    persist({ ...data, vendors: vendors.filter((v) => v.id !== id), negotiations: restNego })
    setCompare((c) => c.filter((x) => x !== id))
  }

  function bookVendor(vendor, price, savings) {
    const category = vendor.category || cat
    const budgetCategories = data.budgetCategories || []
    const hasCat = budgetCategories.some((b) => b.name.toLowerCase() === category.toLowerCase())
    const nextBudget = hasCat
      ? budgetCategories.map((b) => (b.name.toLowerCase() === category.toLowerCase() ? { ...b, projected: b.projected || price } : b))
      : [...budgetCategories, { id: uid(), name: category, projected: price, actual: 0 }]
    const deposit = Math.round((price * 0.3) / 50) * 50
    const payments = [...(data.payments || []),
      { id: uid(), vendorId: vendor.id, label: 'Deposit', amount: deposit, dueDate: '', status: 'due', source: vendor.name },
      { id: uid(), vendorId: vendor.id, label: 'Balance', amount: price - deposit, dueDate: '', status: 'due', source: vendor.name },
    ]
    persist({
      ...data,
      vendors: (data.vendors || []).map((v) => (v.id === vendor.id ? { ...v, stage: 'booked', status: 'booked', negotiatedPrice: price, savings } : v)),
      budgetCategories: nextBudget,
      payments,
    })
    setNegoVendor(null)
    setTab('booked')
  }

  const finalists = vendors.filter((v) => effStage(v, data) !== 'booked')
  const booked = vendors.filter((v) => effStage(v, data) === 'booked')
  const totalSaved = booked.reduce((s, v) => s + (Number(v.savings) || 0), 0)
  const currentFocus = nextCategory(data)
  const catList = recs[cat] || []
  const compareVendors = compare.map(byId).filter(Boolean)

  const Tab = ({ id, label, n }) => (
    <button className={`chip ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
      {label}{n != null ? ` · ${n}` : ''}
    </button>
  )

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Find your vendors</h1>
          <div className="page-sub">
            Discover, shortlist, and let Cadence negotiate — then book and drop in the contract.
          </div>
        </div>
        {totalSaved > 0 && <span className="badge ok" style={{ fontSize: 12 }}>Saved {fmtMoney(totalSaved)} so far</span>}
      </div>

      <div className="row gap-sm wrap" style={{ marginBottom: 18 }}>
        <Tab id="discover" label="Discover" />
        <Tab id="finalists" label="Finalists" n={finalists.length} />
        <Tab id="booked" label="Booked" n={booked.length} />
      </div>

      {tab === 'discover' && (
        <>
          {!venueSet(data) && (
            <div className="card pad-lg" style={{ marginBottom: 16, borderLeft: '3px solid var(--gold)' }}>
              <div className="row between wrap" style={{ gap: 12 }}>
                <div className="faint" style={{ fontSize: 13 }}>
                  Set your venue first — it anchors dates and capacity so vendor picks fit.
                </div>
                <button className="btn sm" onClick={() => setView('venue')}>Find venue →</button>
              </div>
            </div>
          )}

          {currentFocus && (
            <div className="card pad-lg" style={{ marginBottom: 16 }}>
              <div className="row between wrap" style={{ gap: 10, alignItems: 'center' }}>
                <div>
                  <span className="badge low" style={{ fontSize: 10 }}>◉ Cadence recommends next</span>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{currentFocus}</div>
                </div>
                {cat !== currentFocus && (
                  <button className="btn sm" onClick={() => setCat(currentFocus)}>Jump to {currentFocus}</button>
                )}
              </div>
            </div>
          )}

          <div className="row gap-sm wrap" style={{ marginBottom: 16 }}>
            {VENDOR_CATEGORIES.map((c) => {
              const done = booked.some((v) => (v.category || '').toLowerCase() === c.toLowerCase())
              return (
                <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
                  {done ? '✅ ' : ''}{c}
                </button>
              )
            })}
          </div>

          {catList.length === 0 ? (
            <div className="card pad-lg" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="faint" style={{ fontSize: 13 }}>Cadence is still finding {cat} options…</div>
            </div>
          ) : (
            <div className="vendor-grid">
              {catList.map((c) => {
                const existing = byId(c.id)
                const stage = existing ? effStage(existing, data) : 'recommended'
                const chip = chipFor(stage)
                return (
                  <div key={c.id} className="vendor-card">
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{c.name}</div>
                      <span className={`badge ${chip.cls}`} style={{ fontSize: 10 }}>{chip.label}</span>
                    </div>
                    <div className="faint" style={{ fontSize: 12.5, marginBottom: 8 }}>{c.blurb}</div>
                    <div className="row gap-sm wrap" style={{ marginBottom: 8, alignItems: 'center' }}>
                      <span className="badge low" style={{ fontSize: 10 }}>{c.style}</span>
                      <Stars rating={c.rating} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{c.priceLabel || fmtMoney(c.priceValue)}</div>
                    <div className="faint" style={{ fontSize: 11.5, marginBottom: 10 }}>{c.contactName} · {c.email}</div>
                    <div className="row gap-sm">
                      {stage === 'booked' ? (
                        <span className="badge ok" style={{ fontSize: 11 }}>✅ Booked</span>
                      ) : (
                        <>
                          <button className="btn sm" onClick={() => shortlist(c)} disabled={!!existing}>
                            {existing ? '⭐ Shortlisted' : '⭐ Shortlist'}
                          </button>
                          <button className="btn primary sm" onClick={() => openNegotiate(c)}>Contact →</button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {tab === 'finalists' && (
        <>
          {finalists.length === 0 ? (
            <div className="card pad-lg" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="faint" style={{ fontSize: 13 }}>No finalists yet. Shortlist vendors from Discover to compare them here.</div>
            </div>
          ) : (
            <>
              {compareVendors.length >= 2 && (
                <div className="card pad-lg" style={{ marginBottom: 16, overflowX: 'auto' }}>
                  <div className="section-title">Compare</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--ink-dim)' }}></th>
                        {compareVendors.map((v) => (
                          <th key={v.id} style={{ textAlign: 'left', padding: '6px 10px' }}>{v.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Category', (v) => v.category],
                        ['Price', (v) => fmtMoney(data.negotiations?.[v.id]?.currentQuote || v.priceValue)],
                        ['Rating', (v) => Number(v.rating).toFixed(1) + ' ★'],
                        ['Style', (v) => v.style],
                        ['Status', (v) => chipFor(effStage(v, data)).label],
                      ].map(([label, fn]) => (
                        <tr key={label} style={{ borderTop: '1px solid var(--line-soft)' }}>
                          <td style={{ padding: '6px 10px', color: 'var(--ink-dim)' }}>{label}</td>
                          {compareVendors.map((v) => <td key={v.id} style={{ padding: '6px 10px' }}>{fn(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="vendor-grid">
                {finalists.map((v) => {
                  const stage = effStage(v, data)
                  const chip = chipFor(stage)
                  const n = data.negotiations?.[v.id]
                  const inCompare = compare.includes(v.id)
                  return (
                    <div key={v.id} className="vendor-card">
                      <div className="row between" style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700 }}>{v.name}</div>
                        <span className={`badge ${chip.cls}`} style={{ fontSize: 10 }}>{chip.label}</span>
                      </div>
                      <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>{v.category} · {v.contactName}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
                        {fmtMoney(n?.currentQuote || v.priceValue)}
                        {n?.savings > 0 && <span className="badge ok" style={{ fontSize: 10, marginLeft: 6 }}>saved {fmtMoney(n.savings)}</span>}
                      </div>
                      <div className="row gap-sm wrap">
                        {stage === 'agreed' ? (
                          <button className="btn primary sm" onClick={() => bookVendor(v, n?.currentQuote || v.priceValue, n?.savings || 0)}>Book →</button>
                        ) : (
                          <button className="btn primary sm" onClick={() => setNegoVendor(v)}>
                            {n ? 'Continue negotiation' : 'Contact & negotiate'}
                          </button>
                        )}
                        <button className={`btn sm ${inCompare ? '' : ''}`} onClick={() => setCompare((c) => inCompare ? c.filter((x) => x !== v.id) : (c.length < 3 ? [...c, v.id] : c))}>
                          {inCompare ? '✓ Comparing' : 'Compare'}
                        </button>
                        <button className="icon-btn" onClick={() => removeShortlist(v.id)}>remove</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'booked' && (
        <>
          {booked.length === 0 ? (
            <div className="card pad-lg" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="faint" style={{ fontSize: 13 }}>Nothing booked yet. Negotiate a finalist and lock them in.</div>
            </div>
          ) : (
            <div className="vendor-grid">
              {booked.map((v) => (
                <div key={v.id} className="vendor-card" style={{ borderColor: 'var(--green)' }}>
                  <div className="row between" style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{v.name}</div>
                    <span className="badge ok" style={{ fontSize: 10 }}>✅ Booked</span>
                  </div>
                  <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>{v.category} · {v.contactName}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    {fmtMoney(v.negotiatedPrice || v.priceValue)}
                    {v.savings > 0 && <span className="badge ok" style={{ fontSize: 10, marginLeft: 6 }}>saved {fmtMoney(v.savings)}</span>}
                  </div>
                  <button className="btn sm" onClick={() => setView('contracts')}>Add contract →</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {negoVendor && (
        <Negotiate
          vendor={negoVendor}
          data={data}
          profile={data.profile}
          persist={persist}
          onBooked={(price, savings) => bookVendor(negoVendor, price, savings)}
          onClose={() => setNegoVendor(null)}
        />
      )}
    </div>
  )
}
