import React from 'react';

export default function MessageBubble({ message }) {
  const side = message.role === 'self' ? 'self' : 'agent';
  const label = side === 'self' ? 'You' : '🤖 Agent';
  const when = message.createdAt
    ? new Date(message.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={`nai-msg-wrap nai-msg-wrap--${side}`}>
      <div className={`nai-msg-label nai-msg-label--${side}`}>{label}</div>
      <div className={`nai-msg nai-msg--${side}`}>{message.body}</div>
      {when && <div className="nai-msg-time">{when}</div>}
    </div>
  );
}
