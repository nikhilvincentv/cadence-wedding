import React, { useState, useRef, useEffect } from 'react';
import MutationBlock from '../components/MutationBlock';
import SkeletonLoader from '../components/SkeletonLoader';
import { coordinatorChat } from '../api';

export default function AICoordinator({ data, persist }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! I have access to your full wedding plan. Ask me anything or let me know what you'd like to change." }
  ]);
  const [pendingProposal, setPendingProposal] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [aiError, setAiError] = useState(null); // New state for AI errors

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pendingProposal]);

  const handleSendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setIsLoading(true);
    setAiError(null); // Clear previous errors

    try {
      const { wedding, vendors, timeline, budgetCategories, guests, payments } = data;
      const result = await coordinatorChat(text, { wedding, vendors, timeline, budgetCategories, guests, payments });

      setMessages((prev) => [...prev, { role: 'ai', text: result.reply }]);
      if (result.proposal) setPendingProposal(result.proposal);
    } catch (error) {
      console.error("AI Coordinator error:", error);
      setAiError('Failed to get a response from AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApprove = () => {
    if (!pendingProposal?.rawPatch) { setPendingProposal(null); return; }
    const patch = pendingProposal.rawPatch;
    const newData = { ...data };
    // Merge each key from rawPatch into the top-level data
    Object.entries(patch).forEach(([key, value]) => {
      newData[key] = Array.isArray(value) ? value : { ...newData[key], ...value };
    });
    persist(newData);
    setMessages((prev) => [...prev, { role: 'ai', text: 'Done — your plan has been updated.' }]);
    setPendingProposal(null);
  };

  const handleReject = () => {
    setPendingProposal(null);
    setMessages((prev) => [...prev, { role: 'ai', text: 'No problem, the change was discarded.' }]);
  };
  };

  return (
    <div className="ai-coordinator-view">
      <div className="split-pane right-pane" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="chat-pane" style={{ flexGrow: 1, overflowY: 'auto' }}>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role === 'ai' ? 'chat-msg-ai' : 'chat-msg-user'}`}>
              <p>{msg.text}</p>
            </div>
          ))}

          {isLoading && (
            <div className="chat-msg chat-msg-ai">
              <p className="muted">Thinking…</p>
            </div>
          )}

          {pendingProposal && (
            <MutationBlock
              proposal={pendingProposal}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          <div ref={chatEndRef} />
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
            placeholder="Ask a question or request a change…"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows="2"
            style={{ flexGrow: 1, resize: 'none' }}
          />
          <button className="btn primary" onClick={handleSendMessage} disabled={isLoading || !inputText.trim()}>
            {isLoading ? 'Thinking…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
