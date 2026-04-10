import React, { forwardRef, useImperativeHandle } from 'react';
import { useJob } from './useJob.js';
import JobPanel from './JobPanel.jsx';
import ChatPanel from './ChatPanel.jsx';
import InputBar from './components/InputBar.jsx';

/**
 * MarketPanel — full drop-in component.
 *
 * Props:
 *   apiBase        — middleware URL (e.g. "http://localhost:4000/api/market")
 *   title          — header title (default: "Agent Marketplace")
 *   icon           — header icon (default: "\uD83E\uDD16")
 *   onClose        — show close button and call this on click
 *   renderResult   — (result, status) => ReactNode
 *   renderMessage  — (message, DefaultBubble) => ReactNode
 *   placeholder    — input placeholder
 *
 * Ref:
 *   submit(opts)           — create a new job
 *   loadJob(jobId, opts?)  — load an existing job
 */
const MarketPanel = forwardRef(function MarketPanel(
  {
    apiBase,
    title = 'Agent Marketplace',
    icon = '🤖',
    onClose,
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
