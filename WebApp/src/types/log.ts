export interface Log {
  _id: string;
  timestamp: string;
  service: string;
  microservice: string;
  username: string;
  action: string;
  details?: Record<string, unknown>;
  metadata?: {
    ip?: string;
    userAgent?: string;
    role?: string;
    [key: string]: unknown;
  };
  processed_at: string;
  message_id?: string | null;
  delivery_tag?: number;
}

export interface LogsResponse {
  logs: Log[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceGroup {
  service: string;
  logs: Log[];
  count: number;
}

export interface LogsStats {
  totalLogs: number;
  logsLast24h: number;
  isProcessing: boolean;
} 