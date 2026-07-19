import React, { useState } from 'react';
import MutationBlock from '../components/MutationBlock'; // Import MutationBlock
import SkeletonLoader from '../components/SkeletonLoader'; // Import SkeletonLoader

export default function AICoordinator({ data, persist }) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [pendingProposal, setPendingProposal] = useState({
    summary: 'Adjust flower budget',
    changes: ['Increase flower budget from $2000 to $2500'],
    rawPatch: {
      target: 'wedding', // Assuming a direct property of wedding object
      field: 'budgetFlowers', // Example field
      value: 2500 // New value
    }
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiError, setAiError] = useState(null); // New state for AI errors

  const handleApprove = () => {
    if (!pendingProposal) return;

    const { target, field, value } = pendingProposal.rawPatch;
    let newData = { ...data };

    if (target === 'wedding') {
      newData.wedding = { ...newData.wedding, [field]: value };
    } else if (target === 'budgetCategories') {
      // This would be more complex, needing to find and update a specific category
      // For now, let's keep it simple and assume wedding target.
      // If categories were an array of objects with a 'name' field:
      // newData.budgetCategories = newData.budgetCategories.map(cat =>
      //   cat.name === field ? { ...cat, amount: value } : cat
      // );
    }
    // Call persist to save the new state
    persist(newData);
    setPendingProposal(null); // Clear the proposal after approval
  };

  const handleReject = () => {
    setPendingProposal(null); // Clear the proposal on reject
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '' || isLoading) return;
    setIsLoading(true);
    setAiError(null); // Clear previous errors

    // Simulate API call or processing with a random error
    setTimeout(() => {
      const isError = Math.random() > 0.7; // 30% chance of error
      if (isError) {
        setAiError('Failed to get a response from AI. Please try again.');
      } else {
        console.log('Sending message:', inputText);
        // In a real scenario, this would trigger AI response and possibly a new proposal
      }
      setInputText('');
      setIsLoading(false);
      // Clear error after some time if it occurred
      if (isError) {
        setTimeout(() => setAiError(null), 5000); // Clear error after 5 seconds
      }
    }, 1500);
  };

  return (
    <div className="ai-coordinator-view">
      <div className="split-pane left-pane">
        <div className="row between mb-sm">
          <h2 className="section-title" style={{ margin: 0 }}>Context Viewer</h2>
          <div className="row gap-sm">
            <button
              className={`btn sm ${activeTab === 'timeline' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button
              className={`btn sm ${activeTab === 'budget' ? 'primary' : 'ghost'}`}
              onClick={() => setActiveTab('budget')}
            >
              Budget
            </button>
          </div>
        </div>
        {activeTab === 'timeline' && (
          <div>
            <h3>Timeline List (Read-Only)</h3>
            <pre>{JSON.stringify(data.timeline, null, 2)}</pre>
          </div>
        )}
        {activeTab === 'budget' && (
          <div>
            <h3>Budget Table (Read-Only)</h3>
            <pre>{JSON.stringify(data.budgetCategories, null, 2)}</pre>
          </div>
        )}
      </div>
      <div className="split-pane right-pane" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="chat-pane" style={{ flexGrow: 1, overflowY: 'auto' }}>
          <div className="chat-msg chat-msg-ai">
            <p>Hello! How can I help you with your wedding planning today?</p>
          </div>
          <div className="chat-msg chat-msg-user">
            <p>I need to adjust the budget for flowers.</p>
          </div>
          <div className="chat-msg chat-msg-ai">
            <p>No problem. What's your current flower budget and what would you like to change it to?</p>
          </div>
          <div className="chat-msg chat-msg-user">
            <p>It's currently $2000, and I want to increase it to $2500.</p>
          </div>
          {pendingProposal && (
            <MutationBlock
              proposal={pendingProposal}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {isLoading && (
            <div className="chat-msg chat-msg-ai">
              <SkeletonLoader lines={3} />
            </div>
          )}
          {aiError && (
            <div className="chat-msg chat-msg-ai error-message" style={{ color: 'var(--red)', alignSelf: 'center' }}>
              <p>{aiError}</p>
            </div>
          )}
        </div>
        <div className="chat-input-area" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <textarea
            className="field"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            rows="1"
            style={{ flexGrow: 1, resize: 'none' }}
          />
          <button className="btn primary" onClick={handleSendMessage} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
