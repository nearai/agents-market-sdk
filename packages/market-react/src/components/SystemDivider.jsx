import React from 'react';

/**
 * @typedef {Object} SystemDividerProps
 * @property {import('../useJob.js').Message} message - System message to display.
 */

/**
 * SystemDivider — system message divider in the chat thread.
 *
 * @param {SystemDividerProps} props
 * @returns {React.ReactElement}
 */
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
