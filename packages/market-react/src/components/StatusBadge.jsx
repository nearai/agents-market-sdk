import React from 'react';

const LABELS = {
  idle: 'Idle',
  submitting: 'Creating job\u2026',
  in_progress: 'Agent is working\u2026',
  submitted: 'Submitted \u2014 awaiting review',
  completed: 'Completed',
  error: 'Error',
};

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

  if (status === 'submitted' || status === 'completed') {
    return <div className={`nai-badge nai-badge--${status}`}>{label}</div>;
  }

  return null;
}
