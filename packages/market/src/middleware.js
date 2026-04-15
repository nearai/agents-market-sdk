import { Router } from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { MarketClient } from './client.js';
import { parseDeliverable, mapStatus, sanitizeMessageBody } from './utils.js';

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
 */
export function createMiddleware(config) {
  const { apiKey, baseUrl, pollInterval = 3000, corsOrigins } = config || {};
  if (!apiKey) throw new Error('createMiddleware: apiKey is required');

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
      console.log(`[market-middleware] my agent_id: ${myAgentId}`);
    } catch (err) {
      console.error('[market-middleware] failed to resolve agent_id:', err.message);
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
    const assignmentsRaw = await client.jobs.getAssignments(jobId);
    const list = Array.isArray(assignmentsRaw)
      ? assignmentsRaw
      : assignmentsRaw?.assignments || [];
    const a = list[0] || null;

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
      status: mapStatus(null, a),
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
        });
      } else {
        response = await client.jobs.create({
          title,
          description,
          budget,
          deadlineSeconds,
          tags,
        });
      }

      console.log('[market-middleware] create job response:', JSON.stringify(response));
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
      console.error('[market-middleware] create job error:', err.message);
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
      console.error('[market-middleware] list jobs error:', err.message);
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
      console.error('[market-middleware] message error:', err.message);
      res.status(err.status || 500).json({ error: err.message });
    }
  });

  // Accept deliverable
  router.post('/jobs/:id/accept', async (req, res) => {
    try {
      await client.jobs.accept(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('[market-middleware] accept error:', err.message);
      res.status(err.status || 500).json({ error: err.message, body: err.body });
    }
  });

  // Browse services
  router.get('/services', async (req, res) => {
    try {
      const data = await client.services.list({ category: req.query.category });
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
