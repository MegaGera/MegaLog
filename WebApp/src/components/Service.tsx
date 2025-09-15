import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { logsApi } from '../services/api';
import { LogCard } from './LogCard';
import { DailyLogsChart } from './DailyLogsChart';
import { DailyUsersChart } from './DailyUsersChart';
import { getDisplayServiceName } from '../utils/serviceNames';
import type { LogsResponse } from '../types/log';

interface FilterOptions {
  username?: string;
  action?: string;
}

export function Service() {
  const { serviceName } = useParams<{ serviceName: string }>();
  const navigate = useNavigate();
  const [serviceLogs, setServiceLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);
  const [dailyData, setDailyData] = useState<Array<{ date: string; count: number }>>([]);
  const [dailyUsersData, setDailyUsersData] = useState<Array<{ date: string; count: number }>>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [usersChartLoading, setUsersChartLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '3m'>('7d');

  const loadServiceLogs = useCallback(async () => {
    if (!serviceName) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Build filter object
      const filters: FilterOptions = {};
      if (selectedUsername) filters.username = selectedUsername;
      if (selectedAction) filters.action = selectedAction;
      
      const logsData = await logsApi.getLogs(currentPage, limit, {
        service: serviceName,
        ...filters
      });
      setServiceLogs(logsData);
    } catch (err) {
      setError('Failed to load service logs.');
      console.error('Failed to load service logs:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceName, currentPage, selectedUsername, selectedAction, limit]);

  const loadFilterOptions = useCallback(async () => {
    if (!serviceName) return;
    
    try {
      setFiltersLoading(true);
      const [usernamesData, actionsData] = await Promise.all([
        logsApi.getServiceUsernames(serviceName),
        logsApi.getServiceActions(serviceName)
      ]);
      
      setUsernames(usernamesData.usernames);
      setActions(actionsData.actions);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    } finally {
      setFiltersLoading(false);
    }
  }, [serviceName]);

  const loadDailyData = useCallback(async () => {
    if (!serviceName) return;
    
    try {
      setChartLoading(true);
      const data = await logsApi.getServiceDailyData(serviceName, selectedPeriod);
      setDailyData(data.dailyData);
    } catch (err) {
      console.error('Failed to load daily data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [serviceName, selectedPeriod]);

  const loadDailyUsersData = useCallback(async () => {
    if (!serviceName) return;
    
    try {
      setUsersChartLoading(true);
      const data = await logsApi.getServiceDailyUsersData(serviceName, selectedPeriod);
      setDailyUsersData(data.dailyData);
    } catch (err) {
      console.error('Failed to load daily users data:', err);
    } finally {
      setUsersChartLoading(false);
    }
  }, [serviceName, selectedPeriod]);

  const handlePeriodChange = (period: '7d' | '30d' | '3m') => {
    setSelectedPeriod(period);
  };

  useEffect(() => {
    if (serviceName) {
      loadServiceLogs();
      loadFilterOptions();
      loadDailyData();
      loadDailyUsersData();
    }
  }, [serviceName, currentPage, selectedUsername, selectedAction, selectedPeriod, loadServiceLogs, loadFilterOptions, loadDailyData, loadDailyUsersData]);

  const handleRefresh = async () => {
    await Promise.all([
      loadServiceLogs(),
      loadDailyData(),
      loadDailyUsersData()
    ]);
  };

  const handleUsernameChange = (username: string) => {
    setSelectedUsername(username);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleBackToServices = () => {
    navigate('/');
  };

  if (!serviceName) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Service not found</p>
          <button
            onClick={handleBackToServices}
            className="mt-4 px-4 py-2 bg-blue-600 text-black rounded-md hover:bg-blue-700 border border-black"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToServices}
                className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Services
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {serviceName ? getDisplayServiceName(serviceName) : 'Service'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-black rounded-md hover:bg-gray-900 disabled:opacity-50 shadow-md font-semibold border border-gray-700"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Bar - No Background */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Username Filter */}
            <div className="w-full sm:w-48">
              <select
                value={selectedUsername}
                onChange={(e) => handleUsernameChange(e.target.value)}
                disabled={filtersLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Users</option>
                {usernames.map((username) => (
                  <option key={username} value={username}>
                    {username}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Filter */}
            <div className="w-full sm:w-48">
              <select
                value={selectedAction}
                onChange={(e) => handleActionChange(e.target.value)}
                disabled={filtersLoading}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Actions</option>
                {actions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {serviceLogs && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Logs List - 6 columns */}
            <div className="lg:col-span-6">
              {/* Pagination Info */}
              <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-600">
                  Showing {serviceLogs.logs.length} of {serviceLogs.pagination.total} logs
                  {serviceLogs.pagination.pages > 1 && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Page {serviceLogs.pagination.page} of {serviceLogs.pagination.pages})
                    </span>
                  )}
                </p>
                
                {/* Pagination Controls */}
                {serviceLogs.pagination.pages > 1 && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, serviceLogs.pagination.pages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(serviceLogs.pagination.pages, currentPage - 2 + i));
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm border rounded-md ${
                              currentPage === pageNum
                                ? 'bg-gray-800 text-white border-gray-800'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= serviceLogs.pagination.pages}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Logs List */}
              <div className="space-y-4">
                {serviceLogs.logs.map((log) => (
                  <LogCard key={log._id} log={log} />
                ))}
              </div>
              
              {serviceLogs.logs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No logs found for this service.</p>
                </div>
              )}
            </div>

            {/* Charts - 6 columns */}
            <div className="lg:col-span-6 space-y-6">
              {/* Timeline Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Analytics Timeline</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePeriodChange('7d')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedPeriod === '7d'
                          ? 'bg-blue-600 text-blue-600'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => handlePeriodChange('30d')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedPeriod === '30d'
                          ? 'bg-blue-600 text-blue-600'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      30 Days
                    </button>
                    <button
                      onClick={() => handlePeriodChange('3m')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        selectedPeriod === '3m'
                          ? 'bg-blue-600 text-blue-600'
                          : 'bg-gray-100 text-black hover:bg-gray-200'
                      }`}
                    >
                      3 Months
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Logs Chart */}
              <DailyLogsChart 
                data={dailyData} 
                serviceName={serviceName || ''} 
                loading={chartLoading}
                period={selectedPeriod}
              />
              
              {/* Distinct Users Chart */}
              <DailyUsersChart 
                data={dailyUsersData} 
                loading={usersChartLoading}
                period={selectedPeriod}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
