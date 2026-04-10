import React, { useState } from 'react';

export default function JsonResult({ data }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const preview =
    typeof data === 'object'
      ? JSON.stringify(data).slice(0, 120) + (JSON.stringify(data).length > 120 ? '\u2026' : '')
      : String(data);

  return (
    <div className="nai-json-result">
      <div
        className="nai-json-result-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '\u25BC' : '\u25B6'} Result
      </div>
      {expanded ? (
        <pre className="nai-json-result-pre">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <div className="nai-json-result-preview">{preview}</div>
      )}
    </div>
  );
}
