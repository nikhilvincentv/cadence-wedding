import React from 'react';

export default function MutationBlock({ proposal, onApprove, onReject }) {
  const changes = proposal.changes || [];

  return (
    <div className="mutation-block">
      <p className="mutation-summary">{proposal.summary}</p>

      {changes.length > 0 && (
        <ul className="mutation-changes">
          {changes.map((change, index) => {
            // Support both string changes and object changes { field, recordId, from, to }
            if (typeof change === 'string') {
              return <li key={index}>{change}</li>;
            }
            return (
              <li key={index}>
                <span className="mutation-field">{change.field}</span>
                {change.recordId && <span className="mutation-record"> ({change.recordId})</span>}
                {change.from !== undefined && (
                  <span className="mutation-diff">
                    {' '}<span className="mutation-from">{JSON.stringify(change.from)}</span>
                    {' → '}
                    <span className="mutation-to">{JSON.stringify(change.to)}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="row gap-sm" style={{ marginTop: '8px' }}>
        <button className="btn primary sm" onClick={onApprove}>Approve</button>
        <button className="btn sm" onClick={onReject}>Reject</button>
      </div>
    </div>
  );
}
