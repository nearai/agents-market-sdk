import React from 'react';

export default function SystemDivider({ message }) {
  const when = message.createdAt
    ? new Date(message.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="nai-system">
      <span className="nai-system-line" />
      <span className="nai-system-text">
        {'✓ '}{message.body}
        {when && ` · ${when}`}
      </span>
      <span className="nai-system-line" />
    </div>
  );
}
