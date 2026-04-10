/**
 * MarketClient — generic NEAR Agent Marketplace client.
 *
 * Usage:
 *   const client = new MarketClient({ apiKey: 'sk_live_...' });
 *   const job = await client.jobs.createInstant({ ... });
 */
export class MarketClient {
  constructor({ apiKey, baseUrl = 'https://market.near.ai' }) {
    if (!apiKey) throw new Error('MarketClient: apiKey is required');
    this._apiKey = apiKey;
    this._baseUrl = baseUrl.replace(/\/+$/, '');

    // Namespaced method groups
    this.jobs = {
      create: (opts) => this._createJob(opts),
      createInstant: (opts) => this._createInstantJob(opts),
      list: (opts) => this._listJobs(opts),
      get: (jobId) => this._getJob(jobId),
      getAssignments: (jobId) => this._getAssignments(jobId),
      accept: (jobId) => this._acceptJob(jobId),
      requestChanges: (jobId, message) => this._requestChanges(jobId, message),
      getMessages: (assignmentId) => this._getMessages(assignmentId),
      sendMessage: (assignmentId, body) => this._sendMessage(assignmentId, body),
    };

    this.wallet = {
      balance: () => this._walletBalance(),
      deposit: (opts) => this._walletDeposit(opts),
    };

    this.services = {
      list: (opts) => this._listServices(opts),
    };

    this.agents = {
      me: () => this._agentMe(),
      get: (id) => this._agentGet(id),
      browse: (opts) => this._browseAgents(opts),
    };
  }

  // ---- internal HTTP layer ----

  async _request(path, init = {}) {
    const url = `${this._baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const err = new Error(`Marketplace ${res.status}: ${text}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  // ---- jobs ----

  _createJob(opts) {
    const payload = {
      title: opts.title,
      description: opts.description,
      budget_amount: opts.budget?.amount,
      budget_token: opts.budget?.token,
      deadline_seconds: opts.deadlineSeconds ?? 86400,
      tags: opts.tags,
    };
    return this._request('/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  _createInstantJob(opts) {
    const payload = {
      title: opts.title,
      description: opts.description,
      budget_amount: opts.budget?.amount,
      budget_token: opts.budget?.token,
      deadline_seconds: opts.deadlineSeconds ?? 86400,
      tags: opts.tags,
    };
    if (opts.serviceId) payload.service_id = opts.serviceId;
    if (opts.category) payload.category = opts.category;
    if (opts.matchQuery) payload.match_query = opts.matchQuery;
    return this._request('/v1/jobs/instant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  _listJobs(opts = {}) {
    const params = new URLSearchParams();
    params.set('created_by', 'me');
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.status) params.set('status', opts.status);
    return this._request(`/v1/jobs?${params}`);
  }

  _getJob(jobId) {
    return this._request(`/v1/jobs/${jobId}`);
  }

  _getAssignments(jobId) {
    return this._request(`/v1/jobs/${jobId}/assignments`);
  }

  _acceptJob(jobId) {
    return this._request(`/v1/jobs/${jobId}/accept`, { method: 'POST' });
  }

  _requestChanges(jobId, message) {
    return this._request(`/v1/jobs/${jobId}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  _getMessages(assignmentId) {
    return this._request(`/v1/assignments/${assignmentId}/messages`);
  }

  _sendMessage(assignmentId, body) {
    return this._request(`/v1/assignments/${assignmentId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  // ---- wallet ----

  _walletBalance() {
    return this._request('/v1/wallet/balance');
  }

  _walletDeposit(opts) {
    return this._request('/v1/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  }

  // ---- services ----

  _listServices(opts = {}) {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    const qs = params.toString();
    return this._request(`/v1/services${qs ? '?' + qs : ''}`);
  }

  // ---- agents ----

  _agentMe() {
    return this._request('/v1/agents/me');
  }

  _agentGet(id) {
    return this._request(`/v1/agents/${id}`);
  }

  _browseAgents(opts = {}) {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.query) params.set('query', opts.query);
    const qs = params.toString();
    return this._request(`/v1/agents${qs ? '?' + qs : ''}`);
  }
}
