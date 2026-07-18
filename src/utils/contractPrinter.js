/**
 * ContractPrinter — formats a ContractAnalysis object into a human-readable
 * structured summary string suitable for display or export.
 *
 * The format is intentionally parseable: each section is prefixed by a
 * known header so that a parser can reconstruct the original object.
 *
 * @param {object} analysis - ContractAnalysis object from state.contractAnalyses[vendorId]
 * @returns {string} Formatted multi-line summary string
 */
export function printContractAnalysis(analysis) {
  if (!analysis || typeof analysis !== 'object') return ''

  const lines = []

  // Header
  lines.push(`VENDOR: ${analysis.vendorName || ''}`)
  lines.push(`CATEGORY: ${analysis.category || ''}`)
  if (analysis.scannedAt) {
    lines.push(`SCANNED: ${analysis.scannedAt}`)
  }
  lines.push('')

  // Payment schedule
  lines.push('PAYMENT SCHEDULE:')
  if (analysis.payments?.length) {
    for (const p of analysis.payments) {
      const due = p.dueDate ? ` (due ${p.dueDate})` : ''
      const amount = p.amount != null ? ` — $${Number(p.amount).toFixed(2)}` : ''
      lines.push(`  - ${p.label}${amount}${due}`)
    }
  } else {
    lines.push('  None found.')
  }
  lines.push('')

  // Hidden fees
  lines.push('HIDDEN FEES:')
  if (analysis.hiddenFees?.length) {
    for (const f of analysis.hiddenFees) {
      const amount = f.amount ? ` — $${Number(f.amount).toFixed(2)}` : ''
      const detail = f.detail ? ` (${f.detail})` : ''
      lines.push(`  - ${f.label}${amount}${detail}`)
    }
  } else {
    lines.push('  None found.')
  }
  lines.push('')

  // Gratuity
  lines.push(`GRATUITY INCLUDED: ${String(analysis.gratuityIncluded ?? 'unclear')}`)
  lines.push('')

  // Cancellation
  lines.push('CANCELLATION POLICY:')
  lines.push(`  ${analysis.cancellation || 'Not specified.'}`)
  lines.push('')

  // Key dates
  lines.push('KEY DATES:')
  if (analysis.keyDates?.length) {
    for (const d of analysis.keyDates) {
      lines.push(`  - ${d.label}: ${d.date}`)
    }
  } else {
    lines.push('  None found.')
  }
  lines.push('')

  // Watch-outs
  lines.push('WATCH-OUTS:')
  if (analysis.watchOuts?.length) {
    for (const w of analysis.watchOuts) {
      lines.push(`  * ${w}`)
    }
  } else {
    lines.push('  None found.')
  }

  return lines.join('\n')
}
