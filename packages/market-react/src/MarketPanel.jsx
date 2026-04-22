import React, { forwardRef, useImperativeHandle } from 'react';
import { useJob } from './useJob.js';
import JobPanel from './JobPanel.jsx';
import ChatPanel from './ChatPanel.jsx';
import InputBar from './components/InputBar.jsx';

/**
 * @typedef {Object} MarketPanelProps
 * @property {string} apiBase - Middleware URL (e.g. "http://localhost:4000/api/market").
 * @property {string} [title] - Header title (default: "Agent Marketplace").
 * @property {string} [icon] - Header icon (default: robot emoji).
 * @property {() => void} [onClose] - Show close button and call this on click.
 * @property {string} [acceptLabel] - Label for the accept button. Set to empty string to hide it (default: 'Accept & release escrow').
 * @property {(result: Object, status: string) => React.ReactNode} [renderResult] - Custom result renderer.
 * @property {(message: import('./useJob.js').Message, DefaultBubble: React.ComponentType) => React.ReactNode} [renderMessage] - Custom message renderer.
 * @property {string} [placeholder] - Input placeholder text.
 */

/**
 * @typedef {Object} MarketPanelRef
 * @property {(opts: import('./useJob.js').SubmitOpts) => Promise<string>} submit - Create a new job.
 * @property {(jobId: string, opts?: Object) => Promise<void>} loadJob - Load an existing job.
 */

/**
 * MarketPanel — full drop-in component.
 *
 * @type {React.ForwardRefExoticComponent<MarketPanelProps & React.RefAttributes<MarketPanelRef>>}
 */
const MarketPanel = forwardRef(function MarketPanel(
  /** @type {MarketPanelProps} */
  {
    apiBase,
    title = 'Agent Marketplace',
    icon = '🤖',
    onClose,
    acceptLabel,
    renderResult,
    renderMessage,
    placeholder,
  },
  ref,
) {
  const {
    status,
    result,
    messages,
    error,
    submit,
    loadJob,
    sendMessage,
    accept,
  } = useJob({ apiBase });

  useImperativeHandle(
    ref,
    () => ({
      submit: (opts) => submit(opts),
      // @ts-ignore - opts reserved for future use
      loadJob: (jobId, opts) => loadJob(jobId, opts),
    }),
    [submit, loadJob],
  );

  const canFollowUp = status === 'in_progress' || status === 'submitted';
  const chatPlaceholder =
    status === 'completed'
      ? 'Job is completed \u2014 follow-ups are closed'
      : placeholder || 'Send a message\u2026';

  return (
    <div className="nai-panel">
      <div className="nai-header">
        <div className="nai-header-icon">{icon}</div>
        <div className="nai-header-title">{title}</div>
        {onClose && (
          <div className="nai-header-close" onClick={onClose}>
            {'✕'}
          </div>
        )}
      </div>

      <div className="nai-body">
        <JobPanel
          status={status}
          result={result}
          error={error}
          onAccept={accept}
          acceptLabel={acceptLabel}
          renderResult={renderResult}
        />

        <ChatPanel
          messages={messages}
          renderMessage={renderMessage}
          showInput={false}
        />
      </div>

      <div className="nai-footer-bar">
        <InputBar
          disabled={!canFollowUp}
          placeholder={chatPlaceholder}
          onSend={sendMessage}
        />
      </div>
    </div>
  );
});

export default MarketPanel;
