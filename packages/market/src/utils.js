/**
 * Sanitize a string value — strip HTML tags to prevent XSS.
 * This runs server-side in the middleware before data reaches any frontend.
 * @param {string} str
 * @returns {string}
 */
function stripHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]*>/g, '');
}

/**
 * Deep-sanitize an object: strip HTML from all string values recursively.
 * @param {any} obj
 * @returns {any}
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return stripHtml(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitizeObject(v);
    }
    return clean;
  }
  return obj;
}

/**
 * Parse a deliverable payload (string or object) into a structured object.
 * All string values are sanitized to prevent XSS from agent-controlled content.
 * @param {string | Object | null | undefined} raw
 * @returns {Object | null}
 */
export function parseDeliverable(raw) {
  if (!raw) return null;
  let parsed;
  if (typeof raw === 'object') {
    parsed = raw;
  } else {
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = String(raw).match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {}
      }
    }
    if (!parsed) {
      parsed = {
        headline: 'Agent response',
        summary: String(raw),
        verification: [],
        confidence: [],
        recommendation: { level: 'REVIEW', note: 'Unstructured response' },
      };
    }
  }
  // Sanitize all string values — agent content is untrusted.
  return sanitizeObject(parsed);
}

/**
 * Sanitize a message body — strip HTML tags.
 * @param {string} body
 * @returns {string}
 */
export function sanitizeMessageBody(body) {
  return stripHtml(body || '');
}

/**
 * Map marketplace job/assignment status to a simple UI status string.
 * @param {string | null | undefined} jobStatus
 * @param {{ status?: string, deliverable?: any } | null | undefined} assignment
 * @returns {string}
 */
export function mapStatus(jobStatus, assignment) {
  if (assignment?.status === 'accepted') return 'completed';
  if (assignment?.status === 'submitted' || assignment?.deliverable) return 'submitted';
  if (assignment?.status === 'in_progress') return 'in_progress';
  return jobStatus || 'in_progress';
}
