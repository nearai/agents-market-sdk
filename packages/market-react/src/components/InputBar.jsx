import React, { useState } from 'react';

export default function InputBar({ disabled, placeholder, onSend }) {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    onSend?.(text);
  };

  return (
    <div className="nai-footer">
      <input
        className="nai-input"
        placeholder={placeholder || 'Send a message\u2026'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSend();
        }}
        disabled={disabled}
      />
      <button
        className="nai-send"
        onClick={handleSend}
        disabled={!draft.trim() || disabled}
      >
        Send
      </button>
    </div>
  );
}
