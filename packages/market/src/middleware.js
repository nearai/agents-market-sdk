import { Router } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { MarketClient } from './client.js';
import { parseDeliverable, mapStatus, sanitizeMessageBody } from './utils.js';

/**
 * @typedef {Object} Logger
 * @property {(...args: any[]) => void} info - Log an informational message.
 * @property {(...args: any[]) => void} error - Log an error message.
 */

/**
 * @typedef {Object} MiddlewareConfig
 * @property {string} apiKey - API key for the marketplace.
 * @property {string} [baseUrl] - Base URL of the marketplace API.
 * @property {number} [pollInterval] - SSE polling interval in ms (default: 3000).
 * @property {string | string[] | boolean} [corsOrigins] - Allowed CORS origins (default: false).
 * @property {Logger | true} [logger] - Custom logger object with `info` and `error` methods. Pass `true` to use `console`. Default is silent (no logs).
 */

const NOOP_LOGGER = { info: () => {}, error: () => {} };
const CONSOLE_LOGGER = {
  info: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

function resolveLogger(logger) {
  if (logger === true) return CONSOLE_LOGGER;
  if (!logger) return NOOP_LOGGER;
  return {
    info: typeof logger.info === 'function' ? logger.info.bind(logger) : NOOP_LOGGER.info,
    error: typeof logger.error === 'function' ? logger.error.bind(logger) : NOOP_LOGGER.error,
  };
}

/**
 * createMiddleware(config) — Express Router factory.
 *
 * Mount on any path:
 *   app.use('/api/market', createMiddleware({ apiKey: '...' }));
 *
 * Routes (relative to mount point):
 *   GET  /health
 *   GET  /balance
 *   POST /jobs
 *   GET  /jobs
 *   GET  /jobs/:id
 *   GET  /jobs/:id/stream
 *   POST /jobs/:id/message
 *   POST /jobs/:id/accept
 *   GET  /services
 *
 * @param {MiddlewareConfig} config
 * @returns {import('express').Router}
 */
export function createMiddleware(config) {
  const { apiKey, baseUrl, pollInterval = 3000, corsOrigins, logger: loggerOpt } = config || {};
  if (!apiKey) throw new Error('createMiddleware: apiKey is required');

  const logger = resolveLogger(loggerOpt);
  const client = new MarketClient({ apiKey, baseUrl });
  const router = Router();

  // CORS: restricted by default. Pass corsOrigins: '*' to allow all (not recommended).
  router.use(cors({
    origin: corsOrigins || false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }));

  // Resolve own agent_id at startup for message attribution.
  let myAgentId = null;
  (async () => {
    try {
      const me = await client.agents.me();
      myAgentId = me.agent_id;
      logger.info(`[market-middleware] my agent_id: ${myAgentId}`);
    } catch (err) {
      logger.error('[market-middleware] failed to resolve agent_id:', err.message);
    }
  })();

  // ---- helpers ----

  function processMessages(rawMessages) {
    const mlist = Array.isArray(rawMessages) ? rawMessages : rawMessages?.messages || [];
    return mlist.map((m) => {
      const body = m.body || '';
      const deliverableMatch = body.match(/^(Deliverable (?:re)?submitted)\b/i);
      const isSelf =
        m.sender_agent_id && myAgentId
          ? m.sender_agent_id === myAgentId
          : m.from_self ?? false;

      if (deliverableMatch) {
        return {
          id: m.id || m.message_id,
          role: 'system',
          body: deliverableMatch[1],
          createdAt: m.created_at || null,
          isDeliverable: true,
          parsedResult: parseDeliverable(body.slice(deliverableMatch[0].length + 1).trim()),
        };
      }
      return {
        id: m.id || m.message_id,
        role: isSelf ? 'self' : 'agent',
        body: sanitizeMessageBody(body),
        createdAt: m.created_at || null,
      };
    });
  }

  async function fetchJobView(jobId, { includeMessages = true } = {}) {
    // Fetch job and assignments in parallel to get both job-level and assignment-level status.
    const [job, assignmentsRaw] = await Promise.all([
      client.jobs.get(jobId).catch(() => null),
      client.jobs.getAssignments(jobId).catch(() => []),
    ]);
    const list = Array.isArray(assignmentsRaw)
      ? assignmentsRaw
      : assignmentsRaw?.assignments || [];
    const a = list[0] || null;
    const jobStatus = job?.status || null;

    let messages = [];
    if (includeMessages && a?.assignment_id) {
      try {
        const raw = await client.jobs.getMessages(a.assignment_id);
        messages = processMessages(raw);
      } catch {
        // ignore message fetch failures
      }
    }

    return {
      jobId,
      assignmentId: a?.assignment_id || null,
      status: mapStatus(jobStatus, a),
      result: a?.deliverable ? parseDeliverable(a.deliverable) : null,
      messages,
    };
  }

  // ---- routes ----

  router.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  router.get('/balance', async (_req, res) => {
    try {
      const data = await client.wallet.balance();
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // Create job — standard or instant.
  // If serviceId or category is present (or instant=true), use createInstant; otherwise create.
  router.post('/jobs', async (req, res) => {
    try {
      const {
        instant,
        serviceId,
        category,
        title,
        description,
        budget,
        deadlineSeconds,
        tags,
        matchQuery,
        autoAccept,
      } = req.body || {};

      const useInstant = instant || serviceId || category;

      let response;
      if (useInstant) {
        response = await client.jobs.createInstant({
          serviceId,
          category,
          title,
          description,
          budget,
          deadlineSeconds,
          tags,
          matchQuery,
          autoAccept,
        });
      } else {
        response = await client.jobs.create({
          title,
          description,
          budget,
          deadlineSeconds,
          tags,
          autoAccept,
        });
      }

      logger.info('[market-middleware] create job response:', JSON.stringify(response));
      const jobId =
        response?.job_id ||
        response?.id ||
        response?.job?.id ||
        response?.job?.job_id;
      if (!jobId) {
        return res.status(502).json({ error: 'marketplace did not return job_id', response });
      }

      const assignmentId =
        response?.assignment_id ||
        response?.assignment?.assignment_id ||
        null;

      res.json({ jobId, assignmentId, status: 'in_progress' });
    } catch (err) {
      logger.error('[market-middleware] create job error:', err.message);
      res.status(err.status || 500).json({ error: err.message, body: err.body });
    }
  });

  // List jobs
  router.get('/jobs', async (_req, res) => {
    try {
      const raw = await client.jobs.list({ limit: 50 });
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      const instantJobs = list.filter((j) => j.job_type === 'instant');

      const items = await Promise.all(
        instantJobs.map(async (j) => {
          let a = null;
          try {
            const assignments = await client.jobs.getAssignments(j.job_id);
            const alist = Array.isArray(assignments) ? assignments : assignments?.assignments || [];
            a = alist[0] || null;
          } catch {
            // ignore
          }
          const result = a?.deliverable ? parseDeliverable(a.deliverable) : null;
          return {
            jobId: j.job_id,
            assignmentId: a?.assignment_id || null,
            status: mapStatus(j.status, a),
            title: j.title || '',
            description: j.description || '',
            createdAt: j.created_at ? new Date(j.created_at).getTime() : Date.now(),
            headline: result?.headline || null,
          };
        }),
      );

      items.sort((a, b) => b.createdAt - a.createdAt);
      res.json(items);
    } catch (err) {
      logger.error('[market-middleware] list jobs error:', err.message);
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // Single job view
  router.get('/jobs/:id', async (req, res) => {
    try {
      const view = await fetchJobView(req.params.id);
      res.json(view);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // SSE stream — polls marketplace and pushes on change
  router.get('/jobs/:id/stream', async (req, res) => {
    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.flushHeaders();

    let lastSerialized = '';
    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    const tick = async () => {
      if (closed) return;
      try {
        const view = await fetchJobView(req.params.id);
        const serialized = JSON.stringify(view);
        if (serialized !== lastSerialized) {
          lastSerialized = serialized;
          res.write(`data: ${JSON.stringify({ type: 'snapshot', job: view })}\n\n`);
        }
      } catch (err) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      }
      if (!closed) setTimeout(tick, pollInterval);
    };

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (closed) return clearInterval(heartbeat);
      res.write(': ping\n\n');
    }, 25000);

    tick();
  });

  // Send follow-up message
  router.post('/jobs/:id/message', async (req, res) => {
    const { body } = req.body || {};
    if (!body) return res.status(400).json({ error: 'body required' });
    try {
      const assignments = await client.jobs.getAssignments(req.params.id);
      const list = Array.isArray(assignments) ? assignments : assignments?.assignments || [];
      const assignmentId = list[0]?.assignment_id;
      if (!assignmentId) return res.status(400).json({ error: 'no assignment yet' });
      await client.jobs.sendMessage(assignmentId, body);
      res.json({ ok: true });
    } catch (err) {
      logger.error('[market-middleware] message error:', err.message);
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // Accept deliverable. Prefers the assignment-specific endpoint because the
  // job-level one only works when the job has exactly one submitted assignment.
  router.post('/jobs/:id/accept', async (req, res) => {
    try {
      const jobId = req.params.id;
      const raw = await client.jobs.getAssignments(jobId).catch(() => null);
      const list = Array.isArray(raw) ? raw : raw?.assignments || [];
      const submitted = list.find(
        (a) => (a.status || '').toLowerCase() === 'submitted',
      );

      if (submitted?.assignment_id) {
        await client.jobs.acceptAssignment(submitted.assignment_id);
        return res.json({ ok: true });
      }

      // No submitted assignment — surface a useful error rather than letting
      // the marketplace reject a disputed/expired/etc. one.
      const a = list[0];
      if (a?.status) {
        return res.status(409).json({
          error: `Cannot accept: assignment is in state "${a.status}", expected "submitted".`,
        });
      }

      // Fallback: no assignments at all. Try the job-level endpoint.
      await client.jobs.accept(jobId);
      res.json({ ok: true });
    } catch (err) {
      logger.error('[market-middleware] accept error:', err.message);
      res.status(err.status || 500).json({ error: err.message, body: err.body });
    }
  });

  // Browse services
  router.get('/services', async (req, res) => {
    try {
      const data = await client.services.list({ category: /** @type {string | undefined} */ (req.query.category) });
      res.json(data);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // ---- embeddable widget ----

  // Serve the pre-built widget bundle from @agents-market/market-embed if installed.
  router.get('/widget.js', (_req, res) => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // Try local workspace first, then node_modules.
    const candidates = [
      path.resolve(__dirname, '../../market-embed/dist/widget.js'),
      path.resolve(__dirname, '../../../node_modules/@agents-market/market-embed/dist/widget.js'),
    ];
    for (const p of candidates) {
      if (existsSync(p)) {
        return res.sendFile(p);
      }
    }
    res.status(404).json({ error: 'widget.js not found. Run: npm run build --workspace=packages/market-embed' });
  });

  return router;
}
