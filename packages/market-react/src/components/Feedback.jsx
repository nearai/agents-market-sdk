import React, { useState } from 'react';

/**
 * @typedef {Object} FeedbackProps
 * @property {string} [jobId] - Current job ID, passed to onFeedback.
 * @property {Object | null} [result] - Parsed deliverable, passed to onFeedback.
 * @property {(payload: { jobId?: string, rating: 'up' | 'down', comment?: string, result?: Object | null }) => void | Promise<void>} onFeedback - Called when the user submits feedback.
 */

/**
 * Feedback — thumbs up / thumbs down with optional comment for negative feedback.
 *
 * @param {FeedbackProps} props
 * @returns {React.ReactElement}
 */
export default function Feedback({ jobId, result, onFeedback }) {
  const [stage, setStage] = useState('idle');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (rating, commentText) => {
    setBusy(true);
    try {
      await onFeedback?.({ jobId, rating, comment: commentText || undefined, result });
      setStage('done');
    } catch (e) {
      console.error('[NearMarket] onFeedback threw:', e);
      setStage('done');
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'done') {
    return (
      <div className="nai-feedback nai-feedback--done">Thanks for your feedback.</div>
    );
  }

  if (stage === 'comment') {
    return (
      <div className="nai-feedback nai-feedback--comment">
        <textarea
          className="nai-feedback-textarea"
          placeholder="What was wrong? (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={busy}
          rows={2}
        />
        <div className="nai-feedback-actions">
          <button
            type="button"
            className="nai-feedback-skip"
            onClick={() => send('down', '')}
            disabled={busy}
          >
            Skip
          </button>
          <button
            type="button"
            className="nai-feedback-submit"
            onClick={() => send('down', comment.trim())}
            disabled={busy}
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nai-feedback">
      <span className="nai-feedback-label">Was this helpful?</span>
      <button
        type="button"
        className="nai-feedback-btn"
        aria-label="Thumbs up"
        onClick={() => send('up')}
        disabled={busy}
      >
        👍
      </button>
      <button
        type="button"
        className="nai-feedback-btn"
        aria-label="Thumbs down"
        onClick={() => setStage('comment')}
        disabled={busy}
      >
        👎
      </button>
    </div>
  );
}
