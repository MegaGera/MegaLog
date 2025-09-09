import { useState, useEffect } from 'react';
import { Search, ArrowLeft, RefreshCw } from 'lucide-react';
import { logsApi } from './services/api';
import { LogCard } from './components/LogCard';
import { ServiceCard } from './components/ProjectCard';
import { StatsCard } from './components/StatsCard';
import type { ServiceGroup, LogsStats, LogsResponse } from './types/log';

function App() {
  const [view, setView] = useState<'services' | 'service-logs'>('services');
  const [selectedService, setSelectedService] = useState<string>('');
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [serviceLogs, setServiceLogs] = useState<LogsResponse | null>(null);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [servicesData, statsData] = await Promise.all([
        logsApi.getLogsByService(),
        logsApi.getStats()
      ]);
      
      setServiceGroups(servicesData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load data. Please check if the server is running.');
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceClick = async (service: string) => {
    try {
      setLoading(true);
      setError('');
      setSelectedService(service);
      
      const logsData = await logsApi.getServiceLogs(service);
      setServiceLogs(logsData);
      setView('service-logs');
    } catch (err) {
      setError('Failed to load service logs.');
      console.error('Failed to load service logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToServices = () => {
    setView('services');
    setSelectedService('');
    setServiceLogs(null);
    setSearchQuery('');
  };

  const handleRefresh = async () => {
    if (view === 'services') {
      await loadInitialData();
    } else if (selectedService) {
      await handleServiceClick(selectedService);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      
      const searchResults = await logsApi.searchLogs(searchQuery);
      setServiceLogs(searchResults);
      setView('service-logs');
      setSelectedService(`Search: "${searchQuery}"`);
    } catch (err) {
      setError('Search failed.');
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats && !serviceGroups.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading MegaLog Dashboard...</p>
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
              {view === 'service-logs' && (
                <button
                  onClick={handleBackToServices}
                  className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Services
                </button>
              )}
              <h1 className="text-3xl font-bold text-gray-900">
                {view === 'services' ? 'MegaLog Dashboard' : selectedService}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {view === 'service-logs' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="p-2 bg-gray-800 text-black rounded-md hover:bg-gray-900 shadow-md font-semibold border border-gray-700"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              )}
              
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

        {stats && view === 'services' && <StatsCard stats={stats} />}

        {loading && (view !== 'services' || stats) && (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {view === 'services' && !loading && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceGroups.map((group) => (
                <ServiceCard
                  key={group.service}
                  serviceGroup={group}
                  onServiceClick={handleServiceClick}
                />
              ))}
            </div>
            
            {serviceGroups.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">No services found. Check if logs are being processed.</p>
              </div>
            )}
          </div>
        )}

        {view === 'service-logs' && serviceLogs && !loading && (
          <div>
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {serviceLogs.logs.length} of {serviceLogs.total} logs
              </p>
            </div>
            
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
        )}
      </main>
    </div>
  );
}

export default App;
