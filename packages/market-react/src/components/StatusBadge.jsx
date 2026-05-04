import React from 'react';

/**
 * @typedef {Object} StatusBadgeProps
 * @property {string} status - Current job status (e.g. 'idle', 'submitting', 'in_progress', 'submitted', 'completed', 'error').
 */

const LABELS = {
  idle: 'Idle',
  submitting: 'Creating job\u2026',
  in_progress: 'Agent is working\u2026',
  submitted: 'Submitted \u2014 awaiting review',
  completed: 'Completed',
  expired: 'Expired',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
  error: 'Error',
};

/**
 * StatusBadge — displays a status indicator with label.
 *
 * @param {StatusBadgeProps} props
 * @returns {React.ReactElement | null}
 */
export default function StatusBadge({ status }) {
  const label = LABELS[status] || status;

  if (status === 'idle') return null;

  if (status === 'submitting' || status === 'in_progress') {
    return (
      <div className="nai-status">
        <div className="nai-spinner" />
        <span>{label}</span>
      </div>
    );
  }

  if (
    status === 'submitted' ||
    status === 'completed' ||
    status === 'expired' ||
    status === 'disputed' ||
    status === 'cancelled' ||
    status === 'error'
  ) {
    return <div className={`nai-badge nai-badge--${status}`}>{label}</div>;
  }

  // Fallback for any unknown status
  return <div className="nai-badge">{label}</div>;
}
