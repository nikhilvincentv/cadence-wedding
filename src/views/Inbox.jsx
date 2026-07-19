import React, { useState } from 'react';

export default function Inbox({ data, persist }) {
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const inboxThreads = data.inboxThreads || [];
  const activeThread = inboxThreads.find(thread => thread.id === activeThreadId);

  const handleSendReply = () => {
    if (!activeThread || !replyText.trim()) return;

    const updatedThreads = inboxThreads.map(thread =>
      thread.id === activeThreadId
        ? { ...thread, replies: [...(thread.replies || []), replyText] }
        : thread
    );
    persist({ inboxThreads: updatedThreads });
    setReplyText('');
  };

  return (
    <div className="inbox-view">
      <div className="split-pane left-pane" style={{ flex: '0 0 35%', maxWidth: '35%' }}>
        <h2 className="section-title">Inbox Threads</h2>
        <div className="inbox-thread-list" style={{ overflowY: 'auto', flexGrow: 1 }}>
          {inboxThreads.length === 0 ? (
            <div className="onboarding-prompt" style={{ padding: '20px', textAlign: 'center', color: 'var(--faint)' }}>
              <h3>Your inbox is empty!</h3>
              <p>Looks like you don't have any threads yet. New threads will appear here.</p>
              <p>Try sending a message to the AI Coordinator to generate some activity!</p>
            </div>
          ) : (
            inboxThreads.map((thread) => (
              <div
                key={thread.id}
                className={`inbox-thread-item ${thread.id === activeThreadId ? 'active' : ''}`}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <div className="row between">
                  <span className="sender">{thread.sender}</span>
                  <span className="timestamp">{new Date(thread.timestamp).toLocaleString()}</span>
                </div>
                <div className="tldr">{thread.tldr}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="split-pane right-pane" style={{ flex: '1', maxWidth: '65%', display: 'flex', flexDirection: 'column' }}>
        <h2 className="section-title">Active Thread</h2>
        {activeThread ? (
          <>
            <div style={{ flexGrow: 1, overflowY: 'auto', padding: '10px' }}>
              <h3>From: {activeThread.sender}</h3>
              <p>{activeThread.body}</p>
              {(activeThread.replies || []).map((reply, index) => (
                <p key={index} style={{ marginTop: '10px', fontStyle: 'italic' }}>
                  You replied: {reply}
                </p>
              ))}
            </div>
            {/* AI Impact Banner (Task 10.4) */}
            <div className="impact-banner" style={{ padding: '10px', background: 'var(--bg-3)', marginTop: '10px' }}>
              AI Impact: {activeThread.impact || 'None'} <span className="badge low">{activeThread.impactLevel || 'None'}</span>
            </div>
            {/* Smart Reply Area (Task 10.5) */}
            <div className="smart-reply" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <textarea
                className="field"
                placeholder="Smart reply draft..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                style={{ flexGrow: 1, resize: 'none' }}
              />
              <button className="btn primary" onClick={handleSendReply}>Send</button>
            </div>
          </>
        ) : (
          <p className="faint" style={{ padding: '10px' }}>Select a thread to view its content.</p>
        )}
      </div>
    </div>
  );
}
