import React, { useState } from 'react';

function RecommendationBadge({ level }) {
  const normalized = (level || 'REVIEW').toUpperCase();
  const mod = normalized === 'APPROVE' ? 'approve' : normalized === 'REJECT' ? 'reject' : 'review';
  const icon = normalized === 'APPROVE' ? '✓' : normalized === 'REJECT' ? '✕' : '⚠';
  return <div className={`arc-reco-badge arc-reco-badge--${mod}`}>{icon} {normalized}</div>;
}

/**
 * Parse a line like "Website: Match — noodleandbean.com is live..." into
 * { label: "Website: Match", detail: "noodleandbean.com is live..." }
 */
function parseLine(line) {
  // Try "Label: Status — detail"
  const dashMatch = line.match(/^([^—]+?)(?:\s*—\s*)(.+)$/);
  if (dashMatch) {
    return { label: dashMatch[1].trim(), detail: dashMatch[2].trim() };
  }
  // Short line with no detail
  return { label: line, detail: null };
}

function CollapsibleItem({ line }) {
  const { label, detail } = parseLine(line);
  const [open, setOpen] = useState(false);
  const hasDetail = detail && detail.length > 0;

  return (
    <div className="arc-item">
      <div
        className={`arc-item-header ${hasDetail ? 'arc-item-header--clickable' : ''}`}
        onClick={() => hasDetail && setOpen(!open)}
      >
        {hasDetail && <span className="arc-item-arrow">{open ? '▼' : '▶'}</span>}
        <span className="arc-item-label">{label}</span>
      </div>
      {open && detail && (
        <div className="arc-item-detail">{detail}</div>
      )}
    </div>
  );
}

/**
 * ApplicantReviewCard — domain-specific result renderer for wholesale applicant reviews.
 * Used as renderResult prop on MarketPanel.
 */
export default function ApplicantReviewCard({ data }) {
  if (!data) return null;

  const allItems = [
    ...(data.verification || []),
    ...(data.confidence || []),
  ];

  return (
    <>
      {data.headline && <div className="arc-headline">{data.headline}</div>}
      {data.summary && <div className="arc-summary">{data.summary}</div>}

      {allItems.length > 0 && (
        <>
          <div className="arc-divider" />
          <div className="arc-items">
            {allItems.map((line, i) => (
              <CollapsibleItem key={i} line={line} />
            ))}
          </div>
        </>
      )}

      {data.recommendation && (
        <>
          <div className="arc-divider" />
          <div className="arc-reco">
            <RecommendationBadge level={data.recommendation.level} />
            <div className="arc-reco-note">{data.recommendation.note}</div>
          </div>
        </>
      )}
    </>
  );
}
