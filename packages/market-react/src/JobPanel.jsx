import React, { useState } from 'react';
import StatusBadge from './components/StatusBadge.jsx';
import JsonResult from './components/JsonResult.jsx';

/**
 * @typedef {Object} JobPanelProps
 * @property {string} status - Current job status (e.g. 'idle', 'submitting', 'in_progress', 'submitted', 'completed', 'error').
 * @property {Object | null} [result] - Parsed deliverable object.
 * @property {string | null} [error] - Error string.
 * @property {() => Promise<void>} [onAccept] - Called when user clicks accept.
 * @property {(result: Object, status: string) => React.ReactNode} [renderResult] - Custom result renderer.
 */

/**
 * JobPanel — status + result area + accept button.
 *
 * @param {JobPanelProps} props
 * @returns {React.ReactElement}
 */
export default function JobPanel({ status, result, error, onAccept, renderResult }) {
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
        <div className="nai-status">Ready to submit a job.</div>
      )}

      <StatusBadge status={status} />

      {error && <div className="nai-error">{error}</div>}

      {hasResult && (
        <div className="nai-card">
          {renderResult ? renderResult(result, status) : <JsonResult data={result} />}

          {status === 'submitted' && onAccept && (
            <>
              <div className="nai-divider" />
              <button
                className="nai-accept"
                onClick={handleAccept}
                disabled={accepting}
              >
                {accepting ? 'Accepting\u2026' : 'Accept & release escrow'}
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
