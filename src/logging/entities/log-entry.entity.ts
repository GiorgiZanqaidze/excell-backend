export const LOGS_COLLECTION = 'logs';

export interface LogEntry {
  _id?: unknown;
  timestamp: string; // ISO string
  level: string; // info, warn, error, etc
  message: string;
  service?: string;
  env?: string;
  requestId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userId?: string | number;
  statusCode?: number;
  durationMs?: number;
  stack?: string;
  meta?: Record<string, unknown>;
}
