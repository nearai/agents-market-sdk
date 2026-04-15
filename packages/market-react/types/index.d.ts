import { FC, Ref, ReactNode } from 'react';

export type JobStatus = 'idle' | 'submitting' | 'in_progress' | 'submitted' | 'completed' | 'error';

export interface JobMessage {
  id: string;
  role: 'self' | 'agent' | 'system';
  body: string;
  createdAt: string | null;
  isDeliverable?: boolean;
  parsedResult?: any;
}

export interface SubmitOpts {
  title: string;
  description: string;
  budget: { amount: string; token: string };
  serviceId?: string;
  category?: string;
  tags?: string[];
  deadlineSeconds?: number;
}

export interface UseJobOpts {
  apiBase: string;
}

export interface UseJobReturn {
  jobId: string | null;
  status: JobStatus;
  result: any | null;
  messages: JobMessage[];
  error: string | null;
  submit(opts: SubmitOpts): Promise<string>;
  loadJob(jobId: string): Promise<void>;
  sendMessage(body: string): Promise<void>;
  accept(): Promise<void>;
}

export declare function useJob(opts: UseJobOpts): UseJobReturn;

export interface MarketPanelProps {
  apiBase: string;
  title?: string;
  icon?: string;
  onClose?: () => void;
  renderResult?: (result: any, status: string) => ReactNode;
  renderMessage?: (message: JobMessage, DefaultBubble: () => ReactNode) => ReactNode;
  placeholder?: string;
}

export interface MarketPanelRef {
  submit(opts: SubmitOpts): Promise<string>;
  loadJob(jobId: string): Promise<void>;
}

export declare const MarketPanel: FC<MarketPanelProps & { ref?: Ref<MarketPanelRef> }>;

export interface ChatPanelProps {
  messages?: JobMessage[];
  disabled?: boolean;
  placeholder?: string;
  renderMessage?: (message: JobMessage, DefaultBubble: () => ReactNode) => ReactNode;
  onSend?: (body: string) => void;
  showInput?: boolean;
}

export declare const ChatPanel: FC<ChatPanelProps>;

export interface JobPanelProps {
  status: string;
  result: any | null;
  error: string | null;
  onAccept?: () => void;
  renderResult?: (result: any, status: string) => ReactNode;
}

export declare const JobPanel: FC<JobPanelProps>;
