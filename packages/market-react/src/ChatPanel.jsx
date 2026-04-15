import React from 'react';
import MessageBubble from './components/MessageBubble.jsx';
import SystemDivider from './components/SystemDivider.jsx';
import InputBar from './components/InputBar.jsx';

/**
 * @typedef {Object} ChatPanelProps
 * @property {import('./useJob.js').Message[]} [messages] - Array of message objects.
 * @property {boolean} [disabled] - Disable input (only when showInput is true).
 * @property {string} [placeholder] - Input placeholder text.
 * @property {(message: import('./useJob.js').Message, DefaultBubble: React.ComponentType) => React.ReactNode} [renderMessage] - Custom message renderer.
 * @property {(text: string) => void} [onSend] - Called with message text.
 * @property {boolean} [showInput] - Render the input bar (default: true).
 */

/**
 * ChatPanel — standalone chat thread + optional input bar.
 *
 * @param {ChatPanelProps} props
 * @returns {React.ReactElement}
 */
export default function ChatPanel({
  messages = [],
  disabled = false,
  placeholder,
  renderMessage,
  onSend,
  showInput = true,
}) {
  const sorted = [...messages].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  return (
    <>
      {sorted.length > 0 && (
        <div className="nai-thread">
          {sorted.map((m) => {
            if (m.role === 'system') {
              return <SystemDivider key={m.id} message={m} />;
            }
            const DefaultBubble = () => <MessageBubble message={m} />;
            if (renderMessage) {
              return <React.Fragment key={m.id}>{renderMessage(m, DefaultBubble)}</React.Fragment>;
            }
            return <MessageBubble key={m.id} message={m} />;
          })}
        </div>
      )}
      {showInput && (
        <InputBar
          disabled={disabled}
          placeholder={placeholder}
          onSend={onSend}
        />
      )}
    </>
  );
}
