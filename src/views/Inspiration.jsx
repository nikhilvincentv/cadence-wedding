import React, { useState } from 'react'
import { searchInspiration } from '../api.js'

const uid = () => Math.random().toString(36).slice(2, 9)

export default function Inspiration({ data, persist }) {
  const board = data.inspirationBoard || []
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function search(q) {
    const term = (q ?? query).trim()
    if (!term) return
    setQuery(term)
    setLoading(true)
    setError('')
    setSearched(true)
    const r = await searchInspiration(term)
    if (r.error) setError(r.error)
    else setResults(r.results || [])
    setLoading(false)
  }

  const savedUrls = new Set(board.map((b) => b.url))

  function addImage(img) {
    if (savedUrls.has(img.url)) return
    const saved = { id: uid(), url: img.url, thumb: img.thumb, title: img.title, source: img.source, landingUrl: img.landingUrl, query, addedAt: Date.now() }
    persist({ ...data, inspirationBoard: [saved, ...board] })
  }

  function removeImage(id) {
    persist({ ...data, inspirationBoard: board.filter((b) => b.id !== id) })
  }

  const suggestions = ['boho wedding decor', 'floral centerpieces', 'wedding cake', 'reception lighting', 'bridal bouquet', 'wedding arch']

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Inspiration</h1>
          <div className="page-sub">Search openly-licensed photos and pin the ones you love to your board.</div>
        </div>
      </div>

      <div className="card pad-lg mb-sm">
        <form
          className="row gap-sm"
          onSubmit={(e) => {
            e.preventDefault()
            search()
          }}
        >
          <input
            className="field"
            style={{ resize: 'none' }}
            placeholder="Search for florals, venues, dresses, cakes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn primary" type="submit" disabled={loading || !query.trim()}>
            {loading ? <><span className="spin" /> Searching...</> : 'Search'}
          </button>
        </form>
        <div className="scenario-chips" style={{ marginTop: 12 }}>
          {suggestions.map((s) => (
            <span key={s} className="chip" onClick={() => search(s)}>{s}</span>
          ))}
        </div>
      </div>

      {error && <div className="card pad-lg mb-sm"><span className="badge high">heads up</span> <span className="muted">{error}</span></div>}

      {searched && !loading && !error && (
        <div className="mb-sm">
          <div className="row between" style={{ marginBottom: 10 }}>
            <h2 className="section-title" style={{ margin: 0 }}>Results</h2>
            {results.length === 0 && <span className="faint" style={{ fontSize: 12 }}>No images found — try another search.</span>}
          </div>
          <div className="inspo-grid">
            {results.map((img) => {
              const added = savedUrls.has(img.url)
              return (
                <div className="inspo-card" key={img.id}>
                  <img src={img.thumb} alt={img.title} loading="lazy" />
                  <div className="inspo-overlay">
                    <span className="inspo-title">{img.title}</span>
                    <button className="btn sm primary" onClick={() => addImage(img)} disabled={added}>
                      {added ? 'Pinned' : '+ Pin'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-lg">
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Your board</h2>
          <span className="faint" style={{ fontSize: 12 }}>{board.length} pinned</span>
        </div>
        {board.length === 0 ? (
          <div className="card pad-lg"><span className="muted">Nothing pinned yet — search above and pin images for inspiration.</span></div>
        ) : (
          <div className="inspo-grid">
            {board.map((img) => (
              <div className="inspo-card" key={img.id}>
                <img src={img.thumb} alt={img.title} loading="lazy" />
                <div className="inspo-overlay">
                  <span className="inspo-title">{img.title}</span>
                  <button className="btn sm" onClick={() => removeImage(img.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
