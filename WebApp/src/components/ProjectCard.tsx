import { Folder, ChevronRight } from 'lucide-react';
import type { ServiceGroup } from '../types/log';
import { getDisplayServiceName } from '../utils/serviceNames';

interface ServiceCardProps {
  serviceGroup: ServiceGroup;
  onServiceClick: (service: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ serviceGroup, onServiceClick }) => {
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onServiceClick(serviceGroup.service)}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Folder className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            {getDisplayServiceName(serviceGroup.service)}
          </h3>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Activity Stats</h4>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">{serviceGroup.totalCount}</div>
              <div className="text-xs text-gray-500">Total Logs</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">{serviceGroup.last24HoursCount}</div>
              <div className="text-xs text-gray-500">Last 24 Hours</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">{serviceGroup.users24HoursCount}</div>
              <div className="text-xs text-gray-500">Last 24 Hours Users</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">{serviceGroup.users30DaysCount}</div>
              <div className="text-xs text-gray-500">Last 30 Days Users</div>
            </div>
          </div>
        </div>

        {serviceGroup.latestLog && (
          <div>
            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Last Activity</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{serviceGroup.latestLog.action}</div>
                  <div className="text-xs text-gray-500">by {serviceGroup.latestLog.username}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(serviceGroup.latestLog.timestamp)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 