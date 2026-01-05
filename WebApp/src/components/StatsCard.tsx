import { Activity, TrendingUp, Server } from 'lucide-react';
import type { LogsStats } from '../types/log';

interface StatsCardProps {
  stats: LogsStats;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center">
          <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Total Logs</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">{stats.totalLogs.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center">
          <div className="p-1.5 bg-green-100 rounded-lg flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Today</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">{stats.logsToday.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center">
          <div className="p-1.5 bg-purple-100 rounded-lg flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Yesterday</p>
            <p className="text-xl md:text-2xl font-bold text-gray-900 truncate">{stats.logsYesterday.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex items-center">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${stats.rabbitmqConnected ? 'bg-green-100' : 'bg-red-100'}`}>
            <Server className={`w-4 h-4 ${stats.rabbitmqConnected ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-500">Queue Status</p>
            <p className={`text-base md:text-lg font-semibold truncate ${stats.rabbitmqConnected ? 'text-green-600' : 'text-red-600'}`}>
              {stats.rabbitmqConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
