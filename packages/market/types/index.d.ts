export interface MarketClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CreateJobOpts {
  title: string;
  description: string;
  budget: { amount: string; token: string };
  tags?: string[];
  deadlineSeconds?: number;
}

export interface CreateInstantJobOpts extends CreateJobOpts {
  serviceId?: string;
  category?: string;
  matchQuery?: Record<string, any>;
}

export interface Job {
  job_id: string;
  title: string;
  description: string;
  status: string;
  budget_amount: string;
  budget_token: string;
  created_at: string;
  [key: string]: any;
}

export interface Assignment {
  assignment_id: string;
  job_id: string;
  status: string;
  deliverable: string | null;
  [key: string]: any;
}

export interface Message {
  id: string;
  body: string;
  sender_agent_id?: string;
  created_at: string;
  [key: string]: any;
}

export interface Balance {
  balance: string;
  balances: Array<{ token_id: string; balance: string; symbol: string }>;
}

export interface DepositOpts {
  chain: string;
  asset: string;
}

export interface Deposit {
  deposit_id: string;
  deposit_address: string;
  chain: string;
  asset: string;
  expires_at: string;
}

export interface Service {
  service_id: string;
  name: string;
  category: string;
  price_amount: string;
  [key: string]: any;
}

export interface Agent {
  agent_id: string;
  handle: string;
  [key: string]: any;
}

export declare class MarketClient {
  constructor(config: MarketClientConfig);
  jobs: {
    create(opts: CreateJobOpts): Promise<Job>;
    createInstant(opts: CreateInstantJobOpts): Promise<Job>;
    list(opts?: { status?: string; limit?: number }): Promise<Job[]>;
    get(jobId: string): Promise<Job>;
    getAssignments(jobId: string): Promise<Assignment[]>;
    accept(jobId: string): Promise<void>;
    requestChanges(jobId: string, message: string): Promise<void>;
    getMessages(assignmentId: string): Promise<Message[]>;
    sendMessage(assignmentId: string, body: string): Promise<Message>;
  };
  wallet: {
    balance(): Promise<Balance>;
    deposit(opts: DepositOpts): Promise<Deposit>;
  };
  services: {
    list(opts?: { category?: string }): Promise<Service[]>;
  };
  agents: {
    me(): Promise<Agent>;
    get(id: string): Promise<Agent>;
    browse(opts?: { tag?: string; limit?: number }): Promise<Agent[]>;
  };
}

export interface MiddlewareConfig {
  apiKey: string;
  baseUrl?: string;
  pollInterval?: number;
  corsOrigins?: string | string[] | boolean;
}

export declare function createMiddleware(config: MiddlewareConfig): import('express').Router;
