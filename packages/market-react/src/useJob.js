import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @typedef {Object} UseJobOpts
 * @property {string} [apiBase] - Middleware URL (default: "http://localhost:4000").
 */

/**
 * @typedef {Object} SubmitOpts
 * @property {string} title - Job title.
 * @property {string} description - Job description.
 * @property {{ amount: number, token: string }} [budget] - Budget for the job.
 * @property {string} [serviceId] - Service ID for instant matching.
 * @property {string} [category] - Category for instant matching.
 * @property {string[]} [tags] - Tags for the job.
 * @property {number} [deadlineSeconds] - Deadline in seconds.
 * @property {boolean} [autoAccept] - If true, marketplace auto-accepts the deliverable on submission.
 * @property {boolean} [isPrivate] - If true, hides the job from the public marketplace feed (instant jobs only). Default true.
 */

/**
 * @typedef {Object} Message
 * @property {string} id - Message ID.
 * @property {'self' | 'agent' | 'system'} role - Message role.
 * @property {string} body - Message body text.
 * @property {string | null} createdAt - ISO timestamp or null.
 * @property {boolean} [isDeliverable] - Whether the message is a deliverable notification.
 * @property {Object} [parsedResult] - Parsed deliverable data.
 */

/**
 * @typedef {Object} UseJobReturn
 * @property {string | null} jobId - Current job ID.
 * @property {string} status - Current job status (e.g. 'idle', 'submitting', 'in_progress', 'submitted', 'completed', 'error').
 * @property {Object | null} result - Parsed deliverable result.
 * @property {Message[]} messages - Chat messages.
 * @property {string | null} error - Error message.
 * @property {(opts: SubmitOpts) => Promise<string>} submit - Create a new job.
 * @property {(id: string) => Promise<void>} loadJob - Load an existing job by ID.
 * @property {(body: string) => Promise<void>} sendMessage - Send a follow-up message.
 * @property {() => Promise<void>} accept - Accept the deliverable.
 */

/**
 * useJob — headless hook for interacting with the NEAR Agent Marketplace
 * through the @agents-market/market middleware.
 *
 * @param {UseJobOpts} [opts]
 * @returns {UseJobReturn}
 */
export function useJob({ apiBase = 'http://localhost:4000' } = {}) {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const esRef = useRef(null);

  /**
   * Create a new job.
   * @param {{ title, description, budget: { amount, token }, serviceId?, category?, tags?, deadlineSeconds? }} opts
   * @returns {Promise<string>} jobId
   */
  const submit = useCallback(async (opts) => {
    setStatus('submitting');
    setError(null);
    setResult(null);
    setMessages([]);
    try {
      const res = await fetch(`${apiBase}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'failed');
      const data = await res.json();
      const id = data.jobId;
      setJobId(id);
      setStatus('in_progress');
      return id;
    } catch (err) {
      setStatus('error');
      setError(err.message);
      throw err;
    }
  }, [apiBase]);

  /**
   * Load an existing job by ID and subscribe to SSE updates.
   * @param {string} id
   * @param {Object} [_opts] - Reserved for future use.
   */
  const loadJob = useCallback(async (id) => {
    setError(null);
    try {
      const res = await fetch(`${apiBase}/jobs/${id}`);
      if (!res.ok) throw new Error('job not found');
      const job = await res.json();
      setResult(job.result);
      setMessages(job.messages || []);
      setStatus(job.status);
      // Force-reset jobId so the SSE effect re-runs even if same id.
      setJobId(null);
      setTimeout(() => setJobId(id), 0);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [apiBase]);

  /**
   * Send a follow-up message on the current job.
   * @param {string} body
   */
  const sendMessage = useCallback(async (body) => {
    if (!jobId) return;
    await fetch(`${apiBase}/jobs/${jobId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
  }, [apiBase, jobId]);

  /**
   * Accept the deliverable and release escrow.
   */
  const accept = useCallback(async () => {
    if (!jobId) return;
    const res = await fetch(`${apiBase}/jobs/${jobId}/accept`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'accept failed');
    }
    setStatus('completed');
  }, [apiBase, jobId]);

  // SSE subscription
  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource(`${apiBase}/jobs/${jobId}/stream`);
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'snapshot' || payload.type === 'update') {
          const job = payload.job;
          setStatus(job.status);
          setResult(job.result);
          setMessages(job.messages || []);
        } else if (payload.type === 'message') {
          setMessages((m) => {
            if (m.some((x) => x.id === payload.message.id)) return m;
            return [...m, payload.message];
          });
        }
      } catch {
        // ignore parse errors
      }
    };
    es.onerror = () => {};
    return () => es.close();
  }, [apiBase, jobId]);

  return { jobId, status, result, messages, error, submit, loadJob, sendMessage, accept };
}
