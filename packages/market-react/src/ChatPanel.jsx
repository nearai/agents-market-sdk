import React from 'react';
import MessageBubble from './components/MessageBubble.jsx';
import SystemDivider from './components/SystemDivider.jsx';
import InputBar from './components/InputBar.jsx';

/**
 * ChatPanel — standalone chat thread + optional input bar.
 *
 * Props:
 *   messages       — array of { id, role, body, createdAt, isDeliverable? }
 *   disabled       — disable input (only when showInput is true)
 *   placeholder    — input placeholder text
 *   renderMessage  — (message, DefaultBubble) => ReactNode
 *   onSend         — called with message text
 *   showInput      — render the input bar (default true for standalone use)
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
