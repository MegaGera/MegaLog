import { Activity, TrendingUp, Server } from 'lucide-react';
import type { LogsStats } from '../types/log';

interface StatsCardProps {
  stats: LogsStats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Today</p>
            <p className="text-2xl font-bold text-gray-900">{stats.logsToday.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Yesterday</p>
            <p className="text-2xl font-bold text-gray-900">{stats.logsYesterday.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${stats.rabbitmqConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            <Server className={`w-6 h-6 ${stats.rabbitmqConnected ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Queue Status</p>
            <p className={`text-lg font-semibold ${stats.rabbitmqConnected ? 'text-green-600' : 'text-red-600'}`}>
              {stats.rabbitmqConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
