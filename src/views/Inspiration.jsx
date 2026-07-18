import React, { useEffect, useRef, useState } from 'react'
import { searchInspiration } from '../api.js'

const uid = () => Math.random().toString(36).slice(2, 9)

// Preset categories used to fill an endless Pinterest-style feed — no search box needed.
const CATEGORIES = [
  'wedding venue', 'outdoor wedding ceremony', 'wedding reception decor', 'floral centerpieces',
  'bridal bouquet', 'wedding cake', 'reception lighting', 'wedding dress', 'wedding rings',
  'boho wedding', 'garden wedding venue', 'barn wedding venue', 'beach wedding', 'wedding arch',
  'table settings wedding', 'wedding invitation design',
]

export default function Inspiration({ data, persist }) {
  const board = data.inspirationBoard || []
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const catIndex = useRef(0)
  const seenUrls = useRef(new Set())
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)

  async function loadMore(batchSize = 1) {
    if (loadingRef.current || catIndex.current >= CATEGORIES.length) return
    loadingRef.current = true
    setLoading(true)
    const batch = CATEGORIES.slice(catIndex.current, catIndex.current + batchSize)
    catIndex.current += batch.length
    const responses = await Promise.all(batch.map((category) => searchInspiration(category)))
    if (responses.every((r) => r.error) && feed.length === 0) setError(responses[0].error)
    else {
      const fresh = responses
        .flatMap((r) => r.results || [])
        .filter((img) => !seenUrls.current.has(img.url))
      fresh.forEach((img) => seenUrls.current.add(img.url))
      setFeed((prev) => [...prev, ...fresh])
    }
    setLoading(false)
    loadingRef.current = false
  }

  useEffect(() => {
    loadMore(2)
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore()
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const savedUrls = new Set(board.map((b) => b.url))

  function addImage(img) {
    if (savedUrls.has(img.url)) return
    const saved = { id: uid(), url: img.url, thumb: img.thumb, title: img.title, source: img.source, landingUrl: img.landingUrl, addedAt: Date.now() }
    persist({ ...data, inspirationBoard: [saved, ...board] })
  }

  function removeImage(id) {
    persist({ ...data, inspirationBoard: board.filter((b) => b.id !== id) })
  }

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Inspiration</h1>
          <div className="page-sub">Scroll for wedding inspiration and pin the ones you love to your board.</div>
        </div>
      </div>

      <div className="mt-lg">
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Your board</h2>
          <span className="faint" style={{ fontSize: 12 }}>{board.length} pinned</span>
        </div>
        {board.length === 0 ? (
          <div className="card pad-lg"><span className="muted">Nothing pinned yet — pin images from the feed below.</span></div>
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

      <div className="mt-lg">
        <h2 className="section-title" style={{ margin: '0 0 10px' }}>Explore</h2>

        {error && feed.length === 0 && (
          <div className="card pad-lg mb-sm"><span className="badge high">heads up</span> <span className="muted">{error}</span></div>
        )}

        <div className="inspo-grid">
          {feed.map((img) => {
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

        <div ref={sentinelRef} style={{ height: 1 }} />
        {loading && (
          <div className="row" style={{ justifyContent: 'center', padding: '24px 0' }}>
            <span className="spin" /> <span className="muted">Loading more inspiration...</span>
          </div>
        )}
        {!loading && catIndex.current >= CATEGORIES.length && (
          <div className="row" style={{ justifyContent: 'center', padding: '24px 0' }}>
            <span className="faint" style={{ fontSize: 12 }}>You've reached the end of the feed.</span>
          </div>
        )}
      </div>
    </div>
  )
}
