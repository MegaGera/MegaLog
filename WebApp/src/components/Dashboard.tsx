import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';
import { logsApi } from '../services/api';
import { ServiceCard } from './ProjectCard';
import { StatsCard } from './StatsCard';
import type { ServiceGroup, LogsStats } from '../types/log';

export function Dashboard() {
  const navigate = useNavigate();
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [stats, setStats] = useState<LogsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumeSending, setResumeSending] = useState(false);
  const [error, setError] = useState<string>('');
  const [resumeMessage, setResumeMessage] = useState<string>('');

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

  const handleSendDailyResume = async () => {
    try {
      setResumeSending(true);
      setResumeMessage('');
      setError('');
      const result = await logsApi.triggerDailyResume();
      setResumeMessage(`Daily resume queued — ${result.period.label}`);
    } catch (err) {
      console.error('Failed to trigger daily resume:', err);
      setError('Failed to send daily resume. Check MegaLog, MegaQueue, and MegaMail.');
    } finally {
      setResumeSending(false);
    }
  };

  const handleServiceClick = (service: string) => {
    navigate(`/service/${encodeURIComponent(service)}`);
  };

  if (loading && !stats && !serviceGroups.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
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
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSendDailyResume}
                disabled={resumeSending || loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-800 rounded-md hover:bg-gray-50 disabled:opacity-50 shadow-md font-semibold border border-gray-300"
              >
                {resumeSending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                <span>Send daily resume</span>
              </button>
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

        {resumeMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800">{resumeMessage}</p>
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
