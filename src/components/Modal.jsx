import React from 'react'

export function Modal({ title, onClose, onSubmit, submitLabel = 'Save', children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button type="button" className="modal-x" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
        >
          <div className="modal-body">{children}</div>
          <div className="modal-actions">
            <button type="button" className="btn ghost sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary sm">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Field({ label, ...props }) {
  return (
    <label className="field-row">
      <span className="field-label">{label}</span>
      <input className="field" {...props} />
    </label>
  )
}

export function SelectField({ label, options, ...props }) {
  return (
    <label className="field-row">
      <span className="field-label">{label}</span>
      <select className="field" {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
