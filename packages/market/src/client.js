/**
 * @typedef {Object} MarketClientConfig
 * @property {string} apiKey - API key for authenticating with the marketplace.
 * @property {string} [baseUrl] - Base URL of the marketplace API (default: "https://market.near.ai").
 */

/**
 * @typedef {Object} CreateJobOpts
 * @property {string} title - Job title.
 * @property {string} description - Job description.
 * @property {{ amount: number, token: string }} [budget] - Budget for the job.
 * @property {number} [deadlineSeconds] - Deadline in seconds (default: 86400).
 * @property {string[]} [tags] - Tags for the job.
 * @property {boolean} [autoAccept] - If true, marketplace auto-accepts the deliverable on submission.
 */

/**
 * @typedef {Object} CreateInstantJobOpts
 * @property {string} title - Job title.
 * @property {string} description - Job description.
 * @property {{ amount: number, token: string }} [budget] - Budget for the job.
 * @property {number} [deadlineSeconds] - Deadline in seconds (default: 86400).
 * @property {string[]} [tags] - Tags for the job.
 * @property {string} [serviceId] - Service ID for instant matching.
 * @property {string} [category] - Category for instant matching.
 * @property {string} [matchQuery] - Query string for matching.
 * @property {boolean} [isPrivate] - Whether the job is private (default: true).
 * @property {boolean} [autoAccept] - If true, marketplace auto-accepts the deliverable on submission.
 */

/**
 * @typedef {Object} ListJobsOpts
 * @property {number} [limit] - Maximum number of jobs to return.
 * @property {string} [status] - Filter by job status.
 */

/**
 * @typedef {Object} ListServicesOpts
 * @property {string} [category] - Filter by service category.
 */

/**
 * @typedef {Object} BrowseAgentsOpts
 * @property {string} [category] - Filter by agent category.
 * @property {number} [limit] - Maximum number of agents to return.
 * @property {string} [query] - Search query.
 */

/**
 * MarketClient — generic NEAR Agent Marketplace client.
 *
 * Usage:
 *   const client = new MarketClient({ apiKey: 'sk_live_...' });
 *   const job = await client.jobs.createInstant({ ... });
 */
export class MarketClient {
  /**
   * @param {MarketClientConfig} config
   */
  constructor({ apiKey, baseUrl = 'https://market.near.ai' }) {
    if (!apiKey) throw new Error('MarketClient: apiKey is required');
    this._apiKey = apiKey;
    this._baseUrl = baseUrl.replace(/\/+$/, '');

    /**
     * Job-related API methods.
     * @type {{
     *   create: (opts: CreateJobOpts) => Promise<any>,
     *   createInstant: (opts: CreateInstantJobOpts) => Promise<any>,
     *   list: (opts?: ListJobsOpts) => Promise<any>,
     *   get: (jobId: string) => Promise<any>,
     *   getAssignments: (jobId: string) => Promise<any>,
     *   accept: (jobId: string) => Promise<any>,
     *   requestChanges: (jobId: string, message: string) => Promise<any>,
     *   getMessages: (assignmentId: string) => Promise<any>,
     *   sendMessage: (assignmentId: string, body: string) => Promise<any>,
     * }}
     */
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

    /**
     * Wallet-related API methods.
     * @type {{
     *   balance: () => Promise<any>,
     *   deposit: (opts: Object) => Promise<any>,
     * }}
     */
    this.wallet = {
      balance: () => this._walletBalance(),
      deposit: (opts) => this._walletDeposit(opts),
    };

    /**
     * Service-related API methods.
     * @type {{
     *   list: (opts?: ListServicesOpts) => Promise<any>,
     * }}
     */
    this.services = {
      list: (opts) => this._listServices(opts),
    };

    /**
     * Agent-related API methods.
     * @type {{
     *   me: () => Promise<any>,
     *   get: (id: string) => Promise<any>,
     *   browse: (opts?: BrowseAgentsOpts) => Promise<any>,
     * }}
     */
    this.agents = {
      me: () => this._agentMe(),
      get: (id) => this._agentGet(id),
      browse: (opts) => this._browseAgents(opts),
    };
  }

  // ---- internal HTTP layer ----

  /**
   * @param {string} path
   * @param {RequestInit} [init]
   * @returns {Promise<any>}
   */
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
      /** @type {any} */ (err).status = res.status;
      /** @type {any} */ (err).body = body;
      throw err;
    }
    return body;
  }

  // ---- jobs ----

  /**
   * @param {CreateJobOpts} opts
   * @returns {Promise<any>}
   */
  _createJob(opts) {
    const payload = {
      title: opts.title,
      description: opts.description,
      budget_amount: opts.budget?.amount,
      budget_token: opts.budget?.token,
      deadline_seconds: opts.deadlineSeconds ?? 86400,
      tags: opts.tags,
    };
    if (opts.autoAccept) payload.auto_accept = true;
    return this._request('/v1/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * @param {CreateInstantJobOpts} opts
   * @returns {Promise<any>}
   */
  async _createInstantJob(opts) {
    const payload = {
      title: opts.title,
      description: opts.description,
      budget_amount: opts.budget?.amount,
      budget_token: opts.budget?.token,
      deadline_seconds: opts.deadlineSeconds ?? 86400,
      tags: opts.tags,
      is_private: opts.isPrivate ?? true,
    };
    if (opts.serviceId) payload.service_id = opts.serviceId;
    if (opts.category) payload.category = opts.category;
    if (opts.matchQuery) payload.match_query = opts.matchQuery;
    if (opts.autoAccept) payload.auto_accept = true;
    const response = await this._request('/v1/jobs/instant', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    // Normalize: marketplace may wrap as { job: { job_id, ... } } or return flat.
    return response?.job || response;
  }

  /**
   * @param {ListJobsOpts} [opts]
   * @returns {Promise<any>}
   */
  _listJobs(opts = {}) {
    const params = new URLSearchParams();
    params.set('created_by', 'me');
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.status) params.set('status', opts.status);
    return this._request(`/v1/jobs?${params}`);
  }

  /**
   * @param {string} jobId
   * @returns {Promise<any>}
   */
  _getJob(jobId) {
    return this._request(`/v1/jobs/${jobId}`);
  }

  /**
   * @param {string} jobId
   * @returns {Promise<any>}
   */
  _getAssignments(jobId) {
    return this._request(`/v1/jobs/${jobId}/assignments`);
  }

  /**
   * @param {string} jobId
   * @returns {Promise<any>}
   */
  _acceptJob(jobId) {
    return this._request(`/v1/jobs/${jobId}/accept`, { method: 'POST' });
  }

  /**
   * @param {string} jobId
   * @param {string} message
   * @returns {Promise<any>}
   */
  _requestChanges(jobId, message) {
    return this._request(`/v1/jobs/${jobId}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  /**
   * @param {string} assignmentId
   * @returns {Promise<any>}
   */
  _getMessages(assignmentId) {
    return this._request(`/v1/assignments/${assignmentId}/messages`);
  }

  /**
   * @param {string} assignmentId
   * @param {string} body
   * @returns {Promise<any>}
   */
  _sendMessage(assignmentId, body) {
    return this._request(`/v1/assignments/${assignmentId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }

  // ---- wallet ----

  /**
   * @returns {Promise<any>}
   */
  _walletBalance() {
    return this._request('/v1/wallet/balance');
  }

  /**
   * @param {Object} opts
   * @returns {Promise<any>}
   */
  _walletDeposit(opts) {
    return this._request('/v1/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(opts),
    });
  }

  // ---- services ----

  /**
   * @param {ListServicesOpts} [opts]
   * @returns {Promise<any>}
   */
  _listServices(opts = {}) {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    const qs = params.toString();
    return this._request(`/v1/services${qs ? '?' + qs : ''}`);
  }

  // ---- agents ----

  /**
   * @returns {Promise<any>}
   */
  _agentMe() {
    return this._request('/v1/agents/me');
  }

  /**
   * @param {string} id
   * @returns {Promise<any>}
   */
  _agentGet(id) {
    return this._request(`/v1/agents/${id}`);
  }

  /**
   * @param {BrowseAgentsOpts} [opts]
   * @returns {Promise<any>}
   */
  _browseAgents(opts = {}) {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.query) params.set('query', opts.query);
    const qs = params.toString();
    return this._request(`/v1/agents${qs ? '?' + qs : ''}`);
  }
}
