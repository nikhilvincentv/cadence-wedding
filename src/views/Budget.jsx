import React, { useState } from 'react'

const uid = () => Math.random().toString(36).slice(2, 9)

function fmtCurrency(n) {
  const num = Number(n) || 0
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtOverage(n) {
  const num = Number(n) || 0
  return '$' + Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function Budget({ data, persist }) {
  const budgetCategories = data.budgetCategories || []
  const budgetTotal = data.wedding?.budgetTotal || 0

  // editing: { rowId, field } | null
  const [editing, setEditing] = useState(null)
  // editVal: the current text in the edit input
  const [editVal, setEditVal] = useState('')

  // ── Derived totals ────────────────────────────────────────────
  const totalSpent = budgetCategories.reduce((sum, c) => sum + (Number(c.actual) || 0), 0)
  const totalProjected = budgetCategories.reduce((sum, c) => sum + (Number(c.projected) || 0), 0)
  const totalRemaining = budgetTotal - totalSpent

  // ── Over-budget categories ────────────────────────────────────
  const overBudgetCategories = budgetCategories.filter(
    (c) => (Number(c.actual) || 0) > (Number(c.projected) || 0)
  )
  const projectedExceedsBudget = totalProjected > budgetTotal && budgetTotal > 0
  const projectedOverage = totalProjected - budgetTotal

  // ── Editing helpers ───────────────────────────────────────────
  function startEdit(rowId, field, currentValue) {
    setEditing({ rowId, field })
    setEditVal(String(currentValue ?? ''))
  }

  function commitEdit() {
    if (!editing) return
    const { rowId, field } = editing
    const updated = budgetCategories.map((c) => {
      if (c.id !== rowId) return c
      let parsed = editVal
      if (field === 'projected' || field === 'actual') {
        parsed = parseFloat(editVal.replace(/[^0-9.]/g, '')) || 0
      }
      return { ...c, [field]: parsed }
    })
    persist({ ...data, budgetCategories: updated })
    setEditing(null)
    setEditVal('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      setEditing(null)
      setEditVal('')
    }
  }

  // ── Add new row ───────────────────────────────────────────────
  function addCategory() {
    const newCat = {
      id: uid(),
      name: 'New Category',
      projected: 0,
      actual: 0,
      dueDate: '',
      invoiceRef: '',
      vendorId: '',
    }
    const updated = [...budgetCategories, newCat]
    persist({ ...data, budgetCategories: updated })
    // Auto-focus the name cell after adding
    setTimeout(() => startEdit(newCat.id, 'name', newCat.name), 50)
  }

  // ── Invoice update ────────────────────────────────────────────
  function updateInvoiceRef(rowId, value) {
    const updated = budgetCategories.map((c) =>
      c.id === rowId ? { ...c, invoiceRef: value } : c
    )
    persist({ ...data, budgetCategories: updated })
  }

  // ── Delete row ────────────────────────────────────────────────
  function deleteCategory(id) {
    const updated = budgetCategories.filter((c) => c.id !== id)
    persist({ ...data, budgetCategories: updated })
  }

  return (
    <div className="fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="topbar">
        <div>
          <h1 className="page">Where your money goes</h1>
          <div className="page-sub">
            Track projected vs. actual spend per category. Catch overruns before they surprise you.
          </div>
        </div>
        <button className="btn primary sm" onClick={addCategory}>+ Add category</button>
      </div>

      {/* ── Summary metric cards ────────────────────────────────── */}
      <div className="grid cols-3" style={{ marginBottom: 24 }}>
        <div className="card stat">
          <span className="label">Total Budget</span>
          <span className="value" style={{ fontFamily: 'var(--serif)', fontSize: 28 }}>
            {fmtCurrency(budgetTotal)}
          </span>
          <span className="foot">Wedding budget target</span>
        </div>
        <div className="card stat">
          <span className="label">Amount Spent</span>
          <span
            className="value"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 28,
              color: totalSpent > budgetTotal ? 'var(--red)' : 'inherit',
            }}
          >
            {fmtCurrency(totalSpent)}
          </span>
          <span className="foot">
            {budgetTotal > 0
              ? `${Math.round((totalSpent / budgetTotal) * 100)}% of budget used`
              : 'Sum of all actuals'}
          </span>
          {budgetTotal > 0 && (
            <div className="bar" style={{ marginTop: 6 }}>
              <i
                style={{
                  width: `${Math.min(100, Math.round((totalSpent / budgetTotal) * 100))}%`,
                  background:
                    totalSpent > budgetTotal
                      ? 'var(--red)'
                      : 'linear-gradient(90deg, var(--rose), var(--gold))',
                }}
              />
            </div>
          )}
        </div>
        <div className="card stat">
          <span className="label">Amount Remaining</span>
          <span
            className="value"
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 28,
              color: totalRemaining < 0 ? 'var(--red)' : 'var(--green)',
            }}
          >
            {fmtCurrency(totalRemaining)}
          </span>
          <span className="foot">
            {totalRemaining < 0 ? 'Over budget!' : 'Still available'}
          </span>
        </div>
      </div>

      {/* ── Over-budget alert banner ─────────────────────────────── */}
      {overBudgetCategories.length > 0 && (
        <div
          className="budget-over-banner"
          style={{
            background: 'rgba(239,143,143,0.10)',
            border: '1px solid rgba(239,143,143,0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '13px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)', marginBottom: 3 }}>
              Over-budget {overBudgetCategories.length === 1 ? 'category' : 'categories'} detected
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
              {overBudgetCategories.map((c) => c.name).join(', ')} —{' '}
              actual spend exceeds projected for {overBudgetCategories.length === 1 ? 'this category' : 'these categories'}.
            </div>
          </div>
        </div>
      )}

      {/* ── Total-projected-exceeds-budget warning ──────────────── */}
      {projectedExceedsBudget && (
        <div
          className="budget-projected-banner"
          style={{
            background: 'rgba(240,179,107,0.10)',
            border: '1px solid rgba(240,179,107,0.35)',
            borderRadius: 'var(--radius-sm)',
            padding: '13px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--amber)', marginBottom: 3 }}>
              Projected spend exceeds total budget by {fmtOverage(projectedOverage)}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
              Your projected total of {fmtCurrency(totalProjected)} is over your budget of{' '}
              {fmtCurrency(budgetTotal)}. Consider adjusting projected costs.
            </div>
          </div>
        </div>
      )}

      {/* ── Budget table ─────────────────────────────────────────── */}
      <div className="card pad-lg">
        <div className="row between mb-sm">
          <h2 className="section-title" style={{ margin: 0 }}>Budget breakdown</h2>
          <button className="btn sm" onClick={addCategory}>+ Add category</button>
        </div>

        {budgetCategories.length === 0 ? (
          <div className="faint" style={{ fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            No categories yet. Add your first budget category to start tracking.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="budget-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', minWidth: 160 }}>Category</th>
                  <th style={{ textAlign: 'right', minWidth: 110 }}>Projected</th>
                  <th style={{ textAlign: 'right', minWidth: 110 }}>Actual</th>
                  <th style={{ textAlign: 'left', minWidth: 120 }}>Due Date</th>
                  <th style={{ textAlign: 'left', minWidth: 160 }}>Invoice</th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {budgetCategories.map((cat) => {
                  const isOver = (Number(cat.actual) || 0) > (Number(cat.projected) || 0)
                  return (
                    <tr key={cat.id} className={`budget-row${isOver ? ' over-budget-row' : ''}`}>
                      {/* Category name */}
                      <td>
                        {editing?.rowId === cat.id && editing?.field === 'name' ? (
                          <input
                            className="budget-cell-edit"
                            value={editVal}
                            autoFocus
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <span
                            className="budget-cell-display"
                            onClick={() => startEdit(cat.id, 'name', cat.name)}
                            title="Click to edit"
                          >
                            {cat.name || <span className="faint">Unnamed</span>}
                            {isOver && (
                              <span
                                className="badge high"
                                style={{ fontSize: 10, marginLeft: 8, verticalAlign: 'middle' }}
                              >
                                over
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Projected */}
                      <td style={{ textAlign: 'right' }}>
                        {editing?.rowId === cat.id && editing?.field === 'projected' ? (
                          <input
                            className="budget-cell-edit"
                            style={{ textAlign: 'right' }}
                            value={editVal}
                            autoFocus
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <span
                            className="budget-cell-display mono"
                            onClick={() => startEdit(cat.id, 'projected', cat.projected)}
                            title="Click to edit"
                          >
                            {fmtCurrency(cat.projected)}
                          </span>
                        )}
                      </td>

                      {/* Actual */}
                      <td style={{ textAlign: 'right' }}>
                        {editing?.rowId === cat.id && editing?.field === 'actual' ? (
                          <input
                            className="budget-cell-edit"
                            style={{ textAlign: 'right' }}
                            value={editVal}
                            autoFocus
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <span
                            className="budget-cell-display mono"
                            style={{ color: isOver ? 'var(--red)' : 'inherit' }}
                            onClick={() => startEdit(cat.id, 'actual', cat.actual)}
                            title="Click to edit"
                          >
                            {fmtCurrency(cat.actual)}
                          </span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td>
                        {editing?.rowId === cat.id && editing?.field === 'dueDate' ? (
                          <input
                            type="date"
                            className="budget-cell-edit"
                            value={editVal}
                            autoFocus
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <span
                            className="budget-cell-display"
                            onClick={() => startEdit(cat.id, 'dueDate', cat.dueDate || '')}
                            title="Click to edit"
                          >
                            {cat.dueDate ? (
                              <span className="mono" style={{ fontSize: 12 }}>{cat.dueDate}</span>
                            ) : (
                              <span className="faint" style={{ fontSize: 12 }}>—</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Invoice */}
                      <td>
                        <input
                          type="text"
                          className="budget-invoice-input"
                          placeholder="filename or URL"
                          value={cat.invoiceRef || ''}
                          onChange={(e) => updateInvoiceRef(cat.id, e.target.value)}
                          title="Invoice file reference"
                        />
                      </td>

                      {/* Delete */}
                      <td>
                        <button
                          className="icon-btn"
                          onClick={() => deleteCategory(cat.id)}
                          title="Remove category"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="budget-totals-row">
                  <td style={{ fontWeight: 600, fontSize: 13 }}>Totals</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    <span className="mono">{fmtCurrency(totalProjected)}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    <span
                      className="mono"
                      style={{ color: totalSpent > budgetTotal ? 'var(--red)' : 'inherit' }}
                    >
                      {fmtCurrency(totalSpent)}
                    </span>
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
