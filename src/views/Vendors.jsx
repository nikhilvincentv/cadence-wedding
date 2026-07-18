import React, { useState } from 'react'
import VendorProfile from '../components/VendorProfile.jsx'

// ── Helpers ─────────────────────────────────────────────────────────────────

function StarRating({ rating }) {
  const n = Math.round(Number(rating) || 0)
  return (
    <span className="vendor-rating" aria-label={`Rating: ${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? 'var(--gold)' : 'var(--ink-faint)', fontSize: 14 }}>
          ★
        </span>
      ))}
    </span>
  )
}

function PaidProgressBar({ vendorId, payments }) {
  const vendorPayments = (payments || []).filter((p) => p.vendorId === vendorId)
  const total = vendorPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const paid = vendorPayments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0

  return (
    <div>
      <div className="row between" style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 3 }}>
        <span>Paid</span>
        <span>{pct}%</span>
      </div>
      <div className="bar vendor-progress-bar">
        <i style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))' }} />
      </div>
    </div>
  )
}

function nextPaymentDue(vendorId, payments) {
  const unpaid = (payments || [])
    .filter((p) => p.vendorId === vendorId && p.status !== 'paid' && p.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
  if (!unpaid.length) return null
  return unpaid[0]
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusBadge(status) {
  if (status === 'booked') return 'badge ok'
  if (status === 'active') return 'badge info'
  if (status === 'contract-out') return 'badge warn'
  return 'badge ghost'
}

function statusLabel(status) {
  if (status === 'contract-out') return 'Contract out'
  if (!status) return 'Unknown'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// ── Vendor Card ──────────────────────────────────────────────────────────────

function VendorCard({ vendor, payments, onClick }) {
  const next = nextPaymentDue(vendor.id, payments)

  return (
    <div
      className="vendor-card vendor-card-clickable"
      onClick={() => onClick(vendor)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(vendor)}
      aria-label={`Open profile for ${vendor.name}`}
    >
      {/* Name + status */}
      <div className="row between" style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {vendor.name || <span className="faint">Unnamed</span>}
        </div>
        <span className={statusBadge(vendor.status)} style={{ fontSize: 10, marginLeft: 6, flexShrink: 0 }}>
          {statusLabel(vendor.status)}
        </span>
      </div>

      {/* Category */}
      <div className="faint" style={{ fontSize: 12, marginBottom: 8 }}>
        {vendor.category || 'Uncategorized'}
        {vendor.contact ? ` · ${vendor.contact}` : ''}
      </div>

      {/* Star rating */}
      {vendor.rating != null && vendor.rating !== '' && (
        <div style={{ marginBottom: 8 }}>
          <StarRating rating={vendor.rating} />
        </div>
      )}

      {/* Paid-vs-total progress bar */}
      <div style={{ marginBottom: 8 }}>
        <PaidProgressBar vendorId={vendor.id} payments={payments} />
      </div>

      {/* Next payment due */}
      <div style={{ fontSize: 11.5, color: 'var(--ink-dim)' }}>
        {next ? (
          <>
            <span style={{ color: 'var(--amber)' }}>Next due: </span>
            {fmtDate(next.dueDate)}
            {next.label ? ` · ${next.label}` : ''}
          </>
        ) : (
          <span className="faint">No upcoming payments</span>
        )}
      </div>
    </div>
  )
}

// ── Vendors View ─────────────────────────────────────────────────────────────

export default function Vendors({ data, persist, setView }) {
  const vendors = data.vendors || []
  const payments = data.payments || []
  const [selectedVendor, setSelectedVendor] = useState(null)

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="topbar">
        <div>
          <h1 className="page">Your vendors</h1>
          <div className="page-sub">
            Click any vendor card to open their full profile with contract, emails, timeline, and tasks.
          </div>
        </div>
        <span className="badge ghost" style={{ fontSize: 12 }}>
          {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty state */}
      {vendors.length === 0 && (
        <div className="card pad-lg" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
          <div className="faint" style={{ fontSize: 14, marginBottom: 16 }}>
            No vendors yet. Add them from the Dashboard to start tracking.
          </div>
          <button className="btn sm" onClick={() => setView('home')}>
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Vendor grid */}
      {vendors.length > 0 && (
        <div className="vendor-grid">
          {vendors.map((v) => (
            <VendorCard
              key={v.id}
              vendor={v}
              payments={payments}
              onClick={setSelectedVendor}
            />
          ))}
        </div>
      )}

      {/* VendorProfile slide-over panel */}
      {selectedVendor && (
        <VendorProfile
          vendor={selectedVendor}
          data={data}
          persist={persist}
          setView={setView}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  )
}
