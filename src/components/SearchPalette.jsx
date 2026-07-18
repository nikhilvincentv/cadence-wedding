import React, { useEffect, useRef, useState } from 'react'
import { reindexSearch, searchQuery } from '../api.js'

const TYPE_LABEL = { vendor: 'Vendor', guest: 'Guest', payment: 'Payment', timeline: 'Timeline', task: 'Task', budget: 'Budget' }

export default function SearchPalette({ userId, data, goto, onClose }) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState([])
  const [status, setStatus] = useState('indexing')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    reindexSearch(userId, data).then((r) => setStatus(r.enabled ? 'ready' : 'off'))
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (status !== 'ready') return
    const t = setTimeout(async () => {
      const r = await searchQuery(userId, q)
      setHits(r.hits || [])
    }, 160)
    return () => clearTimeout(t)
  }, [q, status])

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder={status === 'indexing' ? 'Indexing your wedding…' : 'Search vendors, guests, payments, timeline…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="palette-results">
          {status === 'off' && <div className="palette-empty">Search is offline (Typesense not configured).</div>}
          {status === 'ready' && q && hits.length === 0 && <div className="palette-empty">No matches for “{q}”.</div>}
          {status === 'ready' && !q && <div className="palette-empty">Start typing to search everything at once.</div>}
          {hits.map((h) => (
            <div key={h.id} className="palette-row" onClick={() => { goto(h.view || 'home'); onClose() }}>
              <span className="palette-type">{TYPE_LABEL[h.type] || h.type}</span>
              <div className="palette-text">
                <div className="palette-title">{h.title}</div>
                {h.subtitle && <div className="palette-sub">{h.subtitle}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="palette-foot">
          <span>Enter to open · Esc to close</span>
          <span>Powered by Typesense</span>
        </div>
      </div>
    </div>
  )
}
