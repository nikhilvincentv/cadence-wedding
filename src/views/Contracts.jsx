import React, { useState } from 'react'
import { extractContract, fmtMoney } from '../api.js'
import { VENDOR_CATEGORIES } from '../journey.js'
import { Modal, Field, SelectField } from '../components/Modal.jsx'

const uid = () => Math.random().toString(36).slice(2, 9)
const CATEGORIES = ['Venue', ...VENDOR_CATEGORIES]

function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
function fmtExecuted(iso) {
  if (!iso) return ''
  return `Executed ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

const emptyTemplate = (wedding) => ({
  category: CATEGORIES[0],
  vendorId: '',
  vendorName: '',
  eventDate: wedding?.date || '',
  price: '',
  deposit: '',
  depositDue: 'On signing',
  balance: '',
  balanceDue: '',
  cancellation: 'Cancellation within 30 days of the event forfeits the deposit.',
  notes: '',
})

function buildTemplateDoc(fields) {
  const price = Number(fields.price) || 0
  const deposit = Number(fields.deposit) || 0
  const balance = Number(fields.balance) || Math.max(0, price - deposit)
  const text = `${(fields.vendorName || 'VENDOR').toUpperCase()} - SERVICE AGREEMENT (DRAFT)
Category: ${fields.category}
Event date: ${fields.eventDate || 'TBD'}

PRICING
Total contract price: ${fmtMoney(price)}

PAYMENT SCHEDULE
- Deposit: ${fmtMoney(deposit)} due ${fields.depositDue || 'on signing'}
- Balance: ${fmtMoney(balance)} due ${fields.balanceDue || 'TBD'}

CANCELLATION POLICY
${fields.cancellation}

NOTES
${fields.notes || 'None.'}

Drafted by AIsle from your vendor details. Review the terms above, then sign to send to ${fields.vendorName || 'the vendor'} for countersignature.`

  return {
    id: uid(),
    name: `${(fields.vendorName || fields.category).replace(/[^a-z0-9]+/gi, '_')}_Agreement.pdf`,
    vendorId: fields.vendorId || '',
    vendorName: fields.vendorName || '',
    category: fields.category,
    sizeLabel: `${(text.length / 1024).toFixed(1)} KB`,
    source: 'ai-drafted',
    status: 'action_required',
    modifiedAt: new Date().toISOString(),
    executedAt: null,
    paymentsAdded: false,
    text,
    analysis: {
      vendorName: fields.vendorName || '',
      category: fields.category,
      payments: [
        { label: 'Deposit', amount: deposit, dueDate: fields.depositDue || 'On signing' },
        { label: 'Balance', amount: balance, dueDate: fields.balanceDue || 'TBD' },
      ],
      hiddenFees: [],
      gratuityIncluded: null,
      cancellation: fields.cancellation,
      keyDates: fields.eventDate ? [{ label: 'Event date', date: fields.eventDate }] : [],
      watchOuts: [],
    },
  }
}

function downloadDoc(doc) {
  const blob = new Blob([doc.text || ''], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = doc.name.replace(/\.pdf$/i, '') + '.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Contracts({ data, persist, live }) {
  const { vendors } = data
  const documents = data.documents || []

  const [expanded, setExpanded] = useState(new Set())
  const [scanningIds, setScanningIds] = useState(new Set())
  const [reviewingAll, setReviewingAll] = useState(false)
  const [search, setSearch] = useState('')

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadVendorId, setUploadVendorId] = useState('')
  const [uploadText, setUploadText] = useState('')
  const [uploadError, setUploadError] = useState('')

  const [templateOpen, setTemplateOpen] = useState(false)
  const [template, setTemplate] = useState(() => emptyTemplate(data.wedding))

  function toggleExpand(id) {
    setExpanded((s) => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function updateDoc(id, updater) {
    persist({ ...data, documents: documents.map((d) => (d.id === id ? updater(d) : d)) })
  }
  function removeDoc(id) {
    persist({ ...data, documents: documents.filter((d) => d.id !== id) })
  }

  async function scanDoc(doc) {
    setScanningIds((s) => new Set(s).add(doc.id))
    try {
      const res = await extractContract(doc.text)
      if (!res.error) {
        updateDoc(doc.id, (d) => ({
          ...d,
          analysis: res,
          vendorName: d.vendorName || res.vendorName || '',
          category: d.category || res.category || '',
        }))
      }
    } catch {
      // leave analysis unset; user can retry from the expanded panel
    } finally {
      setScanningIds((s) => {
        const next = new Set(s)
        next.delete(doc.id)
        return next
      })
    }
  }

  async function reviewAll() {
    const targets = documents.filter((d) => d.status !== 'signed' && !d.analysis)
    if (!targets.length) return
    setReviewingAll(true)
    for (const doc of targets) {
      // eslint-disable-next-line no-await-in-loop
      await scanDoc(doc)
    }
    setReviewingAll(false)
  }

  function signDoc(doc) {
    if (doc.source === 'ai-drafted' && doc.status === 'action_required') {
      updateDoc(doc.id, (d) => ({ ...d, status: 'awaiting_vendor', modifiedAt: new Date().toISOString() }))
    } else {
      updateDoc(doc.id, (d) => ({ ...d, status: 'signed', executedAt: new Date().toISOString() }))
    }
    setExpanded((s) => new Set(s).add(doc.id))
  }
  function markVendorSigned(doc) {
    updateDoc(doc.id, (d) => ({ ...d, status: 'signed', executedAt: new Date().toISOString() }))
  }
  function remindVendor(doc) {
    updateDoc(doc.id, (d) => ({ ...d, lastRemindedAt: new Date().toISOString() }))
  }
  function addPayments(doc) {
    if (!doc.analysis?.payments?.length || doc.paymentsAdded) return
    const pays = doc.analysis.payments.map((p) => ({
      id: uid(),
      vendorId: doc.vendorId || '',
      label: p.label,
      amount: Number(p.amount) || 0,
      dueDate: p.dueDate?.match(/^\d{4}-\d{2}-\d{2}$/) ? p.dueDate : '',
      status: 'due',
      source: `${doc.vendorName || doc.name} (contract)`,
    }))
    persist({
      ...data,
      payments: [...data.payments, ...pays],
      documents: documents.map((d) => (d.id === doc.id ? { ...d, paymentsAdded: true } : d)),
    })
  }

  function openUpload() {
    setUploadName('')
    setUploadVendorId('')
    setUploadText('')
    setUploadError('')
    setUploadOpen(true)
  }
  function submitUpload() {
    if (uploadText.trim().length < 50) {
      setUploadError('Paste at least 50 characters of contract text.')
      return
    }
    const vendor = vendors.find((v) => v.id === uploadVendorId)
    const doc = {
      id: uid(),
      name: uploadName.trim() || 'Uploaded_Contract.pdf',
      vendorId: uploadVendorId || '',
      vendorName: vendor?.name || '',
      category: vendor?.category || '',
      sizeLabel: `${(uploadText.length / 1024).toFixed(1)} KB`,
      source: 'uploaded',
      status: 'action_required',
      modifiedAt: new Date().toISOString(),
      executedAt: null,
      paymentsAdded: false,
      text: uploadText,
      analysis: null,
    }
    persist({ ...data, documents: [doc, ...documents] })
    setUploadOpen(false)
    scanDoc(doc)
  }

  function openTemplate() {
    setTemplate(emptyTemplate(data.wedding))
    setTemplateOpen(true)
  }
  function submitTemplate() {
    const doc = buildTemplateDoc(template)
    persist({ ...data, documents: [doc, ...documents] })
    setTemplateOpen(false)
  }
  const setT = (k, v) => setTemplate((t) => ({ ...t, [k]: v }))
  const templateVendors = vendors.filter((v) => v.category === template.category)

  const statusRank = { action_required: 0, awaiting_vendor: 1 }
  const pendingDocs = documents
    .filter((d) => d.status !== 'signed')
    .sort((a, b) => (statusRank[a.status] ?? 2) - (statusRank[b.status] ?? 2) || new Date(b.modifiedAt) - new Date(a.modifiedAt))
  const completeDocs = documents
    .filter((d) => d.status === 'signed')
    .filter((d) => !search.trim() || d.name.toLowerCase().includes(search.trim().toLowerCase()) || (d.vendorName || '').toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b.executedAt || 0) - new Date(a.executedAt || 0))
  const totalSigned = documents.filter((d) => d.status === 'signed').length

  return (
    <div className="fade-in">
      <div className="topbar">
        <div>
          <h1 className="page">Contracts &amp; Paperwork</h1>
          <div className="page-sub">Finalize your arrangements with curated vendor agreements. AIsle's drafting assistant keeps every payment and deadline captured in the fine print.</div>
        </div>
      </div>

      <div className="card pad-lg">
        <div className="row between mb-sm" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="row gap-sm">
            <h2 className="section-title" style={{ margin: 0 }}>Pending Paperwork</h2>
            {pendingDocs.length > 0 && <span className="badge high">{pendingDocs.length} action item{pendingDocs.length === 1 ? '' : 's'}</span>}
          </div>
          <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
            <button className="btn sm" onClick={openTemplate}>+ New from template</button>
            <button className="btn sm" onClick={openUpload}>Upload new</button>
            <button className="btn sm primary" onClick={reviewAll} disabled={reviewingAll || !pendingDocs.some((d) => !d.analysis)}>
              {reviewingAll ? <><span className="spin" /> Reviewing...</> : 'AI review all'}
            </button>
          </div>
        </div>

        {pendingDocs.length === 0 && (
          <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>All caught up - no pending paperwork.</div>
        )}

        <div className="doc-list">
          {pendingDocs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              pending
              isOpen={expanded.has(doc.id)}
              isScanning={scanningIds.has(doc.id)}
              onToggle={() => toggleExpand(doc.id)}
              onSign={() => signDoc(doc)}
              onRemind={() => remindVendor(doc)}
              onMarkVendorSigned={() => markVendorSigned(doc)}
              onDownload={() => downloadDoc(doc)}
              onDelete={() => removeDoc(doc.id)}
              onRescan={() => scanDoc(doc)}
              onAddPayments={() => addPayments(doc)}
            />
          ))}
        </div>
      </div>

      <div className="card pad-lg mt">
        <div className="row between mb-sm" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Complete Paperwork</h2>
          <div className="row gap-sm">
            <input className="field" style={{ width: 200 }} placeholder="Search archive..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <span className="faint" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{totalSigned} total document{totalSigned === 1 ? '' : 's'}</span>
          </div>
        </div>

        {completeDocs.length === 0 && (
          <div className="faint" style={{ fontSize: 13, padding: '10px 0' }}>{search.trim() ? 'No documents match your search.' : 'Signed paperwork will show up here.'}</div>
        )}

        <div className="doc-list">
          {completeDocs.map((doc) => (
            <DocRow
              key={doc.id}
              doc={doc}
              isOpen={expanded.has(doc.id)}
              isScanning={scanningIds.has(doc.id)}
              onToggle={() => toggleExpand(doc.id)}
              onDownload={() => downloadDoc(doc)}
              onRescan={() => scanDoc(doc)}
              onAddPayments={() => addPayments(doc)}
            />
          ))}
        </div>
      </div>

      {uploadOpen && (
        <Modal title="Upload paperwork" onClose={() => setUploadOpen(false)} onSubmit={submitUpload} submitLabel="Add & scan">
          <Field label="Document name" placeholder="e.g. Catering_Agreement.pdf" value={uploadName} onChange={(e) => setUploadName(e.target.value)} />
          <SelectField label="Vendor (optional)" options={[{ value: '', label: '— none —' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]} value={uploadVendorId} onChange={(e) => setUploadVendorId(e.target.value)} />
          <label className="field-row">
            <span className="field-label">Contract text</span>
            <textarea className="field" rows={8} placeholder="Paste the contract or agreement text here" value={uploadText} onChange={(e) => { setUploadText(e.target.value); if (uploadError) setUploadError('') }} style={{ fontFamily: 'var(--mono)', fontSize: 12 }} />
          </label>
          {uploadError && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: -6, marginBottom: 10 }}>{uploadError}</div>}
          <div className="faint" style={{ fontSize: 12 }}>AIsle scans it for payments, hidden fees, and key dates as soon as it's added.</div>
        </Modal>
      )}

      {templateOpen && (
        <Modal title="New from template" onClose={() => setTemplateOpen(false)} onSubmit={submitTemplate} submitLabel="Draft document">
          <SelectField label="Category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={template.category} onChange={(e) => { setT('category', e.target.value); setT('vendorId', '') }} />
          <SelectField
            label="Vendor"
            options={[{ value: '', label: '— type a name below —' }, ...templateVendors.map((v) => ({ value: v.id, label: v.name }))]}
            value={template.vendorId}
            onChange={(e) => {
              const v = vendors.find((x) => x.id === e.target.value)
              setT('vendorId', e.target.value)
              if (v) setT('vendorName', v.name)
            }}
          />
          <Field label="Vendor name" placeholder="e.g. Table & Vine Catering" value={template.vendorName} onChange={(e) => setT('vendorName', e.target.value)} />
          <Field label="Event date" type="date" value={template.eventDate} onChange={(e) => setT('eventDate', e.target.value)} />
          <Field label="Total contract price ($)" type="number" value={template.price} onChange={(e) => setT('price', e.target.value)} />
          <div className="row gap-sm">
            <Field label="Deposit ($)" type="number" value={template.deposit} onChange={(e) => setT('deposit', e.target.value)} />
            <Field label="Deposit due" placeholder="On signing" value={template.depositDue} onChange={(e) => setT('depositDue', e.target.value)} />
          </div>
          <div className="row gap-sm">
            <Field label="Balance ($, optional)" type="number" placeholder="Auto: price - deposit" value={template.balance} onChange={(e) => setT('balance', e.target.value)} />
            <Field label="Balance due" placeholder="e.g. 14 days before event" value={template.balanceDue} onChange={(e) => setT('balanceDue', e.target.value)} />
          </div>
          <label className="field-row">
            <span className="field-label">Cancellation policy</span>
            <textarea className="field" rows={2} value={template.cancellation} onChange={(e) => setT('cancellation', e.target.value)} />
          </label>
          <label className="field-row">
            <span className="field-label">Notes (optional)</span>
            <textarea className="field" rows={2} value={template.notes} onChange={(e) => setT('notes', e.target.value)} />
          </label>
          <div className="faint" style={{ fontSize: 12 }}>AIsle drafts the agreement from these fields. You'll review and sign it, then send it on for the vendor's countersignature.</div>
        </Modal>
      )}
    </div>
  )
}

function DocRow({ doc, pending, isOpen, isScanning, onToggle, onSign, onRemind, onMarkVendorSigned, onDownload, onDelete, onRescan, onAddPayments }) {
  const a = doc.analysis
  return (
    <div className="doc-row-wrap">
      <div className="doc-row" onClick={onToggle}>
        <div className="doc-icon">▤</div>
        <div className="doc-info">
          <div className="doc-name">
            {doc.name}
            {doc.source === 'ai-drafted' && <span className="badge ai" style={{ marginLeft: 8 }}>AI drafted</span>}
            {doc.status === 'awaiting_vendor' && <span className="badge ghost" style={{ marginLeft: 8 }}>Awaiting signature</span>}
            {isScanning && <span className="badge ghost" style={{ marginLeft: 8 }}><span className="spin" /> scanning</span>}
          </div>
          <div className="doc-meta">
            {doc.vendorName && <span>{doc.vendorName}</span>}
            <span>{doc.sizeLabel}</span>
            <span>{doc.status === 'signed' ? fmtExecuted(doc.executedAt) : `Modified ${timeAgo(doc.modifiedAt)}`}</span>
          </div>
        </div>
        <div className="doc-actions" onClick={(e) => e.stopPropagation()}>
          {doc.status === 'signed' && <span className="badge ok">Signed</span>}
          {doc.status === 'action_required' && <span className="doc-flag high">Action required</span>}
          {doc.status === 'awaiting_vendor' && <span className="doc-flag muted">Pending vendor</span>}

          {doc.status === 'action_required' && <button className="btn sm primary" onClick={onToggle}>View &amp; sign</button>}
          {doc.status === 'awaiting_vendor' && <button className="btn sm ghost" onClick={onRemind}>Remind vendor</button>}
          {doc.status === 'signed' && <button className="btn sm ghost" onClick={onToggle}>View</button>}
          {pending && (
            <button className="icon-btn" onClick={onDownload} title="Download" aria-label="Download">⬇</button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="doc-expand fade-in">
          {!a && !isScanning && (
            <div className="row between">
              <span className="faint" style={{ fontSize: 13 }}>No AI review yet for this document.</span>
              <button className="btn ghost sm" onClick={onRescan}>Scan with AI</button>
            </div>
          )}
          {isScanning && <div className="muted" style={{ fontSize: 13 }}>Reading the agreement...</div>}

          {a && (
            <div className="extract-grid">
              <div>
                <div className="faint" style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Payments</div>
                {(a.payments || []).length === 0 && <div className="faint" style={{ fontSize: 13 }}>None found.</div>}
                {(a.payments || []).map((p, i) => (
                  <div className="kv" key={i}>
                    <span className="k">{p.label}<br /><span className="faint" style={{ fontSize: 11.5 }}>{p.dueDate}</span></span>
                    <span className="v mono">{fmtMoney(p.amount)}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="faint" style={{ fontSize: 11.5, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Fees &amp; terms</div>
                {(a.hiddenFees || []).map((f, i) => (
                  <div className="kv" key={i}>
                    <span className="k">{f.label}<br /><span className="faint" style={{ fontSize: 11.5 }}>{f.detail}</span></span>
                    <span className="v mono">{f.amount ? fmtMoney(f.amount) : '-'}</span>
                  </div>
                ))}
                <div className="kv">
                  <span className="k">Cancellation</span>
                  <span className="v" style={{ fontSize: 12, maxWidth: 190 }}>{a.cancellation}</span>
                </div>
              </div>
            </div>
          )}

          {a?.watchOuts?.length > 0 && (
            <>
              <div className="divider" />
              {a.watchOuts.map((w, i) => (<div className="watchout" key={i}><span style={{ color: 'var(--amber)' }}>&bull;</span> {w}</div>))}
            </>
          )}

          <div className="divider" />
          <details>
            <summary className="faint" style={{ fontSize: 12, cursor: 'pointer' }}>View full document text</summary>
            <pre className="doc-text mono">{doc.text}</pre>
          </details>

          <div className="row between mt-sm" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div className="row gap-sm" style={{ flexWrap: 'wrap' }}>
              {a?.payments?.length > 0 && (
                <button className="btn ghost sm" onClick={onAddPayments} disabled={doc.paymentsAdded}>{doc.paymentsAdded ? 'Payments saved ✓' : '+ Save payments to plan'}</button>
              )}
              <button className="btn ghost sm" onClick={onDownload}>Download</button>
              {pending && <button className="icon-btn" onClick={onDelete}>Delete</button>}
            </div>
            <div className="row gap-sm">
              {doc.status === 'action_required' && <button className="btn sm primary" onClick={onSign}>Sign document</button>}
              {doc.status === 'awaiting_vendor' && <button className="btn sm primary" onClick={onMarkVendorSigned}>Mark vendor signed</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
