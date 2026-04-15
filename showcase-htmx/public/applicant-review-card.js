/**
 * Applicant review card renderer — returns HTML string from a result object.
 * Used as renderResult in NearMarket.init().
 *
 * Expected result shape:
 * { headline, summary, verification[], confidence[], recommendation: { level, note } }
 */

var _arcIdCounter = 0;

function renderApplicantReview(result) {
  if (!result) return '';

  var esc = function(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };

  var badge = function(level) {
    var l = (level || 'REVIEW').toUpperCase();
    var cls = l === 'APPROVE' ? 'approve' : l === 'FLAG' || l === 'REJECT' ? 'reject' : 'review';
    var icon = l === 'APPROVE' ? '✓' : l === 'FLAG' || l === 'REJECT' ? '✕' : '⚠';
    return '<span class="arc-reco-badge arc-reco-badge--' + cls + '">' + icon + ' ' + esc(l) + '</span>';
  };

  var collapsibleItem = function(line) {
    var id = 'arc-item-' + (++_arcIdCounter);
    var dashIdx = line.indexOf(' — ');
    var label, detail;
    if (dashIdx > -1) {
      label = line.substring(0, dashIdx).trim();
      detail = line.substring(dashIdx + 3).trim();
    } else {
      label = line;
      detail = '';
    }

    if (!detail) {
      return '<div class="arc-item"><div class="arc-item-header"><span class="arc-item-label">' + esc(label) + '</span></div></div>';
    }

    return '<div class="arc-item">' +
      '<div class="arc-item-header arc-item-header--clickable" data-collapse-target="' + id + '">' +
      '<span class="arc-item-arrow">▶</span>' +
      '<span class="arc-item-label">' + esc(label) + '</span>' +
      '</div>' +
      '<div class="arc-item-detail" id="' + id + '" style="display:none">' + esc(detail) + '</div>' +
      '</div>';
  };

  var html = '';

  if (result.headline) {
    html += '<div class="arc-headline">' + esc(result.headline) + '</div>';
  }
  if (result.summary) {
    html += '<div class="arc-summary">' + esc(result.summary) + '</div>';
  }

  var allItems = (result.verification || []).concat(result.confidence || []);
  if (allItems.length) {
    html += '<div class="arc-divider"></div>';
    html += '<div class="arc-items">';
    allItems.forEach(function(line) { html += collapsibleItem(line); });
    html += '</div>';
  }

  if (result.recommendation) {
    html += '<div class="arc-divider"></div>';
    html += '<div class="arc-reco">';
    html += badge(result.recommendation.level);
    html += '<div class="arc-reco-note">' + esc(result.recommendation.note) + '</div>';
    html += '</div>';
  }

  return html;
}
