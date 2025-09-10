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
  // Get all logs with pagination and filtering
  getLogs: async (page: number = 1, limit: number = 50, filters?: {
    service?: string;
    username?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<LogsResponse> => {
    const response = await api.get<LogsResponse>('/logs', {
      params: { page, limit, ...filters }
    });
    return response.data;
  },

  // Get logs grouped by service (now using the new stats endpoint)
  getLogsByService: async (): Promise<ServiceGroup[]> => {
    const response = await api.get<ServiceGroup[]>('/stats/services');
    return response.data;
  },

  // Get logs for a specific service
  getServiceLogs: async (service: string, page: number = 1, limit: number = 50, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<LogsResponse> => {
    const response = await api.get<LogsResponse>(`/logs/service/${encodeURIComponent(service)}`, {
      params: { page, limit, ...filters }
    });
    return response.data;
  },

  // Get server stats
  getStats: async (): Promise<LogsStats> => {
    const response = await api.get<LogsStats>('/stats');
    return response.data;
  },

  // Get filter options
  getFilterOptions: async (): Promise<{
    services: string[];
    usernames: string[];
    actions: string[];
  }> => {
    const response = await api.get<{
      services: string[];
      usernames: string[];
      actions: string[];
    }>('/logs/filters');
    return response.data;
  },

  // Search logs (now using the main logs endpoint with filters)
  searchLogs: async (query: string, page: number = 1, limit: number = 50): Promise<LogsResponse> => {
    // Use the main logs endpoint with service filter for search
    const response = await api.get<LogsResponse>('/logs', {
      params: { 
        page, 
        limit, 
        service: query // Simple search by service name
      }
    });
    return response.data;
  },

  // Get distinct usernames for a specific service
  getServiceUsernames: async (service: string): Promise<{ usernames: string[] }> => {
    const response = await api.get<{ usernames: string[] }>(`/logs/service/${encodeURIComponent(service)}/usernames`);
    return response.data;
  },

  // Get distinct actions for a specific service
  getServiceActions: async (service: string): Promise<{ actions: string[] }> => {
    const response = await api.get<{ actions: string[] }>(`/logs/service/${encodeURIComponent(service)}/actions`);
    return response.data;
  },

  // Get all distinct usernames (prepared for future use)
  getAllUsernames: async (): Promise<{ usernames: string[] }> => {
    const response = await api.get<{ usernames: string[] }>('/logs/usernames');
    return response.data;
  },

  // Get all distinct actions (prepared for future use)
  getAllActions: async (): Promise<{ actions: string[] }> => {
    const response = await api.get<{ actions: string[] }>('/logs/actions');
    return response.data;
  },
};

export default api;
