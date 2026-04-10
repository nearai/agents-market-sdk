import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createMiddleware, MarketClient } from '@nearai/market';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Mount marketplace middleware
app.use('/api/nearai', createMiddleware({
  apiKey: process.env.NEAR_MARKET_API_KEY,
}));

// Direct client for server-side job creation
const client = new MarketClient({
  apiKey: process.env.NEAR_MARKET_API_KEY,
});

// --- Helpers ---

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// --- Routes ---

// Home: wholesale application form
app.get('/', (_req, res) => {
  res.render('dashboard');
});

// Form submission — create job server-side, redirect to job detail with widget
app.post('/submit-review', async (req, res) => {
  const f = req.body;
  const name = `${f.firstName || ''} ${f.lastName || ''}`.trim();
  const facts = [
    `Name: ${name}`,
    `Email: ${f.email || '—'}`,
    `Company: ${f.companyName || '—'}`,
    `Tax ID/ABN/VAT: ${f.taxId || '—'}`,
    `Phone: ${f.phone || '—'}`,
    `Website: ${f.website || '—'}`,
    `About: ${f.about || '—'}`,
    `Shipping: ${[f.addressLine1, f.addressLine2, f.city, f.state, f.zip, f.country].filter(Boolean).join(', ')}`,
  ].join('\n');

  const description = [
    'Review this wholesale account application. Return ONLY valid JSON:',
    '{"headline":"...","summary":"...","verification":["..."],"confidence":["..."],"recommendation":{"level":"APPROVE|REVIEW|FLAG","note":"..."}}',
    '',
    'Applicant data:',
    facts,
  ].join('\n');

  try {
    const job = await client.jobs.createInstant({
      serviceId: process.env.NEAR_MARKET_SERVICE_ID,
      title: `Wholesale review: ${name || 'Unknown'}`,
      description,
      budget: { amount: process.env.NEAR_MARKET_BUDGET || '1.0', token: process.env.NEAR_MARKET_BUDGET_TOKEN || 'USDC' },
    });
    const jobId = job.job_id;
    if (!jobId || !/^[a-zA-Z0-9\-]+$/.test(jobId)) {
      return res.render('dashboard', { error: 'Invalid job ID returned from marketplace' });
    }
    res.redirect(`/jobs/${encodeURIComponent(jobId)}`);
  } catch (err) {
    res.render('dashboard', { error: `Failed to create review: ${escapeHtml(err.message)}` });
  }
});

// Jobs list
app.get('/jobs', async (_req, res) => {
  let jobs = [];
  try {
    const raw = await client.jobs.list({ limit: 50 });
    jobs = (Array.isArray(raw) ? raw : raw?.data || [])
      .filter(j => j.job_type === 'instant')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch {}
  const safeJobs = jobs.map(j => ({
    ...j,
    job_id: escapeHtml(j.job_id),
    title: escapeHtml(j.title),
    status: escapeHtml(j.status),
  }));
  res.render('jobs', { jobs: safeJobs });
});

// Job detail page
app.get('/jobs/:jobId', async (req, res) => {
  try {
    const raw = await client.jobs.list({ limit: 50 });
    const list = Array.isArray(raw) ? raw : raw?.data || [];
    const job = list.find(j => j.job_id === req.params.jobId);
    if (!job) return res.status(404).send('Job not found');
    // Pre-escape all user-visible fields for safe EJS template interpolation.
    const safeJob = {
      ...job,
      job_id: escapeHtml(job.job_id),
      title: escapeHtml(job.title),
      status: escapeHtml(job.status),
      job_type: escapeHtml(job.job_type),
      budget_amount: escapeHtml(job.budget_amount),
      budget_token: escapeHtml(job.budget_token),
      _rawJobId: job.job_id, // unescaped for JSON.stringify in <script>
    };
    res.render('job-detail', { job: safeJob });
  } catch (err) {
    res.status(500).send('Failed to load job');
  }
});


const PORT = Number(process.env.PORT || 4001);
app.listen(PORT, () => console.log(`HTMX showcase on :${PORT}`));
