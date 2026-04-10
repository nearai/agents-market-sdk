/**
 * Applicant review card renderer — returns HTML string from a result object.
 * Used as renderResult in NearMarket.init().
 *
 * Expected result shape:
 * { headline, summary, verification[], confidence[], recommendation: { level, note } }
 */
function renderApplicantReview(result) {
  if (!result) return '';

  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const badge = (level) => {
    const l = (level || 'REVIEW').toUpperCase();
    const cls = l === 'APPROVE' ? 'approve' : l === 'FLAG' || l === 'REJECT' ? 'reject' : 'review';
    const icon = l === 'APPROVE' ? '✓' : l === 'FLAG' || l === 'REJECT' ? '✕' : '⚠';
    return `<span class="arc-reco-badge arc-reco-badge--${cls}">${icon} ${esc(l)}</span>`;
  };

  let html = '';

  if (result.headline) {
    html += `<div class="arc-headline">${esc(result.headline)}</div>`;
  }
  if (result.summary) {
    html += `<div class="arc-summary">${esc(result.summary)}</div>`;
  }

  if (result.verification && result.verification.length) {
    html += '<div class="arc-divider"></div>';
    html += '<div class="arc-section-title">Verification Results</div>';
    html += '<div class="arc-lines">';
    result.verification.forEach(function(line) { html += `<div>${esc(line)}</div>`; });
    html += '</div>';
  }

  if (result.confidence && result.confidence.length) {
    html += '<div class="arc-divider"></div>';
    html += '<div class="arc-section-title">Confidence Breakdown</div>';
    html += '<div class="arc-lines">';
    result.confidence.forEach(function(line) { html += `<div>${esc(line)}</div>`; });
    html += '</div>';
  }

  if (result.recommendation) {
    html += '<div class="arc-divider"></div>';
    html += '<div class="arc-reco">';
    html += badge(result.recommendation.level);
    html += `<div class="arc-reco-note">${esc(result.recommendation.note)}</div>`;
    html += '</div>';
  }

  return html;
}
