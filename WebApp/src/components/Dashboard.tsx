import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { logsApi } from '../services/api';
import { ServiceCard } from './ProjectCard';
import { StatsCard } from './StatsCard';
import type { ServiceGroup, LogsStats } from '../types/log';

export function Dashboard() {
  const navigate = useNavigate();
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

  const handleRefresh = async () => {
    await loadInitialData();
  };

  const handleServiceClick = (service: string) => {
    navigate(`/service/${encodeURIComponent(service)}`);
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
              <h1 className="font-semibold text-gray-800 tracking-tight">
                MegaLog
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

        {stats && <StatsCard stats={stats} />}

        {loading && stats && (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

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
      </main>
    </div>
  );
}
