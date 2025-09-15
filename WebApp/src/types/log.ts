export interface Log {
  _id: string;
  timestamp: string;
  service: string;
  microservice?: string;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ServiceGroup {
  service: string;
  totalCount: number;
  last24HoursCount: number;
  users24HoursCount: number;
  users30DaysCount: number;
  latestLog: Log | null;
}

export interface LogsStats {
  totalLogs: number;
  logsLast24h: number;
  isProcessing: boolean;
  rabbitmqConnected: boolean;
}
