import React, { useState } from 'react';
import StatusBadge from './components/StatusBadge.jsx';
import JsonResult from './components/JsonResult.jsx';
import Feedback from './components/Feedback.jsx';

/**
 * @typedef {Object} JobPanelProps
 * @property {string} status - Current job status (e.g. 'idle', 'submitting', 'in_progress', 'submitted', 'completed', 'error').
 * @property {Object | null} [result] - Parsed deliverable object.
 * @property {string | null} [error] - Error string.
 * @property {string} [jobId] - Current job ID (passed to onFeedback).
 * @property {() => Promise<void>} [onAccept] - Called when user clicks accept.
 * @property {string} [acceptLabel] - Label for the accept button. Set to empty string or omit to hide the button (default: 'Accept & release escrow').
 * @property {boolean} [hideStatus] - If true, hides the status badge above the result.
 * @property {boolean} [showFeedback] - If true, render thumbs up / down under the deliverable.
 * @property {(payload: { jobId?: string, rating: 'up' | 'down', comment?: string, result?: Object | null }) => void | Promise<void>} [onFeedback] - Called when the user submits feedback.
 * @property {(result: Object, status: string) => React.ReactNode} [renderResult] - Custom result renderer.
 */

/**
 * JobPanel — status + result area + accept button.
 *
 * @param {JobPanelProps} props
 * @returns {React.ReactElement}
 */
export default function JobPanel({ status, result, error, jobId, onAccept, acceptLabel = 'Accept & release escrow', hideStatus = false, showFeedback = false, onFeedback, renderResult }) {
  const [accepting, setAccepting] = useState(false);

  const hasResult = (status === 'submitted' || status === 'completed') && result;

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAccept?.();
    } catch (e) {
      console.error(e);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <>
      {status === 'idle' && (
        <div className="nai-status">
          <div className="nai-spinner" />
          <span>Loading…</span>
        </div>
      )}

      {status === 'expired' && (
        <div className="nai-status">This job has expired. No agent completed the work in time.</div>
      )}

      {!hideStatus && <StatusBadge status={status} />}

      {error && <div className="nai-error">{error}</div>}

      {hasResult && (
        <div className="nai-card">
          {renderResult ? renderResult(result, status) : <JsonResult data={result} />}

          {status === 'submitted' && onAccept && acceptLabel && (
            <>
              <div className="nai-divider" />
              <button
                className="nai-accept"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? 'Accepting\u2026' : acceptLabel}
              </button>
            </>
          )}

          {showFeedback && onFeedback && (
            <>
              <div className="nai-divider" />
              <Feedback jobId={jobId} result={result} onFeedback={onFeedback} />
            </>
          )}
        </div>
      )}
    </>
  );
}
