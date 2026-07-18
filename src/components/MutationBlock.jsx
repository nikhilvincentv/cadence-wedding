import React from 'react';

export default function MutationBlock({ proposal, onApprove, onReject }) {
  return (
    <div className="mutation-block">
      <h3>Proposal Summary</h3>
      <p>{proposal.summary}</p>

      <h4>Changes:</h4>
      <ul>
        {proposal.changes.map((change, index) => (
          <li key={index}>{change}</li>
        ))}
      </ul>

      <div className="row gap-sm">
        <button className="btn primary sm" onClick={onApprove}>Approve</button>
        <button className="btn sm" onClick={onReject}>Reject</button>
      </div>
    </div>
  );
}
