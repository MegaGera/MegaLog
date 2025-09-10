import axios from 'axios';
import type { LogsResponse, LogsStats, ServiceGroup } from '../types/log';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const IS_PRODUCTION = import.meta.env.PROD;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: IS_PRODUCTION, // Send cookies in production
  headers: {
    'Content-Type': 'application/json'
  }
});

export const logsApi = {
  // Get all logs with pagination
  getLogs: async (page: number = 1, limit: number = 20): Promise<LogsResponse> => {
    const response = await api.get<LogsResponse>('/logs', {
      params: { page, limit }
    });
    return response.data;
  },

  // Get logs grouped by service
  getLogsByService: async (): Promise<ServiceGroup[]> => {
    const response = await api.get<ServiceGroup[]>('/logs/by-service');
    return response.data;
  },

  // Get logs for a specific service
  getServiceLogs: async (service: string, page: number = 1, limit: number = 20): Promise<LogsResponse> => {
    const response = await api.get<LogsResponse>(`/logs/service/${encodeURIComponent(service)}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Get server stats
  getStats: async (): Promise<LogsStats> => {
    const response = await api.get<LogsStats>('/stats');
    return response.data;
  },

  // Search logs
  searchLogs: async (query: string, page: number = 1, limit: number = 20): Promise<LogsResponse> => {
    const response = await api.get<LogsResponse>('/logs/search', {
      params: { q: query, page, limit }
    });
    return response.data;
  }
};

export default api; 