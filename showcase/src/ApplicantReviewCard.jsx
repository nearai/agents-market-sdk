import React from 'react';

function RecommendationBadge({ level }) {
  const normalized = (level || 'REVIEW').toUpperCase();
  const mod = normalized === 'APPROVE' ? 'approve' : normalized === 'REJECT' ? 'reject' : 'review';
  const icon = normalized === 'APPROVE' ? '\u2713' : normalized === 'REJECT' ? '\u2715' : '\u26A0';
  return <div className={`arc-reco-badge arc-reco-badge--${mod}`}>{icon} {normalized}</div>;
}

/**
 * ApplicantReviewCard — domain-specific result renderer for wholesale applicant reviews.
 * Used as renderResult prop on MarketPanel.
 */
export default function ApplicantReviewCard({ data }) {
  if (!data) return null;

  return (
    <>
      {data.headline && <div className="arc-headline">{data.headline}</div>}
      {data.summary && <div className="arc-summary">{data.summary}</div>}

      {data.verification?.length > 0 && (
        <>
          <div className="arc-divider" />
          <div className="arc-section-title">Verification Results</div>
          <div className="arc-lines">
            {data.verification.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </>
      )}

      {data.confidence?.length > 0 && (
        <>
          <div className="arc-divider" />
          <div className="arc-section-title">Confidence Breakdown</div>
          <div className="arc-lines">
            {data.confidence.map((l, i) => <div key={i}>{l}</div>)}
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
